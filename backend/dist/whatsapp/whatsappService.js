"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
class WhatsAppService {
    /**
     * Dispatches a WhatsApp-only notification to the user, logs it to stdout, and saves it in the database.
     */
    static async sendNotification(userId, title, message, type) {
        console.log('\n=======================================');
        console.log(`[WHATSAPP NOTIFICATION DISPATCHED]`);
        console.log(`Recipient User ID: ${userId}`);
        console.log(`Notification Type: ${type}`);
        console.log(`Title: ${title}`);
        console.log(`Message: ${message}`);
        console.log('=======================================\n');
        const status = client_2.NotificationStatus.DELIVERED;
        try {
            // Save notification to database for review/mock dashboard
            const notification = await client_1.default.notification.create({
                data: {
                    userId,
                    title,
                    message,
                    type,
                    status,
                    sentVia: 'WHATSAPP',
                },
            });
            return notification;
        }
        catch (error) {
            console.error('Failed to save WhatsApp notification log:', error);
            return null;
        }
    }
    /**
     * Broadcast summary reports to the Honour
     */
    static async broadcastSummary(honourId, summaryText, isWeekly = false) {
        const title = isWeekly ? 'Weekly Operational Summary' : 'Daily Operational Summary';
        return this.sendNotification(honourId, title, summaryText, 'SUMMARY');
    }
}
exports.WhatsAppService = WhatsAppService;
