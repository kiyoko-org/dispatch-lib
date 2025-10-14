import { useCallback, useEffect, useState } from "react"
import { getDispatchClient } from "../.."
import type { Database } from "../../database.types"

type Officer = Database["public"]["Tables"]["profiles"]["Row"]

type UseOfficersReturn = {
	officers: Officer[]
	loading: boolean
	refresh: () => Promise<void>
}

let cachedOfficers: Officer[] | null = null
let cachedPromise: Promise<void> | null = null

export function useOfficers(): UseOfficersReturn {
	const [officers, setOfficers] = useState<Officer[]>(cachedOfficers ?? [])
	const [loading, setLoading] = useState<boolean>(cachedOfficers === null)

	const client = getDispatchClient()

	const loadOfficers = useCallback(async () => {
		setLoading(true)
		const { data, error } = await client.fetchOfficers()

		if (error) {
			console.error("Error fetching officers:", error)
			setLoading(false)
			return
		}

		if (data) {
			cachedOfficers = data
			setOfficers(data)
		}

		setLoading(false)
	}, [client])

	useEffect(() => {
		if (cachedOfficers !== null) {
			setOfficers(cachedOfficers)
			setLoading(false)
			return
		}

		if (!cachedPromise) {
			cachedPromise = loadOfficers()
		} else {
			cachedPromise.then(() => {
				if (cachedOfficers) setOfficers(cachedOfficers)
				setLoading(false)
			})
		}
	}, [loadOfficers])

	const refresh = useCallback(async () => {
		await loadOfficers()
	}, [loadOfficers])

	return {
		officers,
		loading,
		refresh,
	}
}

