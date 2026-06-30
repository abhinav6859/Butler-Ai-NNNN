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
exports.UsersController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const bcrypt = __importStar(require("bcryptjs"));
class UsersController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const role = req.query.role;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { email: { contains: search, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                    role ? { role: role } : {},
                ],
            };
            const [users, total] = await Promise.all([
                client_1.default.user.findMany({
                    where,
                    include: { staff: true },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.user.count({ where }),
            ]);
            return res.json({
                data: users.map((u) => {
                    const { password, ...safeUser } = u;
                    return safeUser;
                }),
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async get(req, res) {
        try {
            const { id } = req.params;
            const user = await client_1.default.user.findFirst({
                where: { id, isDeleted: false },
                include: { staff: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const { password, ...safeUser } = user;
            return res.json(safeUser);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { email, password, role, name, staffType, salary } = req.body;
            const existing = await client_1.default.user.findFirst({ where: { email, isDeleted: false } });
            if (existing) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const user = await client_1.default.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role,
                    name,
                },
            });
            // If STAFF, create a Staff record linked to this User
            if (role === 'STAFF') {
                await client_1.default.staff.create({
                    data: {
                        userId: user.id,
                        name,
                        staffType: staffType || 'OTHER',
                        salary: salary ? parseFloat(salary) : null,
                    },
                });
            }
            const { password: _, ...safeUser } = user;
            return res.status(201).json(safeUser);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { email, name, role, password } = req.body;
            const user = await client_1.default.user.findFirst({ where: { id, isDeleted: false } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const updateData = {};
            if (email)
                updateData.email = email;
            if (name)
                updateData.name = name;
            if (role)
                updateData.role = role;
            if (password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }
            const updated = await client_1.default.user.update({
                where: { id },
                data: updateData,
            });
            const { password: _, ...safeUser } = updated;
            return res.json(safeUser);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const user = await client_1.default.user.findFirst({ where: { id, isDeleted: false } });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            await client_1.default.user.update({
                where: { id },
                data: { isDeleted: true },
            });
            await client_1.default.staff.updateMany({
                where: { userId: id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'User deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.UsersController = UsersController;
