import { useEffect, useState } from "react"
import { searchSpecialists, type Specialist } from "../services/specialistsApi"

type SearchState = {
	query: string
	specialists: Specialist[]
	isLoading: boolean
	error: "specialistsSearch.errorSearchSpecialists" | null
	hasSearched: boolean
}

export function useSpecialistSearch(query: string) {
	const [state, setState] = useState<SearchState>({
		query: "",
		specialists: [],
		isLoading: false,
		error: null,
		hasSearched: false,
	})

	const trimmedQuery = query.trim()
	const wordCount = trimmedQuery.split(/\s+/).filter(Boolean).length

	const canSearch = trimmedQuery.length >= 3 && trimmedQuery.length <= 100 && wordCount <= 5

	useEffect(() => {
		if (!canSearch) return

		let active = true

		const timer = setTimeout(async () => {
			setState({
				query: trimmedQuery,
				specialists: [],
				isLoading: true,
				error: null,
				hasSearched: false,
			})

			try {
				const response = await searchSpecialists(trimmedQuery)

				if (active) {
					setState({
						query: trimmedQuery,
						specialists: response.data,
						isLoading: false,
						error: null,
						hasSearched: true,
					})
				}
			} catch {
				if (active) {
					setState({
						query: trimmedQuery,
						specialists: [],
						isLoading: false,
						error: "specialistsSearch.errorSearchSpecialists",
						hasSearched: false,
					})
				}
			}
		}, 400)

		return () => {
			active = false
			clearTimeout(timer)
		}
	}, [trimmedQuery, canSearch])

	const isCurrentQuery = canSearch && state.query === trimmedQuery

	return {
		specialists: isCurrentQuery ? state.specialists : [],
		isLoading: isCurrentQuery ? state.isLoading : false,
		error: isCurrentQuery ? state.error : null,
		hasSearched: isCurrentQuery ? state.hasSearched : false,
		canSearch,
	}
}
