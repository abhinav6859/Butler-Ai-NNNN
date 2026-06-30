"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt = __importStar(require("jsonwebtoken"));
const client_1 = __importDefault(require("../prisma/client"));
const JWT_SECRET = process.env.JWT_SECRET || 'butler_ai_super_secret_key_12345';
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        // Fetch user and check active
        const user = await client_1.default.user.findUnique({
            where: { id: decoded.id },
            include: { staff: true },
        });
        if (!user || user.isDeleted) {
            return res.status(401).json({ error: 'User no longer exists or is deleted.' });
        }
        // Determine homeId
        let homeId;
        if (user.role === 'HONOUR') {
            const home = await client_1.default.home.findFirst({
                where: { honourId: user.id, isDeleted: false },
            });
            if (home)
                homeId = home.id;
        }
        else if (user.role === 'STAFF' && user.staff) {
            // Find the first home in the database to link to for staff access (Phase 1 convenience)
            const home = await client_1.default.home.findFirst({
                where: { isDeleted: false },
            });
            if (home)
                homeId = home.id;
        }
        else if (user.role === 'ADMIN') {
            const home = await client_1.default.home.findFirst({
                where: { isDeleted: false },
            });
            if (home)
                homeId = home.id;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            staffId: user.staff?.id,
            staffType: user.staff?.staffType,
            homeId,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}
