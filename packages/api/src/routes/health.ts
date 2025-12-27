import express, { Router, Request, Response } from 'express';
import { type ApiResponse } from '@rewrlution/papyrus-shared';
import { prisma } from '../lib/prisma.js';

const router: Router = express.Router();

router.get('/health', async (req: Request, res: Response) => {
  const logger = req.logger;
  let dbStatus = 'connected';
  let isHealthy = true;

  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error('Database health check failed:', error);
    dbStatus = 'disconnected';
    isHealthy = false;
  }

  if (isHealthy) {
    const response: ApiResponse<{
      status: string;
      database: string;
      timestamp: string;
    }> = {
      success: true,
      message: 'API is healthy',
      data: {
        status: 'ok',
        database: dbStatus,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(200).json(response);
  } else {
    const response: ApiResponse<{
      status: string;
      database: string;
      timestamp: string;
    }> = {
      success: false,
      message: 'Service unavailable',
      error: {
        code: 'DATABASE_UNAVAILABLE',
        details: [
          {
            field: 'database',
            message: 'Database connection failed',
          },
        ],
      },
    };
    res.status(503).json(response);
  }
});

export { router as healthRoutes };
