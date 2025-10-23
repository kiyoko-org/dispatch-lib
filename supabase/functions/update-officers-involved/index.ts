import { createClient } from 'npm:@supabase/supabase-js@2'

interface Report {
  id: number
  status: string
  officers_involved: string[] | null
}

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: Report
  old_record: Report
  schema: 'public'
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()

  if (payload.record.status !== 'resolved' || payload.old_record.status === 'resolved') {
    return new Response(
      JSON.stringify({ message: 'Status not changed to resolved, skipping' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { data: officers, error: officersError } = await supabase
    .from('officers')
    .select('id')
    .eq('assigned_report_id', payload.record.id)

  if (officersError) {
    console.error('Error fetching assigned officers:', officersError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch assigned officers' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!officers || officers.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No officers assigned to this report' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const officerIds = officers.map(officer => officer.id)

  const { error: updateError } = await supabase
    .from('reports')
    .update({ officers_involved: officerIds })
    .eq('id', payload.record.id)

  if (updateError) {
    console.error('Error updating officers_involved:', updateError)
    return new Response(
      JSON.stringify({ error: 'Failed to update officers_involved' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      message: 'Successfully updated officers_involved',
      officer_ids: officerIds 
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
