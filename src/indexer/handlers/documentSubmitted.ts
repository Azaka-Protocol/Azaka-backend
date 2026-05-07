import prisma from '../../db/client';
import { logger } from '../../utils/logger';
import { ParsedContractEvent } from '../../types';
import { enqueueNotification } from '../../jobs';
import { DocType } from '@prisma/client';

export async function handleDocumentSubmitted(event: ParsedContractEvent): Promise<void> {
  const { tradeId, data, ledger, timestamp, actor } = event;

  try {
    logger.info({ tradeId, actor, docType: data.docType }, 'Processing DocumentSubmitted event');

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      logger.warn({ tradeId }, 'Trade not found for DocumentSubmitted event');
      return;
    }

    // Create document record
    await prisma.document.create({
      data: {
        tradeId,
        docType: data.docType as DocType,
        hash: data.hash as string,
        ipfsCid: data.ipfsCid as string | undefined,
        submittedBy: actor || 'unknown',
        submittedAt: timestamp,
        signers: (data.signers as string[]) || [],
        verified: false,
      },
    });

    // Insert trade event
    await prisma.tradeEvent.create({
      data: {
        tradeId,
        eventType: 'DocumentSubmitted',
        actor,
        meta: data,
        ledger,
        timestamp,
      },
    });

    // Notify relevant parties (importer, banks if involved)
    const recipients = [trade.importer];
    if (trade.issuingBank) recipients.push(trade.issuingBank);
    if (trade.confirmingBank) recipients.push(trade.confirmingBank);

    await enqueueNotification({
      tradeId,
      eventType: 'documentSubmitted',
      recipients,
      data: {
        ...data,
        submittedBy: actor,
      },
    });

    logger.info({ tradeId, docType: data.docType }, 'DocumentSubmitted event processed successfully');
  } catch (error) {
    logger.error({ error, tradeId }, 'Failed to process DocumentSubmitted event');
  }
}
