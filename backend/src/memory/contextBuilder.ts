import prisma from "../prisma/client";
import { ConversationService } from "../conversations/conversationservice";
import { MemoryService } from "./memoryService";
export class ContextBuilder {

  static async build(
    userId: string,
    homeId: string,
    message: string
  ) {

    const [
      user,
      home,

      healthProfile,
      foodPreference,
      aiProfile,

      routines,
      mealHistory,

      memories,
      activities,

      pantry,

      tasks,

      staff,

      visitors,

      groceries,

      inventory,
  

recentMessages

    ] = await Promise.all([

      prisma.user.findUnique({
        where: { id: userId }
      }),

      prisma.home.findUnique({
        where: { id: homeId }
      }),

      prisma.healthProfile.findUnique({
        where: { userId }
      }),

      prisma.foodPreference.findUnique({
        where: { userId }
      }),

      prisma.aIProfile.findUnique({
        where: { userId }
      }),

      prisma.routine.findMany({
        where: { userId }
      }),

      prisma.mealHistory.findMany({
        where: { userId },
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      }),

  await MemoryService.getRelevantMemories(userId),

      prisma.activityLog.findMany({
        where: { userId },
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      }),

      prisma.pantryItem.findMany({
        where: {
          homeId,
          isDeleted: false
        }
      }),

      prisma.task.findMany({
        where: {
          homeId,
          isDeleted: false
        }
      }),

      prisma.staff.findMany({
        where: {
          isDeleted: false
        }
      }),

      prisma.visitor.findMany({
        where: {
          homeId,
          isDeleted: false
        }
      }),

      prisma.groceryItem.findMany({
        where: {
          homeId,
          isDeleted: false
        }
      }),

      prisma.inventoryItem.findMany({
        where: {
          homeId,
          isDeleted: false
        }
      }),
      ConversationService.getRecentMessages(userId)

    ]);

    return {

      message,

      user,

      home,

      healthProfile,

      foodPreference,

      aiProfile,

      routines,

      mealHistory,

      memories,

      activities,

      pantry,

      tasks,

      staff,

      visitors,

      groceries,

      inventory,

recentMessages

    };

  }

}