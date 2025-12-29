import crypto from 'crypto';

import { env } from '../env/config.js';
import type { EmailProvider } from './types.js';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getVerificationTokenExpiry(): Date {
  // email verification token expires in 24 hrs
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function sendVerificationEmail(
  provider: EmailProvider,
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${env.CORS_ORIGIN}/auth/verify-email?token=${token}`;

  await provider.sendEmail({
    to: email,
    subject: 'Verify your Papyrus account',
    html: `
      <h1>Welcome to Papyrus!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
    text: `
      Welcome to Papyrus!

      Please verify your email by visiting:
      ${verificationUrl}

      This link expires in 24 hours.
    `,
  });
}
