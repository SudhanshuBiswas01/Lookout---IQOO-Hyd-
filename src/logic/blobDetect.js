// ============================================================================
// BRIGHT BLOB DETECTION - pure functions, no React, no camera.
//
// THE PHYSICS (say this to the judges):
// A camera lens is a retroreflector. Light entering it is focused onto the
// sensor and a portion bounces back out along almost the same path it came
// in. So if the torch sits next to the camera lens, a hidden lens throws a
// small, very bright point straight back at you. Flat shiny surfaces reflect
// at an angle instead, so they only flash when you hit the exact mirror angle.
//
// THE PIPELINE:
//   RGBA frame -> grayscale -> brightness threshold -> connected components
//   -> shape and contrast filters -> candidate blobs
//
// Everything here is deliberately classical CV. No model, no training data,
// nothing to download. It runs offline on a low-end phone and we can explain
// every step of it on stage.
// ============================================================================

import { GLINT } from "../config.js"

/** Luminance conversion, ITU-R BT.601 weights. */
export function toGrayscale(rgba, width, height) {
	const out = new Uint8Array(width * height)
	for (let i = 0, p = 0; i < out.length; i++, p += 4) {
		out[i] = (rgba[p] * 299 + rgba[p + 1] * 587 + rgba[p + 2] * 114) / 1000
	}
	return out
}

/** Mean intensity of the whole frame, used for the contrast test. */
export function meanIntensity(gray) {
	let sum = 0
	for (let i = 0; i < gray.length; i++) sum += gray[i]
	return gray.length ? sum / gray.length : 0
}

/**
 * Pick the intensity cutoff that keeps roughly the brightest `topFraction`
 * of pixels. Built from a histogram so it is one pass, not a sort.
 *
 * The MIN_ABSOLUTE_BRIGHTNESS floor matters: in a dark frame the top 1.5% of
 * pixels might be dim grey noise, and without the floor the detector would
 * light up on nothing.
 */
export function brightnessThreshold(
	gray,
	topFraction = GLINT.BRIGHT_TOP_FRACTION,
	floor = GLINT.MIN_ABSOLUTE_BRIGHTNESS,
) {
	const hist = new Uint32Array(256)
	for (let i = 0; i < gray.length; i++) hist[gray[i]]++

	const target = Math.max(1, Math.floor(gray.length * topFraction))
	let count = 0
	let cutoff = 255
	for (let v = 255; v >= 0; v--) {
		count += hist[v]
		if (count >= target) {
			cutoff = v
			break
		}
	}
	return Math.max(cutoff, floor)
}

/**
 * Connected-component labelling over the thresholded mask, 8-connectivity.
 *
 * Iterative flood fill with an explicit stack - a recursive version blows the
 * JS stack on a large bright region such as a window.
 */
export function findBlobs(gray, width, height, threshold) {
	const total = width * height
	const visited = new Uint8Array(total)
	const stack = new Int32Array(total)
	const blobs = []

	for (let seed = 0; seed < total; seed++) {
		if (visited[seed] || gray[seed] < threshold) continue

		let sp = 0
		stack[sp++] = seed
		visited[seed] = 1

		let area = 0
		let sumX = 0
		let sumY = 0
		let sumI = 0
		let minX = width
		let maxX = -1
		let minY = height
		let maxY = -1

		while (sp > 0) {
			const cur = stack[--sp]
			const cx = cur % width
			const cy = (cur / width) | 0

			area++
			sumX += cx
			sumY += cy
			sumI += gray[cur]
			if (cx < minX) minX = cx
			if (cx > maxX) maxX = cx
			if (cy < minY) minY = cy
			if (cy > maxY) maxY = cy

			for (let dy = -1; dy <= 1; dy++) {
				const ny = cy + dy
				if (ny < 0 || ny >= height) continue
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue
					const nx = cx + dx
					if (nx < 0 || nx >= width) continue
					const n = ny * width + nx
					if (visited[n] || gray[n] < threshold) continue
					visited[n] = 1
					stack[sp++] = n
				}
			}
		}

		const bboxW = maxX - minX + 1
		const bboxH = maxY - minY + 1
		blobs.push({
			area,
			x: sumX / area,
			y: sumY / area,
			minX,
			maxX,
			minY,
			maxY,
			bboxW,
			bboxH,
			// How much of the bounding box the blob actually fills.
			// A perfect disc scores pi/4 = 0.785. A diagonal streak scores low.
			fillRatio: area / (bboxW * bboxH),
			// 1.0 = square bounding box. Low = elongated.
			aspectRatio: Math.min(bboxW, bboxH) / Math.max(bboxW, bboxH),
			meanIntensity: sumI / area,
		})
	}

	return blobs
}

/**
 * Keep only blobs that look like a lens return.
 *
 * Each rejection reason is recorded so the app can show a judge exactly why
 * something was thrown out - that transparency is the product.
 */
export function filterBlobs(blobs, frameMean, opts = GLINT) {
	const kept = []
	const rejected = []

	for (const b of blobs) {
		let reason = null
		if (b.area < opts.MIN_BLOB_AREA) reason = "too small - likely sensor noise"
		else if (b.area > opts.MAX_BLOB_AREA)
			reason = "too large - lamp, window or wall highlight"
		else if (b.fillRatio < opts.MIN_FILL_RATIO)
			reason = "not round - streak or irregular shape"
		else if (b.aspectRatio < opts.MIN_ASPECT_RATIO)
			reason = "elongated - not a lens return"
		else if (b.meanIntensity - frameMean < opts.MIN_CONTRAST)
			reason = "not bright enough against the scene"

		if (reason) rejected.push({ ...b, reason })
		else kept.push(b)
	}

	return { kept, rejected }
}

/** Whole pipeline for one frame. */
export function detectGlints(gray, width, height) {
	const threshold = brightnessThreshold(gray)
	const frameMean = meanIntensity(gray)
	const blobs = findBlobs(gray, width, height, threshold)
	const { kept, rejected } = filterBlobs(blobs, frameMean)
	return { threshold, frameMean, candidates: kept, rejected, rawCount: blobs.length }
}
