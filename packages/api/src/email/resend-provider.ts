import { Resend } from 'resend';
import { logger } from '../lib/logger.js';
import type { EmailProvider, SendEmailOptions } from './types.js';
import { InternalServerError } from '../lib/errors.js';

export interface ResendProviderConfig {
  apiKey: string;
  from: string;
}

export class ResendProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(config: ResendProviderConfig) {
    this.client = new Resend(config.apiKey);
    this.from = config.from;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      logger.error('Failed to send email via resend', error);
      throw new InternalServerError('Failed to send verification email.');
    } else {
      logger.info('Email sent successfully via resend', {
        from: this.from,
        to: options.to,
        subject: options.subject,
        resend_id: data.id,
      });
    }
  }
}
