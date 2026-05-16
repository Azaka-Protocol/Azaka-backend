import { Router, type Router as ExpressRouter } from 'express';
import { getLastCursorUpdate } from '../../indexer/cursor';
import { ApiResponse, HealthStatus } from '../../types';
import { PROTOCOL_IMPLEMENTATION_PERCENTAGE } from '../../protocol/capabilities';

const router: ExpressRouter = Router();

router.get('/', async (_req, res) => {
  try {
    const lastUpdate = await getLastCursorUpdate();
    
    let indexerLag = 0;
    let status: 'ok' | 'degraded' | 'down' = 'ok';

    if (lastUpdate) {
      indexerLag = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      
      // If indexer hasn't updated in 5 minutes, mark as degraded
      if (indexerLag > 300) {
        status = 'degraded';
      }
      
      // If indexer hasn't updated in 15 minutes, mark as down
      if (indexerLag > 900) {
        status = 'down';
      }
    } else {
      status = 'down';
    }

    const response: ApiResponse<HealthStatus> = {
      success: true,
      data: {
        status,
        indexerLag,
        implementationPercentage: PROTOCOL_IMPLEMENTATION_PERCENTAGE,
        timestamp: new Date(),
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check health',
    });
  }
});

export default router;
