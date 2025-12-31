import nodemailer, { type Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

import { InternalServerError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

import { EmailProvider, SendEmailOptions } from './types.js';

export interface NodemailerProviderConfig {
  transport: SMTPTransport.Options;
  from: string;
}

export class NodemailerProvider implements EmailProvider {
  private transporter: Transporter;
  private from: string;

  constructor(config: NodemailerProviderConfig) {
    this.transporter = nodemailer.createTransport(config.transport);
    this.from = config.from;
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { error } = await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      logger.error('Failed to send email via Nodemailer', error);
      throw new InternalServerError('Failed to send verification email.');
    } else {
      logger.info('Email sent successfully via Nodemailer', {
        from: this.from,
        to: options.to,
        subject: options.subject,
      });
    }
  }
}
