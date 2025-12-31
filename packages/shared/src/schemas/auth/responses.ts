import { ApiDataResponseSchema } from '../common/response.js';
import { UserDataSchema } from '../common/user.js';
import { z } from '../zod.js';

// signup response data (no jwt - user needs to verify email)
export const SignupDataSchema = UserDataSchema;

// signin response data (includes jwt)
export const SigninDataSchema = UserDataSchema.extend({
  token: z.string(),
});

export const SignupResponseSchema = ApiDataResponseSchema(
  SignupDataSchema
).openapi('SignupResponse', {
  description: 'Signup API response',
  example: {
    success: true,
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      verifified: false,
    },
    message:
      'User registered successfully. Please check your email to verify your account.',
  },
});

export const SigninResponseSchema = ApiDataResponseSchema(
  SigninDataSchema
).openapi('SigninResponse', {
  description: 'Signin API response',
  example: {
    success: true,
    data: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      verifified: true,
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    message: 'Signin successful',
  },
});

export type SignupData = z.infer<typeof SignupDataSchema>;
export type SigninData = z.infer<typeof SigninDataSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
export type SigninResponse = z.infer<typeof SigninResponseSchema>;
