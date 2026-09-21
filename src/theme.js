// Colours and spacing.
//
// Dark theme on purpose. The Dark Room Scan is used with the lights off, and
// a bright UI would both wreck the user's night vision and spill stray light
// that interferes with glint detection.

export const colors = {
	bg: "#0B0F14",
	surface: "#151B23",
	surfaceAlt: "#1E2630",
	border: "#2A3440",
	text: "#E8EDF2",
	textDim: "#8A97A6",
	accent: "#4EA8FF",
	red: "#FF5A5A",
	yellow: "#FFC24B",
	green: "#3FD17A",
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
export const radius = { sm: 8, md: 12, lg: 20 }

export function verdictColor(verdict) {
	if (verdict === "RED") return colors.red
	if (verdict === "YELLOW") return colors.yellow
	return colors.green
}
