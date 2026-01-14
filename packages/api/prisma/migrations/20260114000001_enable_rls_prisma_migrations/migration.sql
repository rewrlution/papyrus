-- Enable Row Level Security on Prisma's internal migration tracking table
-- This table is automatically created by Prisma to track applied migrations
-- It should not be accessible via PostgREST (Supabase client)

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Note: Prisma uses direct database connections, not PostgREST,
-- so this won't affect migration operations
