import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import documentsRouter from '../../src/api/routes/documents';
import prisma from '../../src/db/client';
import * as ipfs from '../../src/ipfs';

// Mock IPFS functions
vi.mock('../../src/ipfs', () => ({
  uploadDocument: vi.fn(),
  getDocumentUrl: vi.fn((cid) => `https://gateway.pinata.cloud/ipfs/${cid}`),
}));

const app = express();
app.use(express.json());
app.use('/documents', documentsRouter);

describe('Documents API', () => {
  beforeEach(async () => {
    await prisma.document.deleteMany();
    await prisma.trade.deleteMany();
    vi.clearAllMocks();
  });

  describe('POST /documents/upload', () => {
    it('should require API key', async () => {
      const response = await request(app)
        .post('/documents/upload')
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(response.status).toBe(401);
    });

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/documents/upload')
        .set('X-API-Key', 'test_api_key_with_at_least_32_chars_long')
        .attach('file', Buffer.from('test'), 'test.txt')
        .field('tradeId', 'trade-1')
        .field('docType', 'BillOfLading');

      expect(response.status).toBe(500); // Multer rejects before route handler
    });

    it('should upload valid document', async () => {
      const mockCid = 'QmTest123';
      vi.mocked(ipfs.uploadDocument).mockResolvedValue(mockCid);

      const response = await request(app)
        .post('/documents/upload')
        .set('X-API-Key', 'test_api_key_with_at_least_32_chars_long')
        .attach('file', Buffer.from('test pdf content'), 'test.pdf')
        .field('tradeId', 'trade-1')
        .field('docType', 'BillOfLading');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.cid).toBe(mockCid);
      expect(response.body.data.hash).toBeDefined();
      expect(response.body.data.url).toContain(mockCid);
    });
  });

  describe('GET /documents/:tradeId', () => {
    it('should return empty array for trade with no documents', async () => {
      const response = await request(app).get('/documents/trade-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return documents with IPFS URLs', async () => {
      // Create trade and document
      await prisma.trade.create({
        data: {
          id: 'trade-1',
          exporter: 'exporter-1',
          importer: 'importer-1',
          asset: 'USDC',
          amount: '10000',
          status: 'Active',
          requiredDocs: ['BillOfLading'],
          expiryLedger: 1000000,
          createdAt: new Date(),
        },
      });

      await prisma.document.create({
        data: {
          tradeId: 'trade-1',
          docType: 'BillOfLading',
          hash: 'abc123',
          ipfsCid: 'QmTest456',
          submittedBy: 'exporter-1',
          submittedAt: new Date(),
          signers: [],
        },
      });

      const response = await request(app).get('/documents/trade-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ipfsCid).toBe('QmTest456');
      expect(response.body.data[0].url).toContain('QmTest456');
    });
  });
});
