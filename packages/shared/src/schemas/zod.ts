import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// extend zod with OpenAPI capabilities
extendZodWithOpenApi(z);

// re-export the extended z instance
export { z };
