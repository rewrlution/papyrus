import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { logger } from '../lib/logger.js';
import {
  ApiError,
  InternalServerError,
  ValidationError,
} from '../lib/errors.js';
import { env } from '../env/config.js';

/**
 * Wraps async route handlers to automatically catch promise rejections.
 *
 * Without this wrapper, errors thrown in async route handlers would result in
 * unhandled promise rejections. This utility ensures all errors are properly
 * passed to Express error handling middleware via next(error).
 *
 * @example
 * // Without asyncHandler (BAD - unhandled promise rejection)
 * app.get('/users', async (req, res) => {
 *   const users = await getUsers(); // If this throws, it's unhandled
 *   res.json(users);
 * });
 *
 * // With asyncHandler (GOOD - errors caught and handled)
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers(); // Errors passed to error middleware
 *   res.json(users);
 * }));
 *
 * @param fn - Async route handler function
 * @returns Wrapped handler that catches errors
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middlewrae for Express.
 *
 * Handles different error types and formats them according to the ApiErrorResponse schema.
 * Uses the isOperational flag to determine logging severity and error handling strategy.
 *
 * Error handling priority:
 * 1. ApiError instances (custom application errors)
 * 2. Zod validation errors (converted to ValidationError)
 * 3. Generic errors (converted to InternalServiceError)
 *
 * @param err
 * @param req
 * @param res
 * @param next
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // use request logger if available, fallback to global logger
  const reqLogger = req.logger || logger;

  // handle custom ApiError instances
  if (err instanceof ApiError) {
    // Log based on operational flag
    if (err.isOperational) {
      reqLogger.warn('Operational error', {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
      });
    } else {
      reqLogger.error('Non-operational error', {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
        stack: err.stack,
      });
    }

    return res.status(err.statusCode).json(err.toJSON());
  }

  // handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    const validationError = new ValidationError('Validation failed', details);

    reqLogger.warn('Zod validation error', { details });

    return res
      .status(validationError.statusCode)
      .json(validationError.toJSON());
  }

  // don't expose internal error details in production
  const message =
    env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  const internalError = new InternalServerError(message);

  return res.status(internalError.statusCode).json(internalError.toJSON());
}
