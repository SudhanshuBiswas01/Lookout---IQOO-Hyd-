// Magnetometer subscription + metal-detector style haptics.
//
// The analysis itself lives in logic/magnetometer.js as pure functions. This
// hook only deals with the sensor subscription, the React state, and the
// buzzing. Keeping them apart is what makes the logic unit-testable without
// a device (see tools/selftest.mjs).

import { useEffect, useRef, useState } from "react"
import { Magnetometer } from "expo-sensors"
import * as Haptics from "expo-haptics"
import { MAGNETOMETER } from "../config.js"
import { createSweepState, pushSample } from "../logic/magnetometer.js"

const HISTORY_LENGTH = 120 // ~12s of trace at 100ms, for the evidence graph

export function useMagnetometerSweep(active, onSpike) {
	const [reading, setReading] = useState({
		value: 0,
		baseline: 0,
		deviation: 0,
		intensity: 0,
		warmingUp: true,
		over: false,
	})
	const [available, setAvailable] = useState(true)

	const stateRef = useRef(createSweepState())
	const historyRef = useRef([])
	const lastBuzzRef = useRef(0)
	const onSpikeRef = useRef(onSpike)
	onSpikeRef.current = onSpike

	useEffect(() => {
		if (!active) return undefined

		let sub = null
		let cancelled = false

		Magnetometer.isAvailableAsync()
			.then((ok) => {
				if (cancelled) return
				setAvailable(ok)
				if (!ok) return

				stateRef.current = createSweepState()
				historyRef.current = []
				Magnetometer.setUpdateInterval(MAGNETOMETER.UPDATE_INTERVAL_MS)

				sub = Magnetometer.addListener(({ x, y, z }) => {
					const now = Date.now()
					const r = pushSample(stateRef.current, x, y, z, now)

					historyRef.current.push(r.value)
					if (historyRef.current.length > HISTORY_LENGTH)
						historyRef.current.shift()

					setReading(r)

					// Metal-detector feel: the closer you get, the faster it ticks.
					if (!r.warmingUp && r.intensity > 0.08) {
						const interval = 600 - r.intensity * 500 // 600ms -> 100ms
						if (now - lastBuzzRef.current > interval) {
							lastBuzzRef.current = now
							const style =
								r.intensity > 0.66
									? Haptics.ImpactFeedbackStyle.Heavy
									: r.intensity > 0.33
										? Haptics.ImpactFeedbackStyle.Medium
										: Haptics.ImpactFeedbackStyle.Light
							Haptics.impactAsync(style).catch(() => {})
						}
					}

					if (r.isNewSpike) {
						Haptics.notificationAsync(
							Haptics.NotificationFeedbackType.Warning,
						).catch(() => {})
						onSpikeRef.current?.({
							deviation: r.deviation,
							value: r.value,
							baseline: r.baseline,
							trace: [...historyRef.current],
						})
					}
				})
			})
			.catch(() => setAvailable(false))

		return () => {
			cancelled = true
			sub?.remove()
		}
	}, [active])

	return { reading, available, history: historyRef }
}
