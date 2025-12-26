import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z, ZodType } from 'zod';

// extend zod with OpenAPI capabilities
extendZodWithOpenApi(z);

// re-export the extended z instance
export { z, ZodType };
