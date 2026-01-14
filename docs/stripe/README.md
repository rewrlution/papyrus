# Stripe Integration for Papyrus

Complete documentation for Stripe payment processing in Papyrus.

## Quick Links

- **New to Stripe?** → Start with [Quick Setup Guide](../stripe-quick-setup.md)
- **Want details?** → Read [Complete Tutorial](../stripe-integration-tutorial.md)
- **Need reference?** → Check [Summary Document](../STRIPE-SUMMARY.md)

## What's Included

### 1. Quick Setup Guide (`stripe-quick-setup.md`)

**For:** Developers who want to get started fast
**Time:** 15 minutes
**Contents:**
- Environment setup
- API key configuration
- Testing with Stripe CLI
- Verification steps

[Read the Quick Setup Guide →](../stripe-quick-setup.md)

### 2. Complete Tutorial (`stripe-integration-tutorial.md`)

**For:** Developers implementing from scratch or understanding architecture
**Time:** 1-2 hours
**Contents:**
- Architecture overview with diagrams
- Step-by-step implementation
- Code examples with explanations
- Testing strategies
- Common issues and solutions

[Read the Complete Tutorial →](../stripe-integration-tutorial.md)

### 3. Summary Document (`STRIPE-SUMMARY.md`)

**For:** Quick reference during development
**Time:** 5 minutes
**Contents:**
- API endpoints
- Product configuration
- Database schema changes
- Testing cheat sheet
- Production checklist

[Read the Summary Document →](../STRIPE-SUMMARY.md)

## Documentation Philosophy

These documents follow the [TUTOR-PRINCIPLES.md](../TUTOR-PRINCIPLES.md):

✅ **Top-down approach**: Start with big picture, drill into details
✅ **Complete working code**: All examples are runnable
✅ **Proper componentization**: Clean architecture with clear layers
✅ **No unnecessary complexity**: Simple, focused solutions
✅ **Explain why, not just how**: Reasoning behind design decisions
✅ **Multiple learning paths**: Quick start, tutorial, reference

## Which Document Should I Read?

### You want to...

| Goal                                              | Read This                   |
| ------------------------------------------------- | --------------------------- |
| Get Stripe working locally ASAP                   | Quick Setup Guide           |
| Understand how everything works                   | Complete Tutorial           |
| Find specific API endpoints or config             | Summary Document            |
| Implement from scratch                            | Complete Tutorial           |
| Debug webhook issues                              | Quick Setup (troubleshooting)|
| Prepare for production deployment                 | Summary (production checklist)|

### By Experience Level

| Experience                          | Start Here              | Then Read           |
| ----------------------------------- | ----------------------- | ------------------- |
| New to Stripe                       | Quick Setup Guide       | Complete Tutorial   |
| Familiar with Stripe                | Summary Document        | Complete Tutorial   |
| Implementing production             | Complete Tutorial       | Summary (checklist) |
| Debugging existing implementation   | Summary (common issues) | Complete Tutorial   |

## Implementation Status

| Component                      | Status | Location                                    |
| ------------------------------ | ------ | ------------------------------------------- |
| Database schema                | ✅      | `packages/api/prisma/schema.prisma`         |
| Environment configuration      | ✅      | `packages/api/src/env/config.ts`            |
| Stripe utilities               | ✅      | `packages/api/src/lib/stripe.ts`            |
| Payment service                | ✅      | `packages/api/src/services/payment.service.ts`|
| Payment controller             | ✅      | `packages/api/src/controllers/payment.controller.ts`|
| Payment routes                 | ✅      | `packages/api/src/routes/payment.routes.ts` |
| Repository updates             | ✅      | `packages/api/src/domain/repositories/ai-purchse.repository.ts`|
| App registration               | ✅      | `packages/api/src/app.ts`                   |
| Unit tests                     | ✅      | `packages/api/tests/services/payment.service.test.ts`|
| Documentation                  | ✅      | You're reading it!                          |

## Features Implemented

✅ **Stripe Checkout**: Hosted payment pages with card support
✅ **Webhook Handling**: Automatic fulfillment on payment success
✅ **Customer Management**: Reuse customers across purchases
✅ **Idempotency**: Safe webhook retry handling
✅ **Purchase Tracking**: Full history with expiration dates
✅ **Test Mode**: Development with test cards and Stripe CLI
✅ **Security**: Signature verification, secure key storage
✅ **Error Handling**: Graceful failures with logging

## Products Available for Purchase

| Product                | Price | Duration | Free Tier     |
| ---------------------- | ----- | -------- | ------------- |
| Standup Pro            | $9    | 90 days  | 10/month      |
| Promotion Builder      | $19   | 30 days  | 1 lifetime    |
| Resume & Interview Pro | $29   | 30 days  | None          |

See [AI-MONETIZATION.md](../AI-MONETIZATION.md) for complete pricing model.

## API Endpoints

| Method | Endpoint                            | Purpose                   |
| ------ | ----------------------------------- | ------------------------- |
| POST   | `/api/payments/checkout`            | Create checkout session   |
| POST   | `/api/payments/webhook`             | Handle Stripe events      |
| GET    | `/api/payments/checkout/:sessionId` | Get checkout status       |
| GET    | `/api/payments/purchases`           | Get user purchase history |

## Development Workflow

### First Time Setup

1. Read [Quick Setup Guide](../stripe-quick-setup.md)
2. Install dependencies: `pnpm install`
3. Configure environment: Copy `.env.example` to `.env`
4. Add Stripe keys from dashboard
5. Run migrations: `pnpm prisma:migrate`
6. Start server: `pnpm dev`
7. Forward webhooks: `stripe listen --forward-to localhost:3000/api/payments/webhook`

### Daily Development

```bash
# Terminal 1: API server
pnpm dev

# Terminal 2: Webhook forwarding
stripe listen --forward-to localhost:3000/api/payments/webhook

# Terminal 3: Testing
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"product":"standup-pro"}'
```

## Testing

### Unit Tests

```bash
cd packages/api
pnpm test
```

### Manual Testing

```bash
# Create checkout session
curl -X POST http://localhost:3000/api/payments/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product":"standup-pro"}'

# Test card: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits
```

### Webhook Testing

```bash
# Trigger test webhook
stripe trigger checkout.session.completed

# View webhook logs
stripe logs tail
```

## Troubleshooting

Common issues and solutions are documented in:

- [Quick Setup Guide - Troubleshooting](../stripe-quick-setup.md#troubleshooting)
- [Complete Tutorial - Common Issues](../stripe-integration-tutorial.md#common-issues)
- [Summary - Common Issues](../STRIPE-SUMMARY.md#common-issues--solutions)

## Production Deployment

Before deploying to production:

1. Read [Summary - Production Checklist](../STRIPE-SUMMARY.md#production-checklist)
2. Switch to live Stripe keys
3. Configure production webhook endpoint
4. Test with real card (small amount)
5. Set up monitoring and alerts
6. Enable error logging

## Related Documentation

- [AI Monetization Model](../AI-MONETIZATION.md) - Pricing and access control
- [AI Features Brainstorm](../AI-FEATURES-BRAINSTORM.md) - What features to monetize
- [AI Architecture Design](../AI-ARCHITECTURE-DESIGN.md) - Overall AI system architecture
- [TUTOR-PRINCIPLES.md](../TUTOR-PRINCIPLES.md) - Documentation philosophy

## External Resources

- [Stripe Checkout Docs](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Support

For issues or questions:

1. Check troubleshooting sections in docs
2. Review Stripe Dashboard logs
3. Test with Stripe CLI: `stripe logs tail`
4. Consult [Complete Tutorial](../stripe-integration-tutorial.md) for architecture details

---

**Last Updated:** January 14, 2026
**Status:** ✅ Production Ready
