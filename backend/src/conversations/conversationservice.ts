import prisma from "../prisma/client";

export class ConversationService {

    // ======================================
    // Find latest conversation
    // ======================================

    static async getLatestConversation(userId: string) {

        let conversation =
            await prisma.conversation.findFirst({

                where: {
                    userId
                },

                orderBy: {
                    updatedAt: "desc"
                }

            });

        if (!conversation) {

            conversation =
                await prisma.conversation.create({

                    data: {
                        userId,
                        title: "New Conversation"
                    }

                });

        }

        return conversation;

    }

    // ======================================
    // Save User Message
    // ======================================

    static async saveUserMessage(
        userId: string,
        message: string
    ) {

        const conversation =
            await this.getLatestConversation(userId);

        return prisma.message.create({

            data: {

                conversationId: conversation.id,

                role: "USER",

                content: message

            }

        });

    }

    // ======================================
    // Save AI Message
    // ======================================

    static async saveAssistantMessage(
        userId: string,
        message: string
    ) {

        const conversation =
            await this.getLatestConversation(userId);

        return prisma.message.create({

            data: {

                conversationId: conversation.id,

                role: "ASSISTANT",

                content: message

            }

        });

    }

    // ======================================
    // Get Recent Messages
    // ======================================

    static async getRecentMessages(
        userId: string,
        limit: number = 20
    ) {

        const conversation =
            await this.getLatestConversation(userId);

        return prisma.message.findMany({

            where: {
                conversationId: conversation.id
            },

            orderBy: {
                createdAt: "asc"
            },

            take: limit

        });

    }

    // ======================================
    // Delete Conversation
    // ======================================

    static async deleteConversation(
        conversationId: string
    ) {

        await prisma.message.deleteMany({

            where: {
                conversationId
            }

        });

        return prisma.conversation.delete({

            where: {
                id: conversationId
            }

        });

    }

}