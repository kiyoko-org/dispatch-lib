import { useEffect, useState } from "react";
import type { Database } from "../../database.types"
import { getDispatchClient } from "../..";

type UseBarangaysReturn = {
	barangays: Database["public"]["Tables"]["barangays"]["Row"][];
	loading: boolean;
	addBarangay: (payload: Database["public"]["Tables"]["barangays"]["Insert"]) => Promise<{ data: any[] | null; error: any }>;
	updateBarangay: (id: number, payload: Partial<Database["public"]["Tables"]["barangays"]["Update"]>) => Promise<{ data: any[] | null; error: any }>;
	deleteBarangay: (id: number) => Promise<{ data: any[] | null; error: any }>;
}

let cachedBarangays: Database["public"]["Tables"]["barangays"]["Row"][] | null = null;
let cachedPromise: Promise<void> | null = null;

export function useBarangays(): UseBarangaysReturn {
	const [barangays, setBarangays] = useState<Database["public"]["Tables"]["barangays"]["Row"][]>(cachedBarangays ?? []);
	const [loading, setLoading] = useState<boolean>(cachedBarangays === null);

	const client = getDispatchClient();

	useEffect(() => {
		if (cachedBarangays !== null) {
			setBarangays(cachedBarangays);
			setLoading(false);
			return;
		}

		if (!cachedPromise) {
			cachedPromise = (async () => {
				setLoading(true);
				const { data, error } = await client.fetchBarangays();

				if (error) {
					console.error("Error fetching barangays:", (error as any).message);
					setLoading(false);
					return;
				}

				if (data) {
					cachedBarangays = data;
					setBarangays(data);
				}

				setLoading(false);
			})();
		} else {
			cachedPromise.then(() => {
				if (cachedBarangays) setBarangays(cachedBarangays);
				setLoading(false);
			});
		}
	}, []);

	async function addBarangay(payload: Database["public"]["Tables"]["barangays"]["Insert"]) {
		const { data, error } = await client.addBarangay(payload);
		if (error) {
			console.error("Error adding barangay:", error);
		}
		if (data) {
			const newBarangays = [...barangays, ...data];
			setBarangays(newBarangays);
			cachedBarangays = newBarangays;
		}
		return { data, error };
	}

	async function updateBarangay(id: number, payload: Partial<Database["public"]["Tables"]["barangays"]["Update"]>) {
		const { data, error } = await client.updateBarangay(id.toString(), payload);
		if (error) {
			console.error("Error updating barangay:", error);
		}
		if (data && Array.isArray(data) && data.length > 0) {
			const newBarangays = barangays.map(b => (b.id === id ? (data[0] as typeof b) : b));
			setBarangays(newBarangays);
			cachedBarangays = newBarangays;
		}
		return { data, error };
	}

	async function deleteBarangay(id: number) {
		const { data, error } = await client.deleteBarangay(id.toString());
		if (error) {
			console.error("Error deleting barangay:", error);
		}
		if (data) {
			const newBarangays = barangays.filter(b => b.id !== id);
			setBarangays(newBarangays);
			cachedBarangays = newBarangays;
		}
		return { data, error };
	}

	return { barangays, loading, addBarangay, updateBarangay, deleteBarangay };
}
