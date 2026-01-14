# Stripe Payment Integration for Papyrus

> A complete guide to implementing Stripe payments for AI feature monetization in Papyrus

## What We're Building

A production-ready payment system that allows users to purchase premium AI features (Standup Pro, Promotion Builder, Resume & Interview Pro) using Stripe Checkout.

**What problem does this solve?**

- Monetize AI features with secure payment processing
- Track purchases and grant access automatically via webhooks
- Provide seamless checkout experience for users
- Handle subscription-like access with time-based expiration

**Expected outcome:**

- Users can purchase premium features via Stripe Checkout
- Automatic access granting after successful payment
- Webhook-driven purchase fulfillment
- Full purchase history tracking

## Architecture

```
┌─────────────┐
│   CLI/Web   │  User requests purchase
│   Client    │  ────────────────────┐
└─────────────┘                      │
                                     ▼
┌──────────────────────────────────────────┐
│           Papyrus API                    │
│                                          │
│  ┌────────────┐     ┌─────────────────┐ │
│  │  Payment   │────▶│  Payment        │ │
│  │ Controller │     │  Service        │ │
│  └────────────┘     └─────────────────┘ │
│                            │             │
│                            ▼             │
│                     ┌─────────────────┐  │
│                     │   Stripe SDK    │  │
│                     └─────────────────┘  │
│                            │             │
└────────────────────────────┼─────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Stripe     │
                      │   Checkout   │
                      └──────────────┘
                             │
                             ▼ Payment Success
                      ┌──────────────┐
                      │   Webhook    │ ──────┐
                      │   Handler    │       │
                      └──────────────┘       │
                                             ▼
                                      ┌─────────────┐
                                      │  Database   │
                                      │  (Prisma)   │
                                      └─────────────┘
```

**Why this architecture:**

1. **Stripe Checkout**: Secure, PCI-compliant hosted payment page
2. **Webhook-driven**: Automatic fulfillment, no manual intervention
3. **Idempotent**: Duplicate webhooks handled gracefully
4. **Layered**: Clear separation (controller → service → repository)

**Key Components:**

- **Payment Controller**: HTTP request handling
- **Payment Service**: Business logic (session creation, webhook handling)
- **Stripe SDK**: Official Stripe client library
- **Webhook Handler**: Processes Stripe events asynchronously
- **Repository**: Database persistence via Prisma

## Prerequisites

**Required:**

```bash
# Install dependencies (includes Stripe SDK)
pnpm install

# Environment variables
STRIPE_SECRET_KEY=sk_test_...          # From Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe CLI or dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...     # For frontend integration
```

**Assumed knowledge:**

- TypeScript basics (interfaces, async/await)
- Express.js routing
- Prisma ORM queries
- Webhook concepts

## Implementation

### Step 1: Update Database Schema

**Goal:** Add Stripe-specific fields to track payment metadata

```prisma
// packages/api/prisma/schema.prisma

model AiPurchase {
  id      String  @id @default(cuid())
  userId  String  @map("user_id")
  product String  // 'standup-pro' | 'promotion-pro' | 'resume-interview-pro'

  // Purchase metadata
  purchasedAt DateTime  @default(now()) @map("purchased_at")
  expiresAt   DateTime? @map("expires_at") // When access expires

  // Payment metadata
  amount    Int?    // Amount in cents (e.g., 900 for $9.00)
  currency  String? // 'usd', 'cad', 'eur', 'cny', etc.

  // Stripe integration fields
  stripeCustomerId       String? @map("stripe_customer_id")
  stripePaymentIntentId  String? @unique @map("stripe_payment_intent_id")
  stripeCheckoutSessionId String? @unique @map("stripe_checkout_session_id")
  paymentStatus           String? @map("payment_status") // 'pending' | 'succeeded' | 'failed'

  // Relation to User
  user User @relation("UserAiPurchases", fields: [userId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([userId, product])
  @@index([userId, product, expiresAt])
  @@index([stripeCustomerId])

  @@map("ai_purchases")
}
```

**Why these fields:**

- `stripeCustomerId`: Link user to Stripe customer for future purchases
- `stripePaymentIntentId`: Unique payment identifier from Stripe
- `stripeCheckoutSessionId`: Track checkout session for idempotency
- `paymentStatus`: Current status of payment (useful for async webhooks)

**Run migration:**

```bash
cd packages/api
pnpm prisma:migrate
```

### Step 2: Environment Configuration

**Goal:** Add Stripe credentials with validation

```typescript
// packages/api/src/env/config.ts

export const envSchema = z.object({
  // ... existing fields ...

  // Stripe Payment Integration
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'STRIPE_PUBLISHABLE_KEY is required'),
});
```

**Why this approach:**

- **Validation**: Zod ensures keys are present at startup
- **Type safety**: TypeScript knows these values exist
- **Fail fast**: App won't start with invalid config

### Step 3: Create Stripe Utility Module

**Goal:** Centralize Stripe client initialization and common operations

```typescript
// packages/api/src/lib/stripe.ts

import Stripe from 'stripe';
import { env } from '../env/config.js';
import { logger } from './logger.js';

/**
 * Stripe client singleton
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
  appInfo: {
    name: 'Papyrus',
    version: '0.0.1',
  },
});

/**
 * Verify Stripe webhook signature
 *
 * Prevents webhook spoofing attacks
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err });
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Get or create Stripe customer for a user
 *
 * Reuses existing customer to maintain purchase history
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { papyrusUserId: userId },
  });

  return customer.id;
}
```

**Why centralize:**

- **Single source of truth**: One Stripe client instance
- **Reusability**: Common operations used across services
- **Security**: Signature verification in one place
- **Customer management**: Avoid duplicate Stripe customers

### Step 4: Implement Payment Service

**Goal:** Business logic for checkout sessions and webhook handling

```typescript
// packages/api/src/services/payment.service.ts

import Stripe from 'stripe';
import { env } from '../env/config.js';
import { aiPurchaseRepository } from '../domain/repositories/index.js';
import { stripe, getOrCreateCustomer } from '../lib/stripe.js';
import { logger } from '../lib/logger.js';
import { BadRequestError, InternalServerError } from '../lib/errors.js';

export type PurchasableProduct =
  | 'standup-pro'
  | 'promotion-pro'
  | 'resume-interview-pro';

/**
 * Create Stripe checkout session
 *
 * Flow:
 * 1. Get/create Stripe customer
 * 2. Create checkout session with product details
 * 3. Return session URL for redirect
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  product: PurchasableProduct
): Promise<{ sessionId: string; url: string }> {
  const productConfig = getProductConfig(product);
  const customerId = await getOrCreateCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: productConfig.price,
          product_data: {
            name: productConfig.displayName,
            description: productConfig.description,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${env.APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/purchase/cancel`,
    metadata: {
      userId,
      product,
      durationDays: productConfig.duration.toString(),
    },
  });

  if (!session.url) {
    throw new InternalServerError('Failed to create checkout URL');
  }

  logger.info('Created checkout session', { sessionId: session.id, product });
  return { sessionId: session.id, url: session.url };
}

/**
 * Handle successful payment webhook
 *
 * Creates purchase record and grants access
 */
export async function handlePaymentSuccess(
  event: Stripe.Event
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const { userId, product, durationDays } = session.metadata || {};

  if (!userId || !product || !durationDays) {
    throw new BadRequestError('Missing metadata in webhook');
  }

  // Idempotency check
  const existingPurchase =
    await aiPurchaseRepository.findByCheckoutSessionId(session.id);

  if (existingPurchase) {
    logger.warn('Purchase already exists', { sessionId: session.id });
    return;
  }

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays, 10));

  // Create purchase record
  await aiPurchaseRepository.createPurchase({
    userId,
    product: product as PurchasableProduct,
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    stripeCustomerId: session.customer as string,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    paymentStatus: 'succeeded',
    expiresAt,
  });

  logger.info('Purchase created from webhook', { userId, product, expiresAt });
}

/**
 * Product configuration
 */
function getProductConfig(product: PurchasableProduct) {
  const configs = {
    'standup-pro': {
      displayName: 'Standup Pro',
      description: 'Unlimited standup notes for 90 days',
      price: 900,
      duration: 90,
    },
    'promotion-pro': {
      displayName: 'Promotion Builder',
      description: 'Unlimited promotion documents for 30 days',
      price: 1900,
      duration: 30,
    },
    'resume-interview-pro': {
      displayName: 'Resume & Interview Pro',
      description: 'Unlimited resume and interview prep for 30 days',
      price: 2900,
      duration: 30,
    },
  };

  return configs[product];
}
```

**Why this design:**

- **Metadata in session**: Webhook receives all needed data from Stripe
- **Idempotency**: Prevents duplicate purchases from retry webhooks
- **Customer reuse**: Maintains purchase history across products
- **Time-based access**: Calculates expiration upfront

### Step 5: Update Repository Layer

**Goal:** Add database methods for Stripe-related queries

```typescript
// packages/api/src/domain/repositories/ai-purchse.repository.ts

export const aiPurchaseRepository = {
  // ... existing methods ...

  /**
   * Create purchase with Stripe metadata
   */
  async createPurchase(data: {
    userId: string;
    product: string;
    expiresAt?: Date | null;
    amount?: number;
    currency?: string;
    stripeCustomerId?: string;
    stripePaymentIntentId?: string;
    stripeCheckoutSessionId?: string;
    paymentStatus?: string;
  }): Promise<AiPurchase> {
    return prisma.aiPurchase.create({ data });
  },

  /**
   * Find purchase by checkout session (for idempotency)
   */
  async findByCheckoutSessionId(
    sessionId: string
  ): Promise<AiPurchase | null> {
    return prisma.aiPurchase.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });
  },
};
```

**Why separate methods:**

- **Single responsibility**: Each method does one thing
- **Idempotency support**: Easy to check for existing purchases
- **Type safety**: Prisma generates exact types

### Step 6: Create Payment Controller

**Goal:** Handle HTTP requests for payment operations

```typescript
// packages/api/src/controllers/payment.controller.ts

import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service.js';
import { verifyWebhookSignature } from '../lib/stripe.js';
import { BadRequestError } from '../lib/errors.js';

/**
 * Create checkout session
 *
 * POST /api/payments/checkout
 * Body: { product: 'standup-pro' }
 * Returns: { sessionId, url }
 */
export async function createCheckout(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.userId!;
  const userEmail = req.userEmail!;
  const { product } = req.body;

  if (!product) {
    throw new BadRequestError('Product is required');
  }

  const session = await paymentService.createCheckoutSession(
    userId,
    userEmail,
    product
  );

  res.status(200).json({ success: true, data: session });
}

/**
 * Handle Stripe webhooks
 *
 * POST /api/payments/webhook
 * Receives: raw body + Stripe-Signature header
 */
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    throw new BadRequestError('Missing Stripe signature');
  }

  // Verify signature (prevents spoofing)
  const event = verifyWebhookSignature(req.body, signature);

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await paymentService.handlePaymentSuccess(event);
      break;
    case 'checkout.session.expired':
      // Log or notify user
      break;
    default:
      // Ignore unknown events
      break;
  }

  res.status(200).json({ received: true });
}
```

**Why thin controllers:**

- **Delegation**: Business logic in service layer
- **HTTP concerns only**: Extract params, send responses
- **Error handling**: Middleware catches thrown errors

### Step 7: Create Payment Routes

**Goal:** Define API endpoints with proper middleware

```typescript
// packages/api/src/routes/payment.routes.ts

import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { requireAuthentication } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/handlers.js';

const router = Router();

/**
 * Create checkout session (requires auth)
 */
router.post(
  '/checkout',
  requireAuthentication,
  asyncHandler(paymentController.createCheckout)
);

/**
 * Webhook handler (no auth - verified by Stripe signature)
 */
router.post('/webhook', asyncHandler(paymentController.handleWebhook));

/**
 * Get user's purchase history
 */
router.get(
  '/purchases',
  requireAuthentication,
  asyncHandler(paymentController.getPurchases)
);

export default router;
```

**Why separate webhook:**

- **No JWT auth**: Stripe verifies via signature
- **Raw body needed**: Signature verification requires unmodified body

### Step 8: Register Routes in App

**Goal:** Wire up payment routes with special webhook handling

```typescript
// packages/api/src/app.ts

import { paymentRoutes } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(requestLogger);

  // IMPORTANT: Webhook needs raw body, handle before JSON middleware
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    paymentRoutes
  );

  // JSON middleware for all other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/payments', paymentRoutes);

  // ... rest of app setup
}
```

**Why raw body for webhook:**

- **Stripe requirement**: Signature verification needs unmodified body
- **Order matters**: Must come before `express.json()` middleware
- **Security**: Prevents webhook spoofing attacks

## Testing

### Manual Testing with Stripe CLI

**1. Install Stripe CLI:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.18.0/stripe_1.18.0_linux_x86_64.tar.gz
tar -xvf stripe_1.18.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**2. Login to Stripe:**

```bash
stripe login
```

**3. Forward webhooks to local server:**

```bash
# Start your API server first
pnpm dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy the webhook signing secret (whsec_...) to your .env file
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**4. Test checkout flow:**

```bash
# Create checkout session via API
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"product": "standup-pro"}'

# Response contains checkout URL - open in browser
# Use test card: 4242 4242 4242 4242, any future expiry, any CVC
```

**5. Trigger test webhook:**

```bash
stripe trigger checkout.session.completed
```

### Automated Tests

```typescript
// packages/api/tests/services/payment.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as paymentService from '../../src/services/payment.service.js';
import { stripe } from '../../src/lib/stripe.js';

// Mock Stripe SDK
vi.mock('../../src/lib/stripe.js', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    customers: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Payment Service', () => {
  it('creates checkout session', async () => {
    // Mock Stripe responses
    vi.mocked(stripe.customers.list).mockResolvedValue({
      data: [],
    } as any);

    vi.mocked(stripe.customers.create).mockResolvedValue({
      id: 'cus_123',
    } as any);

    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/c/pay/cs_123',
    } as any);

    // Test
    const result = await paymentService.createCheckoutSession(
      'user123',
      'test@example.com',
      'standup-pro'
    );

    expect(result.sessionId).toBe('cs_123');
    expect(result.url).toContain('checkout.stripe.com');
  });
});
```

## Common Issues

**Issue:** Webhook signature verification fails

- **Solution:** Ensure you're using `express.raw()` before the webhook handler
- **Why it happens:** `express.json()` modifies the body, breaking signature

**Issue:** Duplicate purchases created from webhook retries

- **Solution:** Always check `findByCheckoutSessionId()` before creating
- **Why it happens:** Stripe retries failed webhooks

**Issue:** Customer created multiple times for same user

- **Solution:** Use `getOrCreateCustomer()` instead of always creating new
- **Why it happens:** Each checkout creates new customer if not checked

## Enhancements (Optional)

1. **Refund handling:** Add webhook for `charge.refunded` event
2. **Failed payment notifications:** Email users when payment fails
3. **Purchase expiration reminders:** Cron job to notify expiring access
4. **Admin dashboard:** View all purchases, refund manually
5. **Promo codes:** Use Stripe coupons API
6. **Multiple currencies:** Add currency selection in checkout

## Next Steps

1. **Integrate with CLI:** Add `papyrus purchase` command
2. **Web dashboard:** Build purchase history page
3. **Email notifications:** Send receipts after successful purchase
4. **Analytics:** Track conversion rates, popular products

## References

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Prisma Schema Documentation](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## Summary

**What we built:**

1. Database schema with Stripe fields
2. Stripe client initialization and utilities
3. Payment service with checkout and webhook handling
4. Payment controller and routes
5. Repository methods for purchase tracking

**Key principles applied:**

- **Layered architecture**: Clean separation of concerns
- **Idempotency**: Safe webhook handling with retries
- **Security**: Signature verification prevents spoofing
- **Type safety**: TypeScript throughout
- **Proper componentization**: Each layer has single responsibility

**Goal achieved:** Users can now purchase premium AI features with automatic access granting via Stripe webhooks.
