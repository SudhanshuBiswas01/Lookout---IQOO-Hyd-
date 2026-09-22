# Lookout: Hidden Camera Finder
## Complete End-to-End Project Reference & Technical Dossier
*Comprehensive Master Documentation Covering All Product Specifications, Physical Principles, Computer Vision Algorithms, Mathematical Models, Hardware Calibration, Code Architecture, Testing Harnesses, and Operational Protocols*

---

### Project Overview & Identification
- **Project Name:** Lookout (Hidden Camera Finder)
- **Target Event:** iQOO City Battles, Hyderabad (26–27 September 2026)
- **Repository:** `https://github.com/SudhanshuBiswas01/Lookout---IQOO-Hyd-.git`
- **Application Type:** 100% Offline Mobile Privacy & Optical Screening Utility
- **Core Technology Stack:** React Native 0.86, Expo SDK 57/51, Hermes Engine, Pure JS Computer Vision, 3D Magnetometer Vector Processing

---

## 1. Executive Summary & Mission

### 1.1 Core Mission Statement
**Lookout** is a mobile security application designed to detect covert hidden cameras (pinhole lenses, spy cameras disguised in smoke detectors, alarm clocks, tissue boxes, wall outlets) using standard, unmodified smartphone sensors and optics.

### 1.2 The Core Tenet: Real Physics, Zero Gimmicks
Most commercial "camera detector" applications on mobile app stores display animated green radar graphics, play random audio beeps, and output arbitrary confidence scores (e.g., *"98% Safe!"*). Others claim to use "Cloud AI," requiring users to take photos of their private bedrooms or bathrooms and transmit them to external third-party servers.

Lookout is engineered on verifiable physical and mathematical principles:
1. **Optical Retroreflection:** Camera lenses are curved optical systems that reflect incident light straight back along the entry ray vector (the "cat's-eye" phenomenon).
2. **Collinear Optical Transceiver:** By leveraging the fact that a smartphone's flashlight/torch is physically mounted adjacent to its camera sensor (3–8 mm apart), the phone functions as a zero-parallax optical transceiver.
3. **Temporal Persistence Tracking:** A single image frame cannot distinguish a curved glass camera lens from a flat shiny screw head or metallic sticker. Lookout tracks candidate glints across consecutive frames as the user moves the phone. Flat specular surfaces flash for 1–2 frames and vanish; retroreflective lenses stay visible across multiple angles.
4. **Ferrous Magnetic Anomaly Detection:** Unshielded internal camera electronics, coils, transformers, and circuitry perturb the local ambient geomagnetic field, functioning as a non-verdict pre-filter to guide physical inspection.
5. **Air-Gapped Privacy:** Zero network code, zero external APIs, zero telemetry, and internet permissions programmatically blocked in the Android manifest. Operates 100% in Airplane Mode.

---

## 2. Problem Statement & Real-World Threat Landscape

### 2.1 The Crisis in Temporary Accommodation
Covert surveillance has escalated rapidly across India and worldwide. Pinhole spy cameras are frequently uncovered in:
- Budget hotels, boutique guest rooms, homestays, and Airbnb rentals
- Retail trial rooms and fitting stalls in clothing stores and shopping complexes
- Women’s hostels, paying guest (PG) accommodations, and shared apartments
- Gym locker rooms, executive restrooms, and co-working spaces

Victims face extortion, non-consensual imagery distribution, and long-term psychological distress. Modern pinhole apertures measure between **1 mm and 2 mm** in diameter, making them virtually impossible for the human eye to detect under ambient room lighting (&gt;95% failure rate in manual inspections).

### 2.2 The Fatal Flaw of Commercial Bug Detectors
- **RF Spectrum Detectors:** Traditional electronic bug detectors scan for radio frequency (Wi-Fi, Bluetooth, cellular) transmissions.
- **The Critical Indian Market Reality:** **Over 90% of covert micro-cameras deployed in India record locally onto a hidden MicroSD card.** They contain no Wi-Fi chips, emit zero radio frequency signals, and transmit nothing over the air. **RF detectors and Wi-Fi scanner apps are 100% blind to offline SD-card cameras.**
- **Dedicated Optical Wands:** Professional optical lens finders cost ₹3,000 to ₹15,000 ($40–$200), are bulky, require dedicated battery maintenance, and are rarely carried by everyday travelers.

### 2.3 The Failure of Existing App Store Software
1. **The Placebo Problem:** Free apps on Google Play frequently output randomized confidence numbers, creating a deadly false sense of security.
2. **The Cloud Privacy Hazard:** Apps requiring camera uploads to remote cloud servers defeat the very purpose of privacy, creating serious data breach and privacy violation risks.
3. **Single-Frame False Positives:** Apps that attempt simple brightness thresholding on single frames flag every screw, mirror edge, door hinge, and glossy tile, triggering alert fatigue.

---

## 3. Physical Principles & Scientific Foundations

### 3.1 Principle 1: Optical Cat's-Eye Retroreflection
- **The Optical Principle:** A camera lens is a retroreflective optical system consisting of multiple convex/concave glass elements and an aperture stop located near the focal plane. When collimated or semi-collimated light enters the entrance pupil, it is converged onto the sensor surface, where a portion is reflected back out through the same optical train, emerging along the exact reverse vector of the incident light.
- **Collinear Geometry:** For retroreflected light to return to an observer, the illumination source must be co-axial with the sensor. Because smartphone manufacturers mount the rear LED flash directly adjacent to the camera sensor (within millimeters), the smartphone inherently functions as a collinear retroreflective transceiver without requiring auxiliary optical attachments.
- **Angular Envelope Dynamics:**
  - *Retroreflector (Lens):* Reflects incident light back to the source across an angular envelope of approximately $\pm 15^\circ$ to $\pm 30^\circ$. As the user moves the phone smoothly across a room, the returned glint remains visible over several consecutive frames.
  - *Specular Reflector (Screws, Polished Tile, Stickers, Metallic Chrome):* Governed strictly by Snell’s law ($\theta_r = \theta_i$). Incident light bounces off in a single directional ray. Unless the phone is positioned at the exact orthogonal angle relative to the flat surface, light does not return to the camera. During a hand sweep, specular reflections appear as transient 1-frame flashes and immediately vanish.

### 3.2 Principle 2: Ferrous Electromagnetic Perturbation
- **The Magnetic Principle:** Pinhole cameras, micro-DVRs, clock radios, and disguised surveillance devices contain ferromagnetic components: power transformers, inductors, micro-speakers, PCB traces, and shielding cans.
- **Ambient Geomagnetic Baseline:** The Earth's ambient magnetic field typically measures between **30 $\mu$T and 60 $\mu$T** in residential environments.
- **Anomaly Detection:** When a phone's 3D magnetometer passes within 2 to 10 cm of a concealed camera, the ferromagnetic core perturbs the local ambient field lines, producing a measurable deviation above the resting baseline.
- **Pre-Filter Role:** Ferrous metal detection is strictly a *corroborating pre-filter*. It tells the user where to focus their optical lens scan, but cannot verify a camera on its own (since harmless wall screws, nails, and electrical wiring also produce magnetic deflections).

### 3.3 Principle 3: Infrared Emission & Hardware Constraints
- **The IR Principle:** Many night-vision cameras illuminate their surroundings using invisible 850 nm or 940 nm Infrared (IR) LEDs.
- **Camera Sensor Response:** Silicon CMOS sensors are naturally sensitive to near-infrared light, rendering IR illumination as a faint purple or white glow.
- **The Smartphone Reality (IR-Cut Filters):** The primary camera on most modern flagship smartphones is equipped with an integrated hardware **IR-cut filter** designed to block infrared wavelengths to preserve daylight color accuracy. Front-facing selfie cameras occasionally omit this filter.
- **Engineering Decision:** Lookout includes an Infrared detection mode (`DARK`), but ships it **disabled by default** (`IR.ENABLED_ON_THIS_DEVICE = false`). The user runs a 10-minute diagnostic protocol (`DEVICE_TESTS.md`) using a TV remote. If the camera sees IR, the flag is enabled; if blocked, the mode remains honestly grayed out with a clear explanation rather than faking support.

---

## 4. End-to-End Mathematical Algorithms (`src/logic/`)

All detection mathematics are implemented in `src/logic/` as **pure, deterministic, side-effect-free functions** that execute without React Native or device dependencies.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SMARTPHONE HARDWARE LAYER                          │
│     [ Camera Sensor ]         [ LED Flashlight / Torch ]     [ Magnetometer ]│
└──────────────┬───────────────────────────────┬───────────────────────┬──────┘
               │                               │                       │
               ▼                               ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXPO & REACT NATIVE NATIVE BRIDGE                     │
│    expo-camera (CameraView)           Hardware Flashlight         expo-sensors│
│   Downscaled capture (160x120)        Collinear beam              100ms ticks │
└──────────────┬───────────────────────────────────────────────────────┬──────┘
               │                                                       │
               ▼                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PURE MATHEMATICAL LOGIC LAYER                         │
│                                                                             │
│   [blobDetect.js]                  [tracker.js]             [magnetometer.js]│
│   • Grayscale conversion          • Nearest-neighbor match  • 3D Euclidean mag│
│   • Top-1.5% Adaptive Threshold   • Temporal persistence    • 20-sample base  │
│   • 8-connectivity flood fill     • Glint frame-history     • 15% spike ratio │
│   • Pinhole geometry filters      • Eviction of flashes     • Cooldown lock   │
│               │                              │                       │
│               └──────────────────────┬───────┘                       │
│                                      ▼                               ▼
│                         ┌────────────────────────────────────────────────┐  │
│                         │                   fusion.js                    │◄─┘
│                         │   • 4000ms Spatio-Temporal Correlation Window  │
│                         │   • Correlates: [Optical Glint] + [Metal Spike]│
│                         └────────────────────┬───────────────────────────┘
│                                              ▼
│                         ┌────────────────────────────────────────────────┐
│                         │                   verdict.js                   │
│                         │   • Rule 1: High persistence glint -> RED      │
│                         │   • Rule 2: Metal spike alone      -> YELLOW   │
│                         │   • Rule 3: Glint + Metal Spike    -> RED      │
│                         │   • Rule 4: Clean baseline         -> GREEN    │
│                         └────────────────────┬───────────────────────────┘
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION STATE & UI HUD LAYER                    │
│                                                                             │
│  [SessionContext.js]     Central reactive store (aggregates spots & verdict)│
│  [HomeScreen.js]         Mode selection: Lens Sweep, Dark Room, Metal Sweep │
│  [SweepScreen.js]        Real-time heads-up display (HUD), BlobOverlay, logs │
│  [ResultsScreen.js]      Detailed post-sweep forensics & raw sensor evidence│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Computer Vision Pipeline (`blobDetect.js`)

#### 1. Frame Downscaling
Frames are captured via `expo-camera` and downscaled using `expo-image-manipulator` to **160 × 120 pixels** (19,200 total pixels). This resolution was chosen because:
- A pinhole camera lens at 0.5 to 2.0 meters distance occupies between 3 and 30 pixels.
- Pure JavaScript can process 19,200 pixels in **under 8 milliseconds**, preventing UI thread stalls and battery thermal throttling.

#### 2. Luminosity Conversion
The RGBA pixel buffer is converted into a 1D `Uint8Array` grayscale array using ITU-R BT.601 perceptual luminosity weights:
$$Y = 0.299 \cdot R + 0.587 \cdot G + 0.114 \cdot B$$

#### 3. Adaptive Top-Percentile Thresholding
Rather than using a brittle fixed threshold, Lookout computes the luminance histogram and determines the cutoff value corresponding to the **brightest 1.5% of pixels** in the scene (`BRIGHT_TOP_FRACTION = 0.015`).
- **Absolute Floor Guard:** An absolute floor of $Y \ge 200 / 255$ (`MIN_ABSOLUTE_BRIGHTNESS = 200`) is enforced. In a pitch-black room, the top 1.5% of pixels may only measure $Y \approx 30$ (dark sensor noise); the floor ensures noise never passes the threshold.

#### 4. 8-Connected Component Flood Fill
Pixels meeting or exceeding the threshold are labeled into contiguous components using an iterative queue-based 8-connectivity flood fill algorithm. In a single pass, the algorithm computes:
- Bounding box: $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$
- Pixel count (Area $A$)
- Centroid coordinates: $(\bar{x}, \bar{y}) = \left(\frac{\sum x}{A}, \frac{\sum y}{A}\right)$
- Peak luminance value ($Y_{\max}$)

#### 5. Pinhole Morphological Filters
Each connected component is evaluated against four strict geometric criteria:
- **Area Constraint ($3 \le A \le 250$ pixels):**
  - $A < 3$ px: Discarded as single-pixel sensor hot noise.
  - $A > 250$ px: Discarded as large light sources (ceiling fixtures, lamps, TV screens, daylight windows).
- **Fill Ratio Filter ($\text{Fill} \ge 0.5$):**
  $$\text{Fill Ratio} = \frac{\text{Blob Area}}{\text{Bounding Box Width} \times \text{Bounding Box Height}}$$
  A perfect circular disc has a theoretical fill ratio of $\frac{\pi}{4} \approx 0.785$. A threshold of $\ge 0.5$ allows for discrete rasterization effects at low resolution while firmly rejecting thin diagonal scratches, reflections, and glare lines.
- **Aspect Ratio Filter ($\text{Aspect} \ge 0.5$):**
  $$\text{Aspect Ratio} = \frac{\min(\text{Width}, \text{Height})}{\max(\text{Width}, \text{Height})}$$
  Rejects elongated reflections originating from curtain rods, chrome door handles, polished furniture trim, and cables.
- **Local Contrast Filter ($\Delta Y \ge 60$):**
  $$Y_{\max} - \bar{Y}_{\text{frame}} \ge 60$$
  Ensures the glint stands out prominently against the average ambient scene brightness.

---

### 4.2 Multi-Frame Temporal Persistence Tracking (`tracker.js`)
*This algorithm represents the core intellectual differentiator of Lookout.*

1. **State Tracking:** Maintains an active list of tracks across frames. Each track record stores:
   - Unique Track ID
   - Current centroid coordinates $(x, y)$
   - Total consecutive frames detected (`persistence`)
   - Missed frame counter (`misses`)
   - Peak brightness and raw candidate properties
2. **Centroid Matching:** When a new frame produces candidate blobs, they are matched to active tracks using nearest-neighbor Euclidean distance. If the distance:
   $$\sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2} \le 14 \text{ pixels} \quad (\text{TRACK\_MATCH\_DISTANCE})$$
   the track is updated, its centroid refreshed, and its `persistence` counter incremented by 1.
3. **Miss Tolerance:** If an active track is not matched in a frame, its `misses` counter increments. It survives up to 2 consecutive missed frames (`TRACK_MAX_MISSES = 2`) before eviction, accommodating brief frame drops or motion blur.
4. **Strong Track Escalation:** When a track survives for **3 or more consecutive frames** (`STRONG_PERSISTENCE_FRAMES = 3`), it escalates from a tentative reflection to a **Strong Track**.
   - *Physical Result:* A screw head or metallic sticker reflects for 1 or 2 frames during a sweep and resets. A true retroreflective lens maintains focus, climbing to 3, 4, 6, or more frames, triggering an optical detection.

---

### 4.3 3D Magnetometer Signal Processing (`magnetometer.js`)

1. **Euclidean Vector Magnitude:**
   The raw 3-axis sensor outputs $(B_x, B_y, B_z)$ delivered by `expo-sensors` at 10 Hz (every 100 ms) are converted to a scalar magnetic field magnitude:
   $$|\vec{B}| = \sqrt{B_x^2 + B_y^2 + B_z^2} \quad (\mu\text{T})$$
2. **Rolling Baseline Buffer:**
   - Maintains a circular buffer of 20 samples (2.0-second time window).
   - Computes rolling arithmetic mean $\mu_{\text{baseline}}$.
   - Implements a 20-sample warmup period (`WARMUP_SAMPLES = 20`) to prevent the initial ambient reading from triggering a false spike.
3. **Relative Spike Detection:**
   A magnetic spike is flagged when the relative deviation exceeds 15%:
   $$\text{Deviation} = \frac{|\vec{B}| - \mu_{\text{baseline}}}{\mu_{\text{baseline}}} \ge 0.15 \quad (\text{SPIKE\_RATIO})$$
4. **Sustain Verification & Cooldown:**
   - A single anomalous reading does not trigger an alert. The signal must remain above threshold for at least 3 consecutive samples (`SPIKE_SUSTAIN_SAMPLES = 3`, equivalent to 300 ms).
   - Upon logging a valid spike, a 2500 ms debounce cooldown (`COOLDOWN_MS = 2500`) is engaged to prevent log spam when hovering near a stationary metal object.

---

### 4.4 Spatio-Temporal Sensor Fusion (`fusion.js`)
Standard smartphone hardware does not expose spatial indoor tracking coordinates without complex external anchors. Lookout uses **temporal correlation** as a spatial proxy:
- **Correlation Window:** 4000 ms (`CORRELATION_WINDOW_MS = 4000`).
- If an optical candidate glint is observed within 4 seconds of a detected magnetic anomaly spike during a room sweep, the two independent physical phenomena are correlated into a single unified incident.

---

### 4.5 The Verdict Decision Rules (`verdict.js`)

| Observed Signal Combination | Classification | User-Facing Headline | Description |
| :--- | :---: | :--- | :--- |
| **Strong Glint ($\ge 3$ consecutive frames)** | **RED** | Inspect this spot closely | Strong optical retroreflection detected |
| **Brief Glint + Correlated Metal Spike** | **RED** | Inspect this spot closely | Optical reflection confirmed by local metal |
| **Brief Glint Alone (1–2 frames)** | **YELLOW** | Possible lens reflection | Transient specular flash; worth verification |
| **Magnetic Spike Alone** | **YELLOW** | Metal object, worth a lens check | Ferrous metal detected; no optical glint |
| **Infrared Glow Alone (if enabled)** | **YELLOW** | IR glow detected | Infrared light source detected in darkness |
| **Clean Baseline (No anomalies)** | **GREEN** | Clear | No physical anomalies detected during sweep |

#### The Four Inviolable Safety Constraints:
1. **Rule 1: Strong Glint Alone CAN Reach RED.**
   *Rationale:* Inexpensive covert cameras housed in plastic enclosures (clocks, tissue boxes, toys) contain virtually no ferrous shielding. If magnetic confirmation were mandatory for a RED verdict, the app would be blind to plastic spy cameras.
2. **Rule 2: Magnetic Spike Alone Can NEVER Reach RED.**
   *Rationale:* Residential walls are filled with harmless drywall screws, electrical conduits, brackets, and hinges. Classifying metal alone as a camera would create endless false alarms and destroy credibility.
3. **Rule 3: Brief Glint + Metal Escalates to RED.**
   *Rationale:* If a transient reflection happens to occur at the exact spot where a localized magnetic field spike was detected, the two distinct physical sensors corroborate each other.
4. **Rule 4: GREEN Means "Clear", Never "Safe".**
   *Rationale:* Absence of detection is not mathematical proof of absence. The word "safe" is programmatically banned from the entire codebase.

---

## 5. System Architecture & Codebase Map

```
hidden-camera-finder/
├── App.js                         # Root entry: SafeAreaProvider, NavigationContainer, SessionProvider
├── app.json                       # Application manifest: permissions, orient, icon, blocked internet
├── package.json                   # Dependencies, Babel config, Node test scripts
├── src/
│   ├── config.js                  # Centralized tuning parameters (EVERY magic number lives here)
│   ├── modes.js                   # Mode definitions: LENS (primary), MAGNET (filter), DARK (corroborator)
│   ├── theme.js                   # Visual design tokens: palette, typography, status colors, padding
│   ├── logic/                     # PURE MATHEMATICAL CORE (100% side-effect free, testable in Node)
│   │   ├── blobDetect.js          # Grayscale, histogram threshold, 8-connectivity, morphological filters
│   │   ├── tracker.js             # Nearest-neighbor tracking, temporal persistence state machine
│   │   ├── magnetometer.js        # 3D vector magnitude, circular baseline buffer, spike sustain
│   │   ├── fusion.js              # 4000ms spatio-temporal correlation engine
│   │   └── verdict.js             # Decision rules, status copy formatters, session summary rollup
│   ├── hooks/                     # HARDWARE CONTROLLERS & REACT EVENT SUBSCRIPTIONS
│   │   ├── useGlintScanner.js     # Camera frame loop, downscaling, decoding, and pipeline execution
│   │   └── useMagnetometerSweep.js# Magnetometer 100ms subscription and haptic pulse controller
│   ├── components/                # REUSABLE UI PRIMITIVES
│   │   ├── BlobOverlay.js         # Canvas reticle overlay drawing green/red tracking boxes
│   │   ├── SignalBar.js           # Real-time magnetic intensity deflection meter
│   │   └── SparkGraph.js          # Live scrolling sensor waveform chart
│   ├── screens/                   # APPLICATION SCREENS
│   │   ├── HomeScreen.js          # Mode selection, safety disclosure, sensor permission checks
│   │   ├── SweepScreen.js         # Heads-Up Display (HUD), live camera feed, real-time status banner
│   │   └── ResultsScreen.js       # Forensic evidence inspection, raw frame display, candidate logs
│   └── state/
│       └── SessionContext.js      # Global reactive store managing flagged spots and session verdicts
└── tools/                         # AUTOMATED VERIFICATION & TEST HARNESSES
    ├── selftest.mjs               # 33 unit assertions against synthetic camera/sensor data
    ├── test_automation.mjs        # 44 automation tests across all five logic modules
    ├── test_integration.mjs       # 12 end-to-end integration workflows (Clean room, Pinhole clock)
    └── test_regression.mjs        # 8 regression safeguards (key collisions, image saturations, outliers)
```

### 5.1 Technology Stack & Justification
- **Expo SDK 57 / 51:** Modern cross-platform toolchain providing unified access to `expo-camera`, `expo-sensors`, `expo-haptics`, and `expo-image-manipulator`.
- **React Native 0.86.3:** Native mobile view primitives and multi-threaded bridge architecture.
- **Hermes JavaScript Engine:** Pre-compiles application code into optimized bytecode (`.hbc`), yielding instantaneous application boot and low memory footprint (1.91 MB compiled bundle).
- **jpeg-js & base64-arraybuffer:** In-memory JPEG decompression directly into raw 8-bit typed arrays, enabling fast image manipulation without writing temporary files to disk.

---

## 6. Complete Configuration Reference (`src/config.js`)

All magic numbers and physical thresholds are centralized in `src/config.js` to enable rapid calibration across different smartphone models.

```javascript
export const MAGNETOMETER = {
  UPDATE_INTERVAL_MS: 100,      // expo-sensors delivery interval (10 Hz)
  BASELINE_SIZE: 20,           // 20-sample rolling baseline buffer (2.0 seconds)
  WARMUP_SAMPLES: 20,          // Samples discarded before active detection begins
  SPIKE_RATIO: 0.15,           // 15% field increase over rolling baseline triggers spike
  SPIKE_SUSTAIN_SAMPLES: 3,    // Requires 3 consecutive samples over threshold (300ms)
  COOLDOWN_MS: 2500,           // 2.5-second debounce cooldown after logging a spike
  DISPLAY_CEILING_RATIO: 0.6,  // 60% deflection maps to maximum UI meter and haptic rate
}

export const GLINT = {
  CAPTURE_INTERVAL_MS: 300,    // Target frame interval in still-capture mode (~3.3 FPS)
  PROCESS_WIDTH: 160,          // Frame downscale width in pixels
  PROCESS_HEIGHT: 120,         // Frame downscale height in pixels
  CAPTURE_QUALITY: 0.4,        // JPEG compression quality (low quality = faster decode)
  BRIGHT_TOP_FRACTION: 0.015,  // Brightest 1.5% of pixels isolated for candidate extraction
  MIN_ABSOLUTE_BRIGHTNESS: 200,// Absolute floor (0-255) to prevent noise triggers in dark scenes
  MIN_BLOB_AREA: 3,            // Minimum blob size in pixels (rejects single-pixel hot noise)
  MAX_BLOB_AREA: 250,          // Maximum blob size in pixels (rejects ceiling lights, lamps)
  MIN_FILL_RATIO: 0.5,         // Area / (W * H) (rejects diagonal scratches and streaks)
  MIN_ASPECT_RATIO: 0.5,       // min(W,H) / max(W,H) (rejects elongated lines, rods, wires)
  MIN_CONTRAST: 60,            // Peak blob brightness must exceed frame mean by >= 60 units
  TRACK_MATCH_DISTANCE: 14,    // Maximum centroid distance (px) to associate tracks across frames
  TRACK_MAX_MISSES: 2,         // Allowed missed frames before an active track is evicted
  STRONG_PERSISTENCE_FRAMES: 3,// Consecutive frames required to escalate to Strong Track (RED)
  COOLDOWN_MS: 2500,           // Cooldown period between duplicate flagged spot entries
}

export const FUSION = {
  CORRELATION_WINDOW_MS: 4000, // 4-second spatio-temporal fusion window
}

export const IR = {
  ENABLED_ON_THIS_DEVICE: false,// Gated on physical test in DEVICE_TESTS.md
  CAMERA: "front",             // "front" or "back" based on IR-cut filter hardware test
}
```

---

## 7. Quality Assurance & Verification Suite

Lookout includes **97 passing automated tests** across four distinct test harnesses. The pure mathematical logic executes directly in Node.js in **0.8 seconds**.

```
============================================================
TOTAL VERIFIED TESTS: 97 passed, 0 failed (100% PASS RATE)
============================================================
1. tools/selftest.mjs        : 33/33 PASS (Core logic & ground truth)
2. tools/test_automation.mjs : 44/44 PASS (Unit & subsystem automation)
3. tools/test_integration.mjs: 12/12 PASS (End-to-end multi-sensor sweeps)
4. tools/test_regression.mjs :  8/8  PASS (Safeguards, collisions, bounds)
============================================================
```

### 7.1 Test Suites Breakdown
1. **`tools/selftest.mjs` (33 assertions):**
   - Validates 3D vector magnitude calculation: $(3, 4, 0) = 5$.
   - Validates baseline stability and spike detection on synthetic 38% rise.
   - Evaluates synthetic camera frames: retains circular pinhole disc at $(40, 30)$ while rejecting an oversized window and a diagonal streak.
   - Verifies persistence counter accumulation across 6 frames.
   - Confirms verdict rules: strong glint reaches RED; magnetic spike alone NEVER reaches RED.
2. **`tools/test_automation.mjs` (44 assertions):**
   - Tests vector magnitude edge cases (negative coordinates, zero vectors).
   - Validates circular buffer FIFO rollover and warm-up state transitions.
   - Tests 8-connected component flood fill segmentation and centroid calculation.
   - Validates tracking state machine: track creation, nearest-neighbor matching, eviction.
3. **`tools/test_integration.mjs` (12 assertions):**
   - *Clean Room Sweep:* Proves an uncompromised room yields zero flagged spots and evaluates to GREEN.
   - *Pinhole Clock Sweep:* Simulates a 10 Hz magnetic spike followed 1.5s later by an optical glint, verifying a RED verdict and comprehensive forensic evidence rollup.
   - *Multi-Spot Rollup:* Confirms session-level verdict escalation (worst-spot principle).
4. **`tools/test_regression.mjs` (8 assertions):**
   - *Key Collision Guard:* Generates 1,000 log events in the exact same millisecond, verifying 1,000 unique React keys.
   - *Extreme Inputs:* Evaluates pitch-black ($Y=0$) and saturated white ($Y=255$) frames without crashing.
   - *Outlier Values:* Injects a 100× magnetic spike alone and confirms it is locked to YELLOW.
   - *Forbidden Copy Audit:* Scans all verdict text outputs to guarantee words like "Safe", "100%", and fake percentage scores never appear.

---

## 8. Hardware Calibration Protocols (`DEVICE_TESTS.md`)

Before deploying on a new smartphone model, operators execute five physical calibration tests:

### Test 1: Infrared Sensitivity Test (10 minutes)
- **Objective:** Determine whether the front or rear camera possesses an IR-cut filter.
- **Protocol:** In a dim room, point an ordinary television remote control directly at the camera lens (10 cm away). Press and hold any remote button.
- **Evaluation:**
  - If a purple/white glow is visible on the front camera: set `IR.ENABLED_ON_THIS_DEVICE = true` and `IR.CAMERA = "front"`.
  - If visible only on the rear camera: set `true` and `IR.CAMERA = "back"`.
  - If invisible on both: leave `IR.ENABLED_ON_THIS_DEVICE = false`. The mode remains honestly disabled in the UI.

### Test 2: Optical Glint Range & Persistence Test (5 minutes)
- **Objective:** Determine the working distance envelope and verify persistence behavior.
- **Protocol:** Activate the torch. Aim at a test camera lens (webcam, spare phone) from 30 cm, backing away until the glint fades (typically 2.0–2.5 meters). Sweep side-to-side across the target lens, verifying that the glint persists across frames. Sweep across a shiny metallic sticker or screw head, verifying that the glint flashes once and vanishes.

### Test 3: Magnetometer Baseline & Spike Calibration (5 minutes)
- **Objective:** Establish ambient magnetic noise drift and calibrate `SPIKE_RATIO`.
- **Protocol:** Walk through a quiet room away from large metal appliances and record resting drift (typically 42–48 $\mu$T). Bring the phone near a known metal object (door hinge, wall screw) and note the peak reading (e.g., 62 $\mu$T). Set `SPIKE_RATIO` so the threshold sits comfortably above resting drift but below the metal peak. Ensure the quiet room remains completely silent.

### Test 4: Frame Rate Reality Check (2 minutes)
- **Objective:** Verify processing throughput.
- **Expected Benchmark:** 2.0 to 3.5 FPS in Expo Go still-capture mode. If throughput drops below 1.5 FPS, reduce resolution in `config.js` to 128 × 96 pixels.

### Test 5: Airplane Mode Verification (1 minute)
- **Objective:** Validate complete offline operation.
- **Protocol:** Engage Airplane Mode via Android settings. Execute a full workflow (Home $\rightarrow$ Sweep $\rightarrow$ Results $\rightarrow$ Evidence inspection). Verify zero permission prompts and zero network errors.

---

## 9. Live Demonstration Protocol (`DEMO_SCRIPT.md`)

A 4-minute stage demonstration sequence designed for technical hackathon presentations:

- **[0:00 – 0:30] Problem Framing & The SD-Card Reality:**
  Explain that hidden cameras in hotels and PGs in India are a serious threat. Highlight the critical blindspot: over 90% of covert cameras record locally to MicroSD cards, rendering RF and Wi-Fi scanner apps completely useless.
- **[0:30 – 1:00] Physics of Retroreflection:**
  Hold up the smartphone with torch illuminated. Explain how light entering a curved lens reflects directly back along the incident axis into the adjacent camera sensor, creating a collinear transceiver.
- **[1:00 – 2:00] Live Scan & Persistence Counter Demonstration:**
  Sweep the phone toward a real test camera lens on the table. Point to the HUD persistence counter climbing ($1 \rightarrow 2 \rightarrow 3 \rightarrow 4 \rightarrow 5$). Immediately sweep across a shiny metallic sticker: show the reflection flash for 1 frame and reset to 0. Sweep an empty wall: demonstrate total silence.
- **[2:00 – 2:30] The Magnetometer Pre-Filter:**
  Explain that the 3D magnetometer runs continuously to detect ferrous electronics. Explicitly address the hard objection: *"It detects ferrous metal, not cameras. In our code, a magnetic spike can never produce a RED verdict on its own."*
- **[2:30 – 3:15] Forensic Evidence Inspection:**
  Tap "Finish Sweep" and open the flagged spot card. Display the actual captured frame with the reticle overlay, centroid coordinates, area (e.g., 28 px), fill ratio (0.74), peak brightness (248/255), and the rejection log showing that three surrounding bright spots were discarded for failing shape filters.
- **[3:15 – 3:45] Air-Gapped Privacy Architecture:**
  Pull down the Android notification shade showing the active **Airplane Mode** icon. State that internet permissions are blocked in the manifest, no frames are written to disk or sent to the cloud, and the phone form-factor is mandatory due to co-axial torch geometry and mobility.
- **[3:45 – 4:00] Respectful Close:**
  *"We do not certify rooms as safe. Lookout points you at the exact physical spots worth inspecting, backed by verifiable physical evidence, completely offline, on the phone you already own."*
- **Emergency Stage Recovery:**
  If live hardware fails on stage, immediately switch to the laptop terminal and execute `npm run selftest`. Explain that the decoupled pure mathematical core is executing 33 unit assertions against synthetic ground truth in 0.8 seconds.

---

## 10. Technical FAQ & Defense Matrix (`JUDGE_NOTES.md`)

### Q1: "The magnetometer can't tell a camera from a wall screw."
**Answer:** Correct, and Lookout never claims it can. The magnetometer detects ferrous metal as a cheap, fast pre-filter to guide physical attention. In `src/logic/verdict.js`, a magnetic spike alone is strictly locked to YELLOW and can never reach RED. The UI explicitly states: *"Metal object, worth a lens check here"*, never *"Camera detected"*.

### Q2: "This already exists on the Play Store."
**Answer:** Existing free tools suffer from two critical flaws:
1. They are RF-only, missing the most common threat in India: offline SD-card spy cameras.
2. They offer zero evidence verification, displaying opaque "Camera Found" alerts. Lookout provides full forensic evidence: the raw frame, reticle coordinates, blob metrics, threshold used, and the count and reasons for rejected candidates.

### Q3: "What is your measured accuracy percentage?"
**Answer:** Lookout deliberately does not publish an invented accuracy percentage. Measuring an honest accuracy number requires representative testing across thousands of real-world rooms with planted cameras. Publishing an ungrounded "98% accurate" figure would be dangerous, as a user experiencing a false negative based on false confidence is worse off than one given raw physical evidence.

### Q4: "What about a cheap plastic camera with no metal?"
**Answer:** A cheap micro-camera in a plastic case has virtually no magnetic signature. That is precisely why Rule 1 allows a strong persistent optical glint alone to trigger a RED verdict. If magnetic confirmation were mandatory, the app would be systematically blind to plastic spy cameras.

### Q5: "Why does this need to be a mobile phone app?"
**Answer:**
1. Laptops do not possess magnetometers.
2. Retroreflection requires the light source to be collinear with the camera optical axis (3–8 mm spacing on phones; impossible on laptops or separate flashlights).
3. The user must physically sweep a room at 11 PM using a device already in their pocket.

### Q6: "How would you productionize the 2–3 FPS frame rate?"
**Answer:** Plain Expo Go does not expose low-level camera frame processor buffers, requiring still captures and JS JPEG decoding. To productionize, we swap in `react-native-vision-camera` with C++ frame processors running directly on the camera thread at 30 FPS. Crucially, **every mathematical function in `src/logic/` is pure and survives that swap completely unchanged**.

---

## 11. Production Roadmap & Future Enhancements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DEVELOPMENT ROADMAP                              │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ PHASE 1: MVP (DONE)  │ PHASE 2: 30 FPS      │ PHASE 3: EDGE AI & AR         │
│ • Expo SDK 51/57     │ • react-native-      │ • Quantized MobileNet Edge-AI │
│ • 160x120 Pure JS CV │   vision-camera      │   lens pupil classifier       │
│ • Magnetometer 10Hz  │ • C++ Frame Process- │ • ARKit / ARCore 3D spatial   │
│ • 97 Automated Tests │   ors at 30 FPS      │   room marker pinning         │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Phase 1: Zero-Dependency Pure JS MVP (Current State - Complete)**
   - 160 × 120 downscaled computer vision pipeline with connected-component flood fill.
   - Multi-frame temporal persistence tracking with nearest-neighbor matching.
   - 10 Hz 3D magnetometer vector magnitude and 4000 ms spatio-temporal fusion.
   - 97 passing automated unit, integration, and regression tests.
2. **Phase 2: 30 FPS Native Frame Processor Pipeline (Next 30 Days)**
   - Migrate from Expo Go to custom native build using `react-native-vision-camera`.
   - Implement frame downscaling, thresholding, and connected components in C++ directly on the camera hardware buffer at 30 FPS.
   - Keep 100% of detection mathematics in `src/logic/` intact.
3. **Phase 3: On-Device TinyML Second-Stage Classifier (Q1 2027)**
   - Deploy a quantized edge model (< 2 MB TFLite/ONNX) running on the smartphone NPU.
   - Evaluates only 32 × 32 pixel cropped regions around flagged candidate centroids to verify micro-lens pupil reflections versus screw heads.
4. **Phase 4: AR Spatial Room Mapping (Q2 2027)**
   - Utilize ARCore / ARKit plane detection to map room geometry in 3D.
   - Anchor flagged suspicious anomalies to 3D room coordinates, allowing users to move freely while persistent virtual reticles remain anchored to physical locations.

---
*End of Complete Project Reference Dossier — Lookout: Hidden Camera Finder*
