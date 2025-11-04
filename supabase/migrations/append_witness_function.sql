CREATE OR REPLACE FUNCTION public.append_witness(report_id int, new_witness jsonb)
RETURNS SETOF public.reports
AS $$
  UPDATE public.reports
  SET witnesses = COALESCE(witnesses, '[]'::jsonb) || jsonb_build_array(new_witness)
  WHERE id = report_id
  RETURNING *;
$$ LANGUAGE sql;