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

// Module-level singleton subscription tracking
let globalSubscription: any = null;
let subscriberCount = 0;
let globalReports: Report[] = [];
let globalLoading = true;
let globalError: string | null = null;
let globalIsConnected = false;
const globalListeners = new Set<{
	onInsert?: (report: Report) => void;
	onUpdate?: (report: Report) => void;
	onDelete?: (reportId: number) => void;
	setReports: (reports: Report[]) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setIsConnected: (isConnected: boolean) => void;
}>();

export function useRealtimeReports(options: UseRealtimeReportsOptions = {}): UseRealtimeReportsReturn {
	const [reports, setReports] = useState<Report[]>(() => globalReports);
	const [loading, setLoading] = useState<boolean>(() => globalLoading);
	const [error, setError] = useState<string | null>(() => globalError);
	const [isConnected, setIsConnected] = useState<boolean>(() => globalIsConnected);
	
	const client = getDispatchClient();
	const { enabled = true, onInsert, onUpdate, onDelete } = options;
	const listenerRef = useRef<any>(null);

	// Initial fetch of reports (only once globally)
	const fetchInitialReports = useCallback(async () => {
		if (globalReports.length > 0 || !globalLoading) {
			// Already fetched or currently fetching
			return;
		}

		try {
			globalLoading = true;
			globalError = null;
			notifyListeners({ loading: globalLoading, error: globalError });
			
			const { data, error: fetchError } = await client.fetchReports();
			
			if (fetchError) {
				globalError = fetchError.message;
				notifyListeners({ error: globalError });
				return;
			}
			
			if (data) {
				globalReports = data;
				notifyListeners({ reports: globalReports });
			}
		} catch (err) {
			globalError = err instanceof Error ? err.message : "Failed to fetch reports";
			notifyListeners({ error: globalError });
		} finally {
			globalLoading = false;
			notifyListeners({ loading: globalLoading });
		}
	}, [client]);

	// Notify all listeners of state changes
	const notifyListeners = useCallback((updates: {
		reports?: Report[];
		loading?: boolean;
		error?: string | null;
		isConnected?: boolean;
	}) => {
		globalListeners.forEach(listener => {
			if (updates.reports !== undefined) listener.setReports(updates.reports);
			if (updates.loading !== undefined) listener.setLoading(updates.loading);
			if (updates.error !== undefined) listener.setError(updates.error);
			if (updates.isConnected !== undefined) listener.setIsConnected(updates.isConnected);
		});
	}, []);

	// Subscribe to realtime changes (only once globally)
	const subscribe = useCallback(() => {
		if (globalSubscription) {
			return; // Already subscribed
		}

		try {
			globalSubscription = client.supabaseClient
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
								globalReports = [...globalReports, newReport];
								notifyListeners({ reports: globalReports });
								globalListeners.forEach(listener => listener.onInsert?.(newReport));
								break;
								
							case 'UPDATE':
								const updatedReport = payload.new as Report;
								globalReports = globalReports.map(report => 
									report.id === updatedReport.id ? updatedReport : report
								);
								notifyListeners({ reports: globalReports });
								globalListeners.forEach(listener => listener.onUpdate?.(updatedReport));
								break;
								
							case 'DELETE':
								const deletedId = payload.old.id;
								globalReports = globalReports.filter(report => report.id !== deletedId);
								notifyListeners({ reports: globalReports });
								globalListeners.forEach(listener => listener.onDelete?.(deletedId));
								break;
						}
					}
				)
				.subscribe((status) => {
					console.log('Realtime subscription status:', status);
					globalIsConnected = status === 'SUBSCRIBED';
					notifyListeners({ isConnected: globalIsConnected });
					
					if (status === 'CHANNEL_ERROR') {
						globalError = 'Failed to connect to realtime updates';
						notifyListeners({ error: globalError });
					}
				});
		} catch (err) {
			globalError = err instanceof Error ? err.message : "Failed to subscribe to realtime updates";
			notifyListeners({ error: globalError });
		}
	}, [client, notifyListeners]);

	// Unsubscribe from realtime changes (only when no more subscribers)
	const unsubscribe = useCallback(() => {
		subscriberCount--;
		
		if (subscriberCount === 0 && globalSubscription) {
			client.supabaseClient.removeChannel(globalSubscription);
			globalSubscription = null;
			globalIsConnected = false;
			notifyListeners({ isConnected: globalIsConnected });
		}
	}, [client, notifyListeners]);

	// Initialize
	useEffect(() => {
		if (enabled) {
			// Add this component as a listener
			listenerRef.current = {
				onInsert,
				onUpdate,
				onDelete,
				setReports,
				setLoading,
				setError,
				setIsConnected,
			};
			globalListeners.add(listenerRef.current);
			
			// Increment subscriber count
			subscriberCount++;
			
			// Sync current global state
			setReports(globalReports);
			setLoading(globalLoading);
			setError(globalError);
			setIsConnected(globalIsConnected);
			
			// Fetch initial data and subscribe if needed
			fetchInitialReports();
			subscribe();
		}

		return () => {
			if (listenerRef.current) {
				globalListeners.delete(listenerRef.current);
				unsubscribe();
			}
		};
	}, [enabled, fetchInitialReports, subscribe, unsubscribe, onInsert, onUpdate, onDelete]);

	return {
		reports,
		loading,
		error,
		isConnected,
		subscribe,
		unsubscribe,
	};
}
