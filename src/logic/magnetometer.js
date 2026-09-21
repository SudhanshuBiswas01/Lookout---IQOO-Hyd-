// ============================================================================
// MAGNETOMETER ANALYSIS - pure functions, no React, no sensors, no I/O.
//
// WHAT THIS DETECTS: ferrous metal. That is all.
// WHAT IT DOES NOT DETECT: cameras.
//
// A magnetic spike means "there is metal here" - which could be a camera
// module, or a screw, or a bracket, or wiring in the wall. This is used as a
// cheap pre-filter that tells the user where to point the lens scan. It can
// never produce a RED verdict on its own. See logic/verdict.js.
// ============================================================================

// NOTE: explicit .js extension. Metro resolves it fine, and Node's ESM loader
// requires it - which is what lets tools/selftest.mjs run this exact file
// without a device.
import { MAGNETOMETER } from "../config.js"

/** Field strength in microtesla from the three axis components. */
export function magnitude(x, y, z) {
	return Math.sqrt(x * x + y * y + z * z)
}

/** Fresh analyser state. Keep this in a ref, not in React state. */
export function createSweepState() {
	return {
		buffer: [], // rolling window of recent magnitudes
		consecutiveOver: 0, // how many samples in a row exceeded threshold
		sampleCount: 0,
		lastSpikeAt: 0,
	}
}

/**
 * Feed one reading in, get the current interpretation out.
 *
 * Returns a plain object describing this instant. The caller decides what to
 * do with it (draw a bar, buzz, log a spot).
 */
export function pushSample(state, x, y, z, now = Date.now()) {
	const value = magnitude(x, y, z)

	state.sampleCount += 1

	// Rolling baseline of the recent past. NOTE: the current sample is compared
	// against the window BEFORE being added, otherwise a strong reading drags
	// its own baseline up and partially hides itself.
	const baseline =
		state.buffer.length > 0
			? state.buffer.reduce((a, b) => a + b, 0) / state.buffer.length
			: value

	const warmingUp = state.sampleCount < MAGNETOMETER.WARMUP_SAMPLES

	// How far above the quiet baseline are we, as a fraction.
	const deviation = baseline > 0 ? (value - baseline) / baseline : 0

	const over = !warmingUp && deviation >= MAGNETOMETER.SPIKE_RATIO
	state.consecutiveOver = over ? state.consecutiveOver + 1 : 0

	// Sustained requirement: one noisy sample is not a spike.
	const sustained =
		state.consecutiveOver >= MAGNETOMETER.SPIKE_SUSTAIN_SAMPLES

	// Cooldown stops one metal object generating a wall of log entries.
	const cooledDown = now - state.lastSpikeAt > MAGNETOMETER.COOLDOWN_MS
	const isNewSpike = sustained && cooledDown
	if (isNewSpike) state.lastSpikeAt = now

	// Only feed quiet samples back into the baseline. If we folded spikes in,
	// sweeping slowly across a large metal object would normalise it away.
	if (!over) {
		state.buffer.push(value)
		if (state.buffer.length > MAGNETOMETER.BASELINE_SIZE) state.buffer.shift()
	} else if (state.buffer.length === 0) {
		state.buffer.push(value)
	}

	return {
		value,
		baseline,
		deviation,
		warmingUp,
		over,
		isNewSpike,
		// 0..1 for the UI bar and the haptic pulse rate
		intensity: clamp01(deviation / MAGNETOMETER.DISPLAY_CEILING_RATIO),
	}
}

function clamp01(n) {
	if (Number.isNaN(n)) return 0
	return Math.max(0, Math.min(1, n))
}
