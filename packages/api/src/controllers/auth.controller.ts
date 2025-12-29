import type { Response } from 'express';

import { asyncHandler } from '../middleware/handlers.js';
import { AuthService } from '../services/auth.service.js';
import type { ValidatedRequest } from '../middleware/validate.js';
import type { SignupInput, SignupResponse } from '@rewrlution/papyrus-shared';

export const AuthController = {
  signup: asyncHandler(
    async (
      req: ValidatedRequest<SignupInput>,
      res: Response<SignupResponse>
    ) => {
      const { email, password } = req.validated;
      const result = await AuthService.signup(email, password);
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    }
  ),
};
