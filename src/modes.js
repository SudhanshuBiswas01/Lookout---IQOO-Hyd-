// The three scan modes.
//
// ORDERING NOTE: this list is ordered by PHYSICS RELIABILITY, not by build
// order. Lens Scan is first because retroreflection off a lens is the only
// signal here that genuinely indicates a camera. The magnetometer sweep is
// quicker to build, so it gets written first - but the UI and the pitch both
// LEAD with the lens scan. Do not reorder this to match the build sequence.

import { IR } from "./config.js"

export const MODES = {
	LENS: "LENS",
	MAGNET: "MAGNET",
	DARK: "DARK",
}

export const MODE_LIST = [
	{
		key: MODES.LENS,
		title: "Lens Scan",
		subtitle: "Primary detector",
		blurb:
			"Torch on, camera watching for light bouncing straight back off a lens. This is the signal that actually indicates a camera.",
		role: "primary",
		available: true,
	},
	{
		key: MODES.MAGNET,
		title: "Magnetometer Sweep",
		subtitle: "Pre-filter only",
		blurb:
			"Finds ferrous metal so you know where to point the lens scan. It cannot tell a camera from a screw, and it does not pretend to.",
		role: "filter",
		available: true,
	},
	{
		key: MODES.DARK,
		title: "Dark Room Scan",
		subtitle: IR.ENABLED_ON_THIS_DEVICE ? "Corroborating" : "Unsupported here",
		blurb: IR.ENABLED_ON_THIS_DEVICE
			? "Looks for infrared LEDs with the room lights off. Turn the lights out before starting."
			: "Disabled. This phone's camera filters infrared, so night-vision LEDs are invisible to it. Run the test in DEVICE_TESTS.md; if it passes, set IR.ENABLED_ON_THIS_DEVICE to true in src/config.js.",
		role: "corroborator",
		available: IR.ENABLED_ON_THIS_DEVICE,
	},
]

export function getMode(key) {
	return MODE_LIST.find((m) => m.key === key) || MODE_LIST[0]
}
