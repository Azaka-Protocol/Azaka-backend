import { TradeStatus } from '@prisma/client';
import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';

export async function handleTradeCancelled(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId, actor }, 'Processing TradeCancelled event');

    // Update trade status to Cancelled
    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: TradeStatus.Cancelled,
        cancelledAt: timestamp,
      },
    });

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'TradeCancelled',
        actor,
        meta: data,
        ledger,
        timestamp,
      },
    });

    // Notify both parties
    await enqueueNotification({
      tradeId,
      eventType: 'tradeCancelled',
      recipients: [trade.exporter, trade.importer],
      data: {
        ...data,
        cancelledBy: actor,
        reason: data.reason,
      },
    });

    logger.info({ tradeId }, 'TradeCancelled event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process TradeCancelled event');
  }
}
