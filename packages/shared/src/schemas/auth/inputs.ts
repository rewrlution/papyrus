import { z } from 'zod';

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
  });

export const SigninSchema = z.object({
  email: z.email('Invalid email addresss'),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const ResendVerificationSchema = z.object({
  email: z.email('Invalid email address'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type SigninInput = z.infer<typeof SigninSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
