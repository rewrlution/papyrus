# Email Service Guide

This guide covers how to send emails in the Papyrus API, including setup for both development and production environments.

## Overview

The application supports two email providers:

- **Nodemailer (SMTP)** - For local development
- **Resend** - For production deployment (recommended)

> **⚠️ Important**: Nodemailer with Gmail SMTP does not work on Render's free tier due to network restrictions. Render blocks outbound SMTP connections (ports 25, 465, 587) to prevent spam abuse. Use Resend or another email API service for production.

## Architecture

The email service is located in `src/lib/email.ts` and provides:

- `sendVerificationEmail(email, token)` - Sends account verification emails
- `generateVerificationToken()` - Creates secure random tokens
- `getVerificationTokenExpiry()` - Sets 24-hour expiration

Email templates are stored in `src/templates/emails/` as Handlebars (`.hbs`) files.

## Setup

### Option 1: Nodemailer (Local Development Only)

#### 1. Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

#### 2. Configure Environment Variables

Create `.env` file:

```dotenv
# Email (Nodemailer)
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
APP_URL="http://localhost:3000"
```

#### 3. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate a new app password
5. Use the generated password in `SMTP_PASSWORD`

#### 4. Implementation Example

```typescript
import nodemailer from 'nodemailer';
import { env } from '../env/config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // Verify connection
    await transporter.verify();
    logger.info('SMTP connection verified');

    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });

    logger.info('Email sent successfully', { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
```

**Common Ports:**

- `587` - STARTTLS (recommended)
- `465` - SSL/TLS
- `25` - Plain text (not recommended)

### Option 2: Resend (Production Recommended)

Resend is a modern email API service designed for developers. It's reliable, fast, and works perfectly on Render.

#### 1. Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Verify your domain (or use their test domain for development)
4. Generate an API key from the dashboard

#### 2. Install Dependencies

```bash
npm install resend
```

#### 3. Configure Environment Variables

Update `.env.prod`:

```dotenv
# Email (Resend)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
SMTP_FROM="onboarding@resend.dev"  # Use your verified domain
APP_URL="https://your-app.onrender.com"
```

#### 4. Update Environment Schema

Update `src/env/config.ts`:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // ... other fields

  // Email
  EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email'),
  APP_URL: z.url('APP_URL must be a valid URL'),
});

export const env = envSchema.parse(process.env);
```

#### 5. Implementation Example

```typescript
import { Resend } from 'resend';
import { env } from '../env/config';
import { logger } from './logger';

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    logger.info('Email sent successfully via Resend', { id: data?.id });
    return data;
  } catch (error) {
    logger.error('Failed to send email via Resend', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
```

#### 6. Verify Domain

We need to add a domain to Resend. This is something special.

https://resend.com/domains

Just follow the steps on `Resend` - they are pretty straightforward.

You will need to add some `TXT`/`MX` records to your domain provider - porkbun in my case.

It may take minutes and hours to verify your domain.

### Option 3: Hybrid Approach (Best Practice)

Support both providers and switch based on environment:

```typescript
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../env/config';
import { renderTemplate } from './template';
import { logger } from './logger';

// Initialize based on provider
const transporter =
  env.EMAIL_PROVIDER === 'smtp'
    ? nodemailer.createTransporter({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
        connectionTimeout: 10000,
      })
    : null;

const resend =
  env.EMAIL_PROVIDER === 'resend' && env.RESEND_API_KEY
    ? new Resend(env.RESEND_API_KEY)
    : null;

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${env.APP_URL}/api/auth/verify-email?token=${token}`;
  const html = renderTemplate('verify-email', {
    verificationUrl,
    year: new Date().getFullYear(),
  });

  try {
    if (env.EMAIL_PROVIDER === 'resend' && resend) {
      logger.info('Sending email via Resend', { email });
      const { data, error } = await resend.emails.send({
        from: env.SMTP_FROM,
        to: email,
        subject: 'Verify your papyrus account',
        html,
      });

      if (error) throw new Error(error.message);
      logger.info('Email sent successfully', { id: data?.id });
    } else if (env.EMAIL_PROVIDER === 'smtp' && transporter) {
      logger.info('Sending email via SMTP', { email });
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: 'Verify your papyrus account',
        html,
      });
      logger.info('Email sent successfully', { messageId: info.messageId });
    } else {
      throw new Error('No email provider configured');
    }
  } catch (error) {
    logger.error('Failed to send email', {
      email,
      provider: env.EMAIL_PROVIDER,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const getVerificationTokenExpiry = (): Date => {
  return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
};
```

## Email Templates

Email templates use Handlebars for dynamic content rendering.

### Template Structure

**Location**: `src/templates/emails/verify-email.hbs`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify Your Email</title>
  </head>
  <body>
    <h1>Welcome to Papyrus!</h1>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="{{verificationUrl}}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    <p>&copy; {{year}} Papyrus. All rights reserved.</p>
  </body>
</html>
```

### Template Service

**Location**: `src/lib/template.ts`

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export const renderTemplate = (
  templateName: string,
  data: Record<string, any>
): string => {
  if (!templateCache.has(templateName)) {
    const templatePath = join(
      __dirname,
      '../templates/emails',
      `${templateName}.hbs`
    );
    const templateSource = readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    templateCache.set(templateName, template);
  }

  const template = templateCache.get(templateName)!;
  return template(data);
};
```

## Build Configuration

Templates must be copied to the `dist` folder during build.

### Update package.json

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && rimraf dist && tsc && copyfiles -u 1 src/templates/**/*.hbs dist"
  },
  "devDependencies": {
    "copyfiles": "^2.4.1"
  }
}
```

## Testing

### Test Email Sending

```typescript
// tests/lib/email.test.ts
import { sendVerificationEmail } from '../../src/lib/email';

describe('Email Service', () => {
  it('should send verification email', async () => {
    const email = 'test@example.com';
    const token = 'test-token-123';

    await expect(sendVerificationEmail(email, token)).resolves.not.toThrow();
  });
});
```

### Manual Testing

Use development tools like [MailHog](https://github.com/mailhog/MailHog) or [Mailpit](https://github.com/axllent/mailpit) to test emails locally without sending real emails:

```bash
# Using Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Update .env
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASSWORD=""
```

Visit `http://localhost:8025` to see captured emails.

## Troubleshooting

### Connection Timeout (Nodemailer)

**Error**: `Error: Connection timeout`

**Cause**: SMTP ports are blocked (common on cloud platforms like Render, Heroku, Railway)

**Solution**:

- Use Resend or another email API service
- Try port 465 instead of 587
- Check firewall/network settings

### Authentication Failed (Gmail)

**Error**: `Error: Invalid login: 535-5.7.8 Username and Password not accepted`

**Solution**:

- Enable 2-Factor Authentication
- Generate App Password (not your regular password)
- Check if "Less secure app access" is enabled (deprecated by Google)

### Template Not Found

**Error**: `ENOENT: no such file or directory, open '.../dist/templates/emails/verify-email.hbs'`

**Solution**: Ensure templates are copied during build. Add to `package.json`:

```json
"build": "tsc && copyfiles -u 1 src/templates/**/*.hbs dist"
```

### Resend Rate Limits

**Free Tier Limits**: 100 emails/day, 3,000 emails/month

**Solution**:

- Implement rate limiting in your application
- Upgrade to paid plan if needed
- Add email queuing for batch operations

## Best Practices

1. **Use Resend for Production** - More reliable than SMTP on cloud platforms
2. **Environment-based Configuration** - SMTP for dev, Resend for prod
3. **Template Caching** - Cache compiled Handlebars templates
4. **Error Handling** - Always catch and log email errors gracefully
5. **Connection Timeouts** - Set reasonable timeout values (10-30 seconds)
6. **Email Validation** - Validate email addresses before sending
7. **Rate Limiting** - Prevent abuse by limiting emails per user
8. **Monitoring** - Log email delivery status for debugging

## References

### Documentation

- [Nodemailer Official Docs](https://nodemailer.com/about/)
- [Resend Documentation](https://resend.com/docs/introduction)
- [Handlebars Guide](https://handlebarsjs.com/guide/)

### Email Services Comparison

- [Resend](https://resend.com) - Modern, developer-friendly (recommended)
- [SendGrid](https://sendgrid.com) - Enterprise-grade, 100 emails/day free
- [Mailgun](https://www.mailgun.com) - Powerful API, 5,000 emails/month free
- [Postmark](https://postmarkapp.com) - Fast transactional emails
- [AWS SES](https://aws.amazon.com/ses/) - Scalable, pay-as-you-go

### Testing Tools

- [MailHog](https://github.com/mailhog/MailHog) - SMTP testing server
- [Mailpit](https://github.com/axllent/mailpit) - Modern MailHog alternative
- [Ethereal Email](https://ethereal.email/) - Fake SMTP service by Nodemailer

### Render Limitations

- [Render Network Restrictions](https://render.com/docs/free#free-web-services)
- [Why SMTP Doesn't Work on Render Free Tier](https://community.render.com/t/smtp-email-not-working/1576)

### Gmail SMTP Setup

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Settings](https://support.google.com/a/answer/176600)

### Security

- [Email Security Best Practices](https://owasp.org/www-community/controls/Email_Security)
- [SPF, DKIM, DMARC Explained](https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/)
