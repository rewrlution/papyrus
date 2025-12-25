import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import type { OpenAPIObject } from 'openapi3-ts/oas30';
import { z } from 'zod';

extendZodWithOpenApi(z);

/**
 * Central OpenAPI registry for all API documentation.
 * Import this in route files to register paths and schemas.
 */
export const registry = new OpenAPIRegistry();

/**
 * Register security schemes.
 * Bearer token authentication using JWT.
 */
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description:
    'JWT token obtained from /auth/signin. Tokens expire after 7 days. Include in Authorization header as: Bearer <token>',
});

/**
 * Generate OpenAPI document from registry.
 * Call this after all routes have been registered.
 */
export function generateDocument(): OpenAPIObject {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Papyrus API',
      version: '1.0.0',
      description: 'Papyrus API',
      contact: {
        name: 'Papyrus API Support',
        email: 'rewrlution@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.papyrus.rewrlution.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and user management endpoints',
      },
      {
        name: 'Journal',
        description: 'Journal management endpoints',
      },
    ],
  });
}
