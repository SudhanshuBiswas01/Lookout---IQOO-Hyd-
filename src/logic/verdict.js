// ============================================================================
// VERDICT ENGINE - pure functions, no React, no sensors.
//
// This file encodes the single most important design decision in the app:
// WHICH SIGNALS ARE ALLOWED TO MEAN WHAT.
//
// Read the rules before changing anything here. They are not arbitrary.
// ============================================================================

import { GLINT } from "../config.js"

export const VERDICT = {
	RED: "RED",
	YELLOW: "YELLOW",
	GREEN: "GREEN",
}

export const VERDICT_COPY = {
	RED: "Strong signal - inspect this spot closely",
	YELLOW: "Possible - worth a second look",
	GREEN: "Clear",
}

const RANK = { GREEN: 0, YELLOW: 1, RED: 2 }

/**
 * Classify one flagged spot from its raw signals.
 *
 * ---------------------------------------------------------------------------
 * THE RULES, AND WHY THEY ARE THESE RULES
 * ---------------------------------------------------------------------------
 *
 * 1. A STRONG GLINT ALONE CAN REACH RED.
 *    Strong means a bright, round, high-contrast return that held position
 *    across several consecutive frames. Persistence is what distinguishes a
 *    retroreflecting lens from a sticker that flashed once.
 *
 *    This rule exists because the threat we care most about - a cheap camera
 *    in a PLASTIC housing - produces almost no magnetic signature. If glint
 *    always needed magnetic confirmation to reach RED, the app would be
 *    systematically blind to exactly the case it was built for.
 *
 * 2. A MAGNETIC SPIKE ALONE CAN NEVER REACH RED. EVER.
 *    The magnetometer detects ferrous metal, not cameras. Buildings are full
 *    of screws, brackets, hinges and wiring. Treating that as evidence of a
 *    camera would make the app cry wolf constantly and would be dishonest.
 *    It is a pre-filter that says "point the real scan here", nothing more.
 *
 * 3. IR NEVER LEADS.
 *    Most modern flagships have an IR-cut filter that makes this impossible.
 *    Where it does work it corroborates; it never carries a verdict alone.
 *
 * 4. GREEN MEANS "NOTHING FOUND", NOT "SAFE".
 *    Absence of signal is not proof of absence. The copy says Clear, never
 *    Safe, and the UI repeats this. We do not certify rooms.
 *
 * 5. NO CONFIDENCE PERCENTAGES.
 *    We have not measured accuracy on a representative sample, so any number
 *    would be invented. Instead every verdict carries its raw evidence and
 *    the user checks it themselves.
 */
export function classifySignals(signals = {}) {
	const {
		glint = false,
		glintPersistence = 0,
		magnetic = false,
		magneticDeviation = 0,
		ir = false,
	} = signals

	const strongGlint =
		glint && glintPersistence >= GLINT.STRONG_PERSISTENCE_FRAMES

	const reasons = []

	if (strongGlint) {
		reasons.push(
			`Lens-like reflection held for ${glintPersistence} consecutive frames. A flat shiny surface flashes once; a lens keeps reflecting light back at the torch.`,
		)
	} else if (glint) {
		reasons.push(
			`Brief bright reflection (${glintPersistence} frame${glintPersistence === 1 ? "" : "s"}). Could be a lens, could be a sticker or screw head. Re-scan this spot slowly.`,
		)
	}

	if (magnetic) {
		reasons.push(
			`Magnetic field ${Math.round(magneticDeviation * 100)}% above the room baseline. This means ferrous metal is present - NOT that a camera is present.`,
		)
	}

	if (ir) {
		reasons.push(
			"Possible infrared source visible with the lights off. Corroborating signal only.",
		)
	}

	let verdict = VERDICT.GREEN
	let headline = "Nothing flagged"

	if (strongGlint) {
		verdict = VERDICT.RED
		headline = magnetic
			? "Lens reflection confirmed, with metal present"
			: "Lens reflection confirmed"
	} else if (glint && magnetic) {
		// Rule 1 handles the strong case. Here the glint was brief, but metal in
		// the same place is real corroboration, so it escalates.
		verdict = VERDICT.RED
		headline = "Reflection and metal in the same spot"
	} else if (glint) {
		verdict = VERDICT.YELLOW
		headline = "Possible lens reflection"
	} else if (magnetic) {
		verdict = VERDICT.YELLOW
		// Deliberate wording. Never "camera detected", never "magnetic signature".
		headline = "Metal object - worth a lens check here"
	} else if (ir) {
		verdict = VERDICT.YELLOW
		headline = "Possible infrared source - worth a lens check"
	}

	if (verdict === VERDICT.GREEN) {
		reasons.push("No signal crossed the detection thresholds.")
	}

	return { verdict, headline, reasons, copy: VERDICT_COPY[verdict] }
}

/** Worst verdict across every spot in the session. */
export function sessionVerdict(spots) {
	if (!spots || spots.length === 0) return VERDICT.GREEN
	return spots.reduce(
		(worst, s) => (RANK[s.verdict] > RANK[worst] ? s.verdict : worst),
		VERDICT.GREEN,
	)
}

/**
 * Summary line for the results screen.
 * Note the wording: "nothing found", never "the room is safe".
 */
export function sessionSummary(spots) {
	const verdict = sessionVerdict(spots)
	const reds = spots.filter((s) => s.verdict === VERDICT.RED).length
	const yellows = spots.filter((s) => s.verdict === VERDICT.YELLOW).length

	if (verdict === VERDICT.GREEN) {
		return "Nothing found in this sweep. That is not the same as proving the room is clear - re-scan anything you could not reach."
	}
	if (verdict === VERDICT.RED) {
		return `${reds} spot${reds === 1 ? "" : "s"} need close physical inspection${yellows ? `, plus ${yellows} worth a second look` : ""}.`
	}
	return `${yellows} spot${yellows === 1 ? "" : "s"} worth a second look. Nothing reached a strong signal.`
}
