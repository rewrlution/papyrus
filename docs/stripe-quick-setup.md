# Stripe Integration Quick Setup Guide

> Get Stripe payments up and running in 15 minutes

## Overview

This guide walks you through setting up Stripe payment processing for Papyrus AI features. For detailed architectural information, see [stripe-integration-tutorial.md](./stripe-integration-tutorial.md).

## Prerequisites

- Stripe account ([sign up](https://dashboard.stripe.com/register))
- Papyrus API running locally
- Database configured

## Step 1: Get Stripe API Keys

### 1.1 Get Test Keys from Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### 1.2 Get Webhook Secret

**Option A: Stripe CLI (Recommended for local development)**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or
scoop install stripe                    # Windows

# Login
stripe login

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy the webhook signing secret (whsec_...)
```

**Option B: Dashboard Webhooks (For production)**

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://your-api.com/api/payments/webhook`
4. Select events: `checkout.session.completed`, `checkout.session.expired`
5. Copy the webhook signing secret

## Step 2: Configure Environment

Add to `packages/api/.env`:

```env
# Stripe Payment Integration
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 3: Install Dependencies

```bash
cd packages/api
pnpm install  # Installs Stripe SDK (already in package.json)
```

## Step 4: Run Database Migration

```bash
cd packages/api
pnpm prisma:migrate
```

This adds Stripe-specific fields to the `ai_purchases` table.

## Step 5: Start the Server

```bash
# Terminal 1: Start API server
cd packages/api
pnpm dev

# Terminal 2: Forward webhooks (if using Stripe CLI)
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## Step 6: Test the Integration

### 6.1 Create a Checkout Session

```bash
# Get a JWT token first
TOKEN=$(curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.data.token')

# Create checkout session
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product":"standup-pro"}' \
  | jq .
```

Response:

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

### 6.2 Complete Test Payment

1. Open the checkout URL in your browser
2. Use test card: **4242 4242 4242 4242**
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Click "Pay"

### 6.3 Verify Webhook Received

Check your terminal running `stripe listen` - you should see:

```
checkout.session.completed [evt_...]
--> POST http://localhost:3000/api/payments/webhook [200]
```

### 6.4 Verify Purchase in Database

```bash
cd packages/api
pnpm prisma:studio
```

Navigate to `AiPurchase` table - you should see the new purchase record.

## Step 7: Test AI Feature Access

```bash
# Test standup generation (should now work with premium access)
curl -X POST http://localhost:3000/api/ai/standup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

### "Invalid webhook signature" error

**Cause:** Raw body not preserved for webhook endpoint

**Solution:** Ensure `express.raw()` middleware comes before `express.json()`:

```typescript
// In app.ts
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentRoutes
);

app.use(express.json()); // After webhook route
```

### "STRIPE_SECRET_KEY is required" error

**Cause:** Missing environment variable

**Solution:** Double-check `.env` file has all three Stripe keys

### Webhook not received

**Cause:** Stripe CLI not running or wrong port

**Solution:**

1. Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/payments/webhook`
2. Verify API server is on port 3000 (check `PORT` in `.env`)

### Duplicate purchases in database

**Cause:** Webhook retries creating duplicates

**Solution:** This should not happen - the code checks for existing purchases by `stripeCheckoutSessionId`. If it does, check the repository logic.

## Test Cards Reference

| Card Number         | Description                |
| ------------------- | -------------------------- |
| 4242 4242 4242 4242 | Success (generic)          |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0077 | Success (requires 3D auth) |

## Production Checklist

Before going live:

- [ ] Switch to live API keys (not test keys)
- [ ] Configure production webhook endpoint in Stripe Dashboard
- [ ] Use production database (not test DB)
- [ ] Set up webhook monitoring/alerts
- [ ] Test with real card (small amount)
- [ ] Verify email receipts are sent
- [ ] Add error logging to production monitoring

## Next Steps

- [Full Stripe Integration Tutorial](./stripe-integration-tutorial.md) - Deep dive into architecture
- [API Monetization Model](./AI-MONETIZATION.md) - Pricing and access control
- [AI Features Brainstorm](./AI-FEATURES-BRAINSTORM.md) - What features to monetize

## Quick Reference

**Available Products:**

| Product                | Price | Duration |
| ---------------------- | ----- | -------- |
| `standup-pro`          | $9    | 90 days  |
| `promotion-pro`        | $19   | 30 days  |
| `resume-interview-pro` | $29   | 30 days  |

**API Endpoints:**

- `POST /api/payments/checkout` - Create checkout session
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/purchases` - Get user's purchase history
- `GET /api/payments/checkout/:sessionId` - Get checkout status

**Webhook Events:**

- `checkout.session.completed` - Payment succeeded
- `checkout.session.expired` - Payment failed/canceled

---

**Happy integrating!** 🎉
