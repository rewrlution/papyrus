import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { formatMessage, type ApiResponse } from '@rewrlution/papyrus-shared';
import { swaggerOptions, swaggerDocument } from './swagger/index.js';
import { env } from './env/config.js';

export function createServer(): Express {
  const app = express();

  // middleware
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
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
      message: formatMessage('Welcome to Papyrus API'),
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

  // health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    const response: ApiResponse<{ status: string; timestamp: string }> = {
      success: true,
      message: formatMessage('API is healthy'),
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
    res.json(response);
  });
  return app;
}
