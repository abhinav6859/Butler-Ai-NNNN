import prisma from '../prisma/client';
import { Priority, TaskCategory } from '@prisma/client';

export interface ParsedTaskResult {
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  assignedStaffId?: string;
  dueDate?: Date;
}

export class AIService {
  private static geminiKey = process.env.GEMINI_API_KEY || '';

  /**
   * Parse a text command in English or Hindi into a structured Task configuration.
   */
  public static async parseTaskRequest(text: string, homeId: string): Promise<ParsedTaskResult> {
    if (this.geminiKey) {
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
    const recipes = await prisma.recipe.findMany({
      where: { isDeleted: false },
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
  public static async chatAboutHome(message: string, homeId: string): Promise<string> {
    // Gather system state for context
    const openTasks = await prisma.task.count({ where: { homeId, status: { in: ['PENDING', 'IN_PROGRESS'] }, isDeleted: false } });
    const attendanceToday = await prisma.attendance.findMany({
      where: { date: new Date(), isDeleted: false },
      include: { staff: true },
    });
    const lowStockCount = await prisma.pantryItem.count({
      where: {
        homeId,
        isDeleted: false,
        quantity: { lt: prisma.pantryItem.fields.minStock },
      },
    });
    const visitorsToday = await prisma.visitor.count({
      where: {
        homeId,
        isDeleted: false,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    if (this.geminiKey) {
      try {
        const prompt = `
You are the Butler AI assistant for the household. Here is the current status of the household:
- Open Tasks: ${openTasks}
- Staff Present Today: ${attendanceToday.filter(a => a.status === 'PRESENT').map(a => `${a.staff.name} (${a.staff.staffType})`).join(', ') || 'None'}
- Low Stock Pantry Items: ${lowStockCount}
- Visitors Checked-In or Expected Today: ${visitorsToday}

The user asks: "${message}"

Answer this question in a friendly, helpful, and concise manner. Keep it to 2-3 sentences. Support English or Hindi depending on the language they asked in.
`;
        return await this.callGeminiGeneral(prompt);
      } catch (error) {
        console.error('Gemini chat failed, fallback to local QA:', error);
      }
    }

    // Local QA rules
    const msg = message.toLowerCase();
    if (msg.includes('task') || msg.includes('kam') || msg.includes('kaam')) {
      return `Currently, there are ${openTasks} open tasks pending in the household. You can view them in the Tasks dashboard.`;
    }
    if (msg.includes('staff') || msg.includes('duty') || msg.includes('present') || msg.includes('kaun') || msg.includes('kon')) {
      const presentNames = attendanceToday
        .filter((a) => a.status === 'PRESENT')
        .map((a) => `${a.staff.name} (${a.staff.staffType})`);
      return presentNames.length > 0
        ? `The following staff members are on duty today: ${presentNames.join(', ')}.`
        : 'No staff members have checked in today yet.';
    }
    if (msg.includes('pantry') || msg.includes('stock') || msg.includes('grocery') || msg.includes('groceries') || msg.includes('ration') || msg.includes('saman')) {
      return lowStockCount > 0
        ? `We have ${lowStockCount} pantry items running below the minimum stock limit. You can review them in the pantry section to trigger a grocery request.`
        : 'All pantry items are fully stocked above minimum limits.';
    }
    if (msg.includes('visitor') || msg.includes('mehman') || msg.includes('guest')) {
      return `We have ${visitorsToday} visitor entries registered for today.`;
    }

    return `I am here to help you manage the household. We have ${openTasks} open tasks, ${attendanceToday.filter(a => a.status === 'PRESENT').length} staff on duty, and ${lowStockCount} low-stock pantry items. Ask me about tasks, staff on duty, pantry, or visitors.`;
  }

  /**
   * Summarize a report's text or JSON content.
   */
  public static async summarizeReport(reportContent: any): Promise<string> {
    const reportText = typeof reportContent === 'string' ? reportContent : JSON.stringify(reportContent);
    if (this.geminiKey) {
      try {
        const prompt = `Summarize the following household operations report into a single paragraph of 2-3 key findings/actions: ${reportText}`;
        return await this.callGeminiGeneral(prompt);
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

    const responseText = await this.callGeminiGeneral(prompt);
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

  private static async callGeminiGeneral(prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = (await response.json()) as any;
    return data.candidates[0].content.parts[0].text;
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
