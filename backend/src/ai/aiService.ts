import prisma from '../prisma/client';
import { Priority, TaskCategory } from '@prisma/client';
import { ConversationService } from '../conversations/conversationservice';
import { ContextBuilder } from '../memory/contextBuilder';
import { PromptBuilder } from '../memory/promptBuilder';
import { MemoryExtractor } from '../memory/memoryExtractor';
import { GeminiService } from './geminiService';

export interface ParsedTaskResult {
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  assignedStaffId?: string;
  dueDate?: Date;
}

export class AIService {


  /**
   * Parse a text command in English or Hindi into a structured Task configuration.
   */
  public static async parseTaskRequest(text: string, homeId: string): Promise<ParsedTaskResult> {
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await this.callGeminiForTask(text, homeId);
        if (result) return result;
      } catch (error) {
        console.error('Gemini API call failed, falling back to rule-based parser:', error);
      }
    }
    return this.ruleBasedTaskParser(text, homeId);
  }

  /**
   * Suggest meals by matching recipe ingredients against available pantry items in a home.
   */
  public static async suggestMealsFromPantry(homeId: string): Promise<any[]> {
    const pantry = await prisma.pantryItem.findMany({
      where: { homeId, isDeleted: false },
    });
    // const recipes = await prisma.recipe.findMany({
    //   where: { isDeleted: false },
    // });
    const recipes = await prisma.recipe.findMany({
  where: {
    isDeleted: false
  },
  include: {
    ingredients: {
      include: {
        food: true
      }
    }
  }
});

    const suggestions: any[] = [];

    for (const recipe of recipes) {
      let matchedCount = 0;
      let totalIngredients = 0;
      const ingredients = recipe.ingredients as any[];

      if (Array.isArray(ingredients)) {
        totalIngredients = ingredients.length;
        for (const ing of ingredients) {
          const pantryItem = pantry.find(
            (p) => p.name.toLowerCase() === ing.name.toLowerCase() && p.quantity >= (ing.quantity || 0)
          );
          if (pantryItem) {
            matchedCount++;
          }
        }
      }

      const matchPercentage = totalIngredients > 0 ? (matchedCount / totalIngredients) * 100 : 0;

      suggestions.push({
        id: recipe.id,
        name: recipe.name,
        matchPercentage: Math.round(matchPercentage),
        matchedIngredients: matchedCount,
        totalIngredients,
        canCook: matchPercentage === 100,
        prepTime: recipe.prepTime,
      });
    }

    return suggestions.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  /**
   * Suggest grocery items to buy based on pantry stock falling below minimum threshold.
   */
  public static async suggestGroceries(homeId: string): Promise<any[]> {
    const lowStockItems = await prisma.pantryItem.findMany({
      where: {
        homeId,
        isDeleted: false,
        quantity: {
          lt: prisma.pantryItem.fields.minStock,
        },
      },
    });

    return lowStockItems.map((item) => ({
      name: item.name,
      suggestedQuantity: Math.max(0, item.minStock * 2 - item.quantity), // suggest doubling minStock
      unit: item.unit,
      category: item.category,
      currentQuantity: item.quantity,
      minStock: item.minStock,
    }));
  }

  /**
   * Answer a general question about the household's operational state.
   */
 public static async chatAboutHome(
    message: string,
    homeId: string,
    userId: string
): Promise<string> {

    // 1. Save user message
    await ConversationService.saveUserMessage(
        userId,
        message
    );

    // 2. Load everything needed
    const context =
    await ContextBuilder.build(
        userId,
        homeId,
        message
    );

    // 3. Build final prompt
    const prompt =
    PromptBuilder.create(context);

    // 4. Gemini
    const reply =
   await GeminiService.generate(prompt);

    // 5. Save assistant reply
    await ConversationService.saveAssistantMessage(
        userId,
        reply
    );

    // 6. Learn from conversation
    await MemoryExtractor.extract(
        userId,
        message,
        reply
    );

    return reply;

}

  /**
   * Summarize a report's text or JSON content.
   */
  public static async summarizeReport(reportContent: any): Promise<string> {
    const reportText = typeof reportContent === 'string' ? reportContent : JSON.stringify(reportContent);
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Summarize the following household operations report into a single paragraph of 2-3 key findings/actions: ${reportText}`;
        return await GeminiService.generate(prompt);
      } catch (error) {
        console.error('Gemini report summary failed, fallback to local summary:', error);
      }
    }

    return 'This report captures the household operations including visitor logs, task completion metrics, and pantry stock levels. Tasks are progressing on schedule and kitchen stock is being maintained.';
  }

  private static async callGeminiForTask(text: string, homeId: string): Promise<ParsedTaskResult | null> {
    const staff = await prisma.staff.findMany({ where: { isDeleted: false } });
    const staffList = staff.map((s) => `ID: ${s.id}, Name: ${s.name}, RoleType: ${s.staffType}`).join('\n');

    const prompt = `
Analyze the following natural language request for a household task. It may be in English, Hindi, or Hinglish (Hindi written in Latin script).
Request: "${text}"

Available staff members to assign tasks to:
${staffList}

Extract the following details and return them strictly as a JSON object:
{
  "title": "Short title in English",
  "description": "Details of the request in English",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "category": "CLEANING" | "COOKING" | "MAINTENANCE" | "DRIVING" | "SECURITY" | "SHOPPING" | "OTHER",
  "assignedStaffId": "matched_staff_id or null",
  "dueDate": "ISO Date string or null"
}

Determine the dueDate based on current date which is: ${new Date().toISOString()}.
Match the task to a staff member based on their role or name matches.
Return ONLY valid JSON. No markdown codeblocks, no extra text.
`;

    const responseText = await GeminiService.generate(prompt);
    // Clean codeblocks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      title: parsed.title || 'AI Task',
      description: parsed.description || text,
      priority: parsed.priority || Priority.MEDIUM,
      category: parsed.category || TaskCategory.OTHER,
      assignedStaffId: parsed.assignedStaffId || undefined,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
    };
  }

 

  private static async ruleBasedTaskParser(text: string, homeId: string): Promise<ParsedTaskResult> {
    const lowercaseText = text.toLowerCase();

    let category: TaskCategory = TaskCategory.OTHER;
    let priority: Priority = Priority.MEDIUM;
    let assignedStaffId: string | undefined = undefined;
    let title = 'Household Task';
    let description = text;

    // Detect Category
    if (
      lowercaseText.includes('clean') ||
      lowercaseText.includes('safai') ||
      lowercaseText.includes('jhaadu') ||
      lowercaseText.includes('pocha') ||
      lowercaseText.includes('dust') ||
      lowercaseText.includes('room')
    ) {
      category = TaskCategory.CLEANING;
      title = 'Cleaning Request';
    } else if (
      lowercaseText.includes('cook') ||
      lowercaseText.includes('food') ||
      lowercaseText.includes('khana') ||
      lowercaseText.includes('rasoi') ||
      lowercaseText.includes('lunch') ||
      lowercaseText.includes('dinner') ||
      lowercaseText.includes('breakfast')
    ) {
      category = TaskCategory.COOKING;
      title = 'Cooking Request';
    } else if (
      lowercaseText.includes('drive') ||
      lowercaseText.includes('car') ||
      lowercaseText.includes('gaadi') ||
      lowercaseText.includes('drop') ||
      lowercaseText.includes('pick') ||
      lowercaseText.includes('travel')
    ) {
      category = TaskCategory.DRIVING;
      title = 'Driving Request';
    } else if (
      lowercaseText.includes('gate') ||
      lowercaseText.includes('visitor') ||
      lowercaseText.includes('security') ||
      lowercaseText.includes('guard') ||
      lowercaseText.includes('darwaza')
    ) {
      category = TaskCategory.SECURITY;
      title = 'Security Duty';
    } else if (
      lowercaseText.includes('buy') ||
      lowercaseText.includes('grocery') ||
      lowercaseText.includes('shopping') ||
      lowercaseText.includes('saman') ||
      lowercaseText.includes('market')
    ) {
      category = TaskCategory.SHOPPING;
      title = 'Shopping List task';
    } else if (
      lowercaseText.includes('repair') ||
      lowercaseText.includes('fix') ||
      lowercaseText.includes('electric') ||
      lowercaseText.includes('plumber') ||
      lowercaseText.includes('ac') ||
      lowercaseText.includes('water')
    ) {
      category = TaskCategory.MAINTENANCE;
      title = 'Maintenance Check';
    }

    // Detect Priority
    if (
      lowercaseText.includes('urgent') ||
      lowercaseText.includes('emergency') ||
      lowercaseText.includes('jaldi') ||
      lowercaseText.includes('abbi') ||
      lowercaseText.includes('immediately')
    ) {
      priority = Priority.URGENT;
    } else if (
      lowercaseText.includes('important') ||
      lowercaseText.includes('high') ||
      lowercaseText.includes('zaroori')
    ) {
      priority = Priority.HIGH;
    } else if (lowercaseText.includes('low') || lowercaseText.includes('easy')) {
      priority = Priority.LOW;
    }

    // Load active staff to match
    const staff = await prisma.staff.findMany({
      where: { isDeleted: false },
    });

    // Try matching staff name or staff type keyword
    for (const s of staff) {
      const nameParts = s.name.toLowerCase().split(' ');
      const matchName = nameParts.some((part) => part.length > 2 && lowercaseText.includes(part));

      if (matchName) {
        assignedStaffId = s.id;
        break;
      }
    }

    // Fallback: Assign based on category
    if (!assignedStaffId) {
      let matchedType: string | null = null;
      if (category === TaskCategory.CLEANING) matchedType = 'HOUSEKEEPER';
      else if (category === TaskCategory.COOKING) matchedType = 'CHEF';
      else if (category === TaskCategory.DRIVING) matchedType = 'DRIVER';
      else if (category === TaskCategory.SECURITY) matchedType = 'SECURITY';

      if (matchedType) {
        const staffMatch = staff.find((s) => s.staffType === matchedType);
        if (staffMatch) {
          assignedStaffId = staffMatch.id;
        }
      }
    }

    // Due Date
    let dueDate = new Date();
    if (lowercaseText.includes('tomorrow') || lowercaseText.includes('kal')) {
      dueDate.setDate(dueDate.getDate() + 1);
    } else if (lowercaseText.includes('day after') || lowercaseText.includes('parso')) {
      dueDate.setDate(dueDate.getDate() + 2);
    }

    return {
      title,
      description,
      priority,
      category,
      assignedStaffId,
      dueDate,
    };
  }
}
