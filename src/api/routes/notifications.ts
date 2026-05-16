import { Router, type Router as ExpressRouter } from 'express';
import prisma from '../../db/client';
import { requireApiKey } from '../middleware/auth';
import { ApiResponse } from '../../types';
import { logger } from '../../utils/logger';

const router: ExpressRouter = Router();

// POST /notifications/subscribe - Subscribe to notifications
router.post('/subscribe', requireApiKey, async (req, res) => {
  try {
    const { address, email, phone, tradeId } = req.body;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Missing address',
      });
      return;
    }

    if (!email && !phone) {
      res.status(400).json({
        success: false,
        error: 'At least one of email or phone is required',
      });
      return;
    }

    // Upsert subscription
    const subscription = await prisma.notificationSubscription.create({
      data: {
        address,
        email: email || null,
        phone: phone || null,
        tradeId: tradeId || null,
      },
    });

    logger.info({ address, email, phone, tradeId }, 'Notification subscription created');

    const response: ApiResponse = {
      success: true,
      data: subscription,
    };

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Failed to create subscription');
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
    });
  }
});

// DELETE /notifications/subscribe - Unsubscribe from notifications
router.delete('/subscribe', requireApiKey, async (req, res) => {
  try {
    const { address, tradeId } = req.body;

    if (!address) {
      res.status(400).json({
        success: false,
        error: 'Missing address',
      });
      return;
    }

    // Delete subscriptions
    const where: { address: string; tradeId?: string | null } = { address };
    if (tradeId) {
      where.tradeId = tradeId;
    }

    const result = await prisma.notificationSubscription.deleteMany({
      where,
    });

    logger.info({ address, tradeId, count: result.count }, 'Notification subscriptions deleted');

    const response: ApiResponse = {
      success: true,
      data: {
        deleted: result.count,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Failed to delete subscription');
    res.status(500).json({
      success: false,
      error: 'Failed to delete subscription',
    });
  }
});

export default router;
