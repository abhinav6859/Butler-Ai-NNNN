"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const aiService_1 = require("./aiService");
class AIController {
    static async parseTask(req, res) {
        try {
            const { text } = req.body;
            const homeId = req.user?.homeId;
            if (!text) {
                return res.status(400).json({ error: 'Text prompt is required' });
            }
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const result = await aiService_1.AIService.parseTaskRequest(text, homeId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async suggestMeals(req, res) {
        try {
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const result = await aiService_1.AIService.suggestMealsFromPantry(homeId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async suggestGroceries(req, res) {
        try {
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const result = await aiService_1.AIService.suggestGroceries(homeId);
            return res.json(result);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async chat(req, res) {
        try {
            const { message } = req.body;
            const homeId = req.user?.homeId;
            if (!message) {
                return res.status(400).json({ error: 'Message query is required' });
            }
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const reply = await aiService_1.AIService.chatAboutHome(message, homeId);
            return res.json({ reply });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.AIController = AIController;
