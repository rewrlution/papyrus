import crypto from 'crypto';

import { env } from '../env/config.js';
import type { EmailProvider } from './types.js';
import { renderTemplate } from './template.js';

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
  const subject = 'Verify your papyrus account';
  const verificationUrl = `${env.APP_URL}/auth/verify-email?token=${token}`;

  const html = renderTemplate('verify-email', {
    verificationUrl,
    year: new Date().getFullYear(),
  });

  await provider.sendEmail({
    to: email,
    subject,
    html,
    text: `
      Welcome to Papyrus!

      Please verify your email by visiting:
      ${verificationUrl}

      This link expires in 24 hours.
    `,
  });
}
