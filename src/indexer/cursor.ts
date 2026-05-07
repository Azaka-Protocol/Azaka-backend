import prisma from '../db/client';
import { logger } from '../utils/logger';

/**
 * Get the last saved Horizon cursor from the database.
 * Returns "now" if no cursor exists (first run).
 */
export async function getCursor(): Promise<string> {
  try {
    const record = await prisma.indexerCursor.findUnique({
      where: { id: 1 },
    });

    if (!record) {
      logger.info('No cursor found in database, starting from "now"');
      return 'now';
    }

    logger.info({ cursor: record.cursor }, 'Loaded cursor from database');
    return record.cursor;
  } catch (error) {
    logger.error({ error }, 'Failed to get cursor from database');
    throw error;
  }
}

/**
 * Save the current Horizon cursor to the database.
 * Uses upsert to handle both initial save and updates.
 * This is the most critical reliability piece - must never fail silently.
 */
export async function saveCursor(cursor: string): Promise<void> {
  try {
    await prisma.indexerCursor.upsert({
      where: { id: 1 },
      update: { cursor },
      create: { id: 1, cursor },
    });

    logger.debug({ cursor }, 'Cursor saved to database');
  } catch (error) {
    logger.error({ error, cursor }, 'CRITICAL: Failed to save cursor to database');
    throw error;
  }
}

/**
 * Get the last cursor update time for health checks.
 * Returns null if no cursor exists.
 */
export async function getLastCursorUpdate(): Promise<Date | null> {
  try {
    const record = await prisma.indexerCursor.findUnique({
      where: { id: 1 },
      select: { updatedAt: true },
    });

    return record?.updatedAt || null;
  } catch (error) {
    logger.error({ error }, 'Failed to get cursor update time');
    return null;
  }
}
