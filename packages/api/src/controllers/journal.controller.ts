import type { Response } from 'express';
import type {
  CreateJournalInput,
  JournalResponse,
  JournalListResponse,
  UpdateJournalInput,
  JournalMetadataListResponse,
  PaginationParam,
  DateParam,
  ApiMessageResponse,
} from '@rewrlution/papyrus-shared';
import { asyncHandler } from '../middleware/handlers.js';
import { RequestWithUser } from '../middleware/auth.js';
import { ValidatedRequest } from '../middleware/validate.js';
import { JournalService } from '../services/journal.service.js';

export const JournalController = {
  list: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<PaginationParam>,
      res: Response<JournalListResponse>
    ) => {
      const { page, limit } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.findAllByUser(userId, page, limit);
      res.status(200).json(result);
    }
  ),

  get: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<DateParam>,
      res: Response<JournalResponse>
    ) => {
      const { date } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.findOne(userId, date);
      res.status(200).json(result);
    }
  ),

  create: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<CreateJournalInput>,
      res: Response<JournalResponse>
    ) => {
      const { date, content } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.create(userId, date, content);
      res.status(201).json(result);
    }
  ),

  update: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<DateParam & UpdateJournalInput>,
      res: Response<JournalResponse>
    ) => {
      const { date, content } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.update(userId, date, { content });
      res.status(200).json(result);
    }
  ),

  delete: asyncHandler(
    async (
      req: RequestWithUser & ValidatedRequest<DateParam>,
      res: Response<ApiMessageResponse>
    ) => {
      const { date } = req.validated;
      const userId = req.user.id;
      const result = await JournalService.delete(userId, date);
      res.status(200).json(result);
    }
  ),

  metadata: asyncHandler(
    async (
      req: RequestWithUser,
      res: Response<JournalMetadataListResponse>
    ) => {
      const userId = req.user.id;
      const result = await JournalService.findAllMetadataByUser(userId);
      res.status(200).json(result);
    }
  ),
};
