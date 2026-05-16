import { Horizon } from '@stellar/stellar-sdk';
import config from '../config';
import { logger } from '../utils/logger';
import { getCursor, saveCursor } from './cursor';
import { handleTradeCreated } from './handlers/tradeCreated';
import { handleEscrowDeposited } from './handlers/escrowDeposited';
import { HorizonEvent, ParsedContractEvent } from '../types';
import {
  PROTOCOL_IMPLEMENTATION_PERCENTAGE,
  isProtocolEventImplemented,
} from '../protocol/capabilities';

const BATCH_SIZE = 100;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60000;

const contractIds = [
  config.TRADE_CONTRACT_ID,
  config.ESCROW_CONTRACT_ID,
  config.DOCUMENT_CONTRACT_ID,
  config.REGISTRY_CONTRACT_ID,
];

const eventHandlers: Record<string, (event: ParsedContractEvent) => Promise<void>> = {
  TradeCreated: handleTradeCreated,
  EscrowDeposited: handleEscrowDeposited,
};

function parseContractEvent(horizonEvent: HorizonEvent): ParsedContractEvent | null {
  try {
    // Parse Soroban contract event from Horizon
    // This is a simplified parser - actual implementation depends on event structure
    const eventType = horizonEvent.topic?.[0] || 'Unknown';
    const tradeId = horizonEvent.topic?.[1] || '';
    
    return {
      eventType,
      tradeId,
      actor: horizonEvent.source_account,
      data: horizonEvent.value ? JSON.parse(horizonEvent.value.xdr) : {},
      ledger: horizonEvent.ledger,
      timestamp: new Date(horizonEvent.created_at),
    };
  } catch (error) {
    logger.error({ error, event: horizonEvent }, 'Failed to parse contract event');
    return null;
  }
}

async function processEvent(event: HorizonEvent): Promise<void> {
  const parsedEvent = parseContractEvent(event);
  
  if (!parsedEvent) {
    logger.warn({ eventId: event.id }, 'Skipping unparseable event');
    return;
  }

  if (!isProtocolEventImplemented(parsedEvent.eventType)) {
    logger.info(
      { eventType: parsedEvent.eventType, tradeId: parsedEvent.tradeId },
      'Skipping planned protocol event in alpha backend'
    );
    return;
  }

  const handler = eventHandlers[parsedEvent.eventType];

  if (!handler) {
    logger.warn({ eventType: parsedEvent.eventType }, 'Implemented event has no registered handler');
    return;
  }

  await handler(parsedEvent);
}

async function startIndexer(): Promise<void> {
  logger.info({ implementationPercentage: PROTOCOL_IMPLEMENTATION_PERCENTAGE }, 'Starting Azaka alpha indexer');
  logger.info({ contracts: contractIds }, 'Monitoring contract addresses');

  const server = new Horizon.Server(config.HORIZON_URL);
  let cursor = await getCursor();
  let backoffMs = INITIAL_BACKOFF_MS;
  let eventCount = 0;

  logger.info({ cursor }, 'Starting from cursor');

  for (;;) {
    try {
      // Stream operations for all contract addresses
      server
        .operations()
        .cursor(cursor)
        .limit(BATCH_SIZE)
        .stream({
          onmessage: (event: unknown) => {
            void (async () => {
              const horizonEvent = event as HorizonEvent;

              try {
                // Filter for contract events from our contracts
                if (horizonEvent.type === 'invoke_host_function' && horizonEvent.contract) {
                  if (contractIds.includes(horizonEvent.contract)) {
                    await processEvent(horizonEvent);
                    eventCount++;
                  }
                }

                // Update cursor after processing
                cursor = horizonEvent.id;

                // Save cursor every 10 events to balance reliability and performance
                if (eventCount % 10 === 0) {
                  await saveCursor(cursor);
                  logger.debug({ cursor, eventCount }, 'Cursor checkpoint saved');
                }

                // Reset backoff on successful processing
                backoffMs = INITIAL_BACKOFF_MS;
              } catch (error) {
                logger.error({ error, eventId: horizonEvent.id }, 'Error processing event');
                // Don't throw - log and continue to next event
              }
            })();
          },
          onerror: (errorEvent: unknown) => {
            const error = errorEvent instanceof Error ? errorEvent : new Error('Horizon stream error');
            logger.error({ error: errorEvent }, 'Horizon stream error');
            throw error;
          },
        });

      // Keep the stream alive
      await new Promise(() => {}); // Never resolves - stream runs indefinitely
    } catch (error) {
      logger.error({ error, backoffMs }, 'Indexer error, backing off');

      // Save cursor before backing off
      try {
        await saveCursor(cursor);
        logger.info({ cursor }, 'Cursor saved before backoff');
      } catch (saveError) {
        logger.error({ error: saveError }, 'CRITICAL: Failed to save cursor before backoff');
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);

      logger.info('Reconnecting to Horizon');
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

// Start the indexer
startIndexer().catch((error) => {
  logger.error({ error }, 'Fatal indexer error');
  process.exit(1);
});
