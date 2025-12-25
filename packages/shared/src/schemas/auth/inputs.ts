import { z } from '../zod.js';

export const SignupSchema = z
  .object({
    email: z.email('Invalid email address').openapi({
      description: 'User email address',
      example: 'user@example.com',
    }),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters long')
      .refine((val) => /[A-Z]/.test(val), 'Need uppercase')
      .refine((val) => /[a-z]/.test(val), 'Need lowercase')
      .refine((val) => /\d/.test(val), 'Need number')
      .refine((val) => /[@$!%*?&]/.test(val), 'Need special char')
      .openapi({
        description:
          'Password with at least 8 characters, including uppercase, lowercase, number, and special character',
        example: 'SecurePass123!',
      }),
    confirmPassword: z.string().openapi({
      description: 'Password confirmation (must match password)',
      example: 'SecurePass123!',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .openapi('SignupInput', {
    description: 'User signup request body',
  });

export const SigninSchema = z
  .object({
    email: z.email('Invalid email addresss').openapi({
      description: 'User email address',
      example: 'user@example.com',
    }),
    password: z.string().min(1, 'Password is required').openapi({
      description: 'User password',
      example: 'SecurePass123!',
    }),
  })
  .openapi('SigninInput', {
    description: 'User signin request body',
  });

export const VerifyEmailSchema = z
  .object({
    token: z.string().min(1, 'Verification token is required').openapi({
      description: 'Email verification token',
      example: 'abc123def456',
    }),
  })
  .openapi('VerifyEmailInput', {
    description: 'Email verification request body',
  });

export const ResendVerificationSchema = z
  .object({
    email: z.email('Invalid email address').openapi({
      description: 'User email address',
      example: 'user@example.com',
    }),
  })
  .openapi('ResendVerificationInput', {
    description: 'Resend verification email request body',
  });

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
