import prisma from '../../db/client';
import { sendSms } from '../../notifications/sms';
import { getSmsTemplate } from '../../notifications/templates';
import { logger } from '../../utils/logger';
import { NotificationPayload } from '../../types';

export async function sendSmsNotification(payload: NotificationPayload): Promise<void> {
  const { tradeId, eventType, recipients, data } = payload;

  logger.info({ tradeId, eventType, recipients }, 'Processing SMS notification');

  // Get subscriptions for recipients
  const subscriptions = await prisma.notificationSubscription.findMany({
    where: {
      address: { in: recipients },
      phone: { not: null },
      OR: [{ tradeId: null }, { tradeId }],
    },
  });

  if (subscriptions.length === 0) {
    logger.debug({ tradeId, recipients }, 'No SMS subscriptions found');
    return;
  }

  // Get SMS template
  const template = getSmsTemplate(eventType, { tradeId, ...data });

  // Send SMS
  for (const subscription of subscriptions) {
    if (!subscription.phone) continue;

    try {
      await sendSms(subscription.phone, template.message);
      logger.info({ phone: subscription.phone, tradeId, eventType }, 'SMS sent successfully');
    } catch (error) {
      logger.error({ error, phone: subscription.phone, tradeId }, 'Failed to send SMS');
      throw error; // Let BullMQ retry
    }
  }
}
