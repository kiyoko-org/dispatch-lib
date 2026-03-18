CREATE OR REPLACE VIEW public.incident_reports_with_trust
WITH (security_invoker = true) AS
SELECT
  r.*,
  COALESCE(p.trust_score, 0)::smallint AS reporter_trust_score
FROM public.reports r
LEFT JOIN public.profiles p ON p.id = r.reporter_id;

GRANT SELECT ON public.incident_reports_with_trust TO authenticated;
GRANT SELECT ON public.incident_reports_with_trust TO service_role;
