# Stripe Integration for Papyrus

**Last Updated:** 2026-01-13

This documentation covers how to add Stripe payment processing to Papyrus for monetizing AI features.

## Overview

Papyrus uses a **two-tier monetization model**:

1. **Free Tier**: Limited monthly usage (e.g., 20 AI standup requests/month)
2. **Premium Tier**: Time-based or unlimited access via one-time purchases

Stripe handles the payment flow, and our backend creates purchase records in the `ai_purchases` table to grant premium access.

---

## Current State

### ✅ Database Schema Ready

The database foundation for monetization is **already implemented**:

- **`ai_usage` table**: Tracks free tier usage per user/feature/month
- **`ai_purchases` table**: Stores premium purchases with expiration and generation limits
- **Usage limiter system**: Checks for active purchases before enforcing free tier limits

**Migration:** `20260113055129_ai_usage_and_purchases`

**Schema Location:** `packages/api/prisma/schema.prisma`

### ✅ Usage Check Flow

```
User requests AI feature
    ↓
1. Check ai_purchases table
   → Has active purchase? (expiresAt > now OR null)
   → Yes: Allow (unlimited or within purchase limit)
   → No: Continue to step 2
    ↓
2. Check ai_usage table
   → Used < free tier limit this month?
   → Yes: Allow and increment counter
   → No: Return 429 error with upgrade prompt
```

**Implementation:** `packages/api/src/lib/ai/usage-limiter.ts` (if exists) or in service layer

---

## Monetization Products

### Standup Pro ($9 for 90 days)

- **Product ID**: `standup-pro`
- **Price**: $9.00 USD (one-time payment)
- **Access**: Unlimited AI standup generations for 90 days
- **Database Fields**:
  - `expiresAt`: 90 days from purchase
  - `generationsLimit`: `null` (unlimited)

### Future Products

- **Promotion Builder** ($29 for 90 days, 3 generations)
- **Resume Refresh** ($19 for 30 days, 10 generations)
- **Interview Prep** ($24 for 30 days, 20 generations)

---

## Stripe Integration Approaches

We have **two implementation phases**:

### Phase 1: Payment Links (MVP)

**Best for:** Testing demand, early beta users, quick launch

**Effort:** 5 minutes setup, minimal code

**How it works:**
1. Create payment link in Stripe Dashboard
2. CLI command opens link in browser
3. User completes payment on Stripe's hosted page
4. **Manual step**: Link payment to user account

**Limitations:**
- Requires manual linking of purchases to users
- No automatic purchase record creation
- Good for low volume (<10 purchases/week)

**When to use:**
- MVP/beta testing
- Validating product-market fit
- Don't want to build backend endpoints yet

**Tutorial:** [Phase 1: Payment Links](./01-phase1-payment-links.md)

---

### Phase 2: Checkout Sessions (Production)

**Best for:** Automated, scalable production use

**Effort:** 1-2 hours implementation

**How it works:**
1. CLI calls backend API to create checkout session
2. Backend returns Stripe Checkout URL
3. CLI opens URL in browser
4. User completes payment
5. Stripe webhook automatically creates purchase record in database

**Benefits:**
- ✅ Fully automated
- ✅ Scalable to any volume
- ✅ Purchase automatically linked to user
- ✅ Webhook verifies payment authenticity

**When to use:**
- Production deployment
- Expecting regular purchases
- Want full automation

**Tutorial:** [Phase 2: Checkout Sessions](./02-phase2-checkout-sessions.md)

---

## Architecture: Phase 2 (Recommended)

```
┌─────────────────┐
│   CLI Command   │ papyrus purchase standup-pro
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ POST /api/purchases                     │
│ Body: { product: "standup-pro" }        │
│ Headers: { Authorization: Bearer ... }  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Purchase Controller                     │
│ - Validate user authentication          │
│ - Create Stripe Checkout Session        │
│ - Return checkout URL to CLI            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ CLI Opens Browser                       │
│ https://checkout.stripe.com/...         │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ User Completes Payment on Stripe        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Stripe Webhook Fires                    │
│ POST /api/webhooks/stripe               │
│ Event: checkout.session.completed       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Webhook Handler                         │
│ - Verify webhook signature              │
│ - Extract userId and product            │
│ - Create ai_purchases record            │
│   {                                     │
│     userId: "...",                      │
│     product: "standup-pro",             │
│     expiresAt: +90 days,                │
│     generationsLimit: null,             │
│     amount: 900, // cents               │
│     currency: "usd"                     │
│   }                                     │
└─────────────────────────────────────────┘
```

---

## File Structure

### Backend (API)

```
packages/api/
├── src/
│   ├── controllers/
│   │   ├── purchase.controller.ts      # Create checkout sessions
│   │   └── webhook.controller.ts       # Handle Stripe webhooks
│   ├── routes/
│   │   ├── purchase.routes.ts          # POST /api/purchases
│   │   └── webhook.routes.ts           # POST /api/webhooks/stripe
│   └── services/
│       └── stripe.service.ts           # Stripe SDK wrapper
├── prisma/
│   └── schema.prisma                   # ai_purchases model (already exists)
└── .env                                # Stripe API keys
```

### CLI

```
packages/cli/
└── src/
    └── commands/
        └── purchase.ts                 # papyrus purchase <product>
```

---

## Environment Variables

Add to `packages/api/.env`:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...                  # NEVER expose publicly
STRIPE_PUBLISHABLE_KEY=pk_test_...             # Safe to expose in frontend
STRIPE_WEBHOOK_SECRET=whsec_...                # For webhook signature verification

# Product Pricing (in cents)
STRIPE_STANDUP_PRO_PRICE=900                   # $9.00
STRIPE_PROMOTION_BUILDER_PRICE=2900            # $29.00

# Application URLs
APP_URL=http://localhost:3000                  # For checkout success/cancel redirects
```

Add validation to `packages/api/src/env/config.ts`:

```typescript
import { z } from 'zod';

export const envSchema = z.object({
  // ... existing fields

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  APP_URL: z.string().url().default('http://localhost:3000'),
});
```

---

## Stripe Dashboard Configuration

### Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up (free)
2. You'll start in **Test Mode** (use this for development)
3. Switch to **Live Mode** only when ready for production

### Step 2: Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy:
   - **Secret key** (`sk_test_...`) → Backend only
   - **Publishable key** (`pk_test_...`) → Frontend/CLI (optional)

### Step 3: Set Up Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Enter webhook URL:
   - **Local dev**: Use Stripe CLI (see testing section)
   - **Production**: `https://your-api.com/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded` (optional, for additional verification)
5. Copy the **Webhook signing secret** (`whsec_...`)

---

## Testing Your Integration

### Local Development with Stripe CLI

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

**Login and forward webhooks:**

```bash
# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# The output will show your webhook signing secret (whsec_...)
# Add this to your .env as STRIPE_WEBHOOK_SECRET
```

**Trigger test events:**

```bash
# Simulate successful payment
stripe trigger checkout.session.completed

# Simulate payment failure
stripe trigger payment_intent.payment_failed
```

### Test Cards

Use these test cards in Stripe Checkout:

| Card Number         | Scenario            |
| ------------------- | ------------------- |
| 4242 4242 4242 4242 | Success             |
| 4000 0000 0000 0002 | Card declined       |
| 4000 0000 0000 9995 | Insufficient funds  |
| 4000 0025 0000 3155 | Requires 3D Secure  |

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

---

## Key Stripe Concepts

### 1. Checkout Sessions

**What:** Pre-built payment page hosted by Stripe

**Why:** No need to build custom payment UI, handles card collection securely

**How:** Create session via API, redirect user to session URL

**Example:**
```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price_data: { ... }, quantity: 1 }],
  mode: 'payment', // One-time payment
  success_url: 'https://yoursite.com/success',
  cancel_url: 'https://yoursite.com/cancel',
  metadata: { userId: 'user_123', product: 'standup-pro' }
});
```

### 2. Webhooks

**What:** HTTP callbacks from Stripe when events occur (e.g., payment succeeded)

**Why:** Stripe notifies your server about payment status changes

**How:** Stripe sends POST request to your webhook endpoint

**Security:** Verify webhook signature using `stripe.webhooks.constructEvent()`

**Important:** Webhooks can be sent multiple times (idempotency needed)

### 3. Metadata

**What:** Custom key-value data attached to Stripe objects

**Why:** Link Stripe payments to your application data (userId, product)

**Where:** Checkout sessions, payment intents, customers, etc.

**Example:**
```typescript
metadata: {
  userId: 'user_abc123',
  product: 'standup-pro',
  email: 'user@example.com'
}
```

### 4. Test Mode vs Live Mode

**Test Mode:**
- Use test API keys (`sk_test_...`, `pk_test_...`)
- Use test cards (4242 4242 4242 4242)
- No real money charged
- Safe for development

**Live Mode:**
- Use live API keys (`sk_live_...`, `pk_live_...`)
- Real cards, real money
- Use only in production

### 5. Idempotency

**What:** Handling duplicate webhook events safely

**Why:** Stripe may send the same webhook multiple times

**How:** Check if purchase already exists before creating

**Example:**
```typescript
// Check for duplicate within last 5 minutes
const existingPurchase = await prisma.aiPurchase.findFirst({
  where: {
    userId,
    product,
    purchasedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
  }
});

if (existingPurchase) {
  console.log('Duplicate webhook, skipping');
  return;
}
```

---

## Security Best Practices

### 1. Never Expose Secret Key

❌ **DON'T:**
```typescript
// In CLI or frontend
const stripe = new Stripe('sk_test_...');
```

✅ **DO:**
```typescript
// In backend only
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

### 2. Always Verify Webhook Signatures

❌ **DON'T:**
```typescript
app.post('/webhooks/stripe', (req, res) => {
  const event = req.body; // Unverified!
  handleEvent(event);
});
```

✅ **DO:**
```typescript
app.post('/webhooks/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  ); // Verified!
  handleEvent(event);
});
```

### 3. Use Raw Body for Webhooks

Webhook signature verification requires the **raw body** (not parsed JSON).

✅ **DO:**
```typescript
// Webhook route BEFORE express.json()
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// Then other routes can use JSON parser
app.use(express.json());
```

### 4. Store Minimal Payment Data

Only store what you need:

✅ Store:
- Purchase ID
- User ID
- Product
- Amount (for analytics)
- Expiration date

❌ Don't store:
- Card numbers
- CVV codes
- Full payment details (Stripe handles this)

---

## Troubleshooting

### Issue: Webhook signature verification fails

**Symptoms:**
```
Error: Webhook signature verification failed
```

**Causes:**
1. Wrong webhook secret in `.env`
2. Using `express.json()` before webhook route (body is parsed, not raw)
3. Webhook secret is for live mode, but using test events

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure webhook route uses `express.raw()` and is defined BEFORE `express.json()`
3. Use correct webhook secret for test/live mode

### Issue: Purchase record not created after payment

**Symptoms:**
- Payment succeeds in Stripe Dashboard
- No record in `ai_purchases` table

**Causes:**
1. Webhook not configured
2. Webhook URL is wrong
3. Webhook handler has error

**Solution:**
1. Check Stripe Dashboard → Webhooks → Event history
2. Look for failed webhook attempts
3. Check backend logs for webhook errors
4. For local dev: Ensure Stripe CLI is running (`stripe listen`)

### Issue: Cannot open browser from CLI

**Symptoms:**
```
Error: Unable to open browser
```

**Cause:**
- `open` package not working on some systems
- SSH session (no display)

**Solution:**
```typescript
// Fallback: print URL if browser fails
try {
  await open(checkoutUrl);
} catch (error) {
  console.log('Unable to open browser automatically.');
  console.log(`\nPlease visit this URL to complete your purchase:\n${checkoutUrl}\n`);
}
```

### Issue: 401 Unauthorized when creating checkout

**Symptoms:**
```
Error 401: Unauthorized
```

**Cause:**
- Missing or invalid JWT token
- Token expired

**Solution:**
1. Run `papyrus login` to get fresh token
2. Check CLI token storage (XDG config directory)
3. Verify `requireAuthentication` middleware is working

---

## Next Steps

1. **Choose Your Phase:**
   - Quick MVP? → [Phase 1: Payment Links](./01-phase1-payment-links.md)
   - Production ready? → [Phase 2: Checkout Sessions](./02-phase2-checkout-sessions.md)

2. **After Implementation:**
   - Test with Stripe test mode
   - Monitor webhook events in Stripe Dashboard
   - Add analytics (track conversion rates)
   - Consider adding purchase history UI

3. **Going to Production:**
   - Switch to live mode API keys
   - Update webhook endpoint to production URL
   - Test with real card (small amount)
   - Set up error monitoring (Sentry, etc.)

---

## Resources

### Official Documentation

- **Stripe Checkout**: https://docs.stripe.com/checkout/quickstart
- **Stripe Webhooks**: https://docs.stripe.com/webhooks
- **Stripe Testing**: https://docs.stripe.com/testing
- **Stripe CLI**: https://docs.stripe.com/stripe-cli
- **Stripe API**: https://docs.stripe.com/api

### Papyrus Documentation

- **Database Schema**: `packages/api/prisma/schema.prisma` (lines 112-137)
- **AI Usage Limiter**: `packages/api/src/lib/ai/usage-limiter.ts` (if exists)
- **AI Standup Documentation**: `packages/api/docs/ai/standup/`

### Community

- **Stripe Discord**: https://discord.gg/stripe
- **Stack Overflow**: Tag `stripe-payments`

---

## FAQ

### Q: Do I need a business to use Stripe?

**A:** No, you can sign up as an individual. You'll need to provide:
- Email address
- Bank account details (for payouts)
- Tax information (for 1099 forms if in US)

### Q: What are Stripe's fees?

**A:** Standard pricing:
- 2.9% + $0.30 per successful card charge (US)
- No monthly fees, setup fees, or hidden costs
- Fees vary by country

### Q: Can I use Stripe outside the US?

**A:** Yes, Stripe supports 46+ countries. Check: https://stripe.com/global

### Q: How long until I receive payouts?

**A:**
- Default: 7 days after first payment (for fraud protection)
- After initial period: 2-business-day rolling payouts
- Can enable instant payouts (1% fee) in some countries

### Q: What if a customer disputes a charge?

**A:**
- Stripe notifies you via webhook
- You have time to provide evidence
- Stripe handles the dispute process
- If you lose: Charge is refunded + $15 dispute fee

### Q: Can I offer refunds?

**A:** Yes, you can issue full or partial refunds via:
- Stripe Dashboard (manual)
- Stripe API (programmatic)

**Refund implementation:**
```typescript
await stripe.refunds.create({
  payment_intent: 'pi_...',
  amount: 900, // cents (optional, defaults to full refund)
});
```

### Q: How do I handle taxes (sales tax, VAT)?

**A:**
- Use Stripe Tax (automatic tax calculation)
- Or integrate with external tax service
- Or handle manually in your application

---

## Summary

**Stripe integration adds payment processing to Papyrus:**

- ✅ Database schema already ready (`ai_purchases` table)
- ✅ Two implementation phases (Payment Links for MVP, Checkout Sessions for production)
- ✅ Fully automated with webhooks
- ✅ CLI-first approach (opens browser for payment)
- ✅ Secure (Stripe handles card data, we verify webhooks)

**Total implementation time:**
- Phase 1 (MVP): ~30 minutes
- Phase 2 (Production): ~2 hours

**Start with the tutorials:**
1. [Phase 1: Payment Links (MVP)](./01-phase1-payment-links.md)
2. [Phase 2: Checkout Sessions (Production)](./02-phase2-checkout-sessions.md)
