# **Lookout: Hidden Camera Finder — End-to-End Architecture & Tech Stack**

---

## **1. Project Overview & Mission**
**Lookout** is a privacy & safety mobile application designed to detect covert hidden cameras (pinhole lenses, spy cams disguised in smoke detectors, alarm clocks, tissue boxes) using the **standard sensors and optical hardware available on every modern smartphone**.

### **Core Philosophy: No Fake AI, Just Real Physics**
Most apps in the app store claim to "detect spy cameras with AI" and show fake scanning radar animations with random numbers. 
**Lookout is built on verifiable physics & pure mathematics:**
1. **Optical Retroreflection**: Curved camera lenses reflect torch light directly back along the incident ray.
2. **Magnetic Anomaly Detection**: Unshielded camera electronics, transformers, and circuitry perturb the local magnetic field.
3. **Temporal Tracking**: Differentiates flat specular glints (screws, stickers) from true retroreflecting lenses over time.
4. **Air-gapped & 100% Private**: **Zero network requests**, zero telemetry, nothing is ever uploaded or recorded.

---

## **2. System Architecture Diagram**

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
│   • Grayscale conversion          • Nearest-neighbor match  • 3D Euclidean magnitude│
│   • Adaptive top-1.5% brightness  • Temporal persistence    • 20-sample baseline│
│   • 8-connectivity flood fill     • Glint frame-history     • 15% spike ratio│
│   • Pinhole geometry filters      • Eviction of flashes     • Cooldown debounce│
│               │                              │                       │
│               └──────────────────────┬───────┘                       │
│                                      ▼                               ▼
│                         ┌────────────────────────────────────────────────┐  │
│                         │                   fusion.js                    │◄─┘
│                         │   • 4000ms Temporal Correlation Window         │
│                         │   • Correlates: [Glint] + [Ferrous Metal]      │
│                         └────────────────────┬───────────────────────────┘
│                                              ▼
│                         ┌────────────────────────────────────────────────┐
│                         │                   verdict.js                   │
│                         │   • Rule 1: High persistence glint -> RED      │
│                         │   • Rule 2: Metal spike alone      -> YELLOW   │
│                         │   • Rule 3: Glint + Metal          -> RED      │
│                         │   • Rule 4: Clean baseline         -> GREEN    │
│                         └────────────────────┬───────────────────────────┘
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION STATE & UI LAYER                        │
│                                                                             │
│  [SessionContext.js]     Central session store (aggregates spots & verdict) │
│  [HomeScreen.js]         Mode selection: Lens Sweep, Dark Room, Metal Sweep │
│  [SweepScreen.js]        Real-time heads-up display (HUD), BlobOverlay, logs │
│  [ResultsScreen.js]      Detailed post-sweep forensics & raw sensor evidence│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## **3. End-to-End Workflow**

### **Stage 1: Real-Time Scanning ([`SweepScreen.js`](file:///d:/Amhedabad_hackthon/Hyderbad/Lookout---IQOO-Hyd-/src/screens/SweepScreen.js))**
1. **Camera Torch Activation**:
   - The rear camera and torch are initialized simultaneously.
   - Because the LED emitter and camera sensor sit millimeters apart on the back of the phone, they form a **collinear retroreflective transceiver**.
2. **Ambient Magnetic Baselining**:
   - The magnetometer samples at 10 Hz (every 100ms).
   - It buffers 20 samples to learn the magnetic signature of the room (typically 35–55 $\mu$T).

### **Stage 2: Computer Vision Pipeline ([`blobDetect.js`](file:///d:/Amhedabad_hackthon/Hyderbad/Lookout---IQOO-Hyd-/src/logic/blobDetect.js))**
1. Every ~300ms, a frame is downscaled to **160×120 pixels** (19,200 pixels).
2. The image buffer is converted to a flat grayscale luminosity array ($0.299R + 0.587G + 0.114B$).
3. **Adaptive Histogram Thresholding**:
   - Finds the brightest 1.5% pixels in the scene.
   - Applies an absolute brightness floor of $\ge 200/255$ so dark noise does not trigger.
4. **8-Connected Component Flood Fill**:
   - Clusters adjacent pixels into bounding boxes.
5. **Geometry Filtering**:
   - **Area Filter**: Must be between 3 and 250 pixels. Discards light bulbs, open windows, and TV screens.
   - **Fill Ratio**: Evaluates $\frac{\text{Area}}{\text{Width} \times \text{Height}}$. Discards diagonal streaks or scratches.
   - **Aspect Ratio**: Rejects reflections elongated along railings or polished trim.

### **Stage 3: Multi-Frame Persistence Tracking ([`tracker.js`](file:///d:/Amhedabad_hackthon/Hyderbad/Lookout---IQOO-Hyd-/src/logic/tracker.js))**
- **The Core Problem**: A screw or reflective plastic sticker reflects brightly at a specific mirror angle.
- **The Solution**: 
  - As the user sweeps the room, flat objects flash for **1 or 2 frames** and vanish.
  - A retroreflective camera lens focuses light back across an angular envelope, staying visible across consecutive frames.
  - When a track survives $\ge 3$ consecutive frames, it is escalated to a **Strong Track**.

### **Stage 4: Sensor Fusion & Safety Rules ([`fusion.js`](file:///d:/Amhedabad_hackthon/Hyderbad/Lookout---IQOO-Hyd-/src/logic/fusion.js) & [`verdict.js`](file:///d:/Amhedabad_hackthon/Hyderbad/Lookout---IQOO-Hyd-/src/logic/verdict.js))**
- When metal is detected $\ge 15\%$ above baseline, a timestamped magnetic event is noted in the fusion buffer.
- When an optical reflection is confirmed, the fusion engine checks if metal was detected within a **4000ms window**.
- **The Safety Verdict Rules**:
  - 🔴 **RED**: Multi-frame persistent lens reflection OR brief reflection with metal correlation.
  - 🟡 **YELLOW**: Metal detected alone (could be an innocent screw or drywall stud) OR single-frame specular glint.
  - 🟢 **GREEN**: No signals above threshold ("Clear").

### **Stage 5: Forensic Results & Evidence Inspection ([`ResultsScreen.js`](file:///d:/Amhedabad_hackthon/Hyderbad/Lookout---IQOO-Hyd-/src/screens/ResultsScreen.js))**
- The user taps **"Finish Sweep"**.
- The app generates a summary with raw evidence cards:
  - Timestamp of flagged anomalies.
  - Exact coordinates on the camera frame with an interactive target reticle overlay.
  - Plain-English explanation of why it was flagged (e.g. *"Lens-like reflection held for 6 frames + Magnetic field 45% above baseline"*).

---

## **4. Technology Stack**

| Layer / Domain | Technology | Version | Purpose / Role |
| :--- | :--- | :--- | :--- |
| **Framework & Engine** | **Expo SDK** | `~57.0.24` | Modern mobile runtime, toolchain, and native module bindings |
| **Mobile Core** | **React Native** | `0.86.3` | Native UI components, bridge architecture, and threading |
| **UI Library** | **React** | `19.2.3` | Modern declarative component model, hooks, and reconciliation |
| **Camera & Torch** | **`expo-camera`** | `~57.0.5` | Native camera preview, torch control, and fast still capture |
| **Magnetic Sensors** | **`expo-sensors`** | `~57.0.3` | High-frequency 3D magnetometer sensor readings ($X, Y, Z$ $\mu$T) |
| **Haptic Feedback** | **`expo-haptics`** | `~57.0.3` | Tactile vibration pulses when approaching suspicious spots |
| **Image Processing** | **`expo-image-manipulator`** | `~57.0.19` | Hardware-accelerated frame downscaling to 160×120 |
| **Decoding & Buffers** | **`jpeg-js`** & **`base64-arraybuffer`** | `^0.4.4` / `^1.0.2` | Fast pixel decoding into raw RGB `Uint8Array` buffers |
| **Navigation** | **`@react-navigation/native-stack`** | `^7.1.14` | Native stack navigation between Home, Sweep HUD, and Results |
| **Test Engineering** | **Node.js Test Runners** | Pure ESM | 64 automated, regression, and integration tests with zero overhead |

---

## **5. Why This Architecture Wins**

1. **Zero External Backend / 100% Offline**: No images leave the device. Operates inside hotel rooms or bathrooms without Wi-Fi or cellular service.
2. **Sub-10ms JS Processing**: By downsizing frames to 160×120 and executing pure bitwise operations and 1D typed arrays (`Uint8Array`, `Int32Array`), real-time CV runs at 30+ FPS without overheating or draining the battery.
3. **Decoupled Architecture**: All core detection mathematics live in `src/logic/` as **pure, side-effect-free functions**. They can be tested instantly in Node without requiring an emulator or device.
4. **Honest Engineering**: Never outputs fake confidence scores (e.g., "94% safe"). It treats security as verifiable physical evidence.