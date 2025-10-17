import { useEffect, useState } from "react"
import type { Database } from "../../database.types"
import { getDispatchClient } from "../.."

type Officer = Database["public"]["Tables"]["officers"]["Row"]

type UseOfficersReturn = {
	officers: Officer[]
	loading: boolean
	error: Error | null
	updateOfficer: (id: string, payload: Partial<Database["public"]["Tables"]["officers"]["Update"]>) => Promise<{ data: any[] | null; error: any }>
	deleteOfficer: (id: string) => Promise<{ data: any[] | null; error: any }>
}

export const useOfficers = (): UseOfficersReturn => {
	const [officers, setOfficers] = useState<Officer[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<Error | null>(null)

	const client = getDispatchClient()

	const fetchOfficers = async () => {
		setLoading(true)

		const { data, error } = await client.fetchOfficers()

		if (error) {
			console.error("Error fetching officers:", error)
			setError(error)
		}

		if (data) {
			setOfficers(data)
		}

		setLoading(false)
	}

	useEffect(() => {

		fetchOfficers()

		const subscription = client.supabaseClient.channel('officers-channel')
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "officers"
				},
				(payload) => {
					switch (payload.eventType) {
						case "INSERT":
							setOfficers((prev) => [...prev, payload.new as Officer])
							break
						case "UPDATE":
							setOfficers((current) =>
								current.map((officer) =>
									officer.id === (payload.new as Officer).id ? (payload.new as Officer) : officer
								)
							);
							break
						case "DELETE":
							setOfficers((current) =>
								current.filter((officer) => officer.id !== (payload.old as Officer).id)
							);
							break
						default:
							fetchOfficers()
					}
				}
			).subscribe()

		return () => {
			client.supabaseClient.removeChannel(subscription)
		}

	}, [])

	async function updateOfficer(id: string, payload: Partial<Database["public"]["Tables"]["officers"]["Update"]>) {
		const { data, error } = await client.updateOfficer(id, payload);
		if (error) {
			console.error("Error updating officer:", error);
		}
		if (data && Array.isArray(data) && data.length > 0) {
			setOfficers(prev => prev.map(officer => 
				officer.id === id ? (data[0] as Officer) : officer
			));
		}
		return { data, error };
	}

	async function deleteOfficer(id: string) {
		const { data, error } = await client.deleteOfficer(id);
		if (error) {
			console.error("Error deleting officer:", error);
		}
		if (!error) {
			setOfficers(prev => prev.filter(officer => officer.id !== id));
		}
		return { data, error };
	}

	return { officers, loading, error, updateOfficer, deleteOfficer }
}
