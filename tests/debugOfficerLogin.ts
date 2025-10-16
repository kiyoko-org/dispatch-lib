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

async function debugOfficerLogin() {
	console.log("Debugging officer login...")
	
	// Test the RPC function directly
	console.log("\n1. Testing RPC function directly...")
	const rpcResult = await client.supabaseClient.rpc('get_officer_email_by_badge', { 
		badge_number_param: "123456" 
	});
	console.log("RPC Result:", rpcResult);

	// Check if the RPC function exists
	console.log("\n2. Checking if RPC function exists...")
	const functionsResult = await client.supabaseClient.rpc('get_officer_email_by_badge', { 
		badge_number_param: "123456" 
	});
	console.log("Functions check:", functionsResult);

	// Test with a different badge number
	console.log("\n3. Testing with badge 248347...")
	const rpcResult2 = await client.supabaseClient.rpc('get_officer_email_by_badge', { 
		badge_number_param: "248347" 
	});
	console.log("RPC Result 2:", rpcResult2);
}

debugOfficerLogin().catch(console.error)
