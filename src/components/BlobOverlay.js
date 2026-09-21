// Draws a circle over every live glint candidate.
//
// The persistence count is rendered right next to each circle on purpose.
// That number climbing is the whole argument for why a lens is different
// from a sticker, and a judge can watch it happen live.

import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { colors } from "../theme.js"

export default function BlobOverlay({ tracks, width, height }) {
	return (
		<View pointerEvents="none" style={StyleSheet.absoluteFill}>
			{tracks.map((t) => {
				const size = t.strong ? 54 : 40
				const color = t.strong ? colors.red : colors.yellow
				// nx / ny are normalised 0..1 so this works at any resolution.
				const left = t.nx * width - size / 2
				const top = t.ny * height - size / 2

				return (
					<View key={t.id} style={[styles.marker, { left, top }]}>
						<View
							style={{
								width: size,
								height: size,
								borderRadius: size / 2,
								borderWidth: t.strong ? 3 : 2,
								borderColor: color,
							}}
						/>
						<Text style={[styles.count, { color }]}>{t.persistence}</Text>
					</View>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	marker: { position: "absolute", alignItems: "center" },
	count: { fontSize: 12, fontWeight: "700", marginTop: 2 },
})
