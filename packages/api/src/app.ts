import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { type ApiResponse } from '@rewrlution/papyrus-shared';

import { swaggerOptions, swaggerDocument } from './swagger/index.js';
import { env } from './env/config.js';
import { authRoutes, healthRoutes } from './routes/index.js';
import { requestLogger, errorHandler } from './middleware/index.js';
import { NotFoundError } from './lib/errors.js';

export function createApp(): Express {
  const app = express();

  // middleware
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(requestLogger);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // root endpoint - API info
  app.get('/', (_req: Request, res: Response) => {
    const response: ApiResponse<{
      name: string;
      version: string;
      documentation: string;
      endpoints: { [key: string]: string };
    }> = {
      success: true,
      message: 'Welcome to Papyrus API',
      data: {
        name: 'Papyrus API',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
          health: '/health',
          docs: '/api-docs',
        },
      },
    };
    res.json(response);
  });

  // Generate OpenAPI document
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerDocument, swaggerOptions));

  // Routes
  app.use('/health', healthRoutes);
  app.use('/auth', authRoutes);

  // 404 Handler
  app.use((_req, res) => {
    const notFoundError = new NotFoundError('Endpoint not found');
    res.status(notFoundError.statusCode).json(notFoundError.toJSON());
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
