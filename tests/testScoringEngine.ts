import { initDispatchClient } from "../index"
import * as dotenv from "dotenv"

dotenv.config()

const client = initDispatchClient({
	supabaseClientConfig: {
		url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
		anonymousKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	},
})

const TEST_USER_ID = "c563ee88-34c5-486c-92f1-7c300dffbb76"

async function verifyScore(stepName: string, expectedScore: number) {
	const { data } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()
	
	const score = data?.trust_score
	const factors = data?.trust_factors
	
	console.log(`[${stepName}] Score: ${score} (Expected: ${expectedScore})`)
	console.log(`Factors: ${JSON.stringify(factors)}`)
	
	if (score !== expectedScore) {
		console.error(`❌ Mismatch in ${stepName}!`);
	} else {
		console.log(`✅ ${stepName} Passed`);
	}
	return data;
}

async function testScoringEngine() {
	console.log("🚀 Starting Scoring Engine Integration Test...");
	const reportIds: number[] = []

	try {
		// 0. Reset User to 0 reports (Cleanup previous runs)
		await client.supabaseClient.from('reports').delete().eq('reporter_id', TEST_USER_ID)
		await new Promise(r => setTimeout(r, 1000))

		// 1. Threshold: Level 1 (25 Points)
		// 5 reports * 5 points each = 25 points
		console.log("\nStep 1: Adding 5 reports to hit Level 1 (25 pts)...")
		for (let i = 0; i < 5; i++) {
			const { data } = await client.addReport({
				reporter_id: TEST_USER_ID,
				latitude: 0, longitude: 0,
				incident_title: `Engine Test ${i}`,
				status: "pending"
			})
			if (data) reportIds.push(data[0].id)
		}
		await new Promise(r => setTimeout(r, 1500))
		await verifyScore("Reach Level 1", 1)

		// 2. Threshold: Level 2 (55 Points)
		// 25 (base) + 3 resolved * 10 pts = 55 points
		console.log("\nStep 2: Resolving 3 reports to hit Level 2 (55 pts)...")
		for (let i = 0; i < 3; i++) {
			await client.updateReport(reportIds[i]!, { status: "resolved" })
		}
		await new Promise(r => setTimeout(r, 1500))
		await verifyScore("Reach Level 2", 2)

		// 3. Threshold: Level 3 (75 Points)
		// 25 (base) + 5 resolved * 10 pts = 75 points
		console.log("\nStep 3: Resolving 2 more reports to hit Level 3 (75 pts)...")
		for (let i = 3; i < 5; i++) {
			await client.updateReport(reportIds[i]!, { status: "resolved" })
		}
		await new Promise(r => setTimeout(r, 1500))
		await verifyScore("Reach Level 3", 3)

		// 4. Penalty Check: False Report (-20 Points)
		// 75 - 20 = 55 (Should drop back to Level 2)
		console.log("\nStep 4: Marking 1 report as FALSE (-20 pts penalty)...")
		await client.updateReport(reportIds[0]!, { false_report: true })
		await new Promise(r => setTimeout(r, 1500))
		await verifyScore("Drop to Level 2 via Penalty", 2)

	} catch (err) {
		console.error("Test failed:", err)
	} finally {
		console.log("\n🧹 Cleaning up test reports...")
		await client.supabaseClient.from('reports').delete().eq('reporter_id', TEST_USER_ID)
		console.log("Done.")
	}
}

testScoringEngine()
