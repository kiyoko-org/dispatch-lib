-- RPC function to get resolved reports for an officer
-- This function returns all resolved reports where the officer's ID is in the officers_involved array
CREATE OR REPLACE FUNCTION get_resolved_reports(officer_id_param UUID)
RETURNS TABLE(
  id BIGINT,
  created_at TIMESTAMPTZ,
  category_id SMALLINT,
  incident_title TEXT,
  what_happened TEXT,
  status TEXT,
  reporter_id UUID,
  officers_involved UUID[],
  latitude FLOAT8,
  longitude FLOAT8,
  resolved_at DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.created_at,
    r.category_id,
    r.incident_title,
    r.what_happened,
    r.status,
    r.reporter_id,
    r.officers_involved,
    r.latitude,
    r.longitude,
    r.resolved_at
  FROM public.reports r
  WHERE r.status = 'resolved'
  AND officer_id_param = ANY(r.officers_involved);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_resolved_reports(UUID) TO authenticated;
