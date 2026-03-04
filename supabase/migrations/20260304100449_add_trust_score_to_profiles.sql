-- Add trust_score and trust_factors to profiles table
-- Implementation of Phase 1.1 of the TRUST_SCORE_IMPLEMENTATION_PLAN.md

-- 1. Add trust_score column (0-3 scale)
-- Default is 3 (Highly Trusted) as per current mobile app logic
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trust_score smallint DEFAULT 3 
CHECK (trust_score >= 0 AND trust_score <= 3);

-- 2. Add trust_factors JSONB for breakdown
-- Stores data like total_reports, verified_reports, false_reports, etc.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trust_factors jsonb DEFAULT '{
  "total_reports": 0,
  "verified_reports": 0,
  "false_reports": 0,
  "cancelled_reports": 0,
  "avg_response_time_minutes": null
}'::jsonb;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.profiles.trust_score IS 'User trust level: 0 (Untrusted) to 3 (Highly Trusted)';
COMMENT ON COLUMN public.profiles.trust_factors IS 'Breakdown of factors contributing to the trust score calculation';

-- 4. Backfill existing users (Optional but good practice)
-- Ensures all current users have the default score if the column addition didn't catch them
UPDATE public.profiles SET trust_score = 3 WHERE trust_score IS NULL;
