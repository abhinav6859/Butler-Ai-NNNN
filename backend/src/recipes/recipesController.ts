import { Request, Response } from 'express';
import prisma from '../prisma/client';

export class RecipesController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sortBy as string) || 'name';
      const sortOrder = (req.query.sortOrder as string) || 'asc';

      const skip = (page - 1) * limit;

      const where: any = {
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
        prisma.recipe.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.recipe.count({ where }),
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const recipe = await prisma.recipe.findFirst({
        where: { id, isDeleted: false },
      });
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      return res.json(recipe);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, instructions, prepTime, ingredients } = req.body;
      const userId = req.user?.id;

      const recipe = await prisma.recipe.create({
        data: {
          name,
          instructions,
          prepTime: parseInt(prepTime) || 0,
          ingredients: ingredients || [],
          createdById: userId!,
        },
      });

      return res.status(201).json(recipe);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, instructions, prepTime, ingredients } = req.body;

      const recipe = await prisma.recipe.findFirst({ where: { id, isDeleted: false } });
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (instructions !== undefined) updateData.instructions = instructions;
      if (prepTime !== undefined) updateData.prepTime = parseInt(prepTime) || 0;
      if (ingredients !== undefined) updateData.ingredients = ingredients;

      const updated = await prisma.recipe.update({
        where: { id },
        data: updateData,
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const recipe = await prisma.recipe.findFirst({ where: { id, isDeleted: false } });
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      await prisma.recipe.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Recipe deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
