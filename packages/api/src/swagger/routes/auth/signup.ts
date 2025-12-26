import { registry } from '../../registry.js';
import {
  SignupSchema,
  SignupResponseSchema,
  ApiErrorResponseSchema,
} from '@rewrlution/papyrus-shared';

/**
 * POST /auth/signup
 * Register a new user account
 */
registry.registerPath({
  method: 'post',
  path: '/auth/signup',
  tags: ['Auth'],
  summary: 'Register a new user',
  description: `Creates a new user account with email and password.

- Returns user data without JWT token (email verification required first)
- Sends verification email to provided address
- Password must meet complexity requirements
- Email must be unique across all users

No authentication required.`,
  security: [], // Public endpoint

  request: {
    body: {
      description: 'User registration data',
      required: true,
      content: {
        'application/json': {
          schema: SignupSchema,
          example: {
            email: 'user@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!',
          },
        },
      },
    },
  },

  responses: {
    201: {
      description: 'User successfully created. Verification email sent.',
      content: {
        'application/json': {
          schema: SignupResponseSchema,
          example: {
            success: true,
            message:
              'User registered successfully. Please check your email to verify your account.',
            data: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'user@example.com',
              verified: false,
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
          examples: {
            validation: {
              summary: 'Validation error',
              value: {
                success: false,
                message: 'Validation failed',
                error: {
                  code: 'VALIDATION_ERROR',
                  details: [
                    { field: 'password', message: 'Need uppercase letter' },
                    {
                      field: 'confirmPassword',
                      message: "Passwords don't match",
                    },
                  ],
                },
              },
            },
            invalidEmail: {
              summary: 'Invalid email format',
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
          },
        },
      },
    },

    409: {
      description: 'User with this email already exists',
      content: {
        'application/json': {
          schema: ApiErrorResponseSchema,
          example: {
            success: false,
            message: 'User with this email already exists',
            error: {
              code: 'USER_EXISTS',
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
