-- 1. Drop the automated scoring engine
DROP TRIGGER IF EXISTS trigger_recalculate_trust_score ON public.reports;
DROP FUNCTION IF EXISTS public.on_report_update_trust_score();
DROP FUNCTION IF EXISTS public.recalculate_user_trust_score(UUID);

-- 2. Update profiles table: remove trust_factors and reset trust_score
ALTER TABLE public.profiles DROP COLUMN IF EXISTS trust_factors;

-- Update trust_score: change default to 0 and reset all scores to 0
ALTER TABLE public.profiles ALTER COLUMN trust_score SET DEFAULT 0;
UPDATE public.profiles SET trust_score = 0;

-- 3. Update reports table: replace false_report with cancellation_reason
ALTER TABLE public.reports DROP COLUMN IF EXISTS false_report;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS cancellation_reason text;

COMMENT ON COLUMN public.reports.cancellation_reason IS 'The reason for cancelling a report (e.g., Prank Call, Duplicate)';
