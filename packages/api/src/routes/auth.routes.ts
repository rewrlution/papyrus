import express, { Router } from 'express';

import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { SignupSchema } from '@rewrlution/papyrus-shared';

const router: Router = express.Router();

router.post('/signup', validateBody(SignupSchema), AuthController.signup);

export { router as authRoutes };
