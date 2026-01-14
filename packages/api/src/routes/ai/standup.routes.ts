import express, { Router } from 'express';

import { StandupRequestSchema } from '@rewrlution/papyrus-shared';

import { StandupController } from '../../controllers/ai/standup.controller.js';
import { requireAuthentication } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';

const router: Router = express.Router();

router.post(
  '/',
  requireAuthentication,
  validateBody(StandupRequestSchema),
  StandupController.generate
);

export { router as standupRoutes };
