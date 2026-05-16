import { Prisma, TradeStatus } from '@prisma/client';
import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';

export async function handleEscrowDeposited(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId, actor }, 'Processing EscrowDeposited event');

    // Update trade status to Active
    const trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        status: TradeStatus.Active,
      },
    });

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'EscrowDeposited',
        actor,
        meta: data as Prisma.InputJsonObject,
        ledger,
        timestamp,
      },
    });

    // Enqueue notification to exporter that funds are locked
    await enqueueNotification({
      tradeId,
      eventType: 'escrowDeposited',
      recipients: [trade.exporter],
      data: {
        ...data,
        amount: trade.amount,
        asset: trade.asset,
      },
    });

    logger.info({ tradeId }, 'EscrowDeposited event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process EscrowDeposited event');
  }
}
