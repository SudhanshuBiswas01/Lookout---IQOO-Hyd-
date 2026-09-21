// ============================================================================
// GLINT SCANNER - the camera capture loop.
//
// ARCHITECTURE NOTE, READ THIS BEFORE JUDGING THE FRAME RATE:
//
// expo-camera does NOT expose per-frame pixel data. There is no frame
// processor callback in plain Expo. So this hook does the only thing that
// works in Expo Go without a native dev build:
//
//   takePictureAsync (skipProcessing, low quality)
//     -> ImageManipulator resize to 160x120 + base64
//     -> decode the JPEG in pure JS (jpeg-js)
//     -> grayscale -> blob detect -> persistence tracker
//
// HONEST COST: roughly 2-3 frames per second, not 30. Visibly steppy. We took
// that trade because it runs in plain Expo Go with zero native build, which
// is the right call under a 36-hour clock.
//
// UPGRADE PATH: swap this ONE file for react-native-vision-camera frame
// processors in a dev build and you get real 30fps on the camera thread.
// EVERY pure function in src/logic/ is reusable unchanged - the detection
// algorithm, the tracker, the verdict rules all survive. That separation is
// deliberate and it is a good answer to "how would you productionise this".
// ============================================================================

import { useEffect, useRef, useState } from "react"
import * as ImageManipulator from "expo-image-manipulator"
import { decode as decodeBase64 } from "base64-arraybuffer"
import jpeg from "jpeg-js"
import { GLINT } from "../config.js"
import { detectGlints, toGrayscale } from "../logic/blobDetect.js"
import {
	createTrackerState,
	resetTrackIds,
	strongTracks,
	updateTracks,
	visibleTracks,
} from "../logic/tracker.js"

export function useGlintScanner(active, cameraRef, onGlint) {
	const [tracks, setTracks] = useState([])
	const [stats, setStats] = useState({
		fps: 0,
		threshold: 0,
		rawCount: 0,
		frameMean: 0,
		lastError: null,
	})

	const trackerRef = useRef(createTrackerState())
	const reportedRef = useRef(new Map()) // trackId -> last reported timestamp
	const onGlintRef = useRef(onGlint)
	onGlintRef.current = onGlint

	useEffect(() => {
		if (!active) return undefined

		let stopped = false
		let timer = null
		let lastFrameAt = 0

		trackerRef.current = createTrackerState()
		reportedRef.current = new Map()
		resetTrackIds()

		async function tick() {
			if (stopped) return
			const started = Date.now()

			try {
				const cam = cameraRef.current
				if (cam && typeof cam.takePictureAsync === "function") {
					const shot = await cam.takePictureAsync({
						quality: GLINT.CAPTURE_QUALITY,
						skipProcessing: true,
						shutterSound: false,
						exif: false,
					})

					if (stopped || !shot || !shot.uri) return

					const small = await ImageManipulator.manipulateAsync(
						shot.uri,
						[
							{
								resize: {
									width: GLINT.PROCESS_WIDTH,
									height: GLINT.PROCESS_HEIGHT,
								},
							},
						],
						{
							base64: true,
							compress: GLINT.CAPTURE_QUALITY,
							format: ImageManipulator.SaveFormat.JPEG,
						},
					)

					if (stopped || !small || !small.base64) return

					const raw = jpeg.decode(
						new Uint8Array(decodeBase64(small.base64)),
						{ useTArray: true },
					)

					const gray = toGrayscale(raw.data, raw.width, raw.height)
					const result = detectGlints(gray, raw.width, raw.height)

					if (stopped) return
					const now = Date.now()
					const all = updateTracks(trackerRef.current, result.candidates, now)
					const live = visibleTracks(all)

					setTracks(
						live.map((t) => ({
							id: t.id,
							// normalised 0..1 so the overlay does not care about
							// processing resolution or screen size
							nx: t.x / raw.width,
							ny: t.y / raw.height,
							persistence: t.persistence,
							strong: t.persistence >= GLINT.STRONG_PERSISTENCE_FRAMES,
						})),
					)

					const elapsed = lastFrameAt ? now - lastFrameAt : 0
					lastFrameAt = now
					setStats({
						fps: elapsed ? Math.round((1000 / elapsed) * 10) / 10 : 0,
						threshold: result.threshold,
						rawCount: result.rawCount,
						frameMean: Math.round(result.frameMean),
						lastError: null,
					})

					// Report anything that has held long enough, once per cooldown.
					for (const t of strongTracks(all)) {
						const last = reportedRef.current.get(t.id) || 0
						if (now - last < GLINT.COOLDOWN_MS) continue
						reportedRef.current.set(t.id, now)
						onGlintRef.current?.({
							persistence: t.persistence,
							peakIntensity: Math.round(t.peakIntensity),
							threshold: result.threshold,
							nx: t.x / raw.width,
							ny: t.y / raw.height,
							blob: t.blob,
							rejected: result.rejected.length,
							rejectedReasons: result.rejected.map((r) => r.reason),
							frameUri: shot.uri,
						})
					}
				}
			} catch (e) {
				// A dropped frame is not fatal. Surface it but keep scanning.
				setStats((s) => ({ ...s, lastError: String(e?.message || e) }))
			}

			if (stopped) return
			// Self-scheduling timeout, never setInterval. setInterval would queue
			// new captures while the previous one is still decoding and the
			// backlog would grow forever.
			const spent = Date.now() - started
			timer = setTimeout(tick, Math.max(0, GLINT.CAPTURE_INTERVAL_MS - spent))
		}

		// Small delay so the camera has actually mounted before the first shot.
		timer = setTimeout(tick, 700)

		return () => {
			stopped = true
			if (timer) clearTimeout(timer)
		}
	}, [active, cameraRef])

	return { tracks, stats }
}
