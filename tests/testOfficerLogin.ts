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

async function testOfficerLogin() {
	console.log("Testing officerLogin with badge numbers...")
	
	// Test with valid officer badge number
	console.log("\n1. Testing with valid officer badge number...")
	const validOfficerResult = await client.officerLogin(
		"123456", // Replace with actual officer badge number
		"123456" // Replace with actual officer password
	)
	console.log("Valid Officer Login Result:", validOfficerResult)

	// Test with invalid badge number
	console.log("\n2. Testing with invalid badge number...")
	const invalidBadgeResult = await client.officerLogin(
		"INVALID123",
		"password123"
	)
	console.log("Invalid Badge Number Result:", invalidBadgeResult)

	// Test with invalid password
	console.log("\n3. Testing with invalid password...")
	const invalidPasswordResult = await client.officerLogin(
		"BADGE001", // Replace with actual officer badge number
		"wrongpassword"
	)
	console.log("Invalid Password Result:", invalidPasswordResult)

	// Test regular login for comparison (still uses email)
	console.log("\n4. Testing regular login for comparison...")
	const regularLoginResult = await client.login(
		"user@test.com", // Replace with actual user email
		"password123" // Replace with actual password
	)
	console.log("Regular Login Result:", regularLoginResult)

	// Test getSafeSession after login
	console.log("\n5. Testing getSafeSession after login...")
	const sessionResult = await client.getSafeSession()
	console.log("Session Result:", sessionResult)

	// Test fetching officers to see available badge numbers
	console.log("\n6. Testing fetchOfficers to see available badge numbers...")
	const officersResult = await client.fetchOfficers()
	console.log("Available Officers:", officersResult)
}

testOfficerLogin().catch(console.error)
