import type { Response } from 'express';

import { asyncHandler } from '../middleware/handlers.js';
import { AuthService } from '../services/auth.service.js';
import type { ValidatedRequest } from '../middleware/validate.js';
import type {
  SignupInput,
  SignupResponse,
  SigninInput,
  SigninResponse,
  VerifyEmailInput,
  ApiMessageResponse,
  ResendVerificationInput,
} from '@rewrlution/papyrus-shared';

export const AuthController = {
  signup: asyncHandler(
    async (
      req: ValidatedRequest<SignupInput>,
      res: Response<SignupResponse>
    ) => {
      const { email, password } = req.validated;
      const result = await AuthService.signup(email, password);
      res.status(201).json(result);
    }
  ),

  signin: asyncHandler(
    async (
      req: ValidatedRequest<SigninInput>,
      res: Response<SigninResponse>
    ) => {
      const { email, password } = req.validated;
      const result = await AuthService.signin(email, password);
      res.status(200).json(result);
    }
  ),

  verifyEmail: asyncHandler(
    async (
      req: ValidatedRequest<VerifyEmailInput>,
      res: Response<ApiMessageResponse>
    ) => {
      const { token } = req.validated;
      const result = await AuthService.verifyEmail(token);
      res.status(200).json(result);
    }
  ),

  resendVerification: asyncHandler(
    async (
      req: ValidatedRequest<ResendVerificationInput>,
      res: Response<ApiMessageResponse>
    ) => {
      const { email } = req.validated;
      const result = await AuthService.resendVerificationEmail(email);
      res.status(200).json(result);
    }
  ),
};
