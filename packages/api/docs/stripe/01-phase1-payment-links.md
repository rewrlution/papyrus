# Phase 1: Payment Links Integration (MVP)

**Quick implementation for testing demand and early beta users**

## What We're Building

A minimal viable payment system that allows users to purchase premium AI features through Stripe Payment Links. Users run a CLI command that opens a Stripe-hosted payment page in their browser.

**Goal:** Enable purchases with minimal backend code (~30 minutes implementation)

**Best for:**
- Testing product-market fit
- MVP/beta launches
- Low purchase volume (<10/week)
- Quick validation before building full automation

**What problem does this solve?**
- Need to monetize AI features quickly
- Don't want to build complex payment infrastructure yet
- Want to validate demand before investing in full automation

**Expected outcome:**
- Users can purchase "Standup Pro" ($9 for 90 days unlimited access)
- Payment handled securely by Stripe
- Manual process to activate user accounts after purchase

---

## Architecture

```
┌─────────────────────────────┐
│  CLI Command                │
│  papyrus purchase standup-pro
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Open Browser               │
│  https://buy.stripe.com/... │  ← Payment Link (static URL)
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  User Completes Payment     │
│  (On Stripe's hosted page)  │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Payment Success            │
│  Redirect to success page   │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Manual Step (You)          │
│  1. Check Stripe Dashboard  │
│  2. Find customer email     │
│  3. Add purchase to DB      │
└─────────────────────────────┘
```

**Why this architecture:**
- **Minimal code**: No backend endpoints needed, just CLI command
- **Stripe hosts UI**: No payment form to build
- **Secure by default**: Stripe handles card data (PCI compliant)
- **Quick to test**: Can start selling in 5 minutes

**Trade-offs:**
- ❌ Manual activation required (not scalable beyond ~10 purchases/week)
- ❌ Purchase not auto-linked to user account
- ✅ Zero backend complexity
- ✅ Perfect for validation phase

---

## Prerequisites

**Required:**
- Stripe account (create at https://stripe.com - free)
- `open` npm package (for opening browser from CLI)
- Existing user authentication system

**Assumed knowledge:**
- Basic TypeScript
- Familiar with Papyrus CLI structure
- Understanding of Papyrus database schema (`ai_purchases` table)

**Before you start:**
- Read [Stripe Integration Overview](./README.md)
- Ensure `ai_purchases` table exists (migration `20260113055129_ai_usage_and_purchases`)
- Have Stripe test account ready

---

## Implementation

### Step 1: Create Payment Link in Stripe Dashboard

**Goal:** Create a static payment URL that users can visit to purchase

**Instructions:**

1. **Login to Stripe Dashboard**
   - Go to https://dashboard.stripe.com/test
   - Ensure you're in **Test Mode** (top right corner)

2. **Navigate to Payment Links**
   - Left sidebar → **Payment Links**
   - Click **"+ New"** button

3. **Configure Product**
   - **Product name**: `Standup Pro`
   - **Description**: `Unlimited AI standup notes for 90 days`
   - **Pricing model**: `Standard pricing`
   - **Price**: `$9.00`
   - **Billing period**: `One time`

4. **Configure Payment Link Settings**
   - **After payment**: `Redirect to page`
   - **Success URL**: `https://papyrus.yoursite.com/purchase/success`
   - **Cancel URL**: Leave blank (users can close the page)
   - **Collect customer email**: ✅ Enabled (important for linking purchases)
   - **Collect billing address**: Optional
   - **Allow promotion codes**: Optional

5. **Save and Copy Link**
   - Click **"Create link"**
   - Copy the payment link (e.g., `https://buy.stripe.com/test_abc123xyz`)
   - Save it - you'll need it for the CLI command

**Why this approach:**
- No code needed on backend
- Stripe handles entire payment flow
- Customer email is collected automatically
- Can update pricing/product details without code changes

**Screenshot of settings** (if creating documentation with images):
```
[Product Settings]
Name: Standup Pro
Price: $9.00 USD
Type: One-time

[After Payment]
Redirect to: https://papyrus.yoursite.com/purchase/success

[Collect Information]
☑ Email address
☐ Billing address
☐ Phone number
```

---

### Step 2: Create Simple Success Page (Optional)

**Goal:** Show a thank you message after successful payment

**Option A: Static HTML (Simplest)**

Create `packages/web/public/purchase-success.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purchase Successful - Papyrus</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      max-width: 500px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    h1 { font-size: 2.5em; margin-bottom: 20px; }
    p { font-size: 1.2em; line-height: 1.6; margin-bottom: 15px; }
    .emoji { font-size: 4em; margin-bottom: 20px; }
    .note {
      background: rgba(255, 255, 255, 0.2);
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="emoji">🎉</div>
    <h1>Purchase Successful!</h1>
    <p>Thank you for upgrading to <strong>Standup Pro</strong>!</p>
    <p>Your account will be activated within 24 hours.</p>
    <div class="note">
      <p><strong>Next Steps:</strong></p>
      <p>1. Check your email for a receipt<br>
      2. We'll activate your account shortly<br>
      3. Run <code>papyrus ai standup</code> to use unlimited AI standups</p>
    </div>
  </div>
</body>
</html>
```

**Option B: Simple Express Route**

If you have a web server running:

```typescript
// packages/api/src/routes/purchase.routes.ts
import express, { Router } from 'express';

const router: Router = express.Router();

router.get('/purchase/success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Purchase Successful</title>
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>🎉 Purchase Successful!</h1>
        <p>Thank you for purchasing Standup Pro!</p>
        <p>Your account will be activated within 24 hours.</p>
        <p>You'll receive a confirmation email shortly.</p>
      </body>
    </html>
  `);
});

export { router as purchaseRoutes };
```

**Why a success page:**
- Provides clear feedback to users
- Sets expectations for activation time
- Professional user experience

**For MVP:** Even a simple HTML page is sufficient. Focus on functionality over design.

---

### Step 3: Create CLI Purchase Command

**Goal:** Allow users to run `papyrus purchase standup-pro` to open payment page

**File:** `packages/cli/src/commands/purchase/index.ts`

```typescript
// packages/cli/src/commands/purchase/index.ts
// This command opens Stripe Payment Links in the browser
// Run: papyrus purchase standup-pro

import { Command } from 'commander';
import open from 'open';
import chalk from 'chalk';

// Phase 1: Static Payment Links (created in Stripe Dashboard)
const PAYMENT_LINKS: Record<string, string> = {
  'standup-pro': 'https://buy.stripe.com/test_REPLACE_WITH_YOUR_LINK',
  // Add more products here as you create them
  // 'promotion-builder': 'https://buy.stripe.com/test_...',
};

export const purchaseCommand = new Command('purchase')
  .description('Purchase premium AI features')
  .argument('<product>', 'Product to purchase (standup-pro, promotion-builder, etc.)')
  .action(async (product: string) => {
    try {
      // Validate product
      const paymentUrl = PAYMENT_LINKS[product];

      if (!paymentUrl) {
        console.error(chalk.red(`❌ Unknown product: ${product}`));
        console.log('\nAvailable products:');
        Object.keys(PAYMENT_LINKS).forEach(p => {
          console.log(`  - ${p}`);
        });
        process.exit(1);
      }

      // Show purchase info
      console.log(chalk.cyan('\n🚀 Opening payment page in your browser...\n'));

      if (product === 'standup-pro') {
        console.log(chalk.white('Product: ') + chalk.bold('Standup Pro'));
        console.log(chalk.white('Price: ') + chalk.green('$9.00 USD'));
        console.log(chalk.white('Duration: ') + chalk.yellow('90 days'));
        console.log(chalk.white('Benefit: ') + 'Unlimited AI standup generations');
      }

      console.log(chalk.dim('\nIf the browser doesn\'t open automatically, visit:'));
      console.log(chalk.blue(paymentUrl));
      console.log();

      // Open browser
      try {
        await open(paymentUrl);
        console.log(chalk.green('✓ Browser opened'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Unable to open browser automatically'));
        console.log(chalk.white('\nPlease visit this URL to complete your purchase:'));
        console.log(chalk.blue(paymentUrl));
      }

      // Show post-purchase instructions
      console.log(chalk.dim('\n─────────────────────────────────────'));
      console.log(chalk.white('\nAfter completing your purchase:'));
      console.log(chalk.dim('1. Your account will be activated within 24 hours'));
      console.log(chalk.dim('2. You\'ll receive a confirmation email'));
      console.log(chalk.dim('3. Run "papyrus ai standup" to use unlimited AI standups'));
      console.log();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });
```

**Why this approach:**
- Simple mapping of product IDs to Payment Links
- Clear user feedback and instructions
- Graceful fallback if browser doesn't open
- Easy to add more products (just add to `PAYMENT_LINKS` object)

**Testing the command:**
```bash
cd packages/cli
pnpm build
node dist/cli.js purchase standup-pro

# Output:
# 🚀 Opening payment page in your browser...
#
# Product: Standup Pro
# Price: $9.00 USD
# Duration: 90 days
# Benefit: Unlimited AI standup generations
#
# ✓ Browser opened
```

---

### Step 4: Register Purchase Command

**Goal:** Make `papyrus purchase` available as a CLI command

**File:** `packages/cli/src/commands/index.ts`

```typescript
// packages/cli/src/commands/index.ts
import { Command } from 'commander';
import { authCommand } from './auth/index.js';
import { journalCommand } from './journal/index.js';
import { purchaseCommand } from './purchase/index.js'; // Add this

export function registerCommands(program: Command): void {
  program.addCommand(authCommand);
  program.addCommand(journalCommand);
  program.addCommand(purchaseCommand); // Add this
}
```

**Why register at this level:**
- Follows existing command structure (`auth`, `journal`, `purchase`)
- Consistent with project patterns
- Easy to discover and maintain

---

### Step 5: Update Package Dependencies

**Goal:** Ensure `open` package is installed

**File:** `packages/cli/package.json`

Check if `open` is already listed in dependencies. If not, add it:

```bash
cd packages/cli
pnpm add open
```

**Why we need `open`:**
- Cross-platform way to open URLs in default browser
- Works on macOS, Linux, and Windows
- Fallback option if browser doesn't open automatically

---

### Step 6: Test the Purchase Flow

**Goal:** Verify the entire flow works end-to-end

**Test steps:**

1. **Build the CLI**
   ```bash
   cd packages/cli
   pnpm build
   ```

2. **Run purchase command**
   ```bash
   node dist/cli.js purchase standup-pro
   ```

3. **Verify browser opens**
   - Should open to Stripe Payment Link
   - Should show "Standup Pro" product
   - Should show $9.00 price

4. **Complete test payment**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - Email: Your test email
   - Click "Pay"

5. **Verify success redirect**
   - Should redirect to success page
   - Should see confirmation message

6. **Check Stripe Dashboard**
   - Go to https://dashboard.stripe.com/test/payments
   - Should see successful payment
   - Note the customer email

**Expected results:**
- ✅ CLI command opens browser
- ✅ Payment page loads correctly
- ✅ Test payment succeeds
- ✅ Success page displays
- ✅ Payment appears in Stripe Dashboard

---

### Step 7: Manual Purchase Activation

**Goal:** Grant premium access to paying users

Since this is Phase 1 (manual process), you need to:

1. **Check Stripe Dashboard for new payments**
   - Go to https://dashboard.stripe.com/test/payments
   - Look for successful payments

2. **Find customer email**
   - Click on payment
   - Note the customer email address

3. **Look up user in your database**
   ```sql
   SELECT id, email FROM users WHERE email = 'customer@example.com';
   ```

4. **Create purchase record**
   ```sql
   INSERT INTO ai_purchases (
     id,
     user_id,
     product,
     purchased_at,
     expires_at,
     generation_limit,
     generation_used,
     amount,
     currency
   ) VALUES (
     'cuid_placeholder_replace_with_actual_cuid',
     'user_id_from_step_3',
     'standup-pro',
     NOW(),
     NOW() + INTERVAL '90 days',
     NULL,  -- NULL means unlimited
     0,
     900,   -- $9.00 in cents
     'usd'
   );
   ```

5. **Send confirmation email to user** (optional but recommended)
   - "Your Standup Pro access is now active!"
   - "Run `papyrus ai standup` to generate unlimited standup notes"

**Why manual process is OK for Phase 1:**
- Allows you to validate demand quickly
- Gives you direct contact with early customers (valuable feedback!)
- Simple to implement and test
- Can be automated later (Phase 2)

**Time per activation:** ~2 minutes

**Sustainable up to:** ~10 purchases per week

---

## Testing

### Test Checklist

- [ ] CLI command runs without errors
- [ ] Browser opens automatically
- [ ] Payment Link loads correctly
- [ ] Test card payment succeeds
- [ ] Success page displays
- [ ] Payment appears in Stripe Dashboard
- [ ] Can find customer email in Stripe
- [ ] Purchase record created in database
- [ ] User can now use premium features

### Test Cards

Use these Stripe test cards:

| Card Number         | Scenario           |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined      |
| 4000 0000 0000 9995 | Insufficient funds |

**All test cards:**
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits (if required)

### Manual Test Script

```bash
# 1. Build CLI
cd packages/cli
pnpm build

# 2. Run purchase command
node dist/cli.js purchase standup-pro

# Expected: Browser opens to Stripe Payment Link

# 3. Complete payment with test card
# Card: 4242 4242 4242 4242
# Expiry: 12/34
# CVC: 123
# Email: test@example.com

# Expected: Success page displays

# 4. Check Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/payments
# Expected: See successful payment from test@example.com

# 5. Activate user account (manual)
# - Find user ID in database
# - Create ai_purchases record
# - User can now use unlimited AI standups
```

---

## Common Issues

### Issue: Browser doesn't open automatically

**Symptoms:**
```
⚠ Unable to open browser automatically
```

**Causes:**
- Running in SSH session (no display)
- `open` package not installed
- Permissions issue on Linux

**Solution:**
The CLI already handles this gracefully:
```
Please visit this URL to complete your purchase:
https://buy.stripe.com/test_...
```

User can manually copy-paste the URL into their browser.

---

### Issue: Payment Link shows "Invalid link"

**Symptoms:**
- Stripe shows "This payment link is no longer active"

**Causes:**
1. Payment Link was deleted in Stripe Dashboard
2. Using live mode link in test mode (or vice versa)
3. Typo in the URL

**Solution:**
1. Verify Payment Link exists in Stripe Dashboard
2. Ensure you're in Test Mode
3. Copy the Payment Link URL carefully
4. Update `PAYMENT_LINKS` in CLI code

---

### Issue: Cannot find customer after payment

**Symptoms:**
- Payment succeeded in Stripe
- Customer email not visible in Stripe Dashboard

**Causes:**
- "Collect customer email" was not enabled in Payment Link settings

**Solution:**
1. Edit Payment Link in Stripe Dashboard
2. Enable "Collect customer information" → "Email address"
3. Save changes
4. Test with new payment

---

### Issue: User reports premium features not working

**Symptoms:**
- User paid successfully
- Still getting "usage limit exceeded" error

**Causes:**
- Purchase record not created in database
- `expires_at` date is in the past
- Wrong `product` value in database

**Solution:**
1. Check `ai_purchases` table:
   ```sql
   SELECT * FROM ai_purchases WHERE user_id = 'user_id_here';
   ```
2. Verify record exists and is not expired
3. Check `product` matches exactly (e.g., `standup-pro` not `standuppro`)
4. Verify `expires_at` is in the future

---

## Enhancements (Optional)

### 1. Add More Products

Add additional products to the Payment Links:

```typescript
const PAYMENT_LINKS: Record<string, string> = {
  'standup-pro': 'https://buy.stripe.com/test_...',
  'promotion-builder': 'https://buy.stripe.com/test_...',
  'resume-refresh': 'https://buy.stripe.com/test_...',
};
```

### 2. Add Product Info Command

Let users see product details before purchasing:

```typescript
export const purchaseCommand = new Command('purchase')
  .description('Purchase premium AI features')
  .option('-l, --list', 'List available products')
  .argument('[product]', 'Product to purchase')
  .action(async (product?: string, options?: { list?: boolean }) => {
    if (options?.list) {
      console.log('Available Products:\n');
      console.log('standup-pro - $9.00');
      console.log('  Unlimited AI standup notes for 90 days');
      console.log();
      console.log('promotion-builder - $29.00');
      console.log('  AI-powered promotion document generator');
      return;
    }
    // ... rest of purchase logic
  });
```

### 3. Add Purchase History Command

Let users see their purchase history:

```bash
papyrus purchase history
```

This would require a backend endpoint to fetch purchases from the database.

### 4. Automate Activation Email

Instead of manually emailing users, set up an automation:
- Use Stripe's email receipts
- Add custom message to receipt
- Or send email via your backend when activating

---

## Next Steps

### When to Move to Phase 2

Consider implementing [Phase 2: Checkout Sessions](./02-phase2-checkout-sessions.md) when:

- ✅ You're getting >10 purchases per week (manual activation becomes tedious)
- ✅ Users request faster activation times
- ✅ You want to scale without manual intervention
- ✅ You need better analytics and tracking

### Preparing for Phase 2

While using Phase 1, collect data to inform Phase 2:

- Track activation times (how long does manual process take?)
- Collect user feedback (is 24-hour activation acceptable?)
- Monitor purchase patterns (which products sell best?)
- Document edge cases (any issues with manual process?)

### Going to Production (Live Mode)

When ready to accept real payments:

1. **Complete Stripe verification**
   - Provide business/individual information
   - Add bank account for payouts
   - Submit tax forms (if required)

2. **Switch to live mode**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy **live mode** API keys
   - Create new Payment Link in **live mode**

3. **Update CLI**
   - Replace Payment Link URLs with live mode links
   - Test with real card (small amount)

4. **Update success page**
   - Use production URL (not localhost)

5. **Monitor closely**
   - Watch Stripe Dashboard for real payments
   - Respond quickly to customer emails
   - Activate accounts within promised timeframe

---

## Checklist

Before launching Phase 1:

- [ ] Stripe account created and verified
- [ ] Payment Link created for Standup Pro ($9.00)
- [ ] Payment Link collects customer email
- [ ] Success page created and accessible
- [ ] CLI purchase command implemented
- [ ] `open` package installed
- [ ] Tested full flow with test card
- [ ] Documented manual activation process
- [ ] Ready to respond to customer emails within 24 hours
- [ ] Prepared to track metrics (purchases, activation times, user feedback)

---

## Summary

**Phase 1 gives you:**
- ✅ Quick implementation (~30 minutes)
- ✅ Minimal backend code (just CLI)
- ✅ Secure payments (Stripe handles everything)
- ✅ Ability to validate demand
- ✅ Direct customer contact (valuable for early feedback)

**Phase 1 limitations:**
- ❌ Manual activation required (not scalable beyond ~10/week)
- ❌ 24-hour activation time
- ❌ More work for you per purchase

**Perfect for:**
- MVP launches
- Beta testing
- Validating product-market fit
- Low-volume sales (<10/week)

**When to upgrade:**
Once you've validated demand and manual activation becomes tedious, move to [Phase 2: Checkout Sessions](./02-phase2-checkout-sessions.md) for full automation.

---

## Resources

**Stripe Documentation:**
- [Payment Links Guide](https://docs.stripe.com/payment-links)
- [Test Cards](https://docs.stripe.com/testing#cards)
- [Stripe Dashboard](https://dashboard.stripe.com/test)

**Papyrus Documentation:**
- [Stripe Integration Overview](./README.md)
- [Database Schema](../../prisma/schema.prisma)
- [AI Usage Limiter](../ai/standup/architecture.md#usage-limits--monetization)

**Next Tutorial:**
- [Phase 2: Checkout Sessions (Production)](./02-phase2-checkout-sessions.md)
