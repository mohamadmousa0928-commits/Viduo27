/*
# Extend video_jobs for Replicate processing pipeline

## Overview
Adds columns to the `video_jobs` table to support the full Replicate video
enhancement lifecycle: storing the Replicate prediction ID, input/output
storage paths, file size, error messages, and estimated queue times. Also
adds an RPC function `reset_free_coins` that tops up free users to 2.50 coins
if 24 hours have passed since their last reset.

## Modified Tables

### video_jobs (new columns)
- `replicate_id` (text) — Replicate prediction ID for polling status
- `input_storage_path` (text) — Supabase Storage path for the uploaded source video
- `output_storage_path` (text) — Supabase Storage path for the enhanced result
- `file_size_bytes` (bigint) — uploaded file size in bytes
- `error_message` (text) — failure reason if status = 'failed'
- `estimated_wait_seconds` (integer) — estimated queue wait at creation time

## New Functions

### reset_free_coins()
- SECURITY DEFINER function that resets free-plan users' coin balance to 2.50
  if their `coins_last_reset` is more than 24 hours ago.
- Called by the daily scheduled edge function `reset-coins`.
- Returns the number of users reset.

## Security
- No new RLS policies needed — existing owner-scoped policies cover new columns.
- The `reset_free_coins` function is SECURITY DEFINER so it can update
  users_profiles on behalf of the scheduler (service role bypasses RLS).
*/

-- ============ Add columns to video_jobs ============
DO $$ BEGIN
  ALTER TABLE video_jobs ADD COLUMN replicate_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE video_jobs ADD COLUMN input_storage_path text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE video_jobs ADD COLUMN output_storage_path text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE video_jobs ADD COLUMN file_size_bytes bigint;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE video_jobs ADD COLUMN error_message text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE video_jobs ADD COLUMN estimated_wait_seconds integer;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============ reset_free_coins RPC ============
CREATE OR REPLACE FUNCTION public.reset_free_coins()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  reset_count integer;
BEGIN
  UPDATE public.users_profiles
  SET coins_balance = 2.50,
      coins_last_reset = now()
  WHERE plan = 'free'
    AND (coins_last_reset IS NULL OR now() - coins_last_reset >= interval '24 hours');

  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RETURN reset_count;
END;
$$;