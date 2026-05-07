import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from '../../src/api/routes/health';
import prisma from '../../src/db/client';

const app = express();
app.use('/health', healthRouter);

describe('Health API', () => {
  beforeEach(async () => {
    await prisma.indexerCursor.deleteMany();
  });

  it('should return down status when no cursor exists', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('down');
  });

  it('should return ok status when indexer is current', async () => {
    // Create recent cursor
    await prisma.indexerCursor.create({
      data: {
        id: 1,
        cursor: 'test-cursor',
      },
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.indexerLag).toBeLessThan(10);
  });

  it('should return degraded status when indexer is lagging', async () => {
    // Create old cursor (6 minutes ago)
    const oldDate = new Date(Date.now() - 6 * 60 * 1000);
    await prisma.indexerCursor.create({
      data: {
        id: 1,
        cursor: 'test-cursor',
        updatedAt: oldDate,
      },
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('degraded');
    expect(response.body.data.indexerLag).toBeGreaterThan(300);
  });

  it('should return down status when indexer is very stale', async () => {
    // Create very old cursor (20 minutes ago)
    const oldDate = new Date(Date.now() - 20 * 60 * 1000);
    await prisma.indexerCursor.create({
      data: {
        id: 1,
        cursor: 'test-cursor',
        updatedAt: oldDate,
      },
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('down');
    expect(response.body.data.indexerLag).toBeGreaterThan(900);
  });
});
