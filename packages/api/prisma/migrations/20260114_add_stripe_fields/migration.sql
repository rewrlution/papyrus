-- Add Stripe-specific fields to ai_purchases table
ALTER TABLE "ai_purchases" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
ALTER TABLE "ai_purchases" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" TEXT;
ALTER TABLE "ai_purchases" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" TEXT;
ALTER TABLE "ai_purchases" ADD COLUMN IF NOT EXISTS "payment_status" TEXT;

-- Add unique constraints
ALTER TABLE "ai_purchases" ADD CONSTRAINT "ai_purchases_stripe_payment_intent_id_key" UNIQUE ("stripe_payment_intent_id");
ALTER TABLE "ai_purchases" ADD CONSTRAINT "ai_purchases_stripe_checkout_session_id_key" UNIQUE ("stripe_checkout_session_id");

-- Add index for Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS "ai_purchases_stripe_customer_id_idx" ON "ai_purchases"("stripe_customer_id");

-- Comment on payment_status field
COMMENT ON COLUMN "ai_purchases"."payment_status" IS 'Payment status: pending, succeeded, failed, or canceled';
