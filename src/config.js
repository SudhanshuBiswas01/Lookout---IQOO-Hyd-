// ============================================================================
// TUNING CONSTANTS - every magic number in the app lives here.
//
// During the hackathon you WILL need to retune these on the actual device.
// Keeping them in one file means that is a 30-second job, not a hunt through
// five modules at 3am. Run DEVICE_TESTS.md first and write the measured
// numbers into this file.
// ============================================================================

export const MAGNETOMETER = {
	// How often expo-sensors delivers a reading, in ms.
	UPDATE_INTERVAL_MS: 100,

	// Rolling baseline window. ~20 samples at 100ms = a 2 second memory.
	// Longer = more stable but slower to react. Shorter = twitchy.
	BASELINE_SIZE: 20,

	// Ignore everything until the baseline buffer is full, otherwise the first
	// reading becomes its own baseline and nothing ever looks like a spike.
	WARMUP_SAMPLES: 20,

	// A spike is when current magnitude exceeds the rolling baseline by this
	// fraction. 0.15 = 15% above baseline.
	// MEASURE THIS: see DEVICE_TESTS.md test 3.
	SPIKE_RATIO: 0.15,

	// A single noisy sample should not fire. Require this many consecutive
	// over-threshold samples before we call it a spike.
	SPIKE_SUSTAIN_SAMPLES: 3,

	// After a spike is logged, ignore new spikes for this long so that holding
	// the phone near one screw does not produce 40 log entries.
	COOLDOWN_MS: 2500,

	// Deviation ratio that counts as "maximum" for the UI bar and haptic rate.
	DISPLAY_CEILING_RATIO: 0.6,
}

export const GLINT = {
	// Time between frame captures. Lower is smoother but the JS pipeline
	// cannot keep up much below this on a still-capture architecture.
	CAPTURE_INTERVAL_MS: 300,

	// Frames are downscaled to this size before processing. This is the single
	// biggest performance lever - 160x120 is 19,200 pixels, which pure JS can
	// chew through in a few ms. Do not raise this without measuring.
	PROCESS_WIDTH: 160,
	PROCESS_HEIGHT: 120,

	// JPEG quality for the downscaled capture. Low is fine, we only care about
	// bright spots, and lower = faster encode/decode.
	CAPTURE_QUALITY: 0.4,

	// Keep only the brightest fraction of pixels. 0.015 = top 1.5%.
	BRIGHT_TOP_FRACTION: 0.015,

	// Absolute floor for the brightness threshold. Without this, in a very dark
	// frame the "top 1.5%" could be dim grey noise and everything lights up.
	MIN_ABSOLUTE_BRIGHTNESS: 200,

	// A real lens glint at 0.5-2m on a 160x120 frame is a handful of pixels.
	// Too small = sensor noise. Too large = a window, a lamp, a white wall.
	MIN_BLOB_AREA: 3,
	MAX_BLOB_AREA: 250,

	// Shape filters. A circle inscribed in its bounding box has a fill ratio of
	// pi/4 = 0.785. Allowing down to 0.5 tolerates pixelation at this tiny size.
	MIN_FILL_RATIO: 0.5,
	MIN_ASPECT_RATIO: 0.5, // shorter side / longer side of the bounding box

	// The blob must be this much brighter than the frame average.
	MIN_CONTRAST: 60,

	// ---- PERSISTENCE: the most important filter in the whole app ----
	// A retroreflective lens keeps throwing light back as you move, so its
	// glint survives frame after frame. A flat reflective surface (sticker,
	// screw head, polished plastic) flashes at one angle and vanishes.
	// Persistence is what separates the two.
	TRACK_MATCH_DISTANCE: 14, // px on the processed frame
	TRACK_MAX_MISSES: 2, // frames a track survives without a match
	STRONG_PERSISTENCE_FRAMES: 3, // frames held before a glint counts as strong

	COOLDOWN_MS: 2500,
}

export const FUSION = {
	// A magnetic spike and a glint count as "the same area" if they happen
	// within this window of each other. We have no spatial coordinates for the
	// magnetometer, so time proximity while sweeping one spot is the proxy.
	CORRELATION_WINDOW_MS: 4000,
}

export const IR = {
	// Set to true ONLY after DEVICE_TESTS.md test 1 passes on this hardware.
	// Leaving this false is the honest default - most modern flagships have an
	// IR-cut filter that makes this feature physically impossible.
	ENABLED_ON_THIS_DEVICE: false,

	// Which camera saw the IR glow in the test. "front" | "back"
	CAMERA: "front",
}
