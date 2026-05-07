import { Queue, Worker } from 'bullmq';
import prisma from '../db/client';
import { logger } from '../utils/logger';
import { enqueueNotification } from './index';
import { TradeStatus } from '@prisma/client';
import config from '../config';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

const maintenanceQueue = new Queue('maintenance', { connection });

// Estimate ledgers per hour (Stellar: ~5 seconds per ledger = 720 ledgers/hour)
const LEDGERS_PER_HOUR = 720;
const WARNING_HOURS = 48;
const WARNING_LEDGERS = WARNING_HOURS * LEDGERS_PER_HOUR;

async function checkExpiringTrades(): Promise<void> {
  try {
    logger.info('Running expiry watcher');

    // Get current ledger from a recent trade event
    const recentEvent = await prisma.tradeEvent.findFirst({
      orderBy: { ledger: 'desc' },
      select: { ledger: true },
    });

    if (!recentEvent) {
      logger.warn('No recent events found, skipping expiry check');
      return;
    }

    const currentLedger = recentEvent.ledger;
    const warningThreshold = currentLedger + WARNING_LEDGERS;

    // Find active trades expiring within 48 hours
    const expiringTrades = await prisma.trade.findMany({
      where: {
        status: TradeStatus.Active,
        expiryLedger: {
          lte: warningThreshold,
          gt: currentLedger,
        },
      },
    });

    logger.info({ count: expiringTrades.length }, 'Found expiring trades');

    for (const trade of expiringTrades) {
      // Check if we've already sent a warning
      const existingWarning = await prisma.tradeEvent.findFirst({
        where: {
          tradeId: trade.id,
          eventType: 'ExpiryWarning',
        },
      });

      if (existingWarning) {
        logger.debug({ tradeId: trade.id }, 'Warning already sent');
        continue;
      }

      // Calculate hours remaining
      const ledgersRemaining = trade.expiryLedger - currentLedger;
      const hoursRemaining = Math.floor(ledgersRemaining / LEDGERS_PER_HOUR);

      // Create warning event
      await prisma.tradeEvent.create({
        data: {
          tradeId: trade.id,
          eventType: 'ExpiryWarning',
          ledger: currentLedger,
          timestamp: new Date(),
          meta: {
            hoursRemaining,
            expiryLedger: trade.expiryLedger,
          },
        },
      });

      // Enqueue notification
      await enqueueNotification({
        tradeId: trade.id,
        eventType: 'tradeExpiring',
        recipients: [trade.exporter, trade.importer],
        data: {
          hoursRemaining,
          expiryLedger: trade.expiryLedger,
        },
      });

      logger.info({ tradeId: trade.id, hoursRemaining }, 'Expiry warning sent');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to check expiring trades');
  }
}

// Schedule the job to run every hour
export const expiryWatcherWorker = new Worker(
  'maintenance',
  async (job) => {
    if (job.name === 'check-expiring-trades') {
      await checkExpiringTrades();
    }
  },
  { connection }
);

// Add recurring job
maintenanceQueue.add(
  'check-expiring-trades',
  {},
  {
    repeat: {
      pattern: '0 * * * *', // Every hour
    },
  }
);

logger.info('Expiry watcher scheduled');
