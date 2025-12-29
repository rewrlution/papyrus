import { registry } from '../../registry.js';
import {
  SigninSchema,
  SigninResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * POST /auth/signin
 * Authenticate user and return JWT token
 */
registry.registerPath({
  method: 'post',
  path: '/auth/signin',
  tags: ['Auth'],
  summary: 'Sign in a user',
  description: `Authenticates a user with email and password.

- Returns user data with JWT token for authenticated requests
- Token expires after 7 days
- Email must be verified before signin
- Rate limited to 5 attempts per 15 minutes per IP

Use the returned token in the Authorization header:
\`Authorization: Bearer <token>\`

No authentication required to call this endpoint.`,
  security: [], // Public endpoint

  request: {
    body: {
      description: 'User credentials',
      required: true,
      content: {
        'application/json': {
          schema: SigninSchema,
          example: {
            email: 'user@example.com',
            password: 'SecurePass123!',
          },
        },
      },
    },
  },

  responses: {
    200: {
      description: 'User successfully authenticated',
      content: {
        'application/json': {
          schema: SigninResponseSchema,
          example: {
            success: true,
            message: 'Successfully authenticated',
            data: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'user@example.com',
              verified: true,
              token:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE2MTYyMzkwMjIsImV4cCI6MTYxNjg0MzgyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            },
          },
        },
      },
    },

    400: {
      description: 'Invalid input or validation error',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Validation failed',
            error: {
              code: 'VALIDATION_ERROR',
              details: [{ field: 'email', message: 'Invalid email address' }],
            },
          },
        },
      },
    },

    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          examples: {
            invalidCredentials: {
              summary: 'Wrong email or password',
              value: {
                success: false,
                message: 'Invalid credentials',
                error: {
                  code: 'INVALID_CREDENTIALS',
                },
              },
            },
            userNotFound: {
              summary: 'User does not exist',
              value: {
                success: false,
                message: 'User not found',
                error: {
                  code: 'USER_NOT_FOUND',
                },
              },
            },
          },
        },
      },
    },

    403: {
      description: 'Email not verified',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'Please verify your email before signing in',
            error: {
              code: 'EMAIL_NOT_VERIFIED',
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
            message: 'An unexpected error occurred',
            error: {
              code: 'INTERNAL_ERROR',
            },
          },
        },
      },
    },
  },
});
