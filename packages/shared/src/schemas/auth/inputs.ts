import { z } from '../zod.js';

export const SignupSchema = z
  .object({
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters long')
      .refine((val) => /[A-Z]/.test(val), 'Need uppercase')
      .refine((val) => /[a-z]/.test(val), 'Need lowercase')
      .refine((val) => /\d/.test(val), 'Need number')
      .refine((val) => /[@$!%*?&]/.test(val), 'Need special char'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .openapi('SignupInput', {
    description: 'User signup request body',
    example: {
      email: 'user@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    },
  });

export const SigninSchema = z
  .object({
    email: z.email('Invalid email addresss'),
    password: z.string().min(1, 'Password is required'),
  })
  .openapi('SigninInput', {
    description: 'User signin request body',
    example: {
      email: 'user@example.com',
      password: 'SecurePass123!',
    },
  });

export const VerifyEmailSchema = z
  .object({
    token: z.string().min(1, 'Verification token is required'),
  })
  .openapi('VerifyEmailInput', {
    description: 'Email verification request body',
    example: {
      token: 'abc123def456',
    },
  });

export const ResendVerificationSchema = z
  .object({
    email: z.email('Invalid email address'),
  })
  .openapi('ResendVerificationInput', {
    description: 'Resend verification email request body',
    example: {
      email: 'user@example.com',
    },
  });

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
