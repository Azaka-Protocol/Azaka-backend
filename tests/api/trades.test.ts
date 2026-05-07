import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import tradesRouter from '../../src/api/routes/trades';
import prisma from '../../src/db/client';
import { TradeStatus, DocType } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/trades', tradesRouter);

describe('Trades API', () => {
  beforeEach(async () => {
    // Clean database
    await prisma.tradeEvent.deleteMany();
    await prisma.document.deleteMany();
    await prisma.trade.deleteMany();
  });

  describe('GET /trades', () => {
    it('should return empty list when no trades exist', async () => {
      const response = await request(app).get('/trades');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should return paginated trades', async () => {
      // Create test trades
      await prisma.trade.createMany({
        data: [
          {
            id: 'trade-1',
            exporter: 'exporter-1',
            importer: 'importer-1',
            asset: 'USDC',
            amount: '10000',
            status: TradeStatus.Active,
            requiredDocs: [DocType.BillOfLading],
            expiryLedger: 1000000,
            createdAt: new Date(),
          },
          {
            id: 'trade-2',
            exporter: 'exporter-2',
            importer: 'importer-2',
            asset: 'USDC',
            amount: '20000',
            status: TradeStatus.PendingEscrow,
            requiredDocs: [DocType.CertificateOfOrigin],
            expiryLedger: 1000100,
            createdAt: new Date(),
          },
        ],
      });

      const response = await request(app).get('/trades?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter trades by status', async () => {
      await prisma.trade.createMany({
        data: [
          {
            id: 'trade-1',
            exporter: 'exporter-1',
            importer: 'importer-1',
            asset: 'USDC',
            amount: '10000',
            status: TradeStatus.Active,
            requiredDocs: [],
            expiryLedger: 1000000,
            createdAt: new Date(),
          },
          {
            id: 'trade-2',
            exporter: 'exporter-2',
            importer: 'importer-2',
            asset: 'USDC',
            amount: '20000',
            status: TradeStatus.Settled,
            requiredDocs: [],
            expiryLedger: 1000100,
            createdAt: new Date(),
          },
        ],
      });

      const response = await request(app).get('/trades?status=Active');

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].status).toBe('Active');
    });
  });

  describe('GET /trades/:id', () => {
    it('should return 404 for non-existent trade', async () => {
      const response = await request(app).get('/trades/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return trade with events and documents', async () => {
      const trade = await prisma.trade.create({
        data: {
          id: 'trade-1',
          exporter: 'exporter-1',
          importer: 'importer-1',
          asset: 'USDC',
          amount: '10000',
          status: TradeStatus.Active,
          requiredDocs: [DocType.BillOfLading],
          expiryLedger: 1000000,
          createdAt: new Date(),
        },
      });

      await prisma.tradeEvent.create({
        data: {
          tradeId: trade.id,
          eventType: 'TradeCreated',
          ledger: 999000,
          timestamp: new Date(),
        },
      });

      const response = await request(app).get(`/trades/${trade.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(trade.id);
      expect(response.body.data.events).toHaveLength(1);
    });
  });

  describe('GET /trades/:id/timeline', () => {
    it('should return timeline in ascending order', async () => {
      const trade = await prisma.trade.create({
        data: {
          id: 'trade-1',
          exporter: 'exporter-1',
          importer: 'importer-1',
          asset: 'USDC',
          amount: '10000',
          status: TradeStatus.Active,
          requiredDocs: [],
          expiryLedger: 1000000,
          createdAt: new Date(),
        },
      });

      await prisma.tradeEvent.createMany({
        data: [
          {
            tradeId: trade.id,
            eventType: 'TradeCreated',
            ledger: 999000,
            timestamp: new Date('2024-01-01'),
          },
          {
            tradeId: trade.id,
            eventType: 'EscrowDeposited',
            ledger: 999100,
            timestamp: new Date('2024-01-02'),
          },
        ],
      });

      const response = await request(app).get(`/trades/${trade.id}/timeline`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].eventType).toBe('TradeCreated');
      expect(response.body.data[1].eventType).toBe('EscrowDeposited');
    });
  });
});
