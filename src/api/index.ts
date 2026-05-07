import express from 'express';
import cors from 'cors';
import config from '../config';
import { logger } from '../utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';

// Import routes
import healthRouter from './routes/health';
import tradesRouter from './routes/trades';
import documentsRouter from './routes/documents';
import participantsRouter from './routes/participants';
import notificationsRouter from './routes/notifications';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path }, 'Incoming request');
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/trades', tradesRouter);
app.use('/documents', documentsRouter);
app.use('/participants', participantsRouter);
app.use('/notifications', notificationsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'Azaka API server started');
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});
