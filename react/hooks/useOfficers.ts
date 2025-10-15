import { useEffect, useState } from "react"
import type { Database } from "../../database.types"
import { getDispatchClient } from "../.."

type Officer = Database["public"]["Tables"]["officers"]["Row"]

type UseOfficersReturn = {
	officers: Officer[]
	loading: boolean
	error: Error | null
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

	return { officers, loading, error }
}
