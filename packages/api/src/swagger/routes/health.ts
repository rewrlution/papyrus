import { z } from 'zod';

import {
  ApiDataResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

import { registry } from '../registry.js';

const HealthDataSchema = z.object({
  status: z.string(),
  database: z.string(),
  timestamp: z.string(),
});

const HealthSuccessResponseSchema = ApiDataResponseSchema(HealthDataSchema);

/**
 * GET /health
 * Check API and database health
 */
registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  description: `Check the health status of the API and its dependencies.

- Returns 200 if API and database are healthy
- Returns 503 if database connection fails
- Used by load balancers and monitoring systems

No authentication required.`,
  security: [], // Public endpoint

  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: HealthSuccessResponseSchema,
          example: {
            success: true,
            message: 'API is healthy',
            data: {
              status: 'ok',
              database: 'connected',
              timestamp: '2025-12-26T12:00:00.000Z',
            },
          },
        },
      },
    },
    503: {
      description: 'Service unavailable - database connection failed',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
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
          },
        },
      },
    },
  },
});
