# Hidden Camera Finder

An offline mobile app that helps you check a hotel room, trial room or rental
space for hidden cameras using nothing but the phone's own sensors.

No internet. No backend. No cloud AI. No accounts. Everything runs on-device,
and the app works in airplane mode.

Built for the iQOO City Battles, Hyderabad, 26-27 September 2026.

---

## Quick start

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on the phone. Grant camera access when asked.

Run the detection logic without a phone at all:

```bash
npm run selftest
```

That runs 33 assertions against the real algorithm files on synthetic data -
synthetic camera frames, synthetic magnetometer traces, the full verdict
table. It needs no dependencies installed and takes under a second. **If the
live demo ever fails at the venue, run this on a laptop instead.**

---

## How it actually works

### The primary signal: lens retroreflection

A camera lens is a retroreflector. Light that enters it gets focused onto the
sensor and a portion bounces back out along almost the same path it came in.
So if the torch sits right next to the phone's camera, a hidden lens throws a
small, very bright point of light straight back at you.

This is not our invention. It is the physics that every commercial spy-camera
detector on the market uses. We implemented it on-device with classical CV.

The pipeline, per frame:

```
capture -> downscale to 160x120 -> grayscale
  -> keep the brightest ~1.5% of pixels (with an absolute floor)
  -> connected-component labelling (8-connectivity, iterative flood fill)
  -> filter by size, roundness, aspect ratio, contrast
  -> match blobs against previous frames -> persistence counter
```

### The filter that makes it work: persistence

A single frame cannot tell a lens from a shiny sticker. Both are small bright
round spots.

What separates them is behaviour over time. A **lens retroreflects**, so it
stays lit across many frames as you move the phone. A **flat shiny surface**
reflects specularly, so it only lights up at the exact mirror angle and
vanishes a frame later.

So we track blobs across frames and count how many **consecutive** frames each
one survives. That count is what upgrades a maybe into a strong signal. The
number is drawn live next to each circle on screen - you can watch it climb on
a real lens and reset on a sticker.

### The corroborating signal: magnetometer

The magnetometer detects **ferrous metal, not cameras**. The app says this
explicitly, on the mode card and again on the scan screen.

It is used as a cheap first-pass filter that tells you where to point the lens
scan. It behaves like a metal detector: the readout rises and the haptic pulse
rate increases as you get closer.

**A magnetic spike alone can never produce a RED verdict.** That rule is
enforced in `src/logic/verdict.js` and locked by the self-test.

### The conditional signal: infrared

Many night-vision cameras run IR LEDs that are invisible to the eye but
sometimes visible to a phone camera. Sometimes. Most modern flagships have an
IR-cut filter that makes this physically impossible.

So this feature ships **disabled by default**. Run test 1 in `DEVICE_TESTS.md`
on the actual phone. If IR is visible, flip `IR.ENABLED_ON_THIS_DEVICE` in
`src/config.js`. If not, the mode stays greyed out with an honest explanation
and we say so in the pitch rather than faking it.

---

## Verdict logic

```
Strong glint, held >= 3 consecutive frames   -> RED     inspect this spot closely
Brief glint + magnetic spike in same area    -> RED     inspect this spot closely
Brief glint alone                            -> YELLOW  possible lens reflection
Magnetic spike alone                         -> YELLOW  metal object, worth a lens check
IR glow alone (if supported)                 -> YELLOW  worth a lens check
Nothing                                      -> GREEN   clear
```

Four rules behind that table, all of them deliberate:

1. **A strong glint alone can reach RED.** The threat that matters most here
   is a cheap camera in a plastic housing, which has almost no magnetic
   signature. If glint always needed magnetic confirmation, the app would be
   systematically blind to exactly the case it exists to catch.

2. **A magnetic spike alone can never reach RED.** Buildings are full of
   screws, brackets, hinges and wiring. Treating that as camera evidence would
   make the app cry wolf and would be dishonest.

3. **GREEN means "nothing found", never "safe".** Absence of signal is not
   proof of absence. The word "safe" does not appear anywhere in the app.

4. **No confidence percentages.** We have not measured accuracy on a
   representative sample, so any number would be invented. Instead every
   verdict carries its raw evidence.

---

## Raw evidence, not a score

This is the biggest difference between this app and the free ones.

Tap any flagged spot on the results screen and you get:

- the **actual captured frame**, with a marker on the blob that fired
- how many consecutive frames it held, its peak brightness, the exact
  brightness cutoff used
- the blob's measured area, roundness and aspect ratio
- **how many other bright spots were rejected in that frame, and why**
- for magnetic flags, the **real waveform** with peak and baseline in uT

The user checks with their own eyes. Nobody has to trust us.

---

## Project structure

```
App.js                          three screens, navigation, session provider
src/config.js                   EVERY tuning constant lives here
src/theme.js                    colours and spacing
src/modes.js                    the three scan modes

src/logic/                      pure functions - no React, no I/O, testable
  magnetometer.js               magnitude, rolling baseline, spike detection
  blobDetect.js                 grayscale, threshold, blob finding, filters
  tracker.js                    frame-to-frame persistence tracking
  verdict.js                    the RED / YELLOW / GREEN rules
  fusion.js                     correlating the two signals

src/hooks/
  useMagnetometerSweep.js       sensor subscription + metal-detector haptics
  useGlintScanner.js            camera capture loop + detection pipeline

src/components/                 SignalBar, BlobOverlay, SparkGraph
src/screens/                    Home, Sweep, Results
tools/selftest.mjs              33 assertions, runs with plain node

DEVICE_TESTS.md                 run these on the real phone FIRST
DEMO_SCRIPT.md                  the 4-minute stage run
JUDGE_NOTES.md                  prepared answers to the hard questions
```

The split matters. Everything in `src/logic/` is pure, which is why
`tools/selftest.mjs` can exercise the real detection code with no device and
no dependencies.

---

## The frame-capture architecture, honestly

expo-camera does not expose per-frame pixel data. There is no frame processor
callback in plain Expo. So the scanner does this instead:

```
takePictureAsync (skipProcessing)
  -> ImageManipulator resize to 160x120, base64
  -> decode JPEG in pure JS (jpeg-js)
  -> grayscale -> blob detect -> persistence tracker
```

**The honest cost: this runs at roughly 2-3 frames per second, not 30.** It is
visibly steppy. We took that trade because it works in plain Expo Go with no
native build, which is the right call under a 36-hour clock.

The upgrade path is `react-native-vision-camera` frame processors in a dev
build, which gives real 30fps access on the camera thread. **Every pure
function in `src/logic/` is reusable unchanged when that swap happens** - the
only file that gets rewritten is `useGlintScanner.js`. That is precisely why
the pipeline is split this way, and it is a good answer to "how would you
productionise this".

---

## Privacy

The privacy architecture is the product. An app that scans bedrooms and hotel
rooms cannot have a cloud pipeline.

- No network code anywhere in the source tree. There is no `fetch` call.
- `INTERNET` and `ACCESS_NETWORK_STATE` are **blocked** in `app.json`, so the
  built APK cannot reach the network even if it wanted to.
- No accounts, no analytics, no crash reporting SDK.
- Captured frames live in memory for the session and are gone when the app
  closes. There is no store to leak.
- Works fully in airplane mode. Demo it that way.

---

## What this is not

- Not a certification that a room is clear.
- Not an RF detector. Phones cannot scan arbitrary RF bands without extra
  hardware.
- Not a forensic or law-enforcement instrument.
- Not a replacement for physically looking at suspicious objects.

It is a screening aid that points you at spots worth inspecting and shows you
why.

---

## Known limitations

| Limitation | Status |
| --- | --- |
| 2-3 fps capture loop | Accepted trade for Expo Go compatibility |
| Magnetometer has no spatial coordinates | Fusion correlates by time, not position. Stated in `fusion.js` |
| Very bright rooms wash out the glint | Torch retroreflection needs a reasonably dim scene |
| IR mode may be impossible on this hardware | Disabled by default, gated on a device test |
| Thresholds are fixed constants | Tuned per device by hand in `config.js`, not learned |
