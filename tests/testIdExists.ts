import { initDispatchClient } from "../index"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const existingIdCard = process.env.TEST_SUPABASE_EXISTING_ID_CARD

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase environment variables")
	process.exit(1)
}

if (!existingIdCard) {
	console.error("Missing TEST_SUPABASE_EXISTING_ID_CARD environment variable")
	process.exit(1)
}

const client = initDispatchClient({
	supabaseClientConfig: {
		url: supabaseUrl,
		anonymousKey: supabaseKey,
		detectSessionInUrl: true,
	},
})

async function testIdExists() {
	console.log(`\nChecking registered ID card: ${existingIdCard}`)
	const existingResult = await client.idExists(existingIdCard)
	console.log("Result:", existingResult)

	if (existingResult.error) {
		console.error("Error while verifying existing ID card:", existingResult.error)
		process.exit(1)
	}

	const missingIdCard = `UNREGISTERED-${Date.now()}`
	console.log(`\nChecking unregistered ID card: ${missingIdCard}`)
	const missingResult = await client.idExists(missingIdCard)
	console.log("Result:", missingResult)

	if (missingResult.error) {
		console.error("Error while verifying unregistered ID card:", missingResult.error)
		process.exit(1)
	}

	if (!existingResult.exists) {
		console.warn("Expected registered ID card to exist but got false")
	}

	if (missingResult.exists) {
		console.warn("Expected generated ID card to be absent but got true")
	}
}

testIdExists().catch((error) => {
	console.error("idExists test failed:", error)
	process.exit(1)
})
