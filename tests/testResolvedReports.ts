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

async function testResolvedReports() {
	const officerId = "8a27a6a3-7431-4dc3-a64f-4ce587ad1de6"
	
	console.log(`Testing getResolvedReports for officer: ${officerId}...`)
	const result = await client.getResolvedReports(officerId)

	if (result.error) {
		console.error("Error fetching resolved reports:", result.error)
		return
	}

	console.log("Resolved Reports Result:", result.data)
	console.log(`Total resolved reports: ${result.data?.length || 0}`)
}

testResolvedReports()
