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

async function testBarangays() {
	console.log("Testing fetchBarangays...")
	const fetchResult = await client.fetchBarangays()
	console.log("Fetch Barangays Result:", fetchResult)

	console.log("\nTesting addBarangay...")
	const addResult = await client.addBarangay({
		name: "Test Barangay",
	})
	console.log("Add Barangay Result:", addResult)

	if (addResult.data && addResult.data.length > 0) {
		const barangayId = addResult.data[0].id

		console.log(`\nTesting updateBarangay with ID: ${barangayId}...`)
		const updateResult = await client.updateBarangay(barangayId.toString(), {
			name: "Updated Test Barangay",
		})
		console.log("Update Barangay Result:", updateResult)

		console.log(`\nTesting deleteBarangay with ID: ${barangayId}...`)
		const deleteResult = await client.deleteBarangay(barangayId.toString())
		console.log("Delete Barangay Result:", deleteResult)
	}

	console.log("\nTesting fetchBarangays after operations...")
	const finalFetchResult = await client.fetchBarangays()
	console.log("Final Fetch Barangays Result:", finalFetchResult)
}

testBarangays()
