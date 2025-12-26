import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

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
