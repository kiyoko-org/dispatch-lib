import { initDispatchClient } from "../index"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const existingEmail = "stevendavemiranda2@gmail.com"

if (!supabaseUrl || !supabaseKey) {
	console.error("Missing Supabase environment variables")
	process.exit(1)
}

if (!existingEmail) {
	console.error("Missing TEST_SUPABASE_EXISTING_EMAIL environment variable")
	process.exit(1)
}

const client = initDispatchClient({
	supabaseClientConfig: {
		url: supabaseUrl,
		anonymousKey: supabaseKey,
		detectSessionInUrl: true,
	},
})

async function testEmailExists() {
	console.log(`\nChecking registered email: ${existingEmail}`)
	const existingResult = await client.emailExists(existingEmail)
	console.log("Result:", existingResult)

	const unregisteredEmail = `unregistered_${Date.now()}@example.com`
	console.log(`\nChecking unregistered email: ${unregisteredEmail}`)
	const missingResult = await client.emailExists(unregisteredEmail)
	console.log("Result:", missingResult)

	if (!existingResult.exists) {
		console.warn("Expected registered email to exist but got false")
	}

	if (missingResult.exists) {
		console.warn("Expected generated email to be absent but got true")
	}
}

testEmailExists().catch((error) => {
	console.error("emailExists test failed:", error)
	process.exit(1)
})
