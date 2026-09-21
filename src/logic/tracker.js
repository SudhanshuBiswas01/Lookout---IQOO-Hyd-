// ============================================================================
// PERSISTENCE TRACKER - pure functions.
//
// THIS IS THE MOST IMPORTANT FILE IN THE DETECTION PIPELINE.
//
// Single-frame blob detection cannot tell a camera lens from a shiny sticker,
// a screw head, or a drop of water. Both produce a small bright round spot.
//
// What separates them is behaviour over time:
//
//   A LENS retroreflects. It sends light back along the path it arrived on,
//   so it stays lit across many frames while you move the phone around.
//
//   A FLAT SHINY SURFACE reflects specularly. It only lights up at the exact
//   mirror angle, so it flashes for one or two frames and then vanishes.
//
// So we track blobs across frames and count how many consecutive frames each
// one survives. That count - persistence - is what upgrades a maybe into a
// strong signal. Nothing else in single-frame processing can do this job.
// ============================================================================

import { GLINT } from "../config.js"

let nextTrackId = 1

export function createTrackerState() {
	return { tracks: [] }
}

/** Reset ids between sessions so logs stay readable. */
export function resetTrackIds() {
	nextTrackId = 1
}

function distance(a, b) {
	const dx = a.x - b.x
	const dy = a.y - b.y
	return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Advance the tracker by one frame.
 *
 * Greedy nearest-neighbour matching. Good enough here because glint
 * candidates are sparse - usually zero to three per frame. A real production
 * build would use Hungarian assignment or a Kalman filter.
 */
export function updateTracks(state, candidates, now = Date.now()) {
	const unmatched = [...candidates]

	for (const track of state.tracks) {
		let bestIdx = -1
		let bestDist = Infinity
		for (let i = 0; i < unmatched.length; i++) {
			const d = distance(track, unmatched[i])
			if (d < bestDist) {
				bestDist = d
				bestIdx = i
			}
		}

		if (bestIdx >= 0 && bestDist <= GLINT.TRACK_MATCH_DISTANCE) {
			const blob = unmatched.splice(bestIdx, 1)[0]
			// Smooth the position slightly so the overlay circle does not jitter.
			track.x = track.x * 0.4 + blob.x * 0.6
			track.y = track.y * 0.4 + blob.y * 0.6
			track.blob = blob
			track.persistence += 1
			track.misses = 0
			track.lastSeen = now
			if (blob.meanIntensity > track.peakIntensity)
				track.peakIntensity = blob.meanIntensity
		} else {
			track.misses += 1
		}
	}

	// Anything left over is something we have not seen before.
	for (const blob of unmatched) {
		state.tracks.push({
			id: nextTrackId++,
			x: blob.x,
			y: blob.y,
			blob,
			persistence: 1,
			misses: 0,
			firstSeen: now,
			lastSeen: now,
			peakIntensity: blob.meanIntensity,
			reported: false,
		})
	}

	// A track that misses a couple of frames in a row is gone. Dropping it
	// means a sticker that flashes twice in ten seconds never accumulates
	// persistence - the count has to be CONSECUTIVE to mean anything.
	state.tracks = state.tracks.filter((t) => t.misses <= GLINT.TRACK_MAX_MISSES)

	return state.tracks
}

/** Tracks that have survived long enough to count as a strong glint. */
export function strongTracks(tracks) {
	return tracks.filter(
		(t) => t.persistence >= GLINT.STRONG_PERSISTENCE_FRAMES && t.misses === 0,
	)
}

/** Live tracks worth drawing on screen right now. */
export function visibleTracks(tracks) {
	return tracks.filter((t) => t.misses === 0)
}
