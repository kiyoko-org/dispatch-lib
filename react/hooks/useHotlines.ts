import { useEffect, useState } from "react";
import type { Database } from "../../database.types"
import { getDispatchClient } from "../..";
import { type PostgrestSingleResponse } from "@supabase/supabase-js";

type UsehotlinesReturn = {
	hotlines: Database["public"]["Tables"]["hotlines"]["Row"][];
	fetchHotlines?: () => Promise<PostgrestSingleResponse<any[]>>;
	addHotline: (payload: Database["public"]["Tables"]["hotlines"]["Insert"]) => Promise<{ data: any[] | null; error: any }>;
	updateHotline: (id: number, payload: Partial<Database["public"]["Tables"]["hotlines"]["Update"]>) => Promise<{ data: any[] | null; error: any }>;
	deleteHotline: (id: number) => Promise<{ data: any[] | null; error: any }>;
}

export function useHotlines(): UsehotlinesReturn {
	const [hotlines, setHotlines] = useState<Database["public"]["Tables"]["hotlines"]["Row"][]>([]);

	const client = getDispatchClient();
	const fetchHotlines = client.fetchHotlines;

	useEffect(() => {
		async function init() {
			const { data, error } = await fetchHotlines()

			if (error) {
				console.error("Error fetching hotlines:", error);
			}

			if (data) {
				setHotlines(data);
			}
		}

		init()
	}, [fetchHotlines])

	async function addHotline(payload: Database["public"]["Tables"]["hotlines"]["Insert"]) {
		const { data, error } = await client.addHotline(payload);
		if (error) {
			console.error("Error adding hotline:", error);
		}
		if (data) {
			setHotlines(prev => [...prev, ...data]);
		}
		return { data, error };
	}

	async function updateHotline(id: number, payload: Partial<Database["public"]["Tables"]["hotlines"]["Update"]>) {
		const { data, error } = await client.updateHotline(id.toString(), payload);
		if (error) {
			console.error("Error updating hotline:", error);
		}
		if (data && Array.isArray(data) && data.length > 0) {
			setHotlines(prev => prev.map(h => (h.id === id ? (data[0] as typeof h) : h)));
		}
		return { data, error };
	}

	async function deleteHotline(id: number) {
		const { data, error } = await client.deleteHotline(id.toString());
		if (error) {
			console.error("Error deleting hotline:", error);
		}
		if (!error) {
			setHotlines(prev => prev.filter(h => h.id !== id));
		}
		return { data, error };
	}

	return {
		hotlines,
		fetchHotlines: client.fetchHotlines,
		addHotline,
		updateHotline,
		deleteHotline,
	}
}

