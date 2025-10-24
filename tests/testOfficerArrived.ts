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

async function testOfficerArrived() {
	try {

		const { data: reports, error: fetchError } = await client.fetchReports()
		if (fetchError) {
			console.error("Error fetching reports:", fetchError)
			return
		}

		if (!reports || reports.length === 0) {
			console.log("No reports found to mark as arrived")
			return
		}

		const targetReport = reports.find(report => !report.arrived_at)

		if (!targetReport) {
			console.log("All reports already have an arrival timestamp")
			return
		}

		console.log("Marking officer arrival for report id:", targetReport.id)

		const { data, error } = await client.officerArrived(73)

		if (error) {
			console.error("Error recording officer arrival:", error)
		} else {
			console.log("Officer arrival recorded successfully:", data)
		}
	} catch (error) {
		console.error("Test failed:", error)
	}
}

testOfficerArrived()
