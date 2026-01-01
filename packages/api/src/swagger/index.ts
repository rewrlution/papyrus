/**
 * OpenAPI Documentation Entry Point
 *
 * IMPORTANT: Import order matters!
 * 1. Registry must be initialized first (registry.ts)
 * 2. Route files import and register paths (routes/auth, routes/journal)
 * 3. Generate document after all registrations complete
 */

// Import route files - this executes registration
import './routes/auth/index.js';
import './routes/journal/index.js';

// Generate and export the OpenAPI document
import { generateDocument } from './generator.js';

export const swaggerDocument = generateDocument();
export const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Papyrus API Documentation',
};
