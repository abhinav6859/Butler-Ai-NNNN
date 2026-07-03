import prisma from "../prisma/client";

export class MemoryService {

    // =====================================
    // Save or Update Memory
    // =====================================

    static async saveMemory(
        userId: string,
        memory: any
    ) {

        const existing =
            await prisma.conversationMemory.findFirst({

                where: {

                    userId,

                    key: memory.key

                }

            });

        if (existing) {

            return prisma.conversationMemory.update({

                where: {

                    id: existing.id

                },

                data: {

                    value: memory.value,

                    category: memory.category,

                    importance: memory.importance ?? 5,

                    confidence:
                        memory.confidence ?? existing.confidence,

                    source:
                        memory.source ?? "conversation",

                    lastAccessed: new Date()

                }

            });

        }

        return prisma.conversationMemory.create({

            data: {

                userId,

                key: memory.key,

                value: memory.value,

                category: memory.category,

                importance:
                    memory.importance ?? 5,

                confidence:
                    memory.confidence ?? 1,

                source:
                    memory.source ?? "conversation",

                lastAccessed: new Date()

            }

        });

    }

    // =====================================
    // Get Important Memories
    // =====================================

    static async getRelevantMemories(
        userId: string,
        limit: number = 20
    ) {

        return prisma.conversationMemory.findMany({

            where: {

                userId

            },

            orderBy: [

                {

                    importance: "desc"

                },

                {

                    updatedAt: "desc"

                }

            ],

            take: limit

        });

    }

    // =====================================
    // Delete Expired Memories
    // =====================================

    static async deleteExpiredMemories() {

        return prisma.conversationMemory.deleteMany({

            where: {

                expiresAt: {

                    lt: new Date()

                }

            }

        });

    }

    // =====================================
    // Delete One Memory
    // =====================================

    static async deleteMemory(id: string) {

        return prisma.conversationMemory.delete({

            where: {

                id

            }

        });

    }

    // =====================================
    // Get Memory By Category
    // =====================================

    static async getByCategory(

        userId: string,

        category: string

    ) {

        return prisma.conversationMemory.findMany({

            where: {

                userId,

                category

            }

        });

    }

}