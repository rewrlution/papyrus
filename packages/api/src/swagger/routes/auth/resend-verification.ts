import { registry } from '../../registry.js';
import {
  ResendVerificationSchema,
  ApiMessageResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * POST /auth/resend-verification
 * Resend email verification token
 */
registry.registerPath({
  method: 'post',
  path: '/auth/resend-verification',
  tags: ['Auth'],
  summary: 'Resend verification email',
  description: `Resends the email verification token to the user's email address.

- Can be used if the original verification email was not received
- Generates a new verification token and sends it via email
- Will return an error if the email is already verified
- Returns success message only (no data)

No authentication required.`,
  security: [], // Public endpoint

  request: {
    body: {
      description: 'Email address to send verification token to',
      required: true,
      content: {
        'application/json': {
          schema: ResendVerificationSchema,
          example: {
            email: 'user@example.com',
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: 'Verification email sent successfully',
      content: {
        'application/json': {
          schema: ApiMessageResponseSchema,
          example: {
            success: true,
            message: 'Verification email sent successfully.',
          },
        },
      },
    },

    400: {
      description: 'Invalid input or email already verified',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          examples: {
            validation: {
              summary: 'Validation error',
              value: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: [
                    { field: 'email', message: 'Invalid email address' },
                  ],
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
            userNotFound: {
              summary: 'User not found',
              value: {
                success: false,
                message: 'User not found',
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
