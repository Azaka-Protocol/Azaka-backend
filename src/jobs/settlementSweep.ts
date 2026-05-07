import { Queue, Worker } from 'bullmq';
import prisma from '../db/client';
import { logger } from '../utils/logger';
import { TradeStatus } from '@prisma/client';
import config from '../config';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379'),
};

const maintenanceQueue = new Queue('maintenance', { connection });

const STALE_DAYS = 14;

async function sweepStaleTrades(): Promise<void> {
  try {
    logger.info('Running settlement sweep');

    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);

    // Find trades stuck in DocumentsPending for more than 14 days
    const staleTrades = await prisma.trade.findMany({
      where: {
        status: TradeStatus.DocumentsPending,
        createdAt: {
          lt: staleThreshold,
        },
      },
      include: {
        documents: true,
        events: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    logger.info({ count: staleTrades.length }, 'Found stale trades');

    for (const trade of staleTrades) {
      const daysSinceCreation = Math.floor(
        (Date.now() - trade.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      logger.warn(
        {
          tradeId: trade.id,
          daysSinceCreation,
          documentsSubmitted: trade.documents.length,
          requiredDocs: trade.requiredDocs.length,
          lastEvent: trade.events[0]?.eventType,
        },
        'Stale trade detected - manual review required'
      );

      // Create a flag event for manual review
      await prisma.tradeEvent.create({
        data: {
          tradeId: trade.id,
          eventType: 'StaleTradeFlagged',
          ledger: trade.events[0]?.ledger || 0,
          timestamp: new Date(),
          meta: {
            daysSinceCreation,
            documentsSubmitted: trade.documents.length,
            requiredDocs: trade.requiredDocs.length,
            reason: 'Trade stuck in DocumentsPending for more than 14 days',
          },
        },
      });
    }
  } catch (error) {
    logger.error({ error }, 'Failed to sweep stale trades');
  }
}

// Schedule the job to run every 6 hours
export const settlementSweepWorker = new Worker(
  'maintenance',
  async (job) => {
    if (job.name === 'sweep-stale-trades') {
      await sweepStaleTrades();
    }
  },
  { connection }
);

// Add recurring job
maintenanceQueue.add(
  'sweep-stale-trades',
  {},
  {
    repeat: {
      pattern: '0 */6 * * *', // Every 6 hours
    },
  }
);

logger.info('Settlement sweep scheduled');
