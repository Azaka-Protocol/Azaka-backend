import { Prisma, TradeStatus } from '@prisma/client';
import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';

export async function handleTradeExpired(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId }, 'Processing TradeExpired event');

    // Update trade status to Expired
    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: TradeStatus.Expired,
        expiredAt: timestamp,
      },
    });

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'TradeExpired',
        actor,
        meta: data as Prisma.InputJsonObject,
        ledger,
        timestamp,
      },
    });

    // Notify both parties
    await enqueueNotification({
      tradeId,
      eventType: 'tradeExpired',
      recipients: [trade.exporter, trade.importer],
      data: {
        ...data,
        expiryLedger: trade.expiryLedger,
      },
    });

    logger.info({ tradeId }, 'TradeExpired event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process TradeExpired event');
  }
}
