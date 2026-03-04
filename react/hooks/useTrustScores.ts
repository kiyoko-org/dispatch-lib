import { useEffect, useState, useCallback } from "react";
import type { Database } from "../../database.types";
import { getDispatchClient } from "../..";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
	email?: string;
	reports_count?: number;
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
			// Reuse the existing fetchProfiles logic but flattened here for context
			const { data: profiles, error: fetchError } = await client.supabaseClient
				.from("profiles")
				.select("*");

			if (fetchError) throw fetchError;

			if (!profiles) {
				setUsers([]);
				return;
			}

			// In a real production app, you might want to move this merging to an RPC
			// to avoid N+1 queries from the client.
			const userIds = profiles.map((p) => p.id);
			
			// Get report counts
			const reportsData = await Promise.all(
				userIds.map((id) =>
					client.supabaseClient
						.from("reports")
						.select("id", { count: "exact", head: true })
						.eq("reporter_id", id)
				)
			);

			const merged = profiles.map((profile, i) => ({
				...profile,
				reports_count: reportsData[i]?.count || 0,
			}));

			setUsers(merged);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch trust scores");
		} finally {
			setLoading(false);
		}
	}, [client]);

	const updateScore = async (userId: string, score: number) => {
		try {
			const { error: updateError } = await client.updateTrustScore(userId, score);
			if (updateError) throw updateError;
			
			// Optimistic update
			setUsers((current) =>
				current.map((u) => (u.id === userId ? { ...u, trust_score: score } : u))
			);
		} catch (err) {
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
