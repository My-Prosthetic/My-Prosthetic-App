import React, { createContext, useContext, useState, ReactNode } from "react"
import { prostheses } from "@/db/schema/prostheses/prostheses"

export type Prosthesis = typeof prostheses.$inferSelect

interface ProsthesisContextType {
	selectedProsthesis: Prosthesis | null
	setSelectedProsthesis: (prosthesis: Prosthesis | null) => void
}

const ProsthesisContext = createContext<ProsthesisContextType | undefined>(undefined)

interface ProsthesisProviderProps {
	children: ReactNode
}

export const SelectedProsthesisProvider = ({ children }: ProsthesisProviderProps) => {
	const [selectedProsthesis, setSelectedProsthesis] = useState<Prosthesis | null>(null)

	return (
		<ProsthesisContext.Provider value={{ selectedProsthesis, setSelectedProsthesis }}>
			{children}
		</ProsthesisContext.Provider>
	)
}

export const useProsthesis = (): ProsthesisContextType => {
	const context = useContext(ProsthesisContext)
	if (!context) {
		throw new Error("useProsthesis musi być użyty wewnątrz ProsthesisProvider")
	}
	return context
}
