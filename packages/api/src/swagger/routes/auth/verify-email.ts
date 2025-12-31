import {
  VerifyEmailSchema,
  ApiMessageResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

import { registry } from '../../registry.js';

/**
 * GET /auth/verify-email
 * Verify user email address with token
 */
registry.registerPath({
  method: 'get',
  path: '/auth/verify-email',
  tags: ['Auth'],
  summary: 'Verify email address',
  description: `Verifies a user's email address using the verification token sent via email.

- Token is sent to user's email after registration
- Token is valid for 24 hours
- After verification, user can sign in
- Returns success message only (no data)

No authentication required.`,
  security: [], // Public endpoint

  request: {
    query: VerifyEmailSchema,
  },

  responses: {
    200: {
      description: 'Email successfully verified',
      content: {
        'application/json': {
          schema: ApiMessageResponseSchema,
          example: {
            success: true,
            message:
              'Email verified successfully! You may now login with your email and password.',
          },
        },
      },
    },

    400: {
      description: 'Invalid or expired token, or email already verified',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          examples: {
            invalidToken: {
              summary: 'Invalid verification token',
              value: {
                success: false,
                message: 'Invalid verification token',
                error: {
                  code: 'BAD_REQUEST',
                },
              },
            },
            expiredToken: {
              summary: 'Token expired',
              value: {
                success: false,
                message: 'Verification token has expired.',
                error: {
                  code: 'BAD_REQUEST',
                },
              },
            },
            alreadyVerified: {
              summary: 'Email already verified',
              value: {
                success: false,
                message: 'Email already verified',
                error: {
                  code: 'BAD_REQUEST',
                },
              },
            },
          },
        },
      },
    },

    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Internal Server Error',
            error: {
              code: 'INTERNAL_SERVER_ERROR',
            },
          },
        },
      },
    },
  },
});
