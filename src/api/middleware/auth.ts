import { Request, Response, NextFunction } from 'express';
import config from '../../config';
import { logger } from '../../utils/logger';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    logger.warn({ path: req.path }, 'Missing API key');
    res.status(401).json({
      success: false,
      error: 'Missing API key',
    });
    return;
  }

  if (apiKey !== config.API_KEY) {
    logger.warn({ path: req.path }, 'Invalid API key');
    res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
    return;
  }

  next();
}
