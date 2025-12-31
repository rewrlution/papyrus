import express, { Router } from 'express';

import {
  CreateJournalSchema,
  DateParamSchema,
  PaginationParamSchema,
  UpdateJournalSchema,
} from '@rewrlution/papyrus-shared';

import { JournalController } from '../controllers/journal.controller.js';
import {
  requireAuthentication,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/index.js';

const router: Router = express.Router();

// All routes require authentication
router.use(requireAuthentication);

router.get('/', validateQuery(PaginationParamSchema), JournalController.list);
router.get('/metadata', JournalController.metadata);
router.get('/:date', validateParams(DateParamSchema), JournalController.get);

router.post('/', validateBody(CreateJournalSchema), JournalController.create);
router.put(
  '/:date',
  validateParams(DateParamSchema),
  validateBody(UpdateJournalSchema),
  JournalController.update
);
router.delete(
  '/:date',
  validateParams(DateParamSchema),
  JournalController.delete
);

export { router as journalRoutes };
