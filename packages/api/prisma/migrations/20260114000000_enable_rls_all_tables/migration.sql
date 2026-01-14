-- Enable Row Level Security on all tables
-- These tables should only be accessed by the backend (service_role key)
-- No policies are created, meaning only service_role can access them via Supabase

-- users: User accounts and authentication data
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- journals: Encrypted journal entries
ALTER TABLE "journals" ENABLE ROW LEVEL SECURITY;

-- ai_usage: Tracks AI feature usage per user per month
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;

-- ai_trial_usage: Tracks lifetime trial usage per user
ALTER TABLE "ai_trial_usage" ENABLE ROW LEVEL SECURITY;

-- ai_purchases: Tracks premium purchases
ALTER TABLE "ai_purchases" ENABLE ROW LEVEL SECURITY;

-- Note: Without any policies, these tables are inaccessible via PostgREST (anon/authenticated keys)
-- Only the service_role key (used by the backend) can bypass RLS
-- This is intentional for security - all data should only be accessed/modified by the API server
