import { z } from '../zod.js';

import { UserDataSchema } from '../common/user.js';
import { ApiResponseSchema } from '../common/response.js';

// signup response data (no jwt - user needs to verify email)
export const SignupDataSchema = UserDataSchema;

// signin response data (includes jwt)
export const SigninDataSchema = UserDataSchema.extend({
  token: z.string(),
});

export const SignupResponseSchema = ApiResponseSchema(SignupDataSchema);
export const SigninResponseSchema = ApiResponseSchema(SigninDataSchema);

export type SignupData = z.infer<typeof SignupDataSchema>;
export type SigninData = z.infer<typeof SigninDataSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
export type SigninResponse = z.infer<typeof SigninResponseSchema>;
