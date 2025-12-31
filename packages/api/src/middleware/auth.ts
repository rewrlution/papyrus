import type { User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../lib/errors.js';
import { verifyJwtToken } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

// Extend the Express Request type with user information
export interface RequestWithUser extends Request {
  user: User;
}

export async function requireAuthentication(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authLogger = req.logger || logger;

  try {
    authLogger.info('Verifying authorization token...');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      authLogger.error(
        'Authorization token missing from the header',
        req.headers
      );
      throw new UnauthorizedError('No bearer token provided');
    }

    const token = authHeader.substring(7); // remove 'Bearer '
    const payload = verifyJwtToken(token);
    const { userId } = payload;

    authLogger.info('Querying user from database', { userId });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      authLogger.error('User not found in db', { userId });
      throw new UnauthorizedError('User not found');
    }

    authLogger.info('Attaching user information to request object', user);
    (req as RequestWithUser).user = user;

    next();
  } catch (err) {
    authLogger.error('User not authorized', err);
    next(new UnauthorizedError('User not authenticated'));
  }
}
