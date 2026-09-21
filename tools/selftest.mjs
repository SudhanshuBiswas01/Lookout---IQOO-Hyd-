// ============================================================================
// SELF TEST - runs the REAL detection code against synthetic data.
//
// No device, no camera, no dependencies. Just:  node tools/selftest.mjs
//
// This exists for three reasons:
//   1. It proves the algorithm works, independently of the camera plumbing.
//   2. It locks the safety rules - a magnetic spike can never go RED, and no
//      confidence score can ever creep into the copy.
//   3. IT IS THE FALLBACK DEMO. If the live scan fails on stage, run this on
//      a laptop and walk the judges through it.
//
// It imports the exact same files the app imports. Nothing is duplicated.
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

function check(label, condition, detail) {
	if (condition) {
		passed++
		console.log(`  PASS  ${label}${detail ? `  (${detail})` : ""}`)
	} else {
		failed++
		console.log(`  FAIL  ${label}${detail ? `  (${detail})` : ""}`)
	}
}

function section(title) {
	console.log(`\n${title}`)
	console.log("-".repeat(title.length))
}

// ============================================================================
// 1. MAGNETOMETER
// ============================================================================
section("1. Magnetometer")

check("magnitude of (3,4,0) is 5", magnitude(3, 4, 0) === 5)

// A quiet room must stay silent. A detector that fires everywhere is worse
// than no detector, and a judge notices within ten seconds.
{
	const st = createSweepState()
	let spikes = 0
	for (let i = 0; i < 200; i++) {
		// 45 uT with ~1% jitter, a realistic indoor baseline
		const v = 45 + Math.sin(i / 3) * 0.4
		const r = pushSample(st, v, 0, 0, i * 100)
		if (r.isNewSpike) spikes++
	}
	check("no false spike on a quiet baseline", spikes === 0, `${spikes} spikes`)
}

// Walking the phone toward a metal object must fire.
{
	const st = createSweepState()
	for (let i = 0; i < 40; i++) pushSample(st, 45, 0, 0, i * 100)

	let fired = false
	let dev = 0
	for (let i = 40; i < 50; i++) {
		const r = pushSample(st, 62, 0, 0, i * 100) // 62/45 = +38%
		if (r.isNewSpike) {
			fired = true
			dev = r.deviation
		}
	}
	check(
		"spike fires on a sustained 38% rise",
		fired,
		`deviation ${Math.round(dev * 100)}%`,
	)
}

// One noisy sample is not a spike. This is the SPIKE_SUSTAIN_SAMPLES rule.
{
	const st = createSweepState()
	for (let i = 0; i < 40; i++) pushSample(st, 45, 0, 0, i * 100)
	const r = pushSample(st, 90, 0, 0, 4100)
	check("one stray sample does not fire a spike", !r.isNewSpike)
}

// ============================================================================
// 2. BLOB DETECTION
//
// Build a synthetic 160x120 frame containing three things:
//   - a small bright DISC        -> this is what a lens looks like, KEEP
//   - a large bright RECTANGLE   -> this is a window,               REJECT
//   - a thin bright STREAK       -> this is a specular edge,        REJECT
// ============================================================================
section("2. Blob detection")

const W = 160
const H = 120

function blankFrame(bg = 40) {
	const rgba = new Uint8Array(W * H * 4)
	for (let i = 0; i < W * H; i++) {
		rgba[i * 4] = bg
		rgba[i * 4 + 1] = bg
		rgba[i * 4 + 2] = bg
		rgba[i * 4 + 3] = 255
	}
	return rgba
}

function paintDisc(rgba, cx, cy, radius, value) {
	for (let y = cy - radius; y <= cy + radius; y++) {
		for (let x = cx - radius; x <= cx + radius; x++) {
			if (x < 0 || y < 0 || x >= W || y >= H) continue
			const dx = x - cx
			const dy = y - cy
			if (dx * dx + dy * dy > radius * radius) continue
			const p = (y * W + x) * 4
			rgba[p] = value
			rgba[p + 1] = value
			rgba[p + 2] = value
		}
	}
}

function paintRect(rgba, x0, y0, w, h, value) {
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			if (x < 0 || y < 0 || x >= W || y >= H) continue
			const p = (y * W + x) * 4
			rgba[p] = value
			rgba[p + 1] = value
			rgba[p + 2] = value
		}
	}
}

{
	const rgba = blankFrame(40)
	paintDisc(rgba, 40, 30, 3, 255) // the lens
	paintRect(rgba, 100, 10, 40, 40, 255) // the window
	paintRect(rgba, 20, 90, 60, 2, 255) // the streak

	const gray = toGrayscale(rgba, W, H)
	check("grayscale length matches pixel count", gray.length === W * H)
	check("background reads back as ~40", Math.abs(gray[0] - 40) <= 1, `got ${gray[0]}`)

	const threshold = brightnessThreshold(gray)
	check(
		"threshold respects the absolute floor",
		threshold >= GLINT.MIN_ABSOLUTE_BRIGHTNESS,
		`threshold ${threshold}`,
	)

	const blobs = findBlobs(gray, W, H, threshold)
	check("finds all three bright regions", blobs.length === 3, `found ${blobs.length}`)

	const { kept, rejected } = filterBlobs(blobs, meanIntensity(gray))
	check("keeps exactly one candidate", kept.length === 1, `kept ${kept.length}`)

	if (kept.length === 1) {
		const b = kept[0]
		check(
			"the kept blob is the disc at (40,30)",
			Math.abs(b.x - 40) < 2 && Math.abs(b.y - 30) < 2,
			`at (${b.x.toFixed(1)}, ${b.y.toFixed(1)})`,
		)
	}

	check(
		"rejects the window for being too large",
		rejected.some((r) => r.reason.includes("too large")),
	)
	check(
		"rejects the streak for shape",
		rejected.some(
			(r) => r.reason.includes("elongated") || r.reason.includes("not round"),
		),
	)
}

// A dark frame with nothing in it must produce nothing.
{
	const rgba = blankFrame(5)
	const gray = toGrayscale(rgba, W, H)
	const result = detectGlints(gray, W, H)
	check("a black frame produces zero candidates", result.candidates.length === 0)
}

// ============================================================================
// 3. PERSISTENCE TRACKER
//
// The single most important behaviour in the app: a lens holds across frames,
// a sticker flashes and dies.
// ============================================================================
section("3. Persistence tracker")

{
	resetTrackIds()
	const st = createTrackerState()
	let best = 0
	// A lens stays visible, drifting slightly as the hand moves.
	for (let f = 0; f < 6; f++) {
		const tracks = updateTracks(
			st,
			[{ x: 40 + f * 0.8, y: 30, area: 20, meanIntensity: 250 }],
			f * 300,
		)
		best = Math.max(best, ...tracks.map((t) => t.persistence))
	}
	check(
		"a lens accumulates persistence and goes strong",
		best >= GLINT.STRONG_PERSISTENCE_FRAMES,
		`persistence ${best}`,
	)
}

{
	resetTrackIds()
	const st = createTrackerState()
	let everStrong = false
	// A sticker: visible for one frame, gone for four, repeatedly.
	for (let f = 0; f < 20; f++) {
		const visible = f % 5 === 0
		const tracks = updateTracks(
			st,
			visible ? [{ x: 80, y: 60, area: 18, meanIntensity: 250 }] : [],
			f * 300,
		)
		if (strongTracks(tracks).length > 0) everStrong = true
	}
	check("an intermittent sticker never reaches strong", !everStrong)
}

{
	resetTrackIds()
	const st = createTrackerState()
	let tracks = []
	for (let f = 0; f < 4; f++) {
		tracks = updateTracks(
			st,
			[
				{ x: 30, y: 30, area: 20, meanIntensity: 250 },
				{ x: 120, y: 90, area: 20, meanIntensity: 250 },
			],
			f * 300,
		)
	}
	check("two distinct spots stay two distinct tracks", tracks.length === 2)
}

// ============================================================================
// 4. VERDICT RULES
//
// These assertions are the product's conscience. If one of these ever starts
// failing, the app has become dishonest.
// ============================================================================
section("4. Verdict rules (these are the ones that matter)")

{
	// Rule 1: the plastic-housing camera case. Glint alone MUST be able to
	// reach RED, or the app is blind to exactly what it exists to catch.
	const r = classifySignals({ glint: true, glintPersistence: 5 })
	check("strong glint alone reaches RED", r.verdict === VERDICT.RED, r.verdict)
}

{
	// Rule 2: the one that stops the app crying wolf on every screw in India.
	const r = classifySignals({ magnetic: true, magneticDeviation: 0.9 })
	check(
		"magnetic spike alone can NEVER reach RED",
		r.verdict === VERDICT.YELLOW,
		r.verdict,
	)
	check(
		"magnetic copy never says 'camera'",
		!r.headline.toLowerCase().includes("camera"),
		r.headline,
	)
}

{
	const r = classifySignals({ glint: true, glintPersistence: 1 })
	check("a one-frame glint is only YELLOW", r.verdict === VERDICT.YELLOW, r.verdict)
}

{
	const r = classifySignals({
		glint: true,
		glintPersistence: 1,
		magnetic: true,
		magneticDeviation: 0.3,
	})
	check("brief glint plus metal escalates to RED", r.verdict === VERDICT.RED, r.verdict)
}

{
	const r = classifySignals({ ir: true })
	check("IR alone is only YELLOW", r.verdict === VERDICT.YELLOW)
}

{
	const r = classifySignals({})
	check("no signal is GREEN", r.verdict === VERDICT.GREEN)
	// Rule 4: absence of signal is not proof of absence.
	check(
		"GREEN copy says 'Clear', never 'Safe'",
		r.copy.includes("Clear") && !r.copy.toLowerCase().includes("safe"),
		r.copy,
	)
}

{
	// Rule 5: no invented accuracy numbers anywhere in user-facing copy.
	const samples = [
		classifySignals({ glint: true, glintPersistence: 5 }),
		classifySignals({ magnetic: true, magneticDeviation: 0.4 }),
		classifySignals({ ir: true }),
		classifySignals({}),
	]
	// Allow "38% above baseline" (a measurement) but never "97% confident".
	const bad = /\b\d+(\.\d+)?%\s*(confiden|certain|accura|probab|sure|likel)/i
	const text = samples
		.map((s) => `${s.headline} ${s.copy} ${s.reasons.join(" ")}`)
		.join(" ")
	check("no confidence score appears in any verdict text", !bad.test(text))
}

{
	const spots = [
		{ verdict: VERDICT.GREEN },
		{ verdict: VERDICT.YELLOW },
		{ verdict: VERDICT.RED },
	]
	check("session verdict takes the worst spot", sessionVerdict(spots) === VERDICT.RED)
}

// ============================================================================
// 5. SENSOR FUSION
// ============================================================================
section("5. Sensor fusion")

{
	const st = createFusionState()
	const t0 = 1_000_000
	noteMagneticSpike(st, 0.32, t0)
	const signals = buildSignals(st, "glint", { persistence: 2 }, t0 + 1500)
	check("a magnetic spike 1.5s earlier correlates with a glint", signals.magnetic)
	check(
		"and that combination is RED",
		classifySignals(signals).verdict === VERDICT.RED,
	)
}

{
	const st = createFusionState()
	const t0 = 1_000_000
	noteMagneticSpike(st, 0.32, t0)
	const signals = buildSignals(st, "glint", { persistence: 2 }, t0 + 29_000)
	check("a magnetic spike 29s earlier does NOT correlate", !signals.magnetic)
	check(
		"so the stale pair stays YELLOW",
		classifySignals(signals).verdict === VERDICT.YELLOW,
	)
}

// ============================================================================
// 6. END TO END
//
// Simulate sweeping a room: 25 frames of empty wall, then a lens appears.
// Runs the real pipeline start to finish.
// ============================================================================
section("6. End to end: a synthetic room sweep")

{
	resetTrackIds()
	const tracker = createTrackerState()
	const fusion = createFusionState()
	const mag = createSweepState()
	const spots = []
	const reported = new Set()

	for (let f = 0; f < 40; f++) {
		const now = f * 300

		// Magnetometer: quiet, then metal from frame 22.
		const field = f >= 22 ? 60 : 45
		const m = pushSample(mag, field, 0, 0, now)
		if (m.isNewSpike) noteMagneticSpike(fusion, m.deviation, now)

		// Camera: empty wall, then a lens from frame 25.
		const rgba = blankFrame(40)
		if (f >= 25) paintDisc(rgba, 70, 50, 3, 255)
		const gray = toGrayscale(rgba, W, H)
		const result = detectGlints(gray, W, H)
		const tracks = updateTracks(tracker, result.candidates, now)

		for (const t of strongTracks(tracks)) {
			if (reported.has(t.id)) continue
			reported.add(t.id)
			noteGlint(fusion, t.persistence, now)
			const signals = buildSignals(
				fusion,
				"glint",
				{ persistence: t.persistence },
				now,
			)
			spots.push(classifySignals(signals))
		}
	}

	check("the sweep flags exactly one spot", spots.length === 1, `${spots.length} spots`)
	check("and it is RED", spots[0]?.verdict === VERDICT.RED)
	check(
		"and it carries a human-readable reason",
		!!spots[0]?.reasons?.[0] && spots[0].reasons[0].length > 20,
	)
}

// ============================================================================
console.log("\n" + "=".repeat(52))
console.log(`  ${passed} passed, ${failed} failed`)
console.log("=".repeat(52) + "\n")
process.exit(failed === 0 ? 0 : 1)
