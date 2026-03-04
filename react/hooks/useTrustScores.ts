import { useEffect, useState, useCallback } from "react";
import type { Database } from "../../database.types";
import { getDispatchClient } from "../..";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
	email?: string;
	reports_count?: number;
	joined_date?: string;
	last_sign_in_at?: string;
};

type UseTrustScoresReturn = {
	users: Profile[];
	loading: boolean;
	error: string | null;
	updateScore: (userId: string, score: number) => Promise<void>;
	refresh: () => Promise<void>;
};

/**
 * Admin hook to view all users and their trust scores.
 * Provides real-time updates and an update method.
 */
export function useTrustScores(): UseTrustScoresReturn {
	const [users, setUsers] = useState<Profile[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const client = getDispatchClient();

	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			
			// Use the unified DispatchClient method which handles proxy routing automatically
			const { data, error: fetchError } = await client.fetchProfilesWithEmails();

			if (fetchError) {
				const msg = (fetchError as any).message || "Unknown error fetching profiles";
				throw new Error(msg);
			}

			setUsers(data as any || []);
		} catch (err: any) {
			console.error("useTrustScores fetch error:", err);
			setError(err.message || "Failed to fetch trust scores");
		} finally {
			setLoading(false);
		}
	}, [client]);

	const updateScore = async (userId: string, score: number) => {
		try {
			// Use the unified DispatchClient method which handles proxy routing automatically
			const { error: updateError } = await client.updateTrustScore(userId, score);
			
			if (updateError) {
				const msg = (updateError as any).message || "Failed to update score";
				throw new Error(msg);
			}
			
			// Optimistic update
			setUsers((current) =>
				current.map((u) => (u.id === userId ? { ...u, trust_score: score } : u))
			);
		} catch (err: any) {
			console.error("Failed to update trust score:", err);
			throw err;
		}
	};

	useEffect(() => {
		fetchUsers();

		const channel = client.supabaseClient
			.channel("trust-scores-realtime")
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "profiles",
				},
				(payload) => {
					const updated = payload.new as Profile;
					setUsers((current) =>
						current.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
					);
				}
			)
			.subscribe();

		return () => {
			client.supabaseClient.removeChannel(channel);
		};
	}, [client, fetchUsers]);

	return {
		users,
		loading,
		error,
		updateScore,
		refresh: fetchUsers,
	};
}
