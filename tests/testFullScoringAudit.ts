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

async function getAudit() {
	const { data } = await client.supabaseClient
		.from('profiles')
		.select('trust_score, trust_factors')
		.eq('id', TEST_USER_ID)
		.single()
	return data
}

async function testFullScoringAudit() {
	console.log("🕵️ Starting Full Trust System Audit Test...")
	
	try {
		// 0. Reset State
		console.log("\n[0] Resetting user reports...")
		await client.supabaseClient.from('reports').delete().eq('reporter_id', TEST_USER_ID)
		await new Promise(r => setTimeout(r, 1000))

		// 1. Initial Creation
		console.log("\n[1] Submitting a new report...")
		const { data: r1 } = await client.addReport({
			reporter_id: TEST_USER_ID,
			latitude: 0, longitude: 0,
			incident_title: "Audit Report 1",
			status: "pending"
		})
		await new Promise(r => setTimeout(r, 1500))
		const audit1 = await getAudit()
		console.log("Factors after creation:", audit1?.trust_factors)
		if (audit1?.trust_factors?.total_reports !== 1) throw new Error("Total reports should be 1")

		// 2. Resolution
		console.log("\n[2] Resolving Report 1 (Accuracy Bonus)...")
		await client.updateReport(r1![0].id, { status: "resolved" })
		await new Promise(r => setTimeout(r, 1500))
		const audit2 = await getAudit()
		console.log("Factors after resolution:", audit2?.trust_factors)
		if (audit2?.trust_factors?.verified_reports !== 1) throw new Error("Verified reports should be 1")

		// 3. Cancellation
		console.log("\n[3] Submitting and Cancelling Report 2...")
		const { data: r2 } = await client.addReport({
			reporter_id: TEST_USER_ID,
			latitude: 0, longitude: 0,
			incident_title: "Audit Report 2",
			status: "pending"
		})
		await client.updateReport(r2![0].id, { status: "cancelled" })
		await new Promise(r => setTimeout(r, 1500))
		const audit3 = await getAudit()
		console.log("Factors after cancellation:", audit3?.trust_factors)
		if (audit3?.trust_factors?.cancelled_reports !== 1) throw new Error("Cancelled reports should be 1")

		// 4. False Report (The big penalty)
		console.log("\n[4] Submitting and marking Report 3 as FALSE...")
		const { data: r3 } = await client.addReport({
			reporter_id: TEST_USER_ID,
			latitude: 0, longitude: 0,
			incident_title: "Audit Report 3",
			status: "pending"
		})
		await client.updateReport(r3![0].id, { false_report: true })
		await new Promise(r => setTimeout(r, 1500))
		const audit4 = await getAudit()
		console.log("Factors after False Report flag:", audit4?.trust_factors)
		if (audit4?.trust_factors?.false_reports !== 1) throw new Error("False reports should be 1")

		// 5. Final Score Calculation Verification
		// Math: 
		// Reports: 3 (+15 pts)
		// Resolved: 1 (+10 pts)
		// Cancelled: 1 (-5 pts)
		// False: 1 (-20 pts)
		// Total: 15 + 10 - 5 - 20 = 0 points (Level 0)
		console.log("\n[5] Verifying final point total math...")
		console.log(`Final Score Level: ${audit4?.trust_score} (Expected: 0)`)
		if (audit4?.trust_score !== 0) {
			console.warn("⚠️ Warning: Score level mismatch. Check point thresholds in DB.")
		} else {
			console.log("✅ Audit Trail and Point Logic Verified!")
		}

	} catch (err) {
		console.error("❌ Test failed:", err)
	} finally {
		console.log("\n🧹 Cleaning up...")
		await client.supabaseClient.from('reports').delete().eq('reporter_id', TEST_USER_ID)
		console.log("Done.")
	}
}

testFullScoringAudit()
