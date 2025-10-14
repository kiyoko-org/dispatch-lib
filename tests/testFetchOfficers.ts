import { initDispatchClient } from "../index"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const client = initDispatchClient({
  supabaseClientConfig: {
    url: supabaseUrl,
    anonymousKey: supabaseKey,
    detectSessionInUrl: true,
  },
})

client.fetchOfficers().then(console.log)

client.archiveReport(40).then(console.log)