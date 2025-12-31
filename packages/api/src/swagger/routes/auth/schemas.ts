import {
  SignupSchema,
  SigninSchema,
  SignupResponseSchema,
  SigninResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

import { registry } from '../../registry.js';

/**
 * Register all auth-related schemas with OpenAPI registry
 */
registry.register('SignupInput', SignupSchema);
registry.register('SigninInput', SigninSchema);
registry.register('SignupResponse', SignupResponseSchema);
registry.register('SigninResponse', SigninResponseSchema);
registry.register('ApiErrorResponse', ApiErrorResponseSchema);
