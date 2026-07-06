import prisma from '../prisma/client';

export class MealService {
  /**
   * Get a specific meal (breakfast/lunch/dinner) for a given date.
   * Returns { dish: string | null } or null if no plan exists.
   */
  static async getMeal(
    homeId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    date: string
  ): Promise<{ dish: string | null } | null> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const plan = await prisma.mealPlan.findFirst({
      where: {
        homeId,
        date: { gte: start, lt: end },
        isDeleted: false,
      },
    });
    if (!plan) return null;

    const key = `${mealType}Name` as keyof typeof plan;
    return { dish: plan[key] as string || null };
  }

  /**
   * Create or update a meal for a given date and meal type.
   * If a plan exists for that date, update the specific meal field; else create a new plan.
   */
  static async upsertMeal(
    homeId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    date: string,
    dish: string
  ) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let plan = await prisma.mealPlan.findFirst({
      where: {
        homeId,
        date: { gte: start, lt: end },
        isDeleted: false,
      },
    });

    const key = `${mealType}Name` as const;
    if (plan) {
      return prisma.mealPlan.update({
        where: { id: plan.id },
        data: { [key]: dish },
      });
    } else {
      return prisma.mealPlan.create({
        data: {
          homeId,
          date: start,
          [key]: dish,
        },
      });
    }
  }

  /**
   * Delete a specific meal (set it to null) for a given date and meal type.
   */
  static async deleteMeal(
    homeId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    date: string
  ) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const plan = await prisma.mealPlan.findFirst({
      where: {
        homeId,
        date: { gte: start, lt: end },
        isDeleted: false,
      },
    });
    if (!plan) return null;

    const key = `${mealType}Name` as const;
    return prisma.mealPlan.update({
      where: { id: plan.id },
      data: { [key]: null },
    });
  }
}