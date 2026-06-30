"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class RecipesController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = req.query.sortOrder || 'asc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            name: { contains: search, mode: 'insensitive' },
                        }
                        : {},
                ],
            };
            const [recipes, total] = await Promise.all([
                client_1.default.recipe.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.recipe.count({ where }),
            ]);
            return res.json({
                data: recipes,
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
            const recipe = await client_1.default.recipe.findFirst({
                where: { id, isDeleted: false },
            });
            if (!recipe) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
            return res.json(recipe);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, instructions, prepTime, ingredients } = req.body;
            const userId = req.user?.id;
            const recipe = await client_1.default.recipe.create({
                data: {
                    name,
                    instructions,
                    prepTime: parseInt(prepTime) || 0,
                    ingredients: ingredients || [],
                    createdById: userId,
                },
            });
            return res.status(201).json(recipe);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, instructions, prepTime, ingredients } = req.body;
            const recipe = await client_1.default.recipe.findFirst({ where: { id, isDeleted: false } });
            if (!recipe) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (instructions !== undefined)
                updateData.instructions = instructions;
            if (prepTime !== undefined)
                updateData.prepTime = parseInt(prepTime) || 0;
            if (ingredients !== undefined)
                updateData.ingredients = ingredients;
            const updated = await client_1.default.recipe.update({
                where: { id },
                data: updateData,
            });
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const recipe = await client_1.default.recipe.findFirst({ where: { id, isDeleted: false } });
            if (!recipe) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
            await client_1.default.recipe.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Recipe deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.RecipesController = RecipesController;
