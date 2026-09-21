// Animated strength bar with the raw number printed next to it.
//
// The raw microtesla value is always visible. A bar alone would be a
// mystery-meat "trust me" indicator, which is exactly what this app is
// supposed to be an alternative to.

import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import { colors, radius, spacing } from "../theme.js"

export default function SignalBar({ intensity, value, baseline, over }) {
	const anim = useRef(new Animated.Value(0)).current

	useEffect(() => {
		Animated.timing(anim, {
			toValue: Math.max(0, Math.min(1, intensity)),
			duration: 120,
			useNativeDriver: false, // animating width, not transform
		}).start()
	}, [intensity, anim])

	const width = anim.interpolate({
		inputRange: [0, 1],
		outputRange: ["2%", "100%"],
	})

	return (
		<View style={styles.wrap}>
			<View style={styles.row}>
				<Text style={styles.label}>Magnetic field</Text>
				<Text style={styles.value}>
					{value.toFixed(1)} <Text style={styles.unit}>uT</Text>
				</Text>
			</View>

			<View style={styles.track}>
				<Animated.View
					style={[
						styles.fill,
						{ width, backgroundColor: over ? colors.yellow : colors.accent },
					]}
				/>
			</View>

			<Text style={styles.baseline}>
				room baseline {baseline.toFixed(1)} uT
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: { marginBottom: spacing.md },
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginBottom: spacing.sm,
	},
	label: { color: colors.textDim, fontSize: 13 },
	value: { color: colors.text, fontSize: 22, fontWeight: "700" },
	unit: { color: colors.textDim, fontSize: 13, fontWeight: "400" },
	track: {
		height: 10,
		backgroundColor: colors.surfaceAlt,
		borderRadius: radius.sm,
		overflow: "hidden",
	},
	fill: { height: "100%", borderRadius: radius.sm },
	baseline: { color: colors.textDim, fontSize: 11, marginTop: spacing.xs },
})
