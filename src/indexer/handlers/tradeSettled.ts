import { TradeStatus } from '@prisma/client';
import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';

export async function handleTradeSettled(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId, actor }, 'Processing TradeSettled event');

    // Update trade status to Settled
    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: TradeStatus.Settled,
        settledAt: timestamp,
      },
    });

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'TradeSettled',
        actor,
        meta: data,
        ledger,
        timestamp,
      },
    });

    // Notify both exporter and importer
    await enqueueNotification({
      tradeId,
      eventType: 'tradeSettled',
      recipients: [trade.exporter, trade.importer],
      data: {
        ...data,
        amount: trade.amount,
        asset: trade.asset,
      },
    });

    logger.info({ tradeId }, 'TradeSettled event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process TradeSettled event');
  }
}
