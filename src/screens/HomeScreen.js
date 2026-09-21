import React, { useState } from "react"
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native"
import { MODE_LIST, MODES } from "../modes.js"
import { colors, radius, spacing } from "../theme.js"
import { useSession } from "../state/SessionContext.js"

export default function HomeScreen({ navigation }) {
	// Defaults to LENS, not MAGNET. The primary detector is the default.
	const [mode, setMode] = useState(MODES.LENS)
	const { spots, clearSession } = useSession()

	const selected = MODE_LIST.find((m) => m.key === mode)

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.content}
		>
			<Text style={styles.title}>Hidden Camera Finder</Text>
			<Text style={styles.subtitle}>
				Checks a room for hidden cameras using your phone's torch, camera and
				magnetometer. Fully offline.
			</Text>

			<Text style={styles.sectionLabel}>Scan mode</Text>

			{MODE_LIST.map((m) => {
				const active = m.key === mode
				return (
					<Pressable
						key={m.key}
						onPress={() => m.available && setMode(m.key)}
						style={[
							styles.card,
							active && styles.cardActive,
							!m.available && styles.cardDisabled,
						]}
					>
						<View style={styles.cardHeader}>
							<Text
								style={[styles.cardTitle, !m.available && styles.dimText]}
							>
								{m.title}
							</Text>
							<Text
								style={[
									styles.badge,
									m.role === "primary" && styles.badgePrimary,
								]}
							>
								{m.subtitle}
							</Text>
						</View>
						<Text style={styles.cardBlurb}>{m.blurb}</Text>
					</Pressable>
				)
			})}

			<Pressable
				style={styles.primaryButton}
				onPress={() => {
					clearSession()
					navigation.navigate("Sweep", { mode })
				}}
			>
				<Text style={styles.primaryButtonText}>
					Start {selected?.title ?? "Scan"}
				</Text>
			</Pressable>

			{spots.length > 0 && (
				<Pressable
					style={styles.secondaryButton}
					onPress={() => navigation.navigate("Results")}
				>
					<Text style={styles.secondaryButtonText}>
						View last results ({spots.length})
					</Text>
				</Pressable>
			)}

			{/* Expectation setting, on the first screen, before anyone scans.
			    An app like this is dangerous if people over-trust it. */}
			<View style={styles.honestBox}>
				<Text style={styles.honestTitle}>What this can and cannot do</Text>

				<Text style={styles.honestGood}>
					Finds lens-like reflections that hold position as you move - the
					same retroreflection principle commercial detectors use.
				</Text>
				<Text style={styles.honestGood}>
					Flags ferrous metal so you know where to look harder.
				</Text>
				<Text style={styles.honestGood}>
					Shows you the raw evidence behind every result.
				</Text>

				<Text style={styles.honestBad}>
					Cannot certify that a room is safe. Finding nothing is not proof
					that nothing is there.
				</Text>
				<Text style={styles.honestBad}>
					Cannot detect cameras behind thick fabric, dark glass or inside
					walls.
				</Text>
				<Text style={styles.honestBad}>
					Cannot scan radio signals. Phones have no general RF receiver.
				</Text>
			</View>

			<Text style={styles.footer}>
				No internet. No account. No data leaves this phone. Try it in
				airplane mode.
			</Text>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.bg },
	content: { padding: spacing.lg, paddingBottom: spacing.xl },
	title: { color: colors.text, fontSize: 28, fontWeight: "800" },
	subtitle: {
		color: colors.textDim,
		fontSize: 14,
		lineHeight: 20,
		marginTop: spacing.sm,
		marginBottom: spacing.lg,
	},
	sectionLabel: {
		color: colors.textDim,
		fontSize: 12,
		letterSpacing: 1,
		textTransform: "uppercase",
		marginBottom: spacing.sm,
	},
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		marginBottom: spacing.sm,
	},
	cardActive: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
	cardDisabled: { opacity: 0.45 },
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.xs,
	},
	cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
	dimText: { color: colors.textDim },
	badge: { color: colors.textDim, fontSize: 11 },
	badgePrimary: { color: colors.accent, fontWeight: "700" },
	cardBlurb: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
	primaryButton: {
		backgroundColor: colors.accent,
		borderRadius: radius.lg,
		paddingVertical: 18,
		alignItems: "center",
		marginTop: spacing.md,
	},
	primaryButtonText: { color: "#06121F", fontSize: 17, fontWeight: "800" },
	secondaryButton: { paddingVertical: 14, alignItems: "center" },
	secondaryButtonText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
	honestBox: {
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		marginTop: spacing.lg,
	},
	honestTitle: {
		color: colors.text,
		fontSize: 14,
		fontWeight: "700",
		marginBottom: spacing.sm,
	},
	honestGood: {
		color: colors.textDim,
		fontSize: 13,
		lineHeight: 19,
		marginBottom: spacing.xs,
	},
	honestBad: {
		color: colors.yellow,
		fontSize: 13,
		lineHeight: 19,
		marginBottom: spacing.xs,
	},
	footer: {
		color: colors.textDim,
		fontSize: 12,
		textAlign: "center",
		marginTop: spacing.lg,
		lineHeight: 18,
	},
})
