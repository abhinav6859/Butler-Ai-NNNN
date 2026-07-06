
import { MealService } from '../meal-plans/mealService';
// import { TaskService } from '../tasks/taskService';
// import { PantryService } from '../pantry/pantryService';
// import { GroceryService } from '../groceries/groceryService';
// import { VisitorService } from '../visitors/visitorService';
// import { AttendanceService } from '../attendance/attendanceService';
// import { InventoryService } from '../inventory/inventoryService';
// import { StaffService } from '../staff/staffService';
import prisma from '../prisma/client';

// Temporary stubs – replace with actual imports when services exist
const TaskService = {
  getTasks: async (homeId: string, filters?: any) => ({ tasks: [] }),
  createTask: async (homeId: string, title: string, description: string, priority: string, category: string, assignedStaffId?: string, dueDate?: string) => ({ id: 'task-1' }),
  completeTask: async (homeId: string, taskId: string) => ({ success: true }),
  updateTask: async (homeId: string, taskId: string, updates: any) => ({ success: true }),
  deleteTask: async (homeId: string, taskId: string) => ({ success: true }),
};
const PantryService = {
  getPantryItems: async (homeId: string) => [],
  updatePantryItem: async (homeId: string, itemName: string, quantityChange: number) => ({ success: true }),
};
const GroceryService = {
  createGrocery: async (homeId: string, name: string, quantity: number, unit: string, category?: string) => ({ id: 'g-1' }),
  getGroceries: async (homeId: string) => [],
  updateGrocery: async (homeId: string, groceryId: string, updates: any) => ({ success: true }),
};
const VisitorService = {
  createVisitor: async (homeId: string, name: string, purpose: string, hostId: string) => ({ id: 'v-1' }),
  getVisitors: async (homeId: string) => [],
};
const AttendanceService = {
  markAttendance: async (homeId: string, staffId: string, status: string) => ({ id: 'a-1' }),
  getAttendance: async (homeId: string, date?: string) => [],
};
const InventoryService = {
  getInventory: async (homeId: string) => [],
  updateInventory: async (homeId: string, itemId: string, updates: any) => ({ success: true }),
};
const StaffService = {
  getStaff: async (homeId: string) => [],
  createStaff: async (homeId: string, data: any) => ({ id: 's-1' }),
};

export interface AIAction {
  intent: string;
  action: any;
}

export class ActionExecutor {
  static async execute(userId: string, homeId: string, action: AIAction): Promise<any> {
    const { intent, action: params } = action;

    switch (intent) {
      // ─── Meal ─────────────────────────────────────────
      case 'GET_MEAL':
        return MealService.getMeal(homeId, params.mealType, params.date);
      case 'CREATE_MEAL':
      case 'UPDATE_MEAL':
        return MealService.upsertMeal(homeId, params.mealType, params.date, params.dish);
      case 'DELETE_MEAL':
        return MealService.deleteMeal(homeId, params.mealType, params.date);

      case 'SUGGEST_MEAL': {
        // 1. Check if a meal already exists
        const existing = await MealService.getMeal(homeId, params.mealType, params.date);
        if (existing && existing.dish) {
          return { suggestion: existing.dish, alreadyExists: true };
        }

        // 2. Get suggestions from pantry
        const pantry = await prisma.pantryItem.findMany({
          where: { homeId, isDeleted: false },
        });
        const recipes = await prisma.recipe.findMany({
          where: { isDeleted: false },
          include: { ingredients: { include: { food: true } } },
        });

        let bestMatch = null;
        let bestScore = 0;
        for (const recipe of recipes) {
          let matchedCount = 0;
          const ingredients = recipe.ingredients as any[];
          if (Array.isArray(ingredients)) {
            for (const ing of ingredients) {
              const pantryItem = pantry.find(
                (p) => p.name.toLowerCase() === ing.name.toLowerCase() && p.quantity >= (ing.quantity || 0)
              );
              if (pantryItem) matchedCount++;
            }
          }
          const score = ingredients.length > 0 ? (matchedCount / ingredients.length) : 0;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = recipe.name;
          }
        }

        if (bestMatch) {
          return { suggestion: bestMatch, matchPercentage: Math.round(bestScore * 100) };
        } else {
          return { suggestion: null };
        }
      }

      // ─── Task ─────────────────────────────────────────
      case 'GET_TASK':
        return TaskService.getTasks(homeId, params.filters || {});
      case 'CREATE_TASK':
        return TaskService.createTask(homeId, params.title, params.description, params.priority, params.category, params.assignedStaffId, params.dueDate);
      case 'UPDATE_TASK':
        return TaskService.updateTask(homeId, params.taskId, params.updates);
      case 'COMPLETE_TASK':
        return TaskService.completeTask(homeId, params.taskId);
      case 'DELETE_TASK':
        return TaskService.deleteTask(homeId, params.taskId);

      // ─── Pantry ──────────────────────────────────────
      case 'GET_PANTRY':
        return PantryService.getPantryItems(homeId);
      case 'UPDATE_PANTRY':
        return PantryService.updatePantryItem(homeId, params.itemName, params.quantityChange);

      // ─── Grocery ──────────────────────────────────────
      case 'CREATE_GROCERY':
        return GroceryService.createGrocery(homeId, params.name, params.quantity, params.unit, params.category);
      case 'UPDATE_GROCERY':
        return GroceryService.updateGrocery(homeId, params.groceryId, params.updates);
      case 'GET_GROCERY':
        return GroceryService.getGroceries(homeId);

      // ─── Visitor ──────────────────────────────────────
      case 'CREATE_VISITOR':
        return VisitorService.createVisitor(homeId, params.name, params.purpose, userId);
      case 'GET_VISITOR':
        return VisitorService.getVisitors(homeId);

      // ─── Attendance ──────────────────────────────────
      case 'MARK_ATTENDANCE':
        return AttendanceService.markAttendance(homeId, params.staffId, params.status);
      case 'GET_ATTENDANCE':
        return AttendanceService.getAttendance(homeId, params.date);

      // ─── Inventory ────────────────────────────────────
      case 'GET_INVENTORY':
        return InventoryService.getInventory(homeId);
      case 'UPDATE_INVENTORY':
        return InventoryService.updateInventory(homeId, params.itemId, params.updates);

      // ─── Staff ────────────────────────────────────────
      case 'GET_STAFF':
        return StaffService.getStaff(homeId);
      case 'CREATE_STAFF':
        return StaffService.createStaff(homeId, params.data);

      // ─── General / no action ─────────────────────────
      default:
        return { message: 'No action executed' };
    }
  }
}