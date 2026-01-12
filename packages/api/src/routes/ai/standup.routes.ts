import express, { Router } from 'express';

import { StandupController } from '../../controllers/ai/standup.controller.js';
import { requireAuthentication } from '../../middleware/auth.js';

const router: Router = express.Router();

router.post('/', requireAuthentication, StandupController.generate);

export { router as standupRoutes };
