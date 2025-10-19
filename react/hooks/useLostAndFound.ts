import { useEffect, useState } from "react"
import type { Database } from "../../database.types"
import { getDispatchClient } from "../.."

type LostAndFound = Database["public"]["Tables"]["lost_and_found"]["Row"]

type UseLostAndFoundReturn = {
	lostAndFound: LostAndFound[]
	loading: boolean
	error: Error | null
	addLostAndFound: (payload: Database["public"]["Tables"]["lost_and_found"]["Insert"]) => Promise<{ data: any[] | null; error: any }>
	updateLostAndFound: (id: number, payload: Partial<Database["public"]["Tables"]["lost_and_found"]["Update"]>) => Promise<{ data: any[] | null; error: any }>
	deleteLostAndFound: (id: number) => Promise<{ data: any[] | null; error: any }>
}

export const useLostAndFound = (): UseLostAndFoundReturn => {
	const [lostAndFound, setLostAndFound] = useState<LostAndFound[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<Error | null>(null)

	const client = getDispatchClient()

	const fetchLostAndFound = async () => {
		setLoading(true)

		const { data, error } = await client.fetchLostAndFound()

		if (error) {
			console.error("Error fetching lost and found:", error)
			setError(error)
		}

		if (data) {
			setLostAndFound(data)
		}

		setLoading(false)
	}

	useEffect(() => {
		fetchLostAndFound()

		const subscription = client.supabaseClient.channel('lost_and_found-channel')
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "lost_and_found"
				},
				(payload) => {
					switch (payload.eventType) {
						case "INSERT":
							setLostAndFound((prev) => [...prev, payload.new as LostAndFound])
							break
						case "UPDATE":
							setLostAndFound((current) =>
								current.map((item) =>
									item.id === (payload.new as LostAndFound).id ? (payload.new as LostAndFound) : item
								)
							);
							break
						case "DELETE":
							setLostAndFound((current) =>
								current.filter((item) => item.id !== (payload.old as LostAndFound).id)
							);
							break
						default:
							fetchLostAndFound()
					}
				}
			).subscribe()

		return () => {
			client.supabaseClient.removeChannel(subscription)
		}

	}, [])

	async function addLostAndFound(payload: Database["public"]["Tables"]["lost_and_found"]["Insert"]) {
		const { data, error } = await client.addLostAndFound(payload);
		if (error) {
			console.error("Error adding lost and found:", error);
		}
		if (data) {
			setLostAndFound(prev => [...prev, ...data]);
		}
		return { data, error };
	}

	async function updateLostAndFound(id: number, payload: Partial<Database["public"]["Tables"]["lost_and_found"]["Update"]>) {
		const { data, error } = await client.updateLostAndFound(id, payload);
		if (error) {
			console.error("Error updating lost and found:", error);
		}
		if (data && Array.isArray(data) && data.length > 0) {
			setLostAndFound(prev => prev.map(item =>
				item.id === id ? (data[0] as LostAndFound) : item
			));
		}
		return { data, error };
	}

	async function deleteLostAndFound(id: number) {
		const { data, error } = await client.deleteLostAndFound(id);
		if (error) {
			console.error("Error deleting lost and found:", error);
		}
		if (!error) {
			setLostAndFound(prev => prev.filter(item => item.id !== id));
		}
		return { data, error };
	}

	return { lostAndFound, loading, error, addLostAndFound, updateLostAndFound, deleteLostAndFound }
}