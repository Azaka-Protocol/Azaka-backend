import { Queue, Worker, QueueEvents } from 'bullmq';
import config from '../config';
import { logger } from '../utils/logger';
import { NotificationPayload } from '../types';
import { sendEmailNotification } from './workers/emailWorker';
import { sendSmsNotification } from './workers/smsWorker';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

// Notification queue
export const notificationQueue = new Queue('notifications', { connection });

// Maintenance queue
export const maintenanceQueue = new Queue('maintenance', { connection });

// Queue events for monitoring
const notificationEvents = new QueueEvents('notifications', { connection });

notificationEvents.on('completed', ({ jobId }) => {
  logger.debug({ jobId }, 'Notification job completed');
});

notificationEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, 'Notification job failed');
});

// Enqueue notification
export async function enqueueNotification(payload: NotificationPayload): Promise<void> {
  await notificationQueue.add('send-notification', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  logger.debug({ tradeId: payload.tradeId, eventType: payload.eventType }, 'Notification enqueued');
}

// Email worker
export const emailWorker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'send-notification') {
      await sendEmailNotification(job.data as NotificationPayload);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Email notification sent');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Email notification failed');
});

// SMS worker
export const smsWorker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'send-notification') {
      await sendSmsNotification(job.data as NotificationPayload);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

smsWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'SMS notification sent');
});

smsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'SMS notification failed');
});

logger.info('Job queues and workers initialized');
