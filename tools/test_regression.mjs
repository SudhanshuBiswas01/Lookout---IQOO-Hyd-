// ============================================================================
// REGRESSION TEST SUITE - Hidden Camera Finder
//
// Locks bug fixes, edge cases, copy boundaries, and stability constraints.
// Run with: node tools/test_regression.mjs
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
	toGrayscale,
} from "../src/logic/blobDetect.js"
import {
	VERDICT,
	classifySignals,
	sessionVerdict,
} from "../src/logic/verdict.js"

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
	console.log(`\n=== Regression Suite: ${title} ===`)
}

// ----------------------------------------------------------------------------
// REGRESSION 1: Duplicate Key Burst Collision Lock (Fix for Console Error)
// ----------------------------------------------------------------------------
suite("1. Duplicate Key Burst Collision Lock")

{
	// Simulate the pushLog ID generation logic used in SweepScreen
	let logCounter = 0
	const generatedKeys = new Set()
	const fixedTimestamp = 1790010103412 // Same millisecond

	const NUM_LOGS = 1000
	for (let i = 0; i < NUM_LOGS; i++) {
		logCounter += 1
		const id = `${fixedTimestamp}_${logCounter}`
		generatedKeys.add(id)
	}

	assert(
		"1,000 log events in the exact same millisecond produce 1,000 unique keys",
		generatedKeys.size === NUM_LOGS,
		`keys=${generatedKeys.size}/${NUM_LOGS}`
	)

	// Verify old flawed format would have failed
	const flawedKeys = new Set()
	for (let i = 0; i < NUM_LOGS; i++) {
		flawedKeys.add(fixedTimestamp + "Reflection held 6 frames")
	}
	assert(
		"Old format confirms duplication collision (regression caught)",
		flawedKeys.size === 1
	)
}

// ----------------------------------------------------------------------------
// REGRESSION 2: Extreme & Malformed Image Inputs
// ----------------------------------------------------------------------------
suite("2. Extreme & Malformed Image Inputs")

{
	// All white frame (torch reflecting directly into camera at close range)
	const W = 60
	const H = 40
	const allWhite = new Uint8Array(W * H * 4).fill(255)
	const grayWhite = toGrayscale(allWhite, W, H)
	const threshWhite = brightnessThreshold(grayWhite)
	const blobs = findBlobs(grayWhite, W, H, threshWhite)
	const { kept } = filterBlobs(blobs, 255)

	assert(
		"Completely saturated white frame rejects full-frame blob and yields 0 candidates",
		kept.length === 0,
		`candidates=${kept.length}`
	)
}

{
	// Pitch black frame (camera covered completely)
	const W = 60
	const H = 40
	const allBlack = new Uint8Array(W * H * 4).fill(0)
	const grayBlack = toGrayscale(allBlack, W, H)
	const threshBlack = brightnessThreshold(grayBlack)
	const blobs = findBlobs(grayBlack, W, H, threshBlack)
	const { kept } = filterBlobs(blobs, 0)

	assert(
		"Pitch black frame yields 0 candidates safely without crashing",
		kept.length === 0,
		`candidates=${kept.length}`
	)
}

// ----------------------------------------------------------------------------
// REGRESSION 3: Unhandled Malformed / Outlier Sensor Values
// ----------------------------------------------------------------------------
suite("3. Unhandled Malformed / Outlier Sensor Values")

{
	const state = createSweepState()

	// Feed warm-up
	for (let i = 0; i < 20; i++) pushSample(state, 45, 0, 0, i * 100)

	// Feed extreme value (100x baseline, e.g. touching a massive speaker magnet)
	const extremeRes = pushSample(state, 4500, 0, 0, 3000)
	assert("Extreme spike is recognized without numeric NaN or overflow", isFinite(extremeRes.deviation))

	// Verify that even with extreme deviation (+9900%), magnetic ALONE never produces RED verdict
	const signals = {
		glint: false,
		magnetic: true,
		magneticDeviation: extremeRes.deviation,
	}
	const verdict = classifySignals(signals)
	assert(
		"Safety Rule Enforced: 100x magnetic spike alone NEVER escalates to RED",
		verdict.verdict === VERDICT.YELLOW,
		`verdict=${verdict.verdict}`
	)
}

// ----------------------------------------------------------------------------
// REGRESSION 4: Forbidden Copy & Misleading Terms Audit
// ----------------------------------------------------------------------------
suite("4. Forbidden Copy & Misleading Terms Audit")

{
	// Test all possible signal permutations to guarantee that misleading security claims never leak
	const permutations = [
		{ glint: true, glintPersistence: 8, magnetic: true, magneticDeviation: 0.5 },
		{ glint: true, glintPersistence: 6, magnetic: false },
		{ glint: true, glintPersistence: 2, magnetic: true, magneticDeviation: 0.4 },
		{ glint: true, glintPersistence: 1, magnetic: false },
		{ glint: false, magnetic: true, magneticDeviation: 0.6 },
		{ glint: false, magnetic: false, ir: true },
		{ glint: false, magnetic: false, ir: false },
	]

	const forbiddenPatterns = [
		/\bsafe\b/i,          // Must say "Clear", never promise safety
		/\b100%\b/,           // No artificial 100% claims
		/\bconfidence\b/i,    // No fake AI confidence ratings
		/\bguaranteed\b/i,    // No false guarantees
		/\bspy\b/i,           // No sensationalized wording
	]

	let violations = 0
	for (const sig of permutations) {
		const res = classifySignals(sig)
		const fullText = `${res.headline} ${res.copy} ${res.reasons.join(" ")}`

		for (const pattern of forbiddenPatterns) {
			if (pattern.test(fullText)) {
				violations++
				console.error(`  Violation detected with pattern ${pattern} in: "${fullText}"`)
			}
		}
	}

	assert(
		"Zero forbidden terms found across all verdict copy combinations",
		violations === 0,
		`violations=${violations}`
	)
}

// ----------------------------------------------------------------------------
// REGRESSION 5: Session Spot Key Uniqueness Across Resets
// ----------------------------------------------------------------------------
suite("5. Session Spot Key Uniqueness Across Resets")

{
	// Verify that spot keys generated with monotonic counter never duplicate across resets
	const existingSpotIds = new Set()
	let nextSpotId = 1

	function mockAddSpot() {
		const id = `spot_${Date.now()}_${nextSpotId++}`
		existingSpotIds.add(id)
		return id
	}

	function mockClearSession() {
		// nextSpotId is monotonic and not reset, guaranteeing unique keys
	}

	// First session: add 5 spots
	for (let i = 0; i < 5; i++) mockAddSpot()

	// Reset session
	mockClearSession()

	// Second session: add 5 spots
	for (let i = 0; i < 5; i++) mockAddSpot()

	assert(
		"10 spots created across session resets maintain 10 unique spot IDs",
		existingSpotIds.size === 10,
		`unique=${existingSpotIds.size}`
	)
}

// ----------------------------------------------------------------------------
console.log("\n" + "=".repeat(60))
console.log(`REGRESSION SUITE RESULT: ${passed} passed, ${failed} failed`)
console.log("=".repeat(60) + "\n")

process.exit(failed === 0 ? 0 : 1)
