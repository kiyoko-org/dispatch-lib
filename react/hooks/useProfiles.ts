import { useEffect, useState } from "react"
import type { Database } from "../../database.types"
import { getDispatchClient } from "../.."
import { cidrv4 } from "zod"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

type UseProfilesReturn = {
	profiles: Profile[]
	loading: boolean
	error: Error | null
}

export const useProfiles = (): UseProfilesReturn => {
	const [profiles, setProfiles] = useState<Profile[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<Error | null>(null)

	const client = getDispatchClient()

	const fetchProfiles = async () => {
		const { data: profiles, error } = await client.supabaseClient.from('profiles').select('*');
		if (error) {
			console.error("Error fetching profiles:", error)
		}

		// Get auth data using admin API
		const userIds = profiles?.map(p => p.id) || [];
		// Note: This requires admin privileges
		const authData = await Promise.all(
			userIds.map(id => client.supabaseClient.auth.admin.getUserById(id))
		);	

		// Merge the data
		const merged = profiles?.map((profile, i) => ({
			...profile,
			email: authData[i].data.user?.email,
			created_at: authData[i].data.user?.created_at,
			last_sign_in_at: authData[i].data.user?.last_sign_in_at
		}));

		setLoading(false);

		setProfiles(merged as Profile[])
	}

	useEffect(() => {

		fetchProfiles()

		const subscription = client.supabaseClient.channel('profiles-channel')
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "profiles"
				},
				(payload) => {
					switch (payload.eventType) {
						case "INSERT":
							setProfiles((prev) => [...prev, payload.new as Profile])
							break
						case "UPDATE":
							setProfiles((current) =>
								current.map((profile) =>
									profile.id === (payload.new as Profile).id ? (payload.new as Profile) : profile
								)
							);
							break
						case "DELETE":
							setProfiles((current) =>
								current.filter((profile) => profile.id !== (payload.old as Profile).id)
							);
							break
						default:
							fetchProfiles()
					}
				}
			).subscribe()

		return () => {
			client.supabaseClient.removeChannel(subscription)
		}

	}, [])

	return { profiles: profiles, loading, error }
}
