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

const TEST_USER_ID = "32ffca0c-dcc6-4a8d-a8d5-e33f6edaf4c8" // Use a valid reporter ID from the DB

async function getTrustScore(userId: string): Promise<number> {
	const { data, error } = await client.supabaseClient
		.from('profiles')
		.select('trust_score')
		.eq('id', userId)
		.single()
	
	if (error) throw error
	return data.trust_score ?? 0
}

async function runManualTrustTests() {
	console.log(`🚀 Starting Manual Trust Score Tests for User: ${TEST_USER_ID}...`)

	try {
		// 1. Reset to 0
		console.log("\nStep 1: Resetting trust score to 0...")
		await client.updateTrustScore(TEST_USER_ID, 0)
		let score = await getTrustScore(TEST_USER_ID)
		console.log(`Current Score: ${score} (Expected: 0)`)
		if (score !== 0) throw new Error("Reset failed")

		// 2. Test Increments
		console.log("\nStep 2: Testing increments...")
		await client.incrementTrustScore(TEST_USER_ID)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after 1st increment: ${score} (Expected: 1)`)
		if (score !== 1) throw new Error("Increment failed")

		await client.incrementTrustScore(TEST_USER_ID)
		await client.incrementTrustScore(TEST_USER_ID)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after 3 total increments: ${score} (Expected: 3)`)
		if (score !== 3) throw new Error("Increment to 3 failed")

		// 3. Test Cap at Max (3)
		console.log("\nStep 3: Testing cap at max (3)...")
		await client.incrementTrustScore(TEST_USER_ID)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after incrementing at max: ${score} (Expected: 3)`)
		if (score !== 3) throw new Error("Cap at 3 failed")

		// 4. Test Decrements
		console.log("\nStep 4: Testing decrements...")
		await client.decrementTrustScore(TEST_USER_ID)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after 1st decrement: ${score} (Expected: 2)`)
		if (score !== 2) throw new Error("Decrement failed")

		await client.decrementTrustScore(TEST_USER_ID)
		await client.decrementTrustScore(TEST_USER_ID)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after 3 total decrements: ${score} (Expected: 0)`)
		if (score !== 0) throw new Error("Decrement to 0 failed")

		// 5. Test Cap at Min (0)
		console.log("\nStep 5: Testing cap at min (0)...")
		await client.decrementTrustScore(TEST_USER_ID)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after decrementing at min: ${score} (Expected: 0)`)
		if (score !== 0) throw new Error("Cap at 0 failed")

		// 6. Test Direct Update
		console.log("\nStep 6: Testing direct update to Level 2...")
		await client.updateTrustScore(TEST_USER_ID, 2)
		score = await getTrustScore(TEST_USER_ID)
		console.log(`Score after direct update: ${score} (Expected: 2)`)
		if (score !== 2) throw new Error("Direct update failed")

		console.log("\n✅ All Manual Trust Score Tests Passed!")

	} catch (error) {
		console.error("\n❌ Test Failed:", error)
	}
}

runManualTrustTests()
