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

-- 4. Add false_report to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS false_report boolean DEFAULT false;

COMMENT ON COLUMN public.reports.false_report IS 'Indicates if the report was determined to be false/fake, affecting the reporter trust score';

-- 5. Backfill existing users (Optional but good practice)
-- Ensures all current users have the default score if the column addition didn't catch them
UPDATE public.profiles SET trust_score = 3 WHERE trust_score IS NULL;

-- 6. Automated Scoring System (Phase 4)
-- Create function to recalculate trust score
CREATE OR REPLACE FUNCTION public.recalculate_user_trust_score(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_reports integer;
  v_verified_reports integer;
  v_false_reports integer;
  v_cancelled_reports integer;
  v_avg_response_time numeric;
  v_total_points integer := 0;
  v_new_score smallint := 3;
BEGIN
  -- Aggregate metrics from reports table
  SELECT 
    count(*),
    count(*) FILTER (WHERE status = 'resolved'),
    count(*) FILTER (WHERE false_report = true),
    count(*) FILTER (WHERE status = 'cancelled')
  INTO 
    v_total_reports,
    v_verified_reports,
    v_false_reports,
    v_cancelled_reports
  FROM public.reports
  WHERE reporter_id = user_uuid;

  -- Calculate Base Score: +5 points per report (max 25)
  v_total_points := LEAST(v_total_reports * 5, 25);
  
  -- Verified Bonus: +10 points each
  v_total_points := v_total_points + (v_verified_reports * 10);
  
  -- False Penalty: -20 points each
  v_total_points := v_total_points - (v_false_reports * 20);
  
  -- Cancelled Penalty: -5 points each
  v_total_points := v_total_points - (v_cancelled_reports * 5);

  -- Map points to levels (0-3)
  -- 75+ -> 3 (Highly Trusted)
  -- 50+ -> 2 (Trusted)
  -- 25+ -> 1 (Low Trust)
  -- <25 -> 0 (Untrusted)
  IF v_total_points >= 75 THEN
    v_new_score := 3;
  ELSIF v_total_points >= 50 THEN
    v_new_score := 2;
  ELSIF v_total_points >= 25 THEN
    v_new_score := 1;
  ELSE
    v_new_score := 0;
  END IF;

  -- Update profile with new score and factors
  UPDATE public.profiles
  SET 
    trust_score = v_new_score,
    trust_factors = jsonb_build_object(
      'total_reports', v_total_reports,
      'verified_reports', v_verified_reports,
      'false_reports', v_false_reports,
      'cancelled_reports', v_cancelled_reports,
      'calculated_at', now()
    ),
    updated_at = now()
  WHERE id = user_uuid;
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.on_report_update_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if status or false_report changed
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.false_report IS DISTINCT FROM NEW.false_report) THEN
      PERFORM public.recalculate_user_trust_score(NEW.reporter_id);
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM public.recalculate_user_trust_score(NEW.reporter_id);
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.recalculate_user_trust_score(OLD.reporter_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to reports table
DROP TRIGGER IF EXISTS trigger_recalculate_trust_score ON public.reports;
CREATE TRIGGER trigger_recalculate_trust_score
AFTER INSERT OR UPDATE OR DELETE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.on_report_update_trust_score();
