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

async function testUpdateReport() {
	try {
		// First fetch reports to get a valid report id
		const { data: reports, error: fetchError } = await client.fetchReports()
		if (fetchError) {
			console.error("Error fetching reports:", fetchError)
			return
		}

		if (!reports || reports.length === 0) {
			console.log("No reports found to update")
			return
		}

		const reportId = reports[0].id
		console.log("Updating report with id:", reportId)

		// Update the report with a new status
		const { data: updatedReport, error: updateError } = await client.updateReport(reportId, {
			status: "cancelled",
			incident_title: "Updated incident title"
		})

		if (updateError) {
			console.error("Error updating report:", updateError)
		} else {
			console.log("Report updated successfully:", updatedReport)
		}
	} catch (error) {
		console.error("Test failed:", error)
	}
}

testUpdateReport()
