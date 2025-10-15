import { useCallback, useEffect, useState, useRef } from "react"
import { getDispatchClient } from "../.."
import type { Database } from "../../database.types"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type Officer = Database["public"]["Tables"]["officers"]["Row"]

type UseOfficersOptions = {
	enabled?: boolean;
	onInsert?: (officer: Officer) => void;
	onUpdate?: (officer: Officer) => void;
	onDelete?: (officerId: number) => void;
}

type UseOfficersReturn = {
	officers: Officer[]
	loading: boolean
	error: string | null
	isConnected: boolean
	refresh: () => Promise<void>
	assignToReport: (officerId: number, reportId: number) => Promise<{ error?: string }>
	subscribe: () => void
	unsubscribe: () => void
}

let cachedOfficers: Officer[] | null = null
let cachedPromise: Promise<void> | null = null

export function useOfficers(options: UseOfficersOptions = {}): UseOfficersReturn {
	const [officers, setOfficers] = useState<Officer[]>(cachedOfficers ?? [])
	const [loading, setLoading] = useState<boolean>(cachedOfficers === null)
	const [error, setError] = useState<string | null>(null)
	const [isConnected, setIsConnected] = useState<boolean>(false)
	
	const subscriptionRef = useRef<any>(null)
	const client = getDispatchClient()
	const { enabled = true, onInsert, onUpdate, onDelete } = options

	const loadOfficers = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const { data, error: fetchError } = await client.fetchOfficers()

			if (fetchError) {
				setError(fetchError.message)
				return
			}

			if (data) {
				cachedOfficers = data
				setOfficers(data)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch officers")
		} finally {
			setLoading(false)
		}
	}, [client])

	// Subscribe to realtime changes
	const subscribe = useCallback(() => {
		if (subscriptionRef.current) {
			return; // Already subscribed
		}

		try {
			subscriptionRef.current = client.supabaseClient
				.channel('officers-realtime')
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'officers'
					},
					(payload: RealtimePostgresChangesPayload<Officer>) => {
						console.log('Realtime officer change:', payload);
						
						switch (payload.eventType) {
							case 'INSERT':
								const newOfficer = payload.new as Officer;
								setOfficers(prev => [...prev, newOfficer]);
								onInsert?.(newOfficer);
								break;
								
							case 'UPDATE':
								const updatedOfficer = payload.new as Officer;
								setOfficers(prev => 
									prev.map(officer => 
										officer.id === updatedOfficer.id ? updatedOfficer : officer
									)
								);
								onUpdate?.(updatedOfficer);
								break;
								
							case 'DELETE':
								const deletedId = payload.old.id;
								setOfficers(prev => prev.filter(officer => officer.id !== deletedId));
								onDelete?.(deletedId);
								break;
						}
					}
				)
				.subscribe((status) => {
					console.log('Realtime subscription status:', status);
					setIsConnected(status === 'SUBSCRIBED');
					
					if (status === 'CHANNEL_ERROR') {
						setError('Failed to connect to realtime updates');
					}
				});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to subscribe to realtime updates");
		}
	}, [client, onInsert, onUpdate, onDelete]);

	// Unsubscribe from realtime changes
	const unsubscribe = useCallback(() => {
		if (subscriptionRef.current) {
			client.supabaseClient.removeChannel(subscriptionRef.current);
			subscriptionRef.current = null;
			setIsConnected(false);
		}
	}, [client]);

	// Assign officer to report
	const assignToReport = useCallback(async (officerId: number, reportId: number) => {
		try {
			const { error } = await client.assignToReport(officerId, reportId);
			if (error) {
				return { error: error.message };
			}
			return {};
		} catch (err) {
			return { error: err instanceof Error ? err.message : "Failed to assign officer to report" };
		}
	}, [client]);

	useEffect(() => {
		if (cachedOfficers !== null) {
			setOfficers(cachedOfficers)
			setLoading(false)
			if (enabled) {
				subscribe();
			}
			return
		}

		if (!cachedPromise) {
			cachedPromise = loadOfficers()
		} else {
			cachedPromise.then(() => {
				if (cachedOfficers) setOfficers(cachedOfficers)
				setLoading(false)
				if (enabled) {
					subscribe();
				}
			})
		}
	}, [loadOfficers, enabled, subscribe])

	// Initialize realtime subscription when enabled
	useEffect(() => {
		if (enabled && cachedOfficers !== null) {
			subscribe();
		}

		return () => {
			unsubscribe();
		};
	}, [enabled, subscribe, unsubscribe]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			unsubscribe();
		};
	}, [unsubscribe]);

	const refresh = useCallback(async () => {
		await loadOfficers()
	}, [loadOfficers])

	return {
		officers,
		loading,
		error,
		isConnected,
		refresh,
		assignToReport,
		subscribe,
		unsubscribe,
	}
}

