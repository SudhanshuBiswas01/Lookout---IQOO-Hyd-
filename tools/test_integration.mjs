// ============================================================================
// INTEGRATION TEST SUITE - Hidden Camera Finder
//
// End-to-end integration tests simulating complete room sweeps, multi-sensor
// fusion timelines, and session reporting.
// Run with: node tools/test_integration.mjs
// ============================================================================

import {
	createSweepState,
	pushSample,
} from "../src/logic/magnetometer.js"
import {
	brightnessThreshold,
	detectGlints,
	filterBlobs,
	findBlobs,
	toGrayscale,
} from "../src/logic/blobDetect.js"
import {
	createTrackerState,
	resetTrackIds,
	strongTracks,
	updateTracks,
} from "../src/logic/tracker.js"
import {
	VERDICT,
	classifySignals,
	sessionSummary,
	sessionVerdict,
} from "../src/logic/verdict.js"
import {
	buildSignals,
	createFusionState,
	noteGlint,
	noteMagneticSpike,
} from "../src/logic/fusion.js"
import { MODES } from "../src/modes.js"

let passed = 0
let failed = 0

function assert(description, condition, detail = "") {
	if (condition) {
		passed++
		console.log(`  ✓ PASS: ${description}${detail ? ` [${detail}]` : ""}`)
	} else {
		failed++
		console.error(`  ✗ FAIL: ${description}${detail ? ` [${detail}]` : ""}`)
	}
}

function suite(title) {
	console.log(`\n=== Integration Suite: ${title} ===`)
}

// Helpers
function createSyntheticFrame(w, h, bg = 35) {
	const buf = new Uint8Array(w * h * 4)
	for (let i = 0; i < w * h; i++) {
		buf[i * 4 + 0] = bg
		buf[i * 4 + 1] = bg
		buf[i * 4 + 2] = bg
		buf[i * 4 + 3] = 255
	}
	return buf
}

function stampReflection(buf, w, h, cx, cy, radius = 3, val = 255) {
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const dx = x - cx
			const dy = y - cy
			if (dx * dx + dy * dy <= radius * radius) {
				const idx = (y * w + x) * 4
				buf[idx] = val
				buf[idx + 1] = val
				buf[idx + 2] = val
			}
		}
	}
}

// ----------------------------------------------------------------------------
// SCENARIO 1: Clean Room Sweep (Zero Threats)
// ----------------------------------------------------------------------------
suite("1. Clean Room Sweep Workflow (No Threat)")

{
	const mag = createSweepState()
	const tracker = createTrackerState()
	const fusion = createFusionState()
	const spots = []
	const W = 64
	const H = 48

	// Sweep room for 30 frames (representing 30 sensor/camera evaluation ticks)
	for (let i = 0; i < 30; i++) {
		const t = i * 200

		// Magnetometer: Normal ambient magnetic noise (42-45 uT)
		const ambientField = 43 + Math.sin(i / 2) * 1.5
		const m = pushSample(mag, ambientField, 0, 0, t)
		if (m.isNewSpike) {
			noteMagneticSpike(fusion, m.deviation, t)
		}

		// Camera: Uniform wall with slight shadows
		const frame = createSyntheticFrame(W, H, 40)
		const gray = toGrayscale(frame, W, H)
		const glints = detectGlints(gray, W, H)
		const tracks = updateTracks(tracker, glints.candidates, t)

		for (const track of strongTracks(tracks)) {
			noteGlint(fusion, track.persistence, t)
			const sigs = buildSignals(fusion, "glint", { persistence: track.persistence }, t)
			spots.push(classifySignals(sigs))
		}
	}

	assert("Clean room generates zero suspicious spots", spots.length === 0, `spots=${spots.length}`)
	assert("Final session verdict is GREEN", sessionVerdict(spots) === VERDICT.GREEN)
	assert("Session summary reports nothing found", sessionSummary(spots).includes("Nothing found"))
}

// ----------------------------------------------------------------------------
// SCENARIO 2: End-to-End Hidden Lens Detection Inside Electronic Housing
// ----------------------------------------------------------------------------
suite("2. Multi-Sensor Fusion Sweep (Pinhole Lens in Metal Clock)")

{
	resetTrackIds()
	const mag = createSweepState()
	const tracker = createTrackerState()
	const fusion = createFusionState()
	const spots = []
	const reportedTracks = new Set()
	const W = 80
	const H = 60

	// Phase 1: Room warm-up (Frames 0 to 20)
	for (let i = 0; i < 20; i++) {
		pushSample(mag, 45, 0, 0, i * 100)
	}

	// Phase 2: Sensor sweeps toward bedside table:
	// Frame 25: Magnetic field rises to 68 uT (+51% jump above 45 uT baseline)
	// Takes 3 sustained samples (frames 25, 26, 27 -> t = 2700) to confirm spike
	let spikeTimestamp = 0
	for (let i = 20; i < 40; i++) {
		const t = i * 100
		const field = i >= 25 ? 68 : 45
		const m = pushSample(mag, field, 0, 0, t)
		if (m.isNewSpike) {
			spikeTimestamp = t
			noteMagneticSpike(fusion, m.deviation, t)
		}

		// Phase 3: Torch reflects off clock face. Pinhole lens glint appears from Frame 27
		const frame = createSyntheticFrame(W, H, 30)
		if (i >= 27) {
			stampReflection(frame, W, H, 42, 28, 3, 255)
		}

		const gray = toGrayscale(frame, W, H)
		const glints = detectGlints(gray, W, H)
		const tracks = updateTracks(tracker, glints.candidates, t)

		for (const track of strongTracks(tracks)) {
			if (reportedTracks.has(track.id)) continue
			reportedTracks.add(track.id)

			noteGlint(fusion, track.persistence, t)
			const sigs = buildSignals(fusion, "glint", { persistence: track.persistence }, t)
			const spot = {
				id: `spot_${t}_${spots.length + 1}`,
				timestamp: t,
				signals: sigs,
				...classifySignals(sigs),
			}
			spots.push(spot)
		}
	}

	assert("Spike timestamp recorded properly after 3 sustained samples (t=2700)", spikeTimestamp === 2700)
	assert("Exactly 1 target spot flagged during sweep", spots.length === 1)
	assert("Correlated target spot receives RED verdict", spots[0].verdict === VERDICT.RED)
	assert(
		"Evidence reasons cite both optical reflection and metal correlation",
		spots[0].reasons.some((r) => r.includes("reflection") || r.includes("reflecting")) &&
		spots[0].reasons.some((r) => r.includes("metal") || r.includes("Metal")),
		`reasonsCount=${spots[0].reasons.length}`
	)
	assert("Overall session verdict is RED", sessionVerdict(spots) === VERDICT.RED)
}

// ----------------------------------------------------------------------------
// SCENARIO 3: Multi-Spot Session Rollup and Mode Routing
// ----------------------------------------------------------------------------
suite("3. Multi-Spot Session Rollup & Scan Modes")

{
	// Simulate user scanning in different modes:
	// Spot 1: Magnetometer mode found metal radiator (YELLOW)
	const spot1 = {
		id: "spot_1",
		mode: MODES.MAGNET,
		verdict: VERDICT.YELLOW,
		headline: "Metal object - worth a lens check here",
	}

	// Spot 2: Lens mode found specular glare off shiny ceramic cup (YELLOW, 1 frame flash)
	const spot2 = {
		id: "spot_2",
		mode: MODES.LENS,
		verdict: VERDICT.YELLOW,
		headline: "Brief reflection - check from another angle",
	}

	// Spot 3: Dark room scan found continuous IR emitter (YELLOW)
	const spot3 = {
		id: "spot_3",
		mode: MODES.DARK,
		verdict: VERDICT.YELLOW,
		headline: "Infrared source detected",
	}

	const sessionA = [spot1, spot2, spot3]
	assert("Session with multiple YELLOW spots evaluates to overall YELLOW", sessionVerdict(sessionA) === VERDICT.YELLOW)
	assert("Session summary accurately tallies spot count", sessionSummary(sessionA).includes("3 spots"))

	// Add 1 RED spot to session
	const spot4 = {
		id: "spot_4",
		mode: MODES.LENS,
		verdict: VERDICT.RED,
		headline: "Likely camera lens",
	}
	const sessionB = [...sessionA, spot4]
	assert("Session with any RED spot escalates overall verdict to RED", sessionVerdict(sessionB) === VERDICT.RED)
	assert("Session summary updates count with RED inspection warning", sessionSummary(sessionB).includes("1 spot need close physical inspection") && sessionSummary(sessionB).includes("3 worth a second look"))
}

// ----------------------------------------------------------------------------
console.log("\n" + "=".repeat(60))
console.log(`INTEGRATION SUITE RESULT: ${passed} passed, ${failed} failed`)
console.log("=".repeat(60) + "\n")

process.exit(failed === 0 ? 0 : 1)
