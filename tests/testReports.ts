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

async function testReports() {
  console.log("Testing addReport...")
  const addResult = await client.addReport({
    latitude: 14.5995,
    longitude: 120.9842,
    incident_title: "Test Incident",
    what_happened: "This is a test report",
    status: "pending",
  })
  
  console.log("Add Report Result:", addResult)
  
  console.log("\nTesting fetchReports...")
  const fetchResult = await client.fetchReports()
  
  console.log("Fetch Reports Result:", fetchResult)
}

testReports()
