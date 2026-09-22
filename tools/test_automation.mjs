// ============================================================================
// AUTOMATION TEST SUITE - Hidden Camera Finder
//
// Validates all core algorithms, mathematics, signal fusion, and verdict rules
// in isolation using reproducible synthetic test fixtures.
// Run with: node tools/test_automation.mjs
// ============================================================================

import {
	createSweepState,
	magnitude,
	pushSample,
} from "../src/logic/magnetometer.js"
import {
	brightnessThreshold,
	detectGlints,
	filterBlobs,
	findBlobs,
	meanIntensity,
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
import { GLINT } from "../src/config.js"

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
	console.log(`\n=== Suite: ${title} ===`)
}

// Helpers
function createMockRgba(w, h, fillVal = 0) {
	const buf = new Uint8Array(w * h * 4)
	for (let i = 0; i < w * h; i++) {
		buf[i * 4 + 0] = fillVal
		buf[i * 4 + 1] = fillVal
		buf[i * 4 + 2] = fillVal
		buf[i * 4 + 3] = 255
	}
	return buf
}

function drawCircle(rgba, w, h, cx, cy, r, intensity = 255) {
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const dx = x - cx
			const dy = y - cy
			if (dx * dx + dy * dy <= r * r) {
				const idx = (y * w + x) * 4
				rgba[idx] = intensity
				rgba[idx + 1] = intensity
				rgba[idx + 2] = intensity
			}
		}
	}
}

// ----------------------------------------------------------------------------
// SUITE 1: Magnetometer Signal Processing
// ----------------------------------------------------------------------------
suite("1. Magnetometer Signal Processing")

assert("3D Euclidean magnitude of (0, 0, 0) is 0", magnitude(0, 0, 0) === 0)
assert("3D magnitude of (3, 4, 0) is 5", magnitude(3, 4, 0) === 5)
assert("3D magnitude handles negative coordinates (-6, 8, 0)", magnitude(-6, 8, 0) === 10)

{
	const state = createSweepState()
	assert("Newly created sweep state has sampleCount 0", state.sampleCount === 0)

	// Feed 15 samples (< 20 required for baseline warm-up)
	for (let i = 0; i < 15; i++) {
		const res = pushSample(state, 45, 0, 0, i * 100)
		assert("Warm-up status reported in result", res.warmingUp === true)
	}

	// Complete the remaining samples up to 21
	let lastRes = null
	for (let i = 15; i < 21; i++) {
		lastRes = pushSample(state, 45, 0, 0, i * 100)
	}
	assert("Warming up completes once sampleCount >= 20", lastRes.warmingUp === false)
	assert("Learned baseline approximates 45 uT", Math.abs(lastRes.baseline - 45) < 0.5, `baseline=${lastRes.baseline.toFixed(1)}`)
}

{
	// Test spike detection and debouncing (requires 3 sustained samples)
	const state = createSweepState()
	for (let i = 0; i < 25; i++) pushSample(state, 40, 0, 0, i * 100)

	// Introduce a +40% deviation spike (56 uT) across consecutive samples
	pushSample(state, 56, 0, 0, 3000)
	pushSample(state, 56, 0, 0, 3100)
	const spikeRes = pushSample(state, 56, 0, 0, 3200)
	assert("Spike fires after 3 sustained +40% field jump samples", spikeRes.isNewSpike === true)
	assert("Spike deviation calculation is accurate", Math.abs(spikeRes.deviation - 0.40) < 0.05, `dev=${spikeRes.deviation}`)

	// Immediately following sample (cooldown period) should NOT trigger isNewSpike
	const spikeResCooldown = pushSample(state, 57, 0, 0, 3300)
	assert("Spike debounces during cooldown window", spikeResCooldown.isNewSpike === false)
}

// ----------------------------------------------------------------------------
// SUITE 2: Computer Vision Blob & Glint Detection
// ----------------------------------------------------------------------------
suite("2. Computer Vision Blob & Glint Detection")

{
	const W = 64
	const H = 48
	const rgba = createMockRgba(W, H, 50)
	const gray = toGrayscale(rgba, W, H)

	assert("Grayscale buffer length matches W * H", gray.length === W * H)
	assert("Mean intensity calculation is accurate", Math.round(meanIntensity(gray)) === 50)

	const thresh = brightnessThreshold(gray)
	assert("Threshold enforces absolute floor (200)", thresh >= GLINT.MIN_ABSOLUTE_BRIGHTNESS, `thresh=${thresh}`)
}

{
	// Detect circular pinhole reflection vs large light vs streak
	const W = 100
	const H = 80
	const rgba = createMockRgba(W, H, 30)

	// 1. Valid pinhole lens glint: circle at (30, 40) with radius 3 (area ~28 px)
	drawCircle(rgba, W, H, 30, 40, 3, 255)

	// 2. Large window/lamp: circle at (75, 40) with radius 15 (area > 700 px, exceeds max area)
	drawCircle(rgba, W, H, 75, 40, 15, 255)

	const gray = toGrayscale(rgba, W, H)
	const thresh = brightnessThreshold(gray)
	const rawBlobs = findBlobs(gray, W, H, thresh)

	assert("findBlobs finds both bright regions", rawBlobs.length === 2, `found=${rawBlobs.length}`)

	const { kept, rejected } = filterBlobs(rawBlobs, meanIntensity(gray))
	assert("filterBlobs retains exactly 1 pinhole candidate", kept.length === 1)
	assert("filterBlobs rejects large lamp for area", rejected.some((r) => r.reason.includes("too large")))
	assert("Candidate centroid matches pinhole location", Math.abs(kept[0].x - 30) <= 1 && Math.abs(kept[0].y - 40) <= 1)
}

// ----------------------------------------------------------------------------
// SUITE 3: Multi-Frame Temporal Persistence Tracking
// ----------------------------------------------------------------------------
suite("3. Multi-Frame Temporal Persistence Tracking")

{
	resetTrackIds()
	const tracker = createTrackerState()

	// Feed candidate at (50, 50) over consecutive frames
	let currentTracks = []
	for (let frame = 0; frame < 7; frame++) {
		const candidates = [{ x: 50 + (frame % 2) * 0.5, y: 50, area: 25, meanIntensity: 255 }]
		currentTracks = updateTracks(tracker, candidates, frame * 200)
	}

	assert("Track accumulates persistence over 7 frames", currentTracks[0].persistence >= 6)
	const strong = strongTracks(currentTracks)
	assert("Candidate escalates to strongTrack when persistence >= STRONG_PERSISTENCE_FRAMES", strong.length === 1)
}

{
	// Non-persistent flickering glint
	resetTrackIds()
	const tracker = createTrackerState()

	// Flash for 1 frame then vanish for 5 frames
	updateTracks(tracker, [{ x: 20, y: 20, area: 20, meanIntensity: 250 }], 1000)
	for (let f = 1; f < 6; f++) {
		updateTracks(tracker, [], 1000 + f * 500)
	}
	assert("Transient flash track is evicted after missing frames", tracker.tracks.length === 0)
}

// ----------------------------------------------------------------------------
// SUITE 4: Sensor Fusion Correlation
// ----------------------------------------------------------------------------
suite("4. Sensor Fusion Correlation")

{
	const fusion = createFusionState()
	const t0 = 50000

	noteMagneticSpike(fusion, 0.45, t0)
	noteGlint(fusion, 6, t0 + 1200) // 1.2s later (well within 3s window)

	const signals = buildSignals(fusion, "glint", { persistence: 6 }, t0 + 1200)
	assert("Sensor fusion correlates magnetic spike with subsequent glint", signals.magnetic === true)
	assert("Signals retain correct glint persistence", signals.glintPersistence === 6)
}

{
	const fusion = createFusionState()
	const t0 = 50000

	noteMagneticSpike(fusion, 0.35, t0)
	// Query 15 seconds later (expired correlation window)
	const signals = buildSignals(fusion, "glint", { persistence: 2 }, t0 + 15000)
	assert("Sensor fusion drops stale magnetic spike after timeout", signals.magnetic === false)
}

// ----------------------------------------------------------------------------
// SUITE 5: Verdict Classification Rules
// ----------------------------------------------------------------------------
suite("5. Verdict Classification Rules")

{
	// Rule 1: High persistence glint -> RED
	const res = classifySignals({ glint: true, glintPersistence: 6, magnetic: false })
	assert("Strong glint alone evaluates to RED", res.verdict === VERDICT.RED)
}

{
	// Rule 2: Magnetic spike alone -> strictly YELLOW, never RED
	const res = classifySignals({ glint: false, magnetic: true, magneticDeviation: 0.85 })
	assert("Magnetic spike alone NEVER evaluates to RED", res.verdict === VERDICT.YELLOW)
	assert("Magnetic headline does not falsely claim a camera", !res.headline.toLowerCase().includes("camera"))
}

{
	// Rule 3: Brief glint + magnetic escalation -> RED
	const res = classifySignals({ glint: true, glintPersistence: 2, magnetic: true })
	assert("Brief glint + magnetic escalation evaluates to RED", res.verdict === VERDICT.RED)
}

{
	// Rule 4: Clean baseline -> GREEN Clear
	const res = classifySignals({ glint: false, magnetic: false, ir: false })
	assert("No anomalous signals evaluates to GREEN", res.verdict === VERDICT.GREEN)
	assert("GREEN copy says 'Clear', never 'Safe'", res.copy === "Clear")
}

{
	// Summary aggregation
	const spots = [
		{ verdict: VERDICT.GREEN },
		{ verdict: VERDICT.YELLOW },
		{ verdict: VERDICT.RED },
	]
	assert("Session verdict returns worst-case spot (RED)", sessionVerdict(spots) === VERDICT.RED)
}

// ----------------------------------------------------------------------------
console.log("\n" + "=".repeat(60))
console.log(`AUTOMATION SUITE RESULT: ${passed} passed, ${failed} failed`)
console.log("=".repeat(60) + "\n")

process.exit(failed === 0 ? 0 : 1)
