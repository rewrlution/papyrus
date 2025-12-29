import express, { Router } from 'express';

import { AuthController } from '../controllers/auth.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  ResendVerificationSchema,
  SigninSchema,
  SignupSchema,
  VerifyEmailSchema,
} from '@rewrlution/papyrus-shared';

const router: Router = express.Router();

router.post('/signup', validateBody(SignupSchema), AuthController.signup);
router.post('/signin', validateBody(SigninSchema), AuthController.signin);
router.get(
  '/verify-email',
  validateQuery(VerifyEmailSchema),
  AuthController.verifyEmail
);
router.post(
  '/resend-verification',
  validateBody(ResendVerificationSchema),
  AuthController.resendVerification
);

export { router as authRoutes };
