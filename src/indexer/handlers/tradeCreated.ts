import { TradeStatus } from '@prisma/client';
import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';

export async function handleTradeCreated(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId, actor }, 'Processing TradeCreated event');

    // Upsert trade record
    await prisma.trade.upsert({
      where: { id: tradeId },
      update: {
        status: TradeStatus.PendingEscrow,
      },
      create: {
        id: tradeId,
        exporter: data.exporter as string,
        importer: data.importer as string,
        issuingBank: data.issuingBank as string | null,
        confirmingBank: data.confirmingBank as string | null,
        asset: data.asset as string,
        amount: data.amount as string,
        status: TradeStatus.PendingEscrow,
        requiredDocs: data.requiredDocs as string[],
        expiryLedger: data.expiryLedger as number,
        createdAt: timestamp,
      },
    });

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'TradeCreated',
        actor,
        meta: data,
        ledger,
        timestamp,
      },
    });

    // Enqueue notification
    await enqueueNotification({
      tradeId,
      eventType: 'tradeCreated',
      recipients: [data.exporter as string, data.importer as string],
      data,
    });

    logger.info({ tradeId }, 'TradeCreated event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process TradeCreated event');
    // Don't throw - log and continue to avoid crashing the indexer
  }
}
