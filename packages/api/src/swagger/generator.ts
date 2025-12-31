import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import type { OpenAPIObject } from 'openapi3-ts/oas30';

import { registry } from './registry.js';

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
