import prisma from '../../db/client';
import { sendEmail } from '../../notifications/email';
import { getEmailTemplate } from '../../notifications/templates';
import { logger } from '../../utils/logger';
import { NotificationPayload } from '../../types';

export async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  const { tradeId, eventType, recipients, data } = payload;

  logger.info({ tradeId, eventType, recipients }, 'Processing email notification');

  // Get subscriptions for recipients
  const subscriptions = await prisma.notificationSubscription.findMany({
    where: {
      address: { in: recipients },
      email: { not: null },
      OR: [{ tradeId: null }, { tradeId }],
    },
  });

  if (subscriptions.length === 0) {
    logger.debug({ tradeId, recipients }, 'No email subscriptions found');
    return;
  }

  // Get email template
  const template = getEmailTemplate(eventType, { tradeId, ...data });

  // Send emails
  for (const subscription of subscriptions) {
    if (!subscription.email) continue;

    try {
      await sendEmail(subscription.email, template.subject, template.html);
      logger.info({ email: subscription.email, tradeId, eventType }, 'Email sent successfully');
    } catch (error) {
      logger.error({ error, email: subscription.email, tradeId }, 'Failed to send email');
      throw error; // Let BullMQ retry
    }
  }
}
