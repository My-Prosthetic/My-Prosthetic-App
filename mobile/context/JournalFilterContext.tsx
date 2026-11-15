import {
	createContext,
	useContext,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react"

interface JournalFilterContextValue {
	search: string
	setSearch: Dispatch<SetStateAction<string>>
	showIncidents: boolean
	setShowIncidents: Dispatch<SetStateAction<boolean>>
	showComponents: boolean
	setShowComponents: Dispatch<SetStateAction<boolean>>
	prosthesisId: string | undefined
	setProsthesisId: Dispatch<SetStateAction<string | undefined>>
}

const JournalFilterContext = createContext<JournalFilterContextValue | undefined>(undefined)

export function JournalFilterProvider({ children }: { children: ReactNode }) {
	const [search, setSearch] = useState("")
	const [showIncidents, setShowIncidents] = useState(true)
	const [showComponents, setShowComponents] = useState(true)
	const [prosthesisId, setProsthesisId] = useState<string>()

	return (
		<JournalFilterContext.Provider
			value={{
				search,
				setSearch,
				showIncidents,
				setShowIncidents,
				showComponents,
				setShowComponents,
				prosthesisId,
				setProsthesisId,
			}}
		>
			{children}
		</JournalFilterContext.Provider>
	)
}

export function useJournalFilters() {
	const context = useContext(JournalFilterContext)
	if (!context) throw new Error("useJournalFilters must be used within JournalFilterProvider")
	return context
}
