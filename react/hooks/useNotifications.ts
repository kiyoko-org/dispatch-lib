import { useEffect, useState } from "react"
import type { Database } from "../../database.types"
import { getDispatchClient } from "../.."

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

type UseNotificationsReturn = {
	notifications: Notification[]
	loading: boolean
	error: Error | null
	deleteNotification: (id: string) => Promise<{ data: any[] | null; error: any }>
}

export const useNotifications = (): UseNotificationsReturn => {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<Error | null>(null)

	const client = getDispatchClient()

	const fetchNotifications = async () => {
		setLoading(true)

		const { data, error } = await client.supabaseClient.from('notifications').select('*')

		if (error) {
			console.error("Error fetching notifications:", error)
			setError(error as Error)
		}

		if (data) {
			setNotifications(data as Notification[])
		}

		setLoading(false)
	}

	useEffect(() => {

		fetchNotifications()

		const subscription = client.supabaseClient.channel('notifications-channel')
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "notifications"
				},
				(payload) => {
					switch (payload.eventType) {
						case "INSERT":
							setNotifications((prev) => [...prev, payload.new as Notification])
							break
						case "UPDATE":
							setNotifications((current) =>
								current.map((notification) =>
									notification.id === (payload.new as Notification).id ? (payload.new as Notification) : notification
								)
							);
							break
						case "DELETE":
							setNotifications((current) =>
								current.filter((notification) => notification.id !== (payload.old as Notification).id)
							);
							break
						default:
							fetchNotifications()
					}
				}
			).subscribe()

		return () => {
			client.supabaseClient.removeChannel(subscription)
		}

	}, [])

	async function deleteNotification(id: string) {
		const { data, error } = await client.supabaseClient.from('notifications').delete().eq('id', id).select();
		if (error) {
			console.error("Error deleting notification:", error);
		}
		if (!error) {
			setNotifications(prev => prev.filter(notification => notification.id !== id));
		}
		return { data, error };
	}

	return { notifications, loading, error, deleteNotification }
}
