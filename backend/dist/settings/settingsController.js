"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class SettingsController {
    static async list(req, res) {
        try {
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const settings = await client_1.default.setting.findMany({
                where: { homeId, isDeleted: false },
            });
            return res.json(settings);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { settings } = req.body; // Expect [{ key: string, value: string }]
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            if (!Array.isArray(settings)) {
                return res.status(400).json({ error: 'Settings payload must be an array of key-value objects' });
            }
            const updatedSettings = [];
            for (const item of settings) {
                const existing = await client_1.default.setting.findFirst({
                    where: { key: item.key, homeId, isDeleted: false },
                });
                if (existing) {
                    const updated = await client_1.default.setting.update({
                        where: { id: existing.id },
                        data: { value: String(item.value) },
                    });
                    updatedSettings.push(updated);
                }
                else {
                    const created = await client_1.default.setting.create({
                        data: {
                            key: item.key,
                            value: String(item.value),
                            homeId,
                        },
                    });
                    updatedSettings.push(created);
                }
            }
            return res.json(updatedSettings);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.SettingsController = SettingsController;
