import { ApiErrorResponse } from '@rewrlution/papyrus-shared';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  /**
   * isOperational:
   * True for expected errors (validation, auth, not found).
   * False for programmer errors (bugs, null refs, crashes).
   * Used to determine logging level and error handling strategy.
   */
  public readonly isOperational: boolean;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
  }

  toJSON(): ApiErrorResponse {
    return {
      success: false,
      message: this.message,
      error: {
        code: this.code,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export class BadRequestError extends ApiError {
  constructor(
    message = 'Bad Request',
    details?: Array<{ field: string; message: string }>
  ) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource Not Found') {
    super(message, 404, 'NOT_FOUND', true);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT', true);
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = 'Validation Failed',
    details?: Array<{ field: string; message: string }>
  ) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}
