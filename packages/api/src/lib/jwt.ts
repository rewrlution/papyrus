import jwt from 'jsonwebtoken';

import { env } from '../env/config.js';

const JWT_EXPIRES_IN = '7d';

export type JwtPayload = {
  userId: string;
  email: string;
};

export function generateJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwtToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
