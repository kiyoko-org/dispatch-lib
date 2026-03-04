import { useEffect, useState, useCallback } from "react";
import type { Database } from "../../database.types";
import { getDispatchClient } from "../..";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type UseProfileReturn = {
	profile: Profile | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

/**
 * Hook to fetch and subscribe to a single user's profile changes.
 * Useful for the mobile app to show real-time trust score updates.
 */
export function useProfile(userId: string | undefined): UseProfileReturn {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const client = getDispatchClient();

	const fetchProfile = useCallback(async () => {
		if (!userId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const { data, error: fetchError } = await client.supabaseClient
				.from("profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (fetchError) {
				setError(fetchError.message);
			} else {
				setProfile(data);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch profile");
		} finally {
			setLoading(false);
		}
	}, [client, userId]);

	useEffect(() => {
		fetchProfile();

		if (!userId) return;

		const channel = client.supabaseClient
			.channel(`profile-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "profiles",
					filter: `id=eq.${userId}`,
				},
				(payload) => {
					setProfile(payload.new as Profile);
				},
			)
			.subscribe();

		return () => {
			client.supabaseClient.removeChannel(channel);
		};
	}, [client, userId, fetchProfile]);

	return {
		profile,
		loading,
		error,
		refresh: fetchProfile,
	};
}
