import { useEffect, useState } from "react"
import { getDispatchClient } from "../.."
import type { Database } from "../../database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

type UseReportsReturn = {
	categories: Category[],
	loading: boolean
}

export function useReports(): UseReportsReturn {

	const [categories, setCategories] = useState<Category[]>([])
	const [loading, setLoading] = useState<boolean>(false)

	const client = getDispatchClient()

	const fetchcategories = async () => {
		setLoading(true)
		const { data, error } = await client.getCategories()

		if (error) {
			console.error("Error fetching categories:", error.message)
			setLoading(false)
			return
		}

		if (data) {
			setCategories(data)
		}
		setLoading(false)
	}

	useEffect(() => {

		const init = async () => {
			await fetchcategories()
		}

		init()

	}, [])


	return {
		categories: categories,
		loading: loading
	}
}
