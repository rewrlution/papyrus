import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  type ValidatedRequest,
} from '../../src/middleware/validate.js';
import { ValidationError } from '../../src/lib/errors.js';

describe('validate middleware', () => {
  const mockRequest = (data: unknown, target: 'body' | 'query' | 'params') => {
    return {
      [target]: data,
    } as unknown as Request;
  };

  const mockResponse = () => ({}) as Response;
  const mockNext = vi.fn() as NextFunction;

  it('should attach valid data to req.validated', () => {
    const schema = z.object({ name: z.string() });
    const req = mockRequest({ name: 'John' }, 'body');
    const res = mockResponse();
    const next = mockNext;

    const middleware = validate(schema, 'body');
    middleware(req, res, next);

    const validatedReq = req as ValidatedRequest<z.infer<typeof schema>>;
    expect(validatedReq.validated).toEqual({ name: 'John' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('should throw ValidationError for invalid data', () => {
    const schema = z.object({ name: z.string() });
    const req = mockRequest({ name: 123 }, 'body');
    const res = mockResponse();
    const next = mockNext;

    const middleware = validate(schema, 'body');

    expect(() => middleware(req, res, next)).toThrow(ValidationError);
  });

  it('should merge validated data from multiple validations', () => {
    const paramsSchema = z.object({ id: z.string() });
    const bodySchema = z.object({ name: z.string() });

    const req = {
      params: { id: '123' },
      body: { name: 'John' },
    } as unknown as Request;
    const res = mockResponse();
    const next = mockNext;

    const paramsMiddleware = validate(paramsSchema, 'params');
    paramsMiddleware(req, res, next);

    const bodyMiddleware = validate(bodySchema, 'body');
    bodyMiddleware(req, res, next);

    const validatedReq = req as ValidatedRequest<unknown>;
    expect(validatedReq.validated).toEqual({ id: '123', name: 'John' });
  });

  it('should validate body using validateBody helper', () => {
    const schema = z.object({ title: z.string() });
    const req = mockRequest({ title: 'Test' }, 'body');
    const res = mockResponse();
    const next = mockNext;

    const middleware = validateBody(schema);
    middleware(req, res, next);

    const validatedReq = req as ValidatedRequest<z.infer<typeof schema>>;
    expect(validatedReq.validated).toEqual({ title: 'Test' });
  });

  it('should validate query using validateQuery helper', () => {
    const schema = z.object({ page: z.string() });
    const req = mockRequest({ page: '1' }, 'query');
    const res = mockResponse();
    const next = mockNext;

    const middleware = validateQuery(schema);
    middleware(req, res, next);

    const validatedReq = req as ValidatedRequest<z.infer<typeof schema>>;
    expect(validatedReq.validated).toEqual({ page: '1' });
  });

  it('should validate params using validateParams helper', () => {
    const schema = z.object({ id: z.string() });
    const req = mockRequest({ id: '123' }, 'params');
    const res = mockResponse();
    const next = mockNext;

    const middleware = validateParams(schema);
    middleware(req, res, next);

    const validatedReq = req as ValidatedRequest<z.infer<typeof schema>>;
    expect(validatedReq.validated).toEqual({ id: '123' });
  });
});
