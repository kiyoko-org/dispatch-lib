import { initDispatchClient } from "../index"
import * as dotenv from "dotenv"

dotenv.config()

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
	},
})

const TEST_USER_ID = "c563ee88-34c5-486c-92f1-7c300dffbb76"

async function testTrustScore() {
	console.log(`--- Testing Trust Score for User: ${TEST_USER_ID} ---`)

	// 1. Initial State
	const { data: initialProfile } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()

	console.log("Initial Trust Score:", initialProfile?.trust_score)
	console.log("Initial Trust Factors:", initialProfile?.trust_factors)

	// 2. Add a report
	console.log("\nAdding a new report...")
	const { data: report, error: reportError } = await client.addReport({
		reporter_id: TEST_USER_ID,
		latitude: 14.5995,
		longitude: 120.9842,
		incident_title: "Trust Score Test Report",
		what_happened: "Testing the automated trust score system",
		status: "pending",
	})

	if (reportError) {
		console.error("Error adding report:", reportError)
		return
	}

	const reportId = report[0].id
	console.log("Report added with ID:", reportId)

	// Wait for trigger to run
	await new Promise(resolve => setTimeout(resolve, 1000))

	const { data: profileAfterAdd } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()

	console.log("Trust Score after adding report:", profileAfterAdd?.trust_score)
	console.log("Trust Factors after adding report:", profileAfterAdd?.trust_factors)

	// 3. Mark as resolved
	console.log("\nMarking report as resolved...")
	await client.updateReport(reportId, { status: "resolved" })
	
	// Wait for trigger
	await new Promise(resolve => setTimeout(resolve, 1000))

	const { data: profileAfterResolve } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()

	console.log("Trust Score after resolving report:", profileAfterResolve?.trust_score)
	console.log("Trust Factors after resolving report:", profileAfterResolve?.trust_factors)

	// 4. Mark as false
	console.log("\nMarking report as FALSE...")
	await client.updateReport(reportId, { false_report: true })

	// Wait for trigger
	await new Promise(resolve => setTimeout(resolve, 1000))

	const { data: profileAfterFalse } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()

	console.log("Trust Score after marking FALSE:", profileAfterFalse?.trust_score)
	console.log("Trust Factors after marking FALSE:", profileAfterFalse?.trust_factors)

	// 5. Test Manual Library Methods
	console.log("\nTesting Manual Library Methods...")
	
	console.log("Incrementing Trust Score...")
	await client.incrementTrustScore(TEST_USER_ID)
	
	const { data: profileAfterInc } = await client.supabaseClient
		.from('profiles')
		.select('trust_score')
		.eq('id', TEST_USER_ID)
		.single()
	console.log("Trust Score after increment:", profileAfterInc?.trust_score)

	console.log("Decrementing Trust Score...")
	await client.decrementTrustScore(TEST_USER_ID)
	
	const { data: profileAfterDec } = await client.supabaseClient
		.from('profiles')
		.select('trust_score')
		.eq('id', TEST_USER_ID)
		.single()
	console.log("Trust Score after decrement:", profileAfterDec?.trust_score)

	console.log("Incrementing Trust Score to max...")
	await client.updateTrustScore(TEST_USER_ID, 3)
	await client.incrementTrustScore(TEST_USER_ID)
	const { data: profileAtMax } = await client.supabaseClient
		.from('profiles')
		.select('trust_score')
		.eq('id', TEST_USER_ID)
		.single()
	console.log("Trust Score after increment at max (should be 3):", profileAtMax?.trust_score)

	console.log("Decrementing Trust Score to min...")
	await client.updateTrustScore(TEST_USER_ID, 0)
	await client.decrementTrustScore(TEST_USER_ID)
	const { data: profileAtMin } = await client.supabaseClient
		.from('profiles')
		.select('trust_score')
		.eq('id', TEST_USER_ID)
		.single()
	console.log("Trust Score after decrement at min (should be 0):", profileAtMin?.trust_score)

	console.log("Updating Trust Factors...")
	await client.updateTrustFactors(TEST_USER_ID, { 
		avg_response_time_minutes: 15,
		custom_factor: "verified_identity"
	} as any)

	const { data: profileAfterFactors } = await client.supabaseClient
		.from('profiles')
		.select('trust_factors')
		.eq('id', TEST_USER_ID)
		.single()
	console.log("Trust Factors after manual update:", profileAfterFactors?.trust_factors)

	// Cleanup
	console.log("\nCleaning up test report...")
	await client.deleteReport(reportId)
	
	// Final verification after delete
	await new Promise(resolve => setTimeout(resolve, 1000))
	const { data: finalProfile } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()
	console.log("Final Trust Score (after cleanup):", finalProfile?.trust_score)
}

testTrustScore()
