/*
# Create core application schema

## Overview
Sets up the three core tables for the AI video enhancement app: user profiles,
video processing jobs, and payment records. Includes Row Level Security policies
scoped to the authenticated owner, plus a trigger that auto-creates a
users_profiles row whenever a new auth user registers.

## New Tables

### users_profiles
- `id` (uuid, primary key, FK to auth.users) — one row per auth user
- `email` (text) — cached email for display
- `plan` (text) — subscription tier: free | weekly | monthly | yearly (default free)
- `coins_balance` (float8) — virtual coin balance (default 2.50)
- `coins_last_reset` (timestamptz) — last time coins were reset
- `subscription_expires_at` (timestamptz) — when the current subscription ends
- `created_at` (timestamptz) — row creation time

### video_jobs
- `id` (uuid, primary key)
- `user_id` (uuid, FK to auth.users, default auth.uid()) — owner of the job
- `filename` (text) — original uploaded file name
- `status` (text) — queued | processing | completed | failed (default queued)
- `filters_used` (jsonb) — array of filter names applied
- `coins_spent` (float8) — coins consumed by this job
- `output_url` (text) — URL to the processed result
- `started_at` (timestamptz) — when processing began
- `completed_at` (timestamptz) — when processing finished

### payments
- `id` (uuid, primary key)
- `user_id` (uuid, FK to auth.users, default auth.uid()) — owner of the payment
- `plan` (text) — plan purchased
- `amount` (float8) — payment amount
- `method` (text) — paypal | visa | mastercard | google_play
- `coins_added` (float8) — coins credited from this payment
- `status` (text) — pending | success | failed (default pending)
- `created_at` (timestamptz) — payment record creation time

## Security
- RLS enabled on all three tables.
- Owner-scoped CRUD policies (select/insert/update/delete) for authenticated users
  using auth.uid() = user_id.
- user_id columns on video_jobs and payments default to auth.uid() so inserts
  that omit user_id still satisfy the WITH CHECK policy.

## Automation
- `handle_new_user()` trigger function inserts a users_profiles row when a new
  auth.users row is created, seeding email, plan=free, coins_balance=2.50.
- Trigger `on_auth_user_created` fires AFTER INSERT on auth.users.
*/

-- ============ users_profiles ============
CREATE TABLE IF NOT EXISTS users_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','weekly','monthly','yearly')),
  coins_balance float8 NOT NULL DEFAULT 2.50,
  coins_last_reset timestamptz DEFAULT now(),
  subscription_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON users_profiles;
CREATE POLICY "select_own_profile" ON users_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON users_profiles;
CREATE POLICY "insert_own_profile" ON users_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON users_profiles;
CREATE POLICY "update_own_profile" ON users_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON users_profiles;
CREATE POLICY "delete_own_profile" ON users_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ video_jobs ============
CREATE TABLE IF NOT EXISTS video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  filters_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  coins_spent float8 NOT NULL DEFAULT 0,
  output_url text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE video_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_jobs" ON video_jobs;
CREATE POLICY "select_own_jobs" ON video_jobs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_jobs" ON video_jobs;
CREATE POLICY "insert_own_jobs" ON video_jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_jobs" ON video_jobs;
CREATE POLICY "update_own_jobs" ON video_jobs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_jobs" ON video_jobs;
CREATE POLICY "delete_own_jobs" ON video_jobs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ payments ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount float8 NOT NULL DEFAULT 0,
  method text NOT NULL CHECK (method IN ('paypal','visa','mastercard','google_play')),
  coins_added float8 NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_payments" ON payments;
CREATE POLICY "delete_own_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- ============ Auto-create profile trigger ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();