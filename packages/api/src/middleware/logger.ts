import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../lib/logger.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      logger: typeof logger;
    }
  }
}

/**
 * Create a request logging middleware to track requests with unique IDs
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  // attach request id and contextual logger to request
  req.requestId = requestId;
  req.logger = logger.child({ requestId });

  // log incoming request
  req.logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const loglevel = res.statusCode >= 400 ? 'warn' : 'info';

    req.logger.log(loglevel, 'Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
