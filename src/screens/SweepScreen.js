import React, { useCallback, useRef, useState } from "react"
import {
	Dimensions,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import BlobOverlay from "../components/BlobOverlay.js"
import SignalBar from "../components/SignalBar.js"
import { IR } from "../config.js"
import { useGlintScanner } from "../hooks/useGlintScanner.js"
import { useMagnetometerSweep } from "../hooks/useMagnetometerSweep.js"
import {
	buildSignals,
	createFusionState,
	noteGlint,
	noteMagneticSpike,
} from "../logic/fusion.js"
import { MODES, getMode } from "../modes.js"
import { useSession } from "../state/SessionContext.js"
import { colors, radius, spacing, verdictColor } from "../theme.js"

const { width: SCREEN_W } = Dimensions.get("window")
const PREVIEW_H = Math.round((SCREEN_W * 4) / 3)

export default function SweepScreen({ route, navigation }) {
	const mode = route.params?.mode ?? MODES.LENS
	const modeInfo = getMode(mode)
	const usesCamera = mode === MODES.LENS || mode === MODES.DARK

	const [permission, requestPermission] = useCameraPermissions()
	const cameraRef = useRef(null)
	const fusionRef = useRef(createFusionState())
	const [log, setLog] = useState([])

	const { spots, addSpot, verdict } = useSession()

	const pushLog = useCallback((text) => {
		setLog((prev) => [{ at: Date.now(), text }, ...prev].slice(0, 20))
	}, [])

	// ---- magnetometer ------------------------------------------------------
	// NOTE: the magnetometer runs in EVERY mode, including the lens scan. That
	// is the whole point of fusion - if metal was detected a second before a
	// glint appeared, the two corroborate each other.
	const handleSpike = useCallback(
		(payload) => {
			const now = Date.now()
			noteMagneticSpike(fusionRef.current, payload.deviation, now)
			const signals = buildSignals(fusionRef.current, "magnetic", payload, now)
			const spot = addSpot(
				signals,
				{
					kind: "magnetic",
					trace: payload.trace,
					value: payload.value,
					baseline: payload.baseline,
				},
				mode,
			)
			pushLog(`Metal: ${Math.round(payload.deviation * 100)}% over baseline`)
			return spot
		},
		[addSpot, mode, pushLog],
	)

	const { reading, available: magAvailable, history } = useMagnetometerSweep(
		true,
		handleSpike,
	)

	// ---- glint -------------------------------------------------------------
	const handleGlint = useCallback(
		(payload) => {
			const now = Date.now()
			noteGlint(fusionRef.current, payload.persistence, now)
			const signals = buildSignals(
				fusionRef.current,
				"glint",
				{ ...payload, ir: mode === MODES.DARK && IR.ENABLED_ON_THIS_DEVICE },
				now,
			)
			addSpot(
				signals,
				{
					kind: "glint",
					frameUri: payload.frameUri,
					nx: payload.nx,
					ny: payload.ny,
					persistence: payload.persistence,
					peakIntensity: payload.peakIntensity,
					threshold: payload.threshold,
					blob: payload.blob,
					rejected: payload.rejected,
					rejectedReasons: payload.rejectedReasons,
					magTrace: [...(history.current || [])],
				},
				mode,
			)
			pushLog(`Reflection held ${payload.persistence} frames`)
		},
		[addSpot, history, mode, pushLog],
	)

	const cameraReady = usesCamera && permission?.granted
	const { tracks, stats } = useGlintScanner(
		!!cameraReady,
		cameraRef,
		handleGlint,
	)

	// ---- permission gate ---------------------------------------------------
	if (usesCamera && !permission) {
		return (
			<View style={styles.center}>
				<Text style={styles.dim}>Checking camera access...</Text>
			</View>
		)
	}

	if (usesCamera && !permission.granted) {
		return (
			<View style={styles.center}>
				<Text style={styles.gateTitle}>Camera access needed</Text>
				<Text style={styles.gateBody}>
					The lens scan looks for light bouncing back off a camera lens, so
					it needs the camera and the torch. Nothing is recorded, nothing is
					uploaded - the app has no network access at all.
				</Text>
				<Pressable style={styles.button} onPress={requestPermission}>
					<Text style={styles.buttonText}>Allow camera</Text>
				</Pressable>
			</View>
		)
	}

	return (
		<View style={styles.screen}>
			{usesCamera && (
				<View style={{ width: SCREEN_W, height: PREVIEW_H }}>
					<CameraView
						ref={cameraRef}
						style={StyleSheet.absoluteFill}
						// Dark Room Scan uses whichever camera passed the IR test.
						facing={mode === MODES.DARK ? IR.CAMERA : "back"}
						// Torch ONLY in lens mode. In dark-room mode the torch would
						// destroy the very thing we are trying to see.
						enableTorch={mode === MODES.LENS}
						animateShutter={false}
					/>
					<BlobOverlay tracks={tracks} width={SCREEN_W} height={PREVIEW_H} />

					<View style={styles.statsChip}>
						<Text style={styles.statsText}>
							{stats.fps.toFixed(1)} fps - cutoff {stats.threshold} - {""}
							{stats.rawCount} bright region
							{stats.rawCount === 1 ? "" : "s"}
						</Text>
					</View>
				</View>
			)}

			<ScrollView
				style={styles.panel}
				contentContainerStyle={styles.panelContent}
			>
				<View style={[styles.verdictBar, { borderColor: verdictColor(verdict) }]}>
					<Text style={[styles.verdictText, { color: verdictColor(verdict) }]}>
						{verdict === "GREEN"
							? "Nothing flagged yet"
							: `${spots.length} spot${spots.length === 1 ? "" : "s"} flagged`}
					</Text>
				</View>

				{mode === MODES.LENS && (
					<Text style={styles.hint}>
						Sweep slowly, about an arm's length from the surface. A real lens
						keeps reflecting as you move - watch the number next to the circle
						climb. A sticker flashes once and resets.
					</Text>
				)}

				{mode === MODES.DARK && (
					<Text style={styles.hint}>
						Turn the room lights off. Looking for infrared LEDs that the eye
						cannot see.
					</Text>
				)}

				{magAvailable ? (
					<SignalBar
						intensity={reading.intensity}
						value={reading.value}
						baseline={reading.baseline}
						over={reading.over}
					/>
				) : (
					<Text style={styles.warn}>
						No magnetometer on this device. Lens scan still works.
					</Text>
				)}

				{/* Said plainly, on the scan screen, not buried in an about page. */}
				<Text style={styles.caveat}>
					The magnetometer finds ferrous metal, not cameras. It tells you
					where to point the lens scan.
				</Text>

				{reading.warmingUp && (
					<Text style={styles.dim}>
						Learning the room's baseline field...
					</Text>
				)}

				{log.length > 0 && (
					<View style={styles.logBox}>
						<Text style={styles.logTitle}>Live log</Text>
						{log.map((l) => (
							<Text key={l.at + l.text} style={styles.logLine}>
								{new Date(l.at).toLocaleTimeString()} - {l.text}
							</Text>
						))}
					</View>
				)}

				{stats.lastError && (
					<Text style={styles.warn}>Frame error: {stats.lastError}</Text>
				)}

				<Pressable
					style={styles.button}
					onPress={() => navigation.navigate("Results")}
				>
					<Text style={styles.buttonText}>Finish sweep</Text>
				</Pressable>

				<Text style={styles.modeFooter}>{modeInfo.title}</Text>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.bg },
	center: {
		flex: 1,
		backgroundColor: colors.bg,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.lg,
	},
	gateTitle: {
		color: colors.text,
		fontSize: 18,
		fontWeight: "700",
		marginBottom: spacing.sm,
	},
	gateBody: {
		color: colors.textDim,
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		marginBottom: spacing.lg,
	},
	panel: { flex: 1 },
	panelContent: { padding: spacing.lg },
	verdictBar: {
		borderWidth: 1,
		borderRadius: radius.md,
		padding: spacing.md,
		alignItems: "center",
		marginBottom: spacing.md,
	},
	verdictText: { fontSize: 15, fontWeight: "700" },
	hint: {
		color: colors.textDim,
		fontSize: 13,
		lineHeight: 19,
		marginBottom: spacing.md,
	},
	caveat: {
		color: colors.textDim,
		fontSize: 12,
		lineHeight: 18,
		fontStyle: "italic",
		marginBottom: spacing.md,
	},
	dim: { color: colors.textDim, fontSize: 13, marginBottom: spacing.sm },
	warn: { color: colors.yellow, fontSize: 13, marginBottom: spacing.sm },
	logBox: {
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		marginBottom: spacing.md,
	},
	logTitle: {
		color: colors.text,
		fontSize: 13,
		fontWeight: "700",
		marginBottom: spacing.sm,
	},
	logLine: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
	statsChip: {
		position: "absolute",
		top: spacing.sm,
		left: spacing.sm,
		backgroundColor: "rgba(0,0,0,0.6)",
		borderRadius: radius.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
	},
	statsText: { color: "#DDE6EF", fontSize: 11 },
	button: {
		backgroundColor: colors.accent,
		borderRadius: radius.lg,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: spacing.sm,
	},
	buttonText: { color: "#06121F", fontSize: 16, fontWeight: "800" },
	modeFooter: {
		color: colors.textDim,
		fontSize: 11,
		textAlign: "center",
		marginTop: spacing.md,
	},
})
