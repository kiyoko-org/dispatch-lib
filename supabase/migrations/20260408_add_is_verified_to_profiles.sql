-- Add is_verified column to profiles table for identity verification
-- This tracks whether a user has verified their identity through:
-- - National ID (automated verification)
-- - Manual document upload (admin approval)
-- 
-- Values:
-- - true: User is verified (can access gated features)
-- - false: User is not verified (new signups, blocked from gated features)
-- - null: Existing users before migration OR admin/officer accounts (handled separately)

-- Add the column
ALTER TABLE public.profiles 
ADD COLUMN is_verified BOOLEAN DEFAULT NULL;

-- Set default for new user signups (will be overridden by trigger)
-- New regular users get false, admins/existing users stay null

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_verified IS 'Identity verification status: true=verified, false=unverified, null=grandfathered/admin';

-- Optional: Create index for faster queries on verification status
CREATE INDEX idx_profiles_is_verified ON public.profiles(is_verified) WHERE is_verified IS NOT NULL;
