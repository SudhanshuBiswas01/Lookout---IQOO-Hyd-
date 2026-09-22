// Session state for one room sweep.
//
// DESIGN RULE: callers hand this RAW SIGNALS, never a verdict. The verdict is
// computed here by running those signals through logic/verdict.js, so there
// is exactly ONE place in the codebase that decides what RED means. If a
// screen could pass in its own verdict, rule 2 (magnetic alone can never be
// RED) would only be as strong as the most careless call site.

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { classifySignals, sessionSummary, sessionVerdict } from "../logic/verdict.js"

const SessionContext = createContext(null)

let nextSpotId = 1

export function SessionProvider({ children }) {
	const [spots, setSpots] = useState([])

	/**
	 * Flag a spot.
	 * @param signals  raw signal bundle from logic/fusion.js buildSignals()
	 * @param evidence raw data the user can inspect later
	 * @param mode     which scan mode was running
	 */
	const addSpot = useCallback((signals, evidence, mode) => {
		const { verdict, headline, reasons, copy } = classifySignals(signals)
		const spot = {
			id: `spot_${Date.now()}_${nextSpotId++}`,
			timestamp: Date.now(),
			mode,
			signals,
			evidence,
			verdict,
			headline,
			reasons,
			copy,
		}
		setSpots((prev) => [...prev, spot])
		return spot
	}, [])

	const clearSession = useCallback(() => {
		setSpots([])
	}, [])

	const value = useMemo(
		() => ({
			spots,
			addSpot,
			clearSession,
			verdict: sessionVerdict(spots),
			summary: sessionSummary(spots),
		}),
		[spots, addSpot, clearSession],
	)

	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
	const ctx = useContext(SessionContext)
	if (!ctx) throw new Error("useSession must be used inside a SessionProvider")
	return ctx
}
