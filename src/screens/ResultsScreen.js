// Results screen.
//
// THE POINT OF THIS SCREEN: every other camera-detector app shows a verdict
// and nothing else. Here you tap any flagged spot and see the raw evidence -
// the actual frame, the measurements, the threshold, and how many other
// bright spots were rejected and why. The user verifies with their own eyes
// instead of trusting us.

import React, { useState } from "react"
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native"
import SparkGraph from "../components/SparkGraph.js"
import { useSession } from "../state/SessionContext.js"
import { colors, radius, spacing, verdictColor } from "../theme.js"

const EVIDENCE_W = 260
const EVIDENCE_H = 195

export default function ResultsScreen({ navigation }) {
	const { spots, summary, verdict, clearSession } = useSession()
	const [openId, setOpenId] = useState(null)

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<View style={[styles.hero, { borderColor: verdictColor(verdict) }]}>
				<Text style={[styles.heroVerdict, { color: verdictColor(verdict) }]}>
					{verdict === "GREEN" ? "Nothing found" : verdict}
				</Text>
				<Text style={styles.heroSummary}>{summary}</Text>
			</View>

			{spots.length === 0 && (
				<Text style={styles.empty}>
					No spots were flagged in this sweep. Re-scan anywhere you could not
					reach, and check obvious spots physically: smoke detectors, vents,
					clocks, chargers, mirrors.
				</Text>
			)}

			{spots.map((spot) => {
				const open = openId === spot.id
				const tint = verdictColor(spot.verdict)
				const ev = spot.evidence || {}

				return (
					<Pressable
						key={spot.id}
						style={[styles.card, { borderLeftColor: tint }]}
						onPress={() => setOpenId(open ? null : spot.id)}
					>
						<View style={styles.cardHeader}>
							<Text style={[styles.tag, { color: tint, borderColor: tint }]}>
								{spot.verdict}
							</Text>
							<Text style={styles.time}>
								{new Date(spot.timestamp).toLocaleTimeString()}
							</Text>
						</View>

						<Text style={styles.headline}>{spot.headline}</Text>
						<Text style={styles.copy}>{spot.copy}</Text>

						<Text style={styles.toggle}>
							{open ? "Hide raw evidence" : "Show raw evidence"}
						</Text>

						{open && (
							<View style={styles.evidence}>
								{spot.reasons.map((r, i) => (
									<Text key={i} style={styles.reason}>
										{r}
									</Text>
								))}

								{/* --- glint evidence --- */}
								{ev.kind === "glint" && (
									<>
										<Text style={styles.evidenceLabel}>Captured frame</Text>
										<View style={styles.frameWrap}>
											{ev.frameUri ? (
												<Image
													source={{ uri: ev.frameUri }}
													style={styles.frame}
													resizeMode="cover"
												/>
											) : (
												<View style={[styles.frame, styles.frameMissing]}>
													<Text style={styles.dim}>frame unavailable</Text>
												</View>
											)}
											{ev.nx != null && (
												<View
													style={[
														styles.marker,
														{
															left: ev.nx * EVIDENCE_W - 14,
															top: ev.ny * EVIDENCE_H - 14,
															borderColor: tint,
														},
													]}
												/>
											)}
										</View>

										<Row
											k="Frames held in a row"
											v={String(ev.persistence)}
										/>
										<Row
											k="Peak brightness"
											v={`${ev.peakIntensity} / 255`}
										/>
										<Row
											k="Brightness cutoff used"
											v={String(ev.threshold)}
										/>
										{ev.blob && (
											<>
												<Row k="Blob area" v={`${ev.blob.area} px`} />
												<Row
													k="Roundness"
													v={ev.blob.fillRatio.toFixed(2)}
												/>
												<Row
													k="Aspect ratio"
													v={ev.blob.aspectRatio.toFixed(2)}
												/>
											</>
										)}

										{/* The honesty flourish. Show what we THREW OUT. */}
										{ev.rejected > 0 && (
											<Text style={styles.rejected}>
												{ev.rejected} other bright spot
												{ev.rejected === 1 ? " was" : "s were"} rejected in this
												frame:{" "}
												{(ev.rejectedReasons || []).slice(0, 3).join("; ")}
											</Text>
										)}

										{ev.magTrace?.length > 1 && (
											<>
												<Text style={styles.evidenceLabel}>
													Magnetic field at the same moment
												</Text>
												<SparkGraph data={ev.magTrace} />
											</>
										)}
									</>
								)}

								{/* --- magnetic evidence --- */}
								{ev.kind === "magnetic" && (
									<>
										<Text style={styles.evidenceLabel}>
											Magnetic field, last few seconds
										</Text>
										<SparkGraph data={ev.trace} color={colors.yellow} />
										<Row k="Peak" v={`${ev.value.toFixed(1)} uT`} />
										<Row
											k="Room baseline"
											v={`${ev.baseline.toFixed(1)} uT`}
										/>
									</>
								)}
							</View>
						)}
					</Pressable>
				)
			})}

			{/* Repeated at the end, where someone might act on the result. */}
			<Text style={styles.disclaimer}>
				This is a screening aid, not a certification. Finding nothing does not
				prove a room is clear. If something feels wrong, trust that and leave.
			</Text>

			<Pressable
				style={styles.button}
				onPress={() => {
					clearSession()
					navigation.navigate("Home")
				}}
			>
				<Text style={styles.buttonText}>New sweep</Text>
			</Pressable>
		</ScrollView>
	)
}

function Row({ k, v }) {
	return (
		<View style={styles.row}>
			<Text style={styles.rowKey}>{k}</Text>
			<Text style={styles.rowVal}>{v}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.bg },
	content: { padding: spacing.lg, paddingBottom: spacing.xl },
	hero: {
		borderWidth: 2,
		borderRadius: radius.md,
		padding: spacing.md,
		marginBottom: spacing.lg,
	},
	heroVerdict: { fontSize: 22, fontWeight: "800", marginBottom: spacing.xs },
	heroSummary: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
	empty: { color: colors.textDim, fontSize: 13, lineHeight: 20 },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		borderLeftWidth: 4,
		padding: spacing.md,
		marginBottom: spacing.sm,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	tag: {
		fontSize: 11,
		fontWeight: "800",
		borderWidth: 1,
		borderRadius: radius.sm,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	time: { color: colors.textDim, fontSize: 11 },
	headline: { color: colors.text, fontSize: 15, fontWeight: "700" },
	copy: { color: colors.textDim, fontSize: 13, marginTop: 2 },
	toggle: {
		color: colors.accent,
		fontSize: 12,
		fontWeight: "600",
		marginTop: spacing.sm,
	},
	evidence: {
		marginTop: spacing.md,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		paddingTop: spacing.md,
	},
	reason: {
		color: colors.textDim,
		fontSize: 12,
		lineHeight: 18,
		marginBottom: spacing.sm,
	},
	evidenceLabel: {
		color: colors.text,
		fontSize: 12,
		fontWeight: "700",
		marginTop: spacing.sm,
		marginBottom: spacing.xs,
	},
	frameWrap: {
		width: EVIDENCE_W,
		height: EVIDENCE_H,
		borderRadius: radius.sm,
		overflow: "hidden",
		marginBottom: spacing.sm,
	},
	frame: { width: EVIDENCE_W, height: EVIDENCE_H },
	frameMissing: {
		backgroundColor: colors.surfaceAlt,
		alignItems: "center",
		justifyContent: "center",
	},
	marker: {
		position: "absolute",
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 3,
	},
	rowKey: { color: colors.textDim, fontSize: 12 },
	rowVal: { color: colors.text, fontSize: 12, fontWeight: "600" },
	rejected: {
		color: colors.textDim,
		fontSize: 11,
		lineHeight: 17,
		fontStyle: "italic",
		marginTop: spacing.sm,
	},
	dim: { color: colors.textDim, fontSize: 12 },
	disclaimer: {
		color: colors.textDim,
		fontSize: 12,
		lineHeight: 18,
		marginTop: spacing.lg,
		textAlign: "center",
	},
	button: {
		backgroundColor: colors.accent,
		borderRadius: radius.lg,
		paddingVertical: 16,
		alignItems: "center",
		marginTop: spacing.md,
	},
	buttonText: { color: "#06121F", fontSize: 16, fontWeight: "800" },
})
