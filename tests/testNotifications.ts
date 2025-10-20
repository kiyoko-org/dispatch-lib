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

async function testNotifications() {
	console.log("Testing notifyUser...")
	const { data: sessionData } = await client.supabaseClient.auth.getSession()	

	const userId = "98e40b20-4ee0-4dfb-aad6-6ee971a87e4a" 

	const addResult = await client.notifyUser(userId, "Test Notification", "This is a test notification body")

	console.log("Add Notification Result:", addResult)

	console.log("\nTesting fetchNotifications from database...")
	const fetchResult = await client.supabaseClient.from('notifications').select('*')

	console.log("Fetch Notifications Result:", fetchResult)

	if (addResult.data && addResult.data.length > 0) {
		const notificationId = addResult.data[0].id
		console.log(`\nTesting deleteNotification with ID: ${notificationId}...`)
		const deleteResult = await client.supabaseClient.from('notifications').delete().eq('id', notificationId).select()
		console.log("Delete Notification Result:", deleteResult)
	}
}

testNotifications()
