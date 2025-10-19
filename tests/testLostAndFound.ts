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

async function testLostAndFound() {
	console.log("Testing addLostAndFound...")
	const addResult = await client.addLostAndFound({
		item_title: "Test Lost Item",
		category: "Electronics",
		date_lost: "2024-01-01",
		lat: 14.5995,
		lon: 120.9842,
		description: "This is a test lost item",
	})

	console.log("Add Lost And Found Result:", addResult)

	console.log("\nTesting fetchLostAndFound...")
	const fetchResult = await client.fetchLostAndFound()

	console.log("Fetch Lost And Found Result:", fetchResult)

	if (addResult.data && addResult.data.length > 0) {
		const itemId = addResult.data[0].id
		console.log(`\nTesting updateLostAndFound with ID: ${itemId}...`)
		const updateResult = await client.updateLostAndFound(itemId, {
			description: "Updated description",
		})
		console.log("Update Lost And Found Result:", updateResult)

		console.log(`\nTesting deleteLostAndFound with ID: ${itemId}...`)
		const deleteResult = await client.deleteLostAndFound(itemId)
		console.log("Delete Lost And Found Result:", deleteResult)
	}
}

testLostAndFound()