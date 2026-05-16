import { Router, type Router as ExpressRouter } from 'express';
import { ApiResponse } from '../../types';
import { getProtocolCapabilitySummary } from '../../protocol/capabilities';

const router: ExpressRouter = Router();

router.get('/', (_req, res) => {
  const response: ApiResponse = {
    success: true,
    data: getProtocolCapabilitySummary(),
  };

  res.json(response);
});

export default router;
