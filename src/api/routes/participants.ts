import { Router, type Router as ExpressRouter } from 'express';
import prisma from '../../db/client';
import { ApiResponse } from '../../types';

const router: ExpressRouter = Router();

// GET /participants/:address - Get participant details
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const participant = await prisma.participant.findUnique({
      where: { address },
    });

    if (!participant) {
      res.status(404).json({
        success: false,
        error: 'Participant not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: participant,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participant',
    });
  }
});

export default router;
