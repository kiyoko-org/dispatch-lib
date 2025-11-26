-- Add false_report column to reports table (non-nullable with default)
-- This column indicates whether a report has been marked as a false report
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS false_report BOOLEAN NOT NULL DEFAULT false;
