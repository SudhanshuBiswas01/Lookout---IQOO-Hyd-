// A tiny sparkline built from plain Views.
//
// No charting library on purpose: one less dependency to install at 2am on
// venue wifi, and it renders the real captured samples.

import React from "react"
import { StyleSheet, View } from "react-native"
import { colors, radius } from "../theme.js"

export default function SparkGraph({ data, height = 48, color = colors.accent }) {
	if (!data || data.length < 2) return <View style={{ height }} />

	const min = Math.min(...data)
	const max = Math.max(...data)
	const range = max - min || 1

	// Cap the number of bars so a long trace stays readable.
	const step = Math.max(1, Math.floor(data.length / 60))
	const points = data.filter((_, i) => i % step === 0)

	return (
		<View style={[styles.wrap, { height }]}>
			{points.map((v, i) => {
				const h = Math.max(2, ((v - min) / range) * (height - 4))
				return (
					<View
						key={i}
						style={{
							flex: 1,
							height: h,
							backgroundColor: color,
							marginHorizontal: 0.5,
							borderRadius: 1,
						}}
					/>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: {
		flexDirection: "row",
		alignItems: "flex-end",
		backgroundColor: colors.surfaceAlt,
		borderRadius: radius.sm,
		padding: 2,
	},
})
