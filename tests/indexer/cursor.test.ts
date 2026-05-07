import { describe, it, expect, beforeEach } from 'vitest';
import { getCursor, saveCursor, getLastCursorUpdate } from '../../src/indexer/cursor';
import prisma from '../../src/db/client';

describe('Cursor persistence', () => {
  beforeEach(async () => {
    // Clean cursor table
    await prisma.indexerCursor.deleteMany();
  });

  it('should return "now" when no cursor exists', async () => {
    const cursor = await getCursor();
    expect(cursor).toBe('now');
  });

  it('should save and retrieve cursor', async () => {
    const testCursor = 'test-cursor-123';
    await saveCursor(testCursor);

    const retrieved = await getCursor();
    expect(retrieved).toBe(testCursor);
  });

  it('should update existing cursor', async () => {
    await saveCursor('cursor-1');
    await saveCursor('cursor-2');

    const retrieved = await getCursor();
    expect(retrieved).toBe('cursor-2');

    // Should only have one record
    const count = await prisma.indexerCursor.count();
    expect(count).toBe(1);
  });

  it('should track last update time', async () => {
    const before = new Date();
    await saveCursor('test-cursor');
    const after = new Date();

    const lastUpdate = await getLastCursorUpdate();
    expect(lastUpdate).not.toBeNull();
    expect(lastUpdate!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(lastUpdate!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should survive multiple rapid updates', async () => {
    // Simulate rapid cursor updates during event processing
    const cursors = Array.from({ length: 100 }, (_, i) => `cursor-${i}`);

    for (const cursor of cursors) {
      await saveCursor(cursor);
    }

    const final = await getCursor();
    expect(final).toBe('cursor-99');

    const count = await prisma.indexerCursor.count();
    expect(count).toBe(1);
  });
});
