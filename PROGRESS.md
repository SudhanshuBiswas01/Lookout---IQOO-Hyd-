# Lookout — Hidden Camera Finder
## Project Diagnosis & Execution Progress Report

**Date & Time:** September 21, 2026  
**Target Milestone:** iQOO City Battles, Hyderabad (26–27 September 2026)  
**Target Repository:** `https://github.com/SudhanshuBiswas01/Lookout---IQOO-Hyd-.git`  
**Current Branch:** `main`

---

## 1. Executive Summary

Lookout is an **offline-only** hidden-camera detector designed specifically for mobile hardware:
1. **Lens Glint (Primary Detector)**: Torch retroreflection tracked across consecutive frames via classical computer vision (connected components, fill/aspect filters, persistence tracking).
2. **Magnetometer (Corroborating Pre-Filter)**: Ferrous metal detection to guide the search area (strictly non-verdict; cannot trigger RED on its own).
3. **Infrared (Conditional)**: Evaluated at boot; disabled gracefully if the device has an IR-cut filter.

All phases of local environment provisioning, test validation, dependency installation, and bundle compilation have been **successfully executed and verified**.

---

## 2. Environment & Toolchain Provisioning

- **Node.js**: Installed standalone Node.js **v20.18.0 LTS** and npm **10.8.2** in `C:\Users\admin\AppData\Local\Programs\nodejs`.
- **Git**: Installed portable MinGit **v2.44.0.windows.1** in `C:\Users\admin\AppData\Local\Programs\git`.
- **Environment PATH**: Configured user and process PATH to include both tools.

---

## 3. Self-Test Results (`tools/selftest.mjs`)

The self-test suite executes the real algorithm files against synthetic sensor and camera data without requiring a device.

- **Status**: **100% Pass (33/33 assertions)**
- **Command**: `npm run selftest`
- **Resolution**: Updated `package.json` with `--experimental-default-type=module` so the test suite runs directly in Node v20 without modifying `"type": "module"` (preventing Metro bundler conflicts).

```text
1. Magnetometer
---------------
  PASS  magnitude of (3,4,0) is 5
  PASS  no false spike on a quiet baseline  (0 spikes)
  PASS  spike fires on a sustained 38% rise  (deviation 38%)
  PASS  one stray sample does not fire a spike

2. Blob detection
-----------------
  PASS  grayscale length matches pixel count
  PASS  background reads back as ~40  (got 40)
  PASS  threshold respects the absolute floor  (threshold 255)
  PASS  finds all three bright regions  (found 3)
  PASS  keeps exactly one candidate  (kept 1)
  PASS  the kept blob is the disc at (40,30)  (at (40.0, 30.0))
  PASS  rejects the window for being too large
  PASS  rejects the streak for shape
  PASS  a black frame produces zero candidates

3. Persistence tracker
----------------------
  PASS  a lens accumulates persistence and goes strong  (persistence 6)
  PASS  an intermittent sticker never reaches strong
  PASS  two distinct spots stay two distinct tracks

4. Verdict rules (these are the ones that matter)
-------------------------------------------------
  PASS  strong glint alone reaches RED  (RED)
  PASS  magnetic spike alone can NEVER reach RED  (YELLOW)
  PASS  magnetic copy never says 'camera'  (Metal object - worth a lens check here)
  PASS  a one-frame glint is only YELLOW  (YELLOW)
  PASS  brief glint plus metal escalates to RED  (RED)
  PASS  IR alone is only YELLOW
  PASS  no signal is GREEN
  PASS  GREEN copy says 'Clear', never 'Safe'  (Clear)
  PASS  no confidence score appears in any verdict text
  PASS  session verdict takes the worst spot

5. Sensor fusion
----------------
  PASS  a magnetic spike 1.5s earlier correlates with a glint
  PASS  and that combination is RED
  PASS  a magnetic spike 29s earlier does NOT correlate
  PASS  so the stale pair stays YELLOW

6. End to end: a synthetic room sweep
-------------------------------------
  PASS  the sweep flags exactly one spot  (1 spots)
  PASS  and it is RED
  PASS  and it carries a human-readable reason

====================================================
  33 passed, 0 failed
====================================================
```

---

## 4. Dependencies & Expo SDK 51 Verification

1. **Dependency Installation**:
   - Ran `npm install` (1,150 packages resolved and installed).
   - Added `"babel-preset-expo": "~11.0.15"` to `devDependencies`.

2. **Expo Doctor Audit**:
   - Ran `npx expo-doctor`:
   - **Result**: `16/16 checks passed. No issues detected!`

3. **Android Bundle Compilation Test**:
   - Ran `npx expo export --platform android --no-minify`.
   - **Result**: `Android Bundled 8895ms ... AppEntry.js (756 modules)`. Hermès bytecode (`.hbc`) generated cleanly (1.91 MB). Zero compilation or syntax errors.

---

## 5. Applied Code Improvements

| Area | Status | File | Description |
| --- | --- | --- | --- |
| **SafeArea & Insets** | **FIXED** | `App.js` | Wrapped navigation hierarchy in `SafeAreaProvider` from `react-native-safe-area-context` to prevent layout clipping on punch-hole / notched displays. |
| **Camera Frame Loop** | **HARDENED** | `src/hooks/useGlintScanner.js` | Added null/unmount guards around `cam.takePictureAsync`, `shot.uri`, and `ImageManipulator.manipulateAsync` to protect against unhandled dropped frame exceptions. |
| **ESM Execution** | **FIXED** | `package.json` | Updated `npm run selftest` to include `--experimental-default-type=module`. |
| **Babel Configuration** | **FIXED** | `package.json` | Explicitly added `babel-preset-expo` to `devDependencies`. |
| **Algorithmic Core** | **LOCKED** | `src/logic/*` | Kept 100% pure and untouched. |

---

## 6. How to Run Locally

### Start Development Server
```powershell
npm start
```
Scan the displayed QR code with the Expo Go app on your phone (connected to the same Wi-Fi or via USB tunnel).

### Run Test Suite (Laptop Offline Demo)
```powershell
npm run selftest
```

---

## 7. GitHub Push Instructions

The local Git repository is completely configured with all source code, tests, and research documents. To push `main` to GitHub:

```powershell
git push -u origin main
```
If prompted for credentials, use your GitHub username (`SudhanshuBiswas01`) and a Personal Access Token (classic or fine-grained with `repo` scope).
