// ============================================================================
// SENSOR FUSION - pure functions.
//
// Combines the magnetometer pre-filter with the glint detector.
//
// Honest limitation, stated out loud: the magnetometer gives us NO spatial
// coordinates. It tells us the field strength where the phone is, not where
// in the frame the metal sits. So "the same area" is approximated by TIME
// proximity - if a magnetic spike and a glint happen within a few seconds of
// each other, the user was sweeping the same spot.
//
// This is a real approximation and we should say so rather than pretend the
// two signals are spatially registered. Production would fuse against device
// pose from the IMU.
// ============================================================================

import { FUSION } from "../config.js"

export function createFusionState() {
	return { lastMagneticSpike: null, lastGlint: null }
}

export function noteMagneticSpike(state, deviation, now = Date.now()) {
	state.lastMagneticSpike = { at: now, deviation }
}

export function noteGlint(state, persistence, now = Date.now()) {
	state.lastGlint = { at: now, persistence }
}

/** Was there a magnetic spike recently enough to count as the same spot? */
export function recentMagnetic(state, now = Date.now()) {
	const m = state.lastMagneticSpike
	if (!m) return null
	return now - m.at <= FUSION.CORRELATION_WINDOW_MS ? m : null
}

/** Was there a glint recently enough to count as the same spot? */
export function recentGlint(state, now = Date.now()) {
	const g = state.lastGlint
	if (!g) return null
	return now - g.at <= FUSION.CORRELATION_WINDOW_MS ? g : null
}

/**
 * Build the signal bundle for a spot being flagged right now.
 * `source` is whichever detector fired; the other is pulled in if it fired
 * recently enough to be plausibly the same location.
 */
export function buildSignals(state, source, payload, now = Date.now()) {
	if (source === "glint") {
		const mag = recentMagnetic(state, now)
		return {
			glint: true,
			glintPersistence: payload.persistence,
			magnetic: !!mag,
			magneticDeviation: mag ? mag.deviation : 0,
			ir: !!payload.ir,
		}
	}

	if (source === "magnetic") {
		const g = recentGlint(state, now)
		return {
			glint: !!g,
			glintPersistence: g ? g.persistence : 0,
			magnetic: true,
			magneticDeviation: payload.deviation,
			ir: false,
		}
	}

	return {
		glint: false,
		glintPersistence: 0,
		magnetic: false,
		magneticDeviation: 0,
		ir: !!payload.ir,
	}
}
