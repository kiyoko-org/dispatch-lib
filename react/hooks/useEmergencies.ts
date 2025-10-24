import { useEffect, useState } from "react"
import type { Database } from "../../database.types"
import { getDispatchClient } from "../.."

type EmergencyCall = Database["public"]["Tables"]["emergency_calls"]["Row"]

type UseEmergenciesReturn = {
	emergencies: EmergencyCall[]
	loading: boolean
	error: Error | null
	updateEmergency: (id: string, payload: Partial<Database["public"]["Tables"]["emergency_calls"]["Update"]>) => Promise<{ data: any[] | null; error: any }>
	deleteEmergency: (id: string) => Promise<{ data: any[] | null; error: any }>
}

export const useEmergencies = (): UseEmergenciesReturn => {
	const [emergencies, setEmergencies] = useState<EmergencyCall[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<Error | null>(null)

	const client = getDispatchClient()

	const fetchEmergencies = async () => {
		setLoading(true)

		const { data, error } = await client.fetchEmergencyCalls()

		if (error) {
			console.error("Error fetching emergency calls:", error)
			setError(error)
		}

		if (data) {
			setEmergencies(data)
		}

		setLoading(false)
	}

	useEffect(() => {
		fetchEmergencies()

		const subscription = client.supabaseClient.channel("emergency_calls-channel")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "emergency_calls",
				},
				(payload) => {
					switch (payload.eventType) {
						case "INSERT":
							setEmergencies((prev) => [...prev, payload.new as EmergencyCall])
							break
						case "UPDATE":
							setEmergencies((current) =>
								current.map((emergency) =>
									emergency.id === (payload.new as EmergencyCall).id ? (payload.new as EmergencyCall) : emergency
								)
							)
							break
						case "DELETE":
							setEmergencies((current) =>
								current.filter((emergency) => emergency.id !== (payload.old as EmergencyCall).id)
							)
							break
						default:
							fetchEmergencies()
					}
				}
			)
			.subscribe()

		return () => {
			client.supabaseClient.removeChannel(subscription)
		}
	}, [])

	async function updateEmergency(id: string, payload: Partial<Database["public"]["Tables"]["emergency_calls"]["Update"]>) {
		const { data, error } = await client.updateEmergencyCall(id, payload)
		if (error) {
			console.error("Error updating emergency call:", error)
		}
		if (data && Array.isArray(data) && data.length > 0) {
			setEmergencies((prev) =>
				prev.map((emergency) =>
					emergency.id === id ? (data[0] as EmergencyCall) : emergency
				)
			)
		}
		return { data, error }
	}

	async function deleteEmergency(id: string) {
		const { data, error } = await client.deleteEmergencyCall(id)
		if (error) {
			console.error("Error deleting emergency call:", error)
		}
		if (!error) {
			setEmergencies((prev) => prev.filter((emergency) => emergency.id !== id))
		}
		return { data, error }
	}

	return { emergencies, loading, error, updateEmergency, deleteEmergency }
}
