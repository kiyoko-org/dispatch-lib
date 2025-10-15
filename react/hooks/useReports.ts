import { useEffect, useState } from "react";
import type { Database } from "../../database.types"
import { getDispatchClient } from "../..";
import { type PostgrestSingleResponse } from "@supabase/supabase-js";

type UseReportsReturn = {
	reports: Database["public"]["Tables"]["reports"]["Row"][];
	fetchReports?: () => Promise<PostgrestSingleResponse<any[]>>;
	addReport: (payload: Database["public"]["Tables"]["reports"]["Insert"]) => Promise<{ data: any[] | null; error: any }>;
	updateReport: (id: number, payload: Partial<Database["public"]["Tables"]["reports"]["Update"]>) => Promise<{ data: any[] | null; error: any }>;
	deleteReport: (id: number) => Promise<{ data: any[] | null; error: any }>;
	getReportInfo: (id: number) => Promise<{ data: Database["public"]["Tables"]["reports"]["Row"] | null; error: any }>;
}

export function useReports(): UseReportsReturn {
	const [reports, setReports] = useState<Database["public"]["Tables"]["reports"]["Row"][]>([]);

	const client = getDispatchClient();
	const fetchReports = client.fetchReports;

	useEffect(() => {
		async function init() {
			const { data, error } = await fetchReports()

			if (error) {
				console.error("Error fetching reports:", error);
			}

			if (data) {
				setReports(data);
			}
		}

		init()
	}, [fetchReports])

	async function addReport(payload: Database["public"]["Tables"]["reports"]["Insert"]) {
		const { data, error } = await client.addReport(payload);
		if (error) {
			console.error("Error adding report:", error);
		}
		if (data) {
			setReports(prev => [...prev, ...data]);
		}
		return { data, error };
	}

	async function updateReport(id: number, payload: Partial<Database["public"]["Tables"]["reports"]["Update"]>) {
		const { data, error } = await client.updateReport(id, payload);
		if (error) {
			console.error("Error updating report:", error);
		}
		if (data && Array.isArray(data) && data.length > 0) {
			setReports(prev => prev.map(r => (r.id === id ? (data[0] as typeof r) : r)));
		}
		return { data, error };
	}

	async function deleteReport(id: number) {
		const { data, error } = await client.deleteReport(id);
		if (error) {
			console.error("Error deleting report:", error);
		}
		if (!error) {
			setReports(prev => prev.filter(r => r.id !== id));
		}
		return { data, error };
	}

	async function getReportInfo(id: number) {
		const { data, error } = await client.getReportInfo(id);
		if (error) {
			console.error("Error fetching report info:", error);
		}
		return { data, error };
	}

	return {
		reports,
		fetchReports: client.fetchReports,
		addReport,
		updateReport,
		deleteReport,
		getReportInfo,
	}
}

