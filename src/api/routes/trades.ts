import { Router, type Router as ExpressRouter } from 'express';
import prisma from '../../db/client';
import { ApiResponse, PaginatedResponse, TradeWithSummary, TimelineEvent } from '../../types';
import { TradeStatus } from '@prisma/client';

const router: ExpressRouter = Router();

// GET /trades - List trades with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      exporter,
      importer,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: {
      exporter?: string;
      importer?: string;
      status?: TradeStatus;
    } = {};

    if (exporter) where.exporter = exporter as string;
    if (importer) where.importer = importer as string;
    if (status) where.status = status as TradeStatus;

    // Get total count
    const total = await prisma.trade.count({ where });

    // Get trades with latest event and document summary
    const trades = await prisma.trade.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        documents: {
          select: {
            verified: true,
          },
        },
      },
    });

    const tradesWithSummary: TradeWithSummary[] = trades.map((trade) => ({
      id: trade.id,
      exporter: trade.exporter,
      importer: trade.importer,
      issuingBank: trade.issuingBank,
      confirmingBank: trade.confirmingBank,
      asset: trade.asset,
      amount: trade.amount,
      status: trade.status,
      requiredDocs: trade.requiredDocs,
      expiryLedger: trade.expiryLedger,
      createdAt: trade.createdAt,
      settledAt: trade.settledAt,
      cancelledAt: trade.cancelledAt,
      expiredAt: trade.expiredAt,
      latestEvent: trade.events[0]
        ? {
            eventType: trade.events[0].eventType,
            timestamp: trade.events[0].timestamp,
          }
        : undefined,
      documentSummary: {
        total: trade.documents.length,
        verified: trade.documents.filter((d) => d.verified).length,
      },
    }));

    const response: ApiResponse<PaginatedResponse<TradeWithSummary>> = {
      success: true,
      data: {
        items: tradesWithSummary,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trades',
    });
  }
});

// GET /trades/:id - Get trade details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
        },
        documents: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!trade) {
      res.status(404).json({
        success: false,
        error: 'Trade not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: trade,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trade',
    });
  }
});

// GET /trades/:id/timeline - Get trade timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;

    const events = await prisma.tradeEvent.findMany({
      where: { tradeId: id },
      orderBy: { timestamp: 'asc' },
    });

    const timeline: TimelineEvent[] = events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      actor: event.actor,
      meta: event.meta as Record<string, unknown> | null,
      ledger: event.ledger,
      timestamp: event.timestamp,
    }));

    const response: ApiResponse<TimelineEvent[]> = {
      success: true,
      data: timeline,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline',
    });
  }
});

export default router;
