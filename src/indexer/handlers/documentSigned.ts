import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';
import { Prisma } from '@prisma/client';

export async function handleDocumentSigned(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId, actor, documentId: data.documentId }, 'Processing DocumentSigned event');

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      logger.warn({ tradeId }, 'Trade not found for DocumentSigned event');
      return;
    }

    // Update document verification status
    const document = await prisma.document.updateMany({
      where: {
        tradeId,
        hash: data.documentHash as string,
      },
      data: {
        verified: true,
        verifiedAt: timestamp,
      },
    });

    if (document.count === 0) {
      logger.warn({ tradeId, hash: data.documentHash }, 'Document not found for verification');
    }

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'DocumentSigned',
        actor,
        meta: data as Prisma.InputJsonObject,
        ledger,
        timestamp,
      },
    });

    // Notify trade parties
    const recipients = [trade.exporter, trade.importer];
    if (trade.issuingBank) recipients.push(trade.issuingBank);
    if (trade.confirmingBank) recipients.push(trade.confirmingBank);

    await enqueueNotification({
      tradeId,
      eventType: 'documentSigned',
      recipients,
      data: {
        ...data,
        signedBy: actor,
      },
    });

    logger.info({ tradeId, documentHash: data.documentHash }, 'DocumentSigned event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process DocumentSigned event');
  }
}
