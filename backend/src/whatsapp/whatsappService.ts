import prisma from '../prisma/client';
import { NotificationType, NotificationStatus } from '@prisma/client';

export class WhatsAppService {
  /**
   * Dispatches a WhatsApp-only notification to the user, logs it to stdout, and saves it in the database.
   */
  public static async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType
  ): Promise<any> {
    console.log('\n=======================================');
    console.log(`[WHATSAPP NOTIFICATION DISPATCHED]`);
    console.log(`Recipient User ID: ${userId}`);
    console.log(`Notification Type: ${type}`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);
    console.log('=======================================\n');

    const status: NotificationStatus = NotificationStatus.DELIVERED;

    try {
      // Save notification to database for review/mock dashboard
      const notification = await prisma.notification.create({
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
    } catch (error) {
      console.error('Failed to save WhatsApp notification log:', error);
      return null;
    }
  }

  /**
   * Broadcast summary reports to the Honour
   */
  public static async broadcastSummary(honourId: string, summaryText: string, isWeekly = false): Promise<any> {
    const title = isWeekly ? 'Weekly Operational Summary' : 'Daily Operational Summary';
    return this.sendNotification(honourId, title, summaryText, 'SUMMARY');
  }
}
