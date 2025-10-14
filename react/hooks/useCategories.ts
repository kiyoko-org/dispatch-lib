import { useEffect, useState } from "react"
import { getDispatchClient } from "../.."
import type { Database } from "../../database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

type UseCategoriesReturn = {
	categories: Category[]
	loading: boolean
	addCategory: (payload: Database["public"]["Tables"]["categories"]["Insert"]) => Promise<{ data: any[] | null; error: any }>
	updateCategory: (id: number, payload: Partial<Database["public"]["Tables"]["categories"]["Update"]>) => Promise<{ data: any[] | null; error: any }>
	deleteCategory: (id: number) => Promise<{ data: any[] | null; error: any }>
}

let cachedCategories: Category[] | null = null
let cachedPromise: Promise<void> | null = null

export function useCategories(): UseCategoriesReturn {
	const [categories, setCategories] = useState<Category[]>(cachedCategories ?? [])
	const [loading, setLoading] = useState<boolean>(cachedCategories === null)

	const client = getDispatchClient()

	useEffect(() => {
		if (cachedCategories !== null) {
			setCategories(cachedCategories)
			setLoading(false)
			return
		}

		if (!cachedPromise) {
			cachedPromise = (async () => {
				setLoading(true)
				const { data, error } = await client.getCategories()

				if (error) {
					console.error("Error fetching categories:", (error as any).message)
					setLoading(false)
					return
				}

				if (data) {
					cachedCategories = data
					setCategories(data)
				}

				setLoading(false)
			})()
		} else {
			cachedPromise.then(() => {
				if (cachedCategories) setCategories(cachedCategories)
				setLoading(false)
			})
		}
	}, [])

	async function addCategory(payload: Database["public"]["Tables"]["categories"]["Insert"]) {
		const { data, error } = await client.addCategory(payload);
		if (error) {
			console.error("Error adding category:", error);
		}
		if (data) {
			const newCategories = [...categories, ...data];
			setCategories(newCategories);
			cachedCategories = newCategories;
		}
		return { data, error };
	}

	async function updateCategory(id: number, payload: Partial<Database["public"]["Tables"]["categories"]["Update"]>) {
		const { data, error } = await client.updateCategory(id.toString(), payload);
		if (error) {
			console.error("Error updating category:", error);
		}
		if (data && Array.isArray(data) && data.length > 0) {
			const newCategories = categories.map(c => (c.id === id ? (data[0] as typeof c) : c));
			setCategories(newCategories);
			cachedCategories = newCategories;
		}
		return { data, error };
	}

	async function deleteCategory(id: number) {
		const { data, error } = await client.deleteCategory(id.toString());
		if (error) {
			console.error("Error deleting category:", error);
		}
		if (data) {
			const newCategories = categories.filter(c => c.id !== id);
			setCategories(newCategories);
			cachedCategories = newCategories;
		}
		return { data, error };
	}

	return { categories, loading, addCategory, updateCategory, deleteCategory }
}
