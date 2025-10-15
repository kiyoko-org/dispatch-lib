import { useEffect, useState, useCallback, useRef } from "react";
import type { Database } from "../../database.types";
import { getDispatchClient } from "../..";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Report = Database["public"]["Tables"]["reports"]["Row"];

type UseRealtimeReportsOptions = {
	enabled?: boolean;
	onInsert?: (report: Report) => void;
	onUpdate?: (report: Report) => void;
	onDelete?: (reportId: number) => void;
};

type UseRealtimeReportsReturn = {
	reports: Report[];
	loading: boolean;
	error: string | null;
	isConnected: boolean;
	subscribe: () => void;
	unsubscribe: () => void;
};

export function useRealtimeReports(options: UseRealtimeReportsOptions = {}): UseRealtimeReportsReturn {
	const [reports, setReports] = useState<Report[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	
	const subscriptionRef = useRef<any>(null);
	const client = getDispatchClient();

	const { enabled = true, onInsert, onUpdate, onDelete } = options;

	// Initial fetch of reports
	const fetchInitialReports = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const { data, error: fetchError } = await client.fetchReports();
			
			if (fetchError) {
				setError(fetchError.message);
				return;
			}
			
			if (data) {
				setReports(data);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch reports");
		} finally {
			setLoading(false);
		}
	}, [client]);

	// Subscribe to realtime changes
	const subscribe = useCallback(() => {
		if (subscriptionRef.current) {
			return; // Already subscribed
		}

		try {
			subscriptionRef.current = client.supabaseClient
				.channel('reports-realtime')
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'reports'
					},
					(payload: RealtimePostgresChangesPayload<Report>) => {
						console.log('Realtime report change:', payload);
						
						switch (payload.eventType) {
							case 'INSERT':
								const newReport = payload.new as Report;
								setReports(prev => [...prev, newReport]);
								onInsert?.(newReport);
								break;
								
							case 'UPDATE':
								const updatedReport = payload.new as Report;
								setReports(prev => 
									prev.map(report => 
										report.id === updatedReport.id ? updatedReport : report
									)
								);
								onUpdate?.(updatedReport);
								break;
								
							case 'DELETE':
								const deletedId = payload.old.id;
								setReports(prev => prev.filter(report => report.id !== deletedId));
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

	// Initialize
	useEffect(() => {
		if (enabled) {
			fetchInitialReports();
			subscribe();
		}

		return () => {
			unsubscribe();
		};
	}, [enabled, fetchInitialReports, subscribe, unsubscribe]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			unsubscribe();
		};
	}, [unsubscribe]);

	return {
		reports,
		loading,
		error,
		isConnected,
		subscribe,
		unsubscribe,
	};
}