# Phase 2: Checkout Sessions Integration (Production)

**Fully automated payment system for scalable production use**

## What We're Building

A production-ready payment system that automatically creates purchase records when users complete payments. Users run a CLI command that calls your backend API, which creates a Stripe Checkout Session and opens it in their browser. After payment, Stripe webhooks automatically activate the user's account.

**Goal:** Fully automated purchase flow (~2 hours implementation)

**Best for:**
- Production deployments
- Scalable to any purchase volume
- Automated account activation (instant access)
- Professional user experience

**What problem does this solve?**
- Manual activation is tedious at scale
- Users want immediate access after payment
- Need audit trail of all purchases
- Want to track conversion metrics

**Expected outcome:**
- Users purchase and get instant access (no manual work)
- All purchases automatically recorded in database
- Full payment history and analytics
- Webhook verification ensures payment authenticity

---

## Architecture

```
┌──────────────────────────────────────┐
│  CLI Command                         │
│  papyrus purchase standup-pro        │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  POST /api/purchases                 │
│  Authorization: Bearer <JWT>         │
│  Body: { product: "standup-pro" }    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Purchase Controller                 │
│  - Validate authentication           │
│  - Extract userId from JWT           │
│  - Call Stripe Service               │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Stripe Service                      │
│  stripe.checkout.sessions.create()   │
│  - product: "standup-pro"            │
│  - amount: $9.00                     │
│  - metadata: { userId, product }     │
│  Returns: { url: "https://..." }    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Return Checkout URL to CLI          │
│  { checkoutUrl: "https://..." }      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  CLI Opens Browser                   │
│  Stripe Checkout page loads          │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  User Completes Payment              │
│  (Enters card details on Stripe)     │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Stripe Webhook Event                │
│  POST /api/webhooks/stripe           │
│  Event: checkout.session.completed   │
│  Signature: <webhook signature>      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Webhook Handler                     │
│  1. Verify signature (security!)     │
│  2. Extract metadata (userId, product)
│  3. Check for duplicate (idempotency)│
│  4. Create ai_purchases record       │
│  5. User has instant access          │
└──────────────────────────────────────┘
```

**Why this architecture:**
- **Automated**: No manual steps after initial setup
- **Secure**: Webhook signature verification prevents fraud
- **Scalable**: Handles any purchase volume
- **Instant access**: User can use premium features immediately
- **Audit trail**: All purchases logged in database
- **Idempotent**: Handles duplicate webhooks correctly

**Trade-offs:**
- ✅ Fully automated
- ✅ Instant activation
- ✅ Scalable
- ❌ More code to write (~150 lines)
- ❌ Requires webhook endpoint (need public URL)

---

## Prerequisites

**Required:**
- Stripe account with API keys
- `stripe` npm package
- Existing authentication system (JWT tokens)
- Database with `ai_purchases` table
- Public URL for webhooks (for production) or Stripe CLI (for local dev)

**Assumed knowledge:**
- TypeScript and async/await
- Express.js routing and middleware
- Prisma ORM
- Papyrus backend architecture (controllers, services, routes)

**Before you start:**
- Complete [Phase 1: Payment Links](./01-phase1-payment-links.md) (optional but recommended)
- Read [Stripe Integration Overview](./README.md)
- Ensure you have Stripe test mode API keys

---

## Implementation

### Step 1: Install Stripe SDK

**Goal:** Add Stripe SDK to backend API

**Command:**

```bash
cd packages/api
pnpm add stripe
```

**Verify installation:**

```bash
cat package.json | grep stripe
# Should show: "stripe": "^14.x.x"
```

**Why we need this:**
- Official Stripe SDK for Node.js
- Type-safe TypeScript support
- Handles API requests and webhook verification
- Maintained by Stripe (security updates)

---

### Step 2: Add Environment Variables

**Goal:** Store Stripe API keys securely

**File:** `packages/api/.env`

Add these variables:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_51ABC...XYZ
STRIPE_WEBHOOK_SECRET=whsec_123...789

# Application URLs
APP_URL=http://localhost:3000
```

**How to get these values:**

1. **STRIPE_SECRET_KEY**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy the "Secret key" (starts with `sk_test_`)
   - ⚠️ NEVER commit this to git or expose publicly

2. **STRIPE_WEBHOOK_SECRET**:
   - For local dev: Will be provided by Stripe CLI (see Step 8)
   - For production: Get from Stripe Dashboard → Webhooks (see Step 9)

3. **APP_URL**:
   - Local dev: `http://localhost:3000`
   - Production: `https://api.papyrus.com` (or your actual domain)

---

### Step 3: Update Environment Config Schema

**Goal:** Validate environment variables at startup

**File:** `packages/api/src/env/config.ts`

```typescript
// packages/api/src/env/config.ts
import { z } from 'zod';

export const envSchema = z.object({
  // ... existing fields (DATABASE_URL, JWT_SECRET, etc.)

  // Stripe Configuration
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),

  // Application URLs
  APP_URL: z
    .string()
    .url('APP_URL must be a valid URL')
    .default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
export const env: Env = envSchema.parse(process.env);
```

**Why validate environment variables:**
- Fail fast at startup if config is invalid
- Clear error messages for missing/invalid values
- Type-safe access to env vars throughout codebase
- Prevents runtime errors from misconfiguration

**Test validation:**

```bash
# Should fail if STRIPE_SECRET_KEY is missing
cd packages/api
pnpm dev
# Error: STRIPE_SECRET_KEY is required
```

---

### Step 4: Create Stripe Service

**Goal:** Wrapper around Stripe SDK for creating checkout sessions

**File:** `packages/api/src/services/stripe.service.ts`

```typescript
// packages/api/src/services/stripe.service.ts
// Service for interacting with Stripe API
// Handles checkout session creation

import Stripe from 'stripe';
import { env } from '../env/config.js';

// Initialize Stripe with secret key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia', // Use latest stable version
  typescript: true, // Enable TypeScript types
});

/**
 * Product pricing configuration (in cents)
 */
export const PRODUCT_PRICES: Record<string, number> = {
  'standup-pro': 900, // $9.00
  'promotion-builder': 2900, // $29.00
  'resume-refresh': 1900, // $19.00
  'interview-prep': 2400, // $24.00
};

/**
 * Product descriptions for checkout
 */
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  'standup-pro': 'Unlimited AI standup notes for 90 days',
  'promotion-builder': 'AI-powered promotion document generator (3 generations)',
  'resume-refresh': 'AI resume enhancement (10 generations, 30 days)',
  'interview-prep': 'AI interview preparation (20 generations, 30 days)',
};

/**
 * Create a Stripe Checkout Session for a product purchase
 *
 * @param userId - User ID from JWT token
 * @param product - Product identifier (e.g., 'standup-pro')
 * @returns Checkout session with URL to redirect user
 */
export async function createCheckoutSession(
  userId: string,
  product: string
): Promise<Stripe.Checkout.Session> {
  // Validate product
  const price = PRODUCT_PRICES[product];
  if (!price) {
    throw new Error(`Invalid product: ${product}`);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    // Payment configuration
    payment_method_types: ['card'],
    mode: 'payment', // One-time payment (not subscription)

    // Line items (what user is buying)
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: formatProductName(product),
            description: PRODUCT_DESCRIPTIONS[product],
          },
          unit_amount: price, // Amount in cents
        },
        quantity: 1,
      },
    ],

    // Redirect URLs after payment
    success_url: `${env.APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/purchase/cancel`,

    // Metadata to link payment to user (critical for webhook)
    client_reference_id: userId, // User ID stored at session level
    metadata: {
      userId, // Also store in metadata for redundancy
      product, // Product identifier
    },

    // Customer information
    customer_email: undefined, // Let Stripe collect email
  });

  return session;
}

/**
 * Format product name for display
 */
function formatProductName(product: string): string {
  const names: Record<string, string> = {
    'standup-pro': 'Standup Pro',
    'promotion-builder': 'Promotion Builder',
    'resume-refresh': 'Resume Refresh',
    'interview-prep': 'Interview Prep',
  };
  return names[product] || product;
}

/**
 * Verify webhook signature
 * Prevents unauthorized webhook calls
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}

// Export stripe instance for direct access if needed
export { stripe };
```

**Why this approach:**
- **Single responsibility**: Only handles Stripe operations
- **Configuration centralized**: All prices and descriptions in one place
- **Type-safe**: TypeScript types from Stripe SDK
- **Secure**: Webhook signature verification built-in
- **Easy to extend**: Add new products by updating `PRODUCT_PRICES` object

**Design decisions:**
- Store prices in cents (Stripe convention)
- Use `metadata` to link payments to users
- Separate webhook verification into its own function
- Use `client_reference_id` for primary user linking

---

### Step 5: Create Purchase Controller

**Goal:** HTTP handler for creating checkout sessions

**File:** `packages/api/src/controllers/purchase.controller.ts`

```typescript
// packages/api/src/controllers/purchase.controller.ts
// HTTP controller for purchase endpoints
// Thin layer that delegates to services

import { Request, Response, NextFunction } from 'express';
import { createCheckoutSession, PRODUCT_PRICES } from '../services/stripe.service.js';

export class PurchaseController {
  /**
   * POST /api/purchases
   * Create a Stripe checkout session for purchasing a product
   */
  static async createCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract user ID from JWT (set by requireAuthentication middleware)
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Extract product from request body
      const { product } = req.body;

      // Validate product
      if (!product || typeof product !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Product is required',
        });
        return;
      }

      // Check if product exists
      if (!PRODUCT_PRICES[product]) {
        res.status(400).json({
          success: false,
          message: `Invalid product: ${product}`,
          availableProducts: Object.keys(PRODUCT_PRICES),
        });
        return;
      }

      // Create Stripe checkout session
      const session = await createCheckoutSession(userId, product);

      // Return checkout URL to client
      res.status(200).json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      next(error); // Pass to error handler middleware
    }
  }

  /**
   * GET /api/purchases (optional - for listing user's purchases)
   * List purchases for authenticated user
   */
  static async listPurchases(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // TODO: Implement with Prisma
      // const purchases = await prisma.aiPurchase.findMany({
      //   where: { userId },
      //   orderBy: { purchasedAt: 'desc' },
      // });

      res.status(200).json({
        success: true,
        purchases: [], // Placeholder
      });
    } catch (error) {
      next(error);
    }
  }
}
```

**Why this structure:**
- **Thin controller**: Delegates business logic to services
- **Authentication first**: Check userId before doing anything
- **Validation**: Clear error messages for invalid input
- **Error handling**: Uses Express error middleware via `next(error)`
- **Static methods**: Follows existing Papyrus controller pattern

---

### Step 6: Create Webhook Controller

**Goal:** Handle Stripe webhook events (payment success)

**File:** `packages/api/src/controllers/webhook.controller.ts`

```typescript
// packages/api/src/controllers/webhook.controller.ts
// Handles Stripe webhook events
// Creates purchase records when payments succeed

import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { constructWebhookEvent } from '../services/stripe.service.js';
import { prisma } from '../lib/prisma.js';

export class WebhookController {
  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhook events
   *
   * IMPORTANT: This route must use express.raw() middleware
   * to preserve the raw body for signature verification
   */
  static async handleStripeWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get webhook signature from header
      const signature = req.headers['stripe-signature'];
      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing stripe-signature header',
        });
        return;
      }

      // Verify webhook signature (prevents unauthorized requests)
      let event: Stripe.Event;
      try {
        event = constructWebhookEvent(req.body, signature);
      } catch (error) {
        console.error('⚠️ Webhook signature verification failed:', error);
        res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
        });
        return;
      }

      // Log webhook event for debugging
      console.log(`✅ Webhook verified: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event);
          break;

        case 'payment_intent.succeeded':
          // Optional: Additional verification
          console.log('ℹ️ Payment intent succeeded:', event.data.object.id);
          break;

        default:
          console.log(`ℹ️ Unhandled webhook event: ${event.type}`);
      }

      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('❌ Webhook handler error:', error);
      next(error);
    }
  }
}

/**
 * Handle successful checkout session
 * Creates purchase record in database
 */
async function handleCheckoutSessionCompleted(
  event: Stripe.Event
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  // Extract metadata
  const userId = session.client_reference_id || session.metadata?.userId;
  const product = session.metadata?.product;

  // Validate required data
  if (!userId || !product) {
    console.error('❌ Missing userId or product in webhook metadata:', {
      userId,
      product,
      sessionId: session.id,
    });
    return;
  }

  console.log(`📦 Processing purchase: user=${userId}, product=${product}`);

  // Check for duplicate purchase (webhook idempotency)
  const existingPurchase = await prisma.aiPurchase.findFirst({
    where: {
      userId,
      product,
      purchasedAt: {
        // Check for purchases within last 5 minutes
        gte: new Date(Date.now() - 5 * 60 * 1000),
      },
    },
  });

  if (existingPurchase) {
    console.log('ℹ️ Purchase already exists (duplicate webhook), skipping');
    return;
  }

  // Calculate expiration date (90 days for standup-pro)
  const expiresAt = calculateExpirationDate(product);

  // Create purchase record
  await prisma.aiPurchase.create({
    data: {
      userId,
      product,
      purchasedAt: new Date(),
      expiresAt,
      generationsLimit: getGenerationsLimit(product),
      generationsUsed: 0,
      amount: session.amount_total, // Amount in cents
      currency: session.currency || 'usd',
    },
  });

  console.log(`✅ Purchase created successfully: user=${userId}, product=${product}`);

  // TODO: Optional enhancements
  // - Send confirmation email to user
  // - Log event for analytics
  // - Trigger notification (Slack, Discord, etc.)
}

/**
 * Calculate expiration date based on product
 */
function calculateExpirationDate(product: string): Date {
  const daysMap: Record<string, number> = {
    'standup-pro': 90, // 90 days
    'promotion-builder': 90, // 90 days
    'resume-refresh': 30, // 30 days
    'interview-prep': 30, // 30 days
  };

  const days = daysMap[product] || 90; // Default to 90 days
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get generation limit for product
 * null = unlimited
 */
function getGenerationsLimit(product: string): number | null {
  const limitsMap: Record<string, number | null> = {
    'standup-pro': null, // Unlimited
    'promotion-builder': 3, // 3 generations
    'resume-refresh': 10, // 10 generations
    'interview-prep': 20, // 20 generations
  };

  return limitsMap[product] ?? null;
}
```

**Why this approach:**
- **Security first**: Verify webhook signature before processing
- **Idempotency**: Check for duplicates (Stripe may send same event multiple times)
- **Logging**: Console logs for debugging and monitoring
- **Error handling**: Graceful failure, always acknowledge webhook
- **Extensible**: Easy to add more event types

**Critical security note:**
- Always verify webhook signature using `constructWebhookEvent()`
- Never trust webhook data without signature verification
- An attacker could send fake webhooks without this check

---

### Step 7: Create Routes

**Goal:** Register HTTP endpoints for purchases and webhooks

**File:** `packages/api/src/routes/purchase.routes.ts`

```typescript
// packages/api/src/routes/purchase.routes.ts
// Routes for purchase operations

import express, { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller.js';
import { requireAuthentication } from '../middleware/auth.js';

const router: Router = express.Router();

// POST /api/purchases - Create checkout session (requires authentication)
router.post(
  '/purchases',
  requireAuthentication,
  PurchaseController.createCheckout
);

// GET /api/purchases - List user's purchases (optional)
router.get(
  '/purchases',
  requireAuthentication,
  PurchaseController.listPurchases
);

export { router as purchaseRoutes };
```

**File:** `packages/api/src/routes/webhook.routes.ts`

```typescript
// packages/api/src/routes/webhook.routes.ts
// Routes for webhook handlers
// IMPORTANT: Must use raw body parser

import express, { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router: Router = express.Router();

// POST /api/webhooks/stripe - Stripe webhook handler
// CRITICAL: Use express.raw() to preserve raw body for signature verification
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }), // Raw body for signature verification
  WebhookController.handleStripeWebhook
);

export { router as webhookRoutes };
```

**Why separate route files:**
- Follows existing Papyrus pattern (auth.routes.ts, journal.routes.ts)
- Webhook route requires special middleware (raw body)
- Purchase routes require authentication
- Clean separation of concerns

---

### Step 8: Register Routes in Main App

**Goal:** Mount routes in Express app

**File:** `packages/api/src/app.ts` (or `index.ts` depending on your structure)

```typescript
// packages/api/src/app.ts (or index.ts)
import express from 'express';
import { authRoutes } from './routes/auth.routes.js';
import { journalRoutes } from './routes/journal.routes.js';
import { purchaseRoutes } from './routes/purchase.routes.js';
import { webhookRoutes } from './routes/webhook.routes.js';

const app = express();

// ⚠️ CRITICAL: Webhook routes MUST come BEFORE express.json()
// Webhook route needs raw body for signature verification
app.use('/api', webhookRoutes);

// Now add JSON body parser for other routes
app.use(express.json());

// Register other routes (these use JSON parser)
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api', purchaseRoutes);

// ... rest of your app setup

export { app };
```

**Critical ordering:**
1. ✅ Webhook routes FIRST (uses raw body)
2. ✅ `express.json()` middleware
3. ✅ All other routes (use parsed JSON body)

**Why order matters:**
- Webhook signature verification requires raw body (not parsed JSON)
- If `express.json()` runs first, body is already parsed → signature verification fails
- Other routes need JSON parsing for convenience

---

### Step 9: Update CLI Purchase Command (Phase 2 Version)

**Goal:** CLI calls backend API to create checkout session

**File:** `packages/cli/src/commands/purchase/index.ts`

```typescript
// packages/cli/src/commands/purchase/index.ts
// Phase 2: Dynamic checkout sessions via backend API

import { Command } from 'commander';
import open from 'open';
import chalk from 'chalk';
import axios from 'axios';
import { getConfig } from '../../lib/config.js';

export const purchaseCommand = new Command('purchase')
  .description('Purchase premium AI features')
  .argument('<product>', 'Product to purchase (standup-pro, promotion-builder, etc.)')
  .action(async (product: string) => {
    try {
      // Get API URL and auth token from config
      const config = getConfig();
      const apiUrl = config.apiUrl || 'http://localhost:3000';
      const token = config.token;

      if (!token) {
        console.error(chalk.red('❌ You must be logged in to make purchases'));
        console.log(chalk.dim('\nRun: papyrus login'));
        process.exit(1);
      }

      // Show purchase info
      console.log(chalk.cyan('\n🚀 Creating checkout session...\n'));

      // Call backend API to create checkout session
      const response = await axios.post(
        `${apiUrl}/api/purchases`,
        { product },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { checkoutUrl } = response.data;

      // Display product info
      displayProductInfo(product);

      console.log(chalk.dim('\nOpening payment page in your browser...'));
      console.log(chalk.dim('If the browser doesn\'t open, visit:'));
      console.log(chalk.blue(checkoutUrl));
      console.log();

      // Open browser
      try {
        await open(checkoutUrl);
        console.log(chalk.green('✓ Browser opened'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Unable to open browser automatically'));
        console.log(chalk.white('\nPlease visit this URL to complete your purchase:'));
        console.log(chalk.blue(checkoutUrl));
      }

      // Show post-purchase instructions
      console.log(chalk.dim('\n─────────────────────────────────────'));
      console.log(chalk.white('\nAfter completing your purchase:'));
      console.log(chalk.dim('• Access is activated instantly'));
      console.log(chalk.dim('• Run "papyrus ai standup" to use premium features'));
      console.log(chalk.dim('• Check your email for receipt'));
      console.log();

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 401) {
          console.error(chalk.red('❌ Authentication failed'));
          console.log(chalk.dim('Run: papyrus login'));
        } else if (status === 400) {
          console.error(chalk.red(`❌ ${message || 'Invalid product'}`));
          if (error.response?.data?.availableProducts) {
            console.log(chalk.white('\nAvailable products:'));
            error.response.data.availableProducts.forEach((p: string) => {
              console.log(chalk.dim(`  - ${p}`));
            });
          }
        } else {
          console.error(chalk.red(`❌ Error: ${message || 'Failed to create checkout'}`));
        }
      } else {
        console.error(chalk.red('❌ Unexpected error:'), error);
      }
      process.exit(1);
    }
  });

/**
 * Display product information
 */
function displayProductInfo(product: string): void {
  const productInfo: Record<string, { name: string; price: string; duration: string; benefit: string }> = {
    'standup-pro': {
      name: 'Standup Pro',
      price: '$9.00 USD',
      duration: '90 days',
      benefit: 'Unlimited AI standup generations',
    },
    'promotion-builder': {
      name: 'Promotion Builder',
      price: '$29.00 USD',
      duration: '90 days',
      benefit: '3 AI-powered promotion documents',
    },
    'resume-refresh': {
      name: 'Resume Refresh',
      price: '$19.00 USD',
      duration: '30 days',
      benefit: '10 AI resume enhancements',
    },
    'interview-prep': {
      name: 'Interview Prep',
      price: '$24.00 USD',
      duration: '30 days',
      benefit: '20 AI interview preparations',
    },
  };

  const info = productInfo[product];
  if (info) {
    console.log(chalk.white('Product: ') + chalk.bold(info.name));
    console.log(chalk.white('Price: ') + chalk.green(info.price));
    console.log(chalk.white('Duration: ') + chalk.yellow(info.duration));
    console.log(chalk.white('Benefit: ') + info.benefit);
  }
}
```

**Why this approach:**
- Calls backend API (not static payment link)
- Requires authentication (user must be logged in)
- Clear error handling for different scenarios
- Better UX with instant activation messaging

**Differences from Phase 1:**
- ❌ No static payment links
- ✅ Calls backend API
- ✅ Requires authentication
- ✅ Returns dynamic checkout URL
- ✅ Instant activation (no manual step)

---

### Step 10: Test Locally with Stripe CLI

**Goal:** Test webhook handling on localhost

**Install Stripe CLI:**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/

# Windows
scoop install stripe
```

**Login to Stripe:**

```bash
stripe login
# Opens browser to authorize CLI
```

**Forward webhooks to localhost:**

```bash
# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Output will show:
# > Ready! Your webhook signing secret is whsec_abc123xyz...
# Copy this secret to your .env as STRIPE_WEBHOOK_SECRET
```

**Keep this terminal running** while testing locally.

**Why use Stripe CLI:**
- Simulates production webhook delivery
- Provides webhook signing secret for local dev
- Allows testing without deploying to production
- Shows webhook events in real-time

---

### Step 11: Test End-to-End Flow

**Goal:** Verify complete purchase flow works

**Test steps:**

```bash
# Terminal 1: Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Start backend API
cd packages/api
pnpm dev

# Terminal 3: Build and test CLI
cd packages/cli
pnpm build

# Test purchase command
node dist/cli.js purchase standup-pro
```

**Expected flow:**

1. ✅ CLI authenticates with backend (JWT token)
2. ✅ Backend creates Stripe checkout session
3. ✅ CLI opens browser to Stripe Checkout page
4. ✅ User completes payment (use test card: 4242 4242 4242 4242)
5. ✅ Stripe sends webhook to your API
6. ✅ Webhook handler creates `ai_purchases` record
7. ✅ User can immediately use premium features

**Verify in database:**

```bash
cd packages/api
pnpm prisma:studio

# Check ai_purchases table
# Should see new record with:
# - userId: <user_id>
# - product: 'standup-pro'
# - expiresAt: 90 days from now
# - amount: 900
```

**Check Stripe Dashboard:**

Go to https://dashboard.stripe.com/test/payments

Should see successful payment with correct metadata.

---

## Testing

### Test Checklist

**Backend:**
- [ ] Environment variables loaded correctly
- [ ] Stripe SDK initializes without error
- [ ] POST /api/purchases returns checkout URL
- [ ] Webhook endpoint receives events
- [ ] Webhook signature verification works
- [ ] Purchase record created in database
- [ ] Duplicate webhooks handled correctly (idempotency)

**CLI:**
- [ ] Purchase command requires authentication
- [ ] Creates checkout session successfully
- [ ] Opens browser to Stripe Checkout
- [ ] Clear error messages for invalid products

**Integration:**
- [ ] Complete payment flow works end-to-end
- [ ] User gets instant access after payment
- [ ] Webhook events logged correctly
- [ ] Database records are accurate

### Manual Test Script

```bash
# 1. Setup
cd packages/api
pnpm build
pnpm dev
# Backend running on http://localhost:3000

# 2. Start Stripe webhook forwarding (separate terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy webhook secret to .env

# 3. Login to CLI
cd packages/cli
pnpm build
node dist/cli.js login
# Enter test credentials

# 4. Make test purchase
node dist/cli.js purchase standup-pro

# Expected: Browser opens to Stripe Checkout

# 5. Complete payment
# Card: 4242 4242 4242 4242
# Expiry: 12/34
# CVC: 123
# Name: Test User
# Click "Pay"

# Expected: Success page displays

# 6. Check Terminal 2 (Stripe CLI)
# Should see:
# ✅ Webhook verified: checkout.session.completed
# 📦 Processing purchase: user=..., product=standup-pro
# ✅ Purchase created successfully

# 7. Verify in database
pnpm prisma:studio
# ai_purchases table should have new record

# 8. Test premium feature
node dist/cli.js ai standup
# Should work without usage limit error
```

### Automated Test (Optional)

```typescript
// packages/api/src/controllers/__tests__/webhook.controller.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import request from 'supertest';
import { app } from '../../app.js';

describe('Webhook Controller', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.aiPurchase.deleteMany();
  });

  it('should create purchase on checkout.session.completed', async () => {
    // TODO: Mock Stripe webhook event
    // TODO: Send to /api/webhooks/stripe
    // TODO: Verify purchase created in database
  });

  it('should handle duplicate webhooks (idempotency)', async () => {
    // TODO: Send same webhook twice
    // TODO: Verify only one purchase created
  });
});
```

---

## Common Issues

### Issue: Webhook signature verification fails

**Symptoms:**
```
⚠️ Webhook signature verification failed
Invalid webhook signature
```

**Causes:**
1. Wrong `STRIPE_WEBHOOK_SECRET` in `.env`
2. Webhook route is using `express.json()` instead of `express.raw()`
3. Using live mode webhook secret with test mode events

**Solution:**
1. Verify `.env` has correct `STRIPE_WEBHOOK_SECRET`
2. Ensure webhook route is mounted BEFORE `express.json()`
3. For local dev: Use secret from `stripe listen` output
4. For production: Use secret from Stripe Dashboard

```typescript
// WRONG ORDER
app.use(express.json()); // ❌ This parses body first
app.use('/api', webhookRoutes); // ❌ Body already parsed

// CORRECT ORDER
app.use('/api', webhookRoutes); // ✅ Uses raw body
app.use(express.json()); // ✅ Parses other routes
```

---

### Issue: 401 Unauthorized when creating checkout

**Symptoms:**
```
❌ Authentication failed
Run: papyrus login
```

**Causes:**
- Not logged in to CLI
- JWT token expired
- Token not being sent in Authorization header

**Solution:**
```bash
# Login to CLI
papyrus login

# Verify token is stored
cat ~/.config/papyrus/config.json
# Should show: { "token": "eyJ..." }

# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/purchases \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"product":"standup-pro"}'
```

---

### Issue: Purchase not created after successful payment

**Symptoms:**
- Payment succeeds in Stripe Dashboard
- No record in `ai_purchases` table
- Webhook shows "received: true" but no logs

**Causes:**
1. Webhook not being forwarded (Stripe CLI not running)
2. Missing `metadata` in checkout session
3. Error in webhook handler (check logs)

**Solution:**
1. Check Stripe CLI is running: `stripe listen --forward-to ...`
2. Verify checkout session includes metadata:
   ```typescript
   metadata: {
     userId: '...',
     product: 'standup-pro'
   }
   ```
3. Check backend logs for webhook errors
4. Check Stripe Dashboard → Webhooks → Event History

---

## Going to Production

### Step 1: Switch to Live Mode

**Get live API keys:**
1. Complete Stripe account verification
2. Add bank account for payouts
3. Go to https://dashboard.stripe.com/apikeys (NOT /test/apikeys)
4. Copy live mode keys (start with `sk_live_` and `pk_live_`)

**Update production environment variables:**

```env
# Production .env
STRIPE_SECRET_KEY=sk_live_ABC...XYZ
STRIPE_WEBHOOK_SECRET=whsec_LIVE...SECRET
APP_URL=https://api.papyrus.com
```

### Step 2: Create Production Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. Enter endpoint URL: `https://api.papyrus.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to production `.env` as `STRIPE_WEBHOOK_SECRET`

### Step 3: Test in Production

**Use real card with small amount:**
1. Deploy backend to production
2. Update CLI to use production API URL
3. Make test purchase with real card
4. Verify webhook received
5. Verify purchase created
6. Verify premium features work

**Monitor closely:**
- Check Stripe Dashboard for successful payments
- Check backend logs for webhook events
- Verify database records
- Test premium features immediately

### Step 4: Set Up Monitoring

**Recommended:**
- **Error tracking**: Sentry, Rollbar, or similar
- **Logging**: CloudWatch, Datadog, or similar
- **Alerts**: Email/Slack on webhook failures
- **Metrics**: Track conversion rates, failed payments, webhook latency

---

## Enhancements (Optional)

### 1. Add Purchase History Endpoint

Let users view their past purchases:

```typescript
// In PurchaseController
static async listPurchases(req, res, next) {
  const userId = req.user.id;
  const purchases = await prisma.aiPurchase.findMany({
    where: { userId },
    orderBy: { purchasedAt: 'desc' },
    select: {
      id: true,
      product: true,
      purchasedAt: true,
      expiresAt: true,
      amount: true,
      currency: true,
    }
  });
  res.json({ success: true, purchases });
}
```

### 2. Add Refund Support

Allow issuing refunds programmatically:

```typescript
import { stripe } from '../services/stripe.service.js';

async function refundPurchase(purchaseId: string) {
  const purchase = await prisma.aiPurchase.findUnique({
    where: { id: purchaseId }
  });

  if (!purchase) throw new Error('Purchase not found');

  // Issue refund via Stripe
  const refund = await stripe.refunds.create({
    payment_intent: purchase.stripePaymentIntentId,
    amount: purchase.amount,
  });

  // Mark purchase as refunded
  await prisma.aiPurchase.update({
    where: { id: purchaseId },
    data: { refundedAt: new Date() }
  });

  return refund;
}
```

### 3. Add Email Confirmations

Send email after successful purchase:

```typescript
// In webhook handler after creating purchase
await sendPurchaseConfirmationEmail(userId, product);

async function sendPurchaseConfirmationEmail(userId: string, product: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // Use your email service (SendGrid, Resend, etc.)
  await emailService.send({
    to: user.email,
    subject: 'Purchase Confirmation - Papyrus',
    body: `Thank you for purchasing ${product}! Your premium access is now active.`
  });
}
```

### 4. Add Analytics Tracking

Track conversion metrics:

```typescript
// In webhook handler
await analytics.track('purchase_completed', {
  userId,
  product,
  amount: session.amount_total,
  currency: session.currency,
  timestamp: new Date(),
});
```

---

## Summary

**Phase 2 provides:**
- ✅ Fully automated purchase flow
- ✅ Instant access (no manual activation)
- ✅ Secure webhook verification
- ✅ Scalable to any purchase volume
- ✅ Complete audit trail in database
- ✅ Professional user experience

**Implementation checklist:**
- [ ] Stripe SDK installed
- [ ] Environment variables configured
- [ ] Stripe service created
- [ ] Purchase controller implemented
- [ ] Webhook controller implemented
- [ ] Routes registered (correct order!)
- [ ] CLI command updated
- [ ] Tested locally with Stripe CLI
- [ ] Tested end-to-end flow
- [ ] Ready for production deployment

**Files created:**
- `packages/api/src/services/stripe.service.ts`
- `packages/api/src/controllers/purchase.controller.ts`
- `packages/api/src/controllers/webhook.controller.ts`
- `packages/api/src/routes/purchase.routes.ts`
- `packages/api/src/routes/webhook.routes.ts`
- `packages/cli/src/commands/purchase/index.ts`

**Total code:** ~500 lines (including comments and type definitions)

**Implementation time:** ~2 hours for experienced developer

---

## Next Steps

1. **Deploy to production**: Follow "Going to Production" section
2. **Add monitoring**: Set up error tracking and alerts
3. **Collect metrics**: Track conversion rates and revenue
4. **Iterate**: Add features based on user feedback (refunds, purchase history, etc.)

---

## Resources

**Stripe Documentation:**
- [Checkout Sessions](https://docs.stripe.com/checkout)
- [Webhooks](https://docs.stripe.com/webhooks)
- [Testing](https://docs.stripe.com/testing)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)

**Papyrus Documentation:**
- [Stripe Integration Overview](./README.md)
- [Phase 1: Payment Links](./01-phase1-payment-links.md)
- [Database Schema](../../prisma/schema.prisma)
- [AI Usage Limiter](../ai/standup/architecture.md)
