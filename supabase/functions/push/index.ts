import { createClient } from 'npm:@supabase/supabase-js@2'
import { JWT } from 'npm:google-auth-library@9'
import serviceAccount from '../service-account.json' with { type: 'json' }

interface Notification {
  id: string
  user_id: string
	title: string
  body: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: Notification
  schema: 'public'
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()

  const { data: officerData, error: officerError } = await supabase
    .from('officers')
    .select('fcm_token')
    .eq('id', payload.record.user_id)
    .maybeSingle()

  if (officerError) {
    console.error('Supabase officers lookup error:', officerError)
  }

  let fcmToken = officerData?.fcm_token as string | undefined

  if (!fcmToken) {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', payload.record.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Supabase profiles lookup error:', profileError)
    }

    fcmToken = profileData?.fcm_token as string | undefined
  }

  if (!fcmToken) {
    return new Response(
      JSON.stringify({ error: 'FCM token not found for user' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const accessToken = await getAccessToken({
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
  })

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {
            title: payload.record.title,
            body: payload.record.body,
          },
        },
      }),
    }
  )

  const resData = await res.json()
  if (res.status < 200 || 299 < res.status) {
    throw resData
  }

  return new Response(JSON.stringify(resData), {
    headers: { 'Content-Type': 'application/json' },
  })
})

const getAccessToken = ({
  clientEmail,
  privateKey,
}: {
  clientEmail: string
  privateKey: string
}): Promise<string> => {
  return new Promise((resolve, reject) => {
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    jwtClient.authorize((err, tokens) => {
      if (err) {
        reject(err)
        return
      }
      resolve(tokens!.access_token!)
    })
  })
}
