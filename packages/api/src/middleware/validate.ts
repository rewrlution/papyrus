import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ValidationError } from '../lib/errors.js';

export interface ValidatedRequest<T> extends Request {
  validated: T;
}

export type ValidationTarget = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodType<T>, target: ValidationTarget) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[target]);

      /**
       * store validated/transformed data in req.validated
       * merge with existing validated data to support multiple validations
       * this allows validate params, query and body co-exist instead of overwrite
       */
      const validatedReq = req as ValidatedRequest<T>;
      validatedReq.validated = validatedReq.validated
        ? { ...validatedReq.validated, ...data }
        : data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Validation failed', details);
      } else {
        throw err;
      }
    }
  };
}

export const validateBody = <T>(schema: ZodType<T>) => validate(schema, 'body');
export const validateQuery = <T>(schema: ZodType<T>) =>
  validate(schema, 'query');
export const validateParams = <T>(schema: ZodType<T>) =>
  validate(schema, 'params');
