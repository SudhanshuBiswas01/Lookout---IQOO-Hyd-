# Judge notes - the hard questions and the honest answers

Every one of these will come up. Rehearse them out loud. The single biggest
advantage this project has is that it does not need to dodge anything.

---

## "The magnetometer can't tell a camera from a screw."

Correct, and we do not claim it can.

It detects ferrous metal. That is a cheap first-pass filter that tells the
real scan where to look, not a detector in its own right. In the code, a
magnetic spike can never produce a RED verdict on its own - that rule is
enforced in one place and locked by a unit test. The copy on screen says
"metal object, worth a lens check here", never "camera detected".

The verdict is always glint-confirmed.

---

## "This already exists on the Play Store."

RF detectors exist, and they miss the case that matters most in India: a cheap
camera recording to an SD card with nothing to transmit. There is no signal
for an RF scanner to catch.

We are not claiming to have invented camera detection. We are fixing two
things the existing free tools get wrong:

1. **No signal fusion.** They are RF-only or IR-only. We combine lens
   retroreflection with a metal pre-filter.
2. **No way to verify the result.** They show "camera found!" and nothing
   else. Every result we produce carries the raw frame, the blob measurements,
   the threshold used, and how many other candidates were rejected and why.

The second one is the real differentiator. Tap any result on the screen and
you can see for yourself.

---

## "How accurate is it?"

We deliberately do not publish an accuracy number.

We have not measured one on a representative sample of real hidden cameras in
real rooms, and inventing a percentage would be dishonest. It would also be
the single most dangerous thing this app could do - a user who trusts "97%
accurate" and gets a false negative is worse off than a user who was never
given a number.

That is exactly why every result shows its raw evidence instead of a score.
The user makes the final call, with the data in front of them.

---

## "Why does this need to be on a phone?"

Three hard dependencies, none of which a laptop or a web app has:

1. **The magnetometer.** Not present on laptops.
2. **A torch mounted next to the camera lens.** Retroreflection only works
   when the light source is close to the optical axis. That geometry is a
   phone design accident we depend on completely.
3. **Being carried into the room.** You check a hotel room at 11pm with the
   thing in your pocket. There is no other form factor.

And it has to be offline, which means the processing has to be on the device
that has the sensors.

---

## "Show me it working on something that isn't planted."

This is the question that kills demos. Be ready:

- Have a **real webcam or a spare phone camera** on the table, not a prop.
- Let a judge hold the lens and move it. The persistence counter on screen
  climbs as long as it stays a lens.
- Then point at a **shiny sticker or a screw head** in the same lighting. It
  flashes and the counter resets. It never reaches RED.
- Then sweep an **empty wall** and let it say nothing. Silence on a clean
  surface is a feature, and most demos never show it.

---

## "What about the plastic camera with no metal in it?"

This is our favourite question, so bring it up first if nobody asks.

A cheap camera in a plastic housing produces almost no magnetic signature.
That is precisely why a strong glint alone is allowed to reach RED in our
logic. If we had required magnetic confirmation for every RED - which is the
obvious, tidy-looking design - the app would be systematically blind to
exactly the threat it exists to catch.

The magnetometer is the corroborator. The lens is the detector. That ordering
is in the code, in the UI, and in the pitch.

---

## "Your IR mode is disabled."

Yes. We tested it on this hardware in the first hour, and this phone's camera
filters infrared, so night-vision LEDs are invisible to it.

We could have shipped a mode that looks like it works and never fires. We
disabled it instead, and the app tells the user why. The code is in place
behind one config flag - on a phone that passes the test, it works.

(If the test passed on your device, delete this section and demo the feature.)

---

## "How would you productionise this?"

The honest gap is frame rate. We run at 2-3 fps because plain Expo does not
expose per-frame pixel data, so we capture, downscale and decode in JS.

Production swaps in `react-native-vision-camera` frame processors on a dev
build, which gives 30fps on the camera thread. **Every pure function in
`src/logic/` survives that change unchanged** - the detection algorithm,
the persistence tracker, the verdict rules. Exactly one file gets rewritten.

Beyond that: a small on-device model as a second stage to classify lens versus
sticker versus LED, per-device calibration on first run, and an encrypted
local evidence store. All of it stays on the device. An app that scans
bedrooms cannot have a cloud pipeline, and that constraint does not change at
any scale.

---

## "Did you build this or generate it?"

Point at `tools/selftest.mjs` and run it.

33 assertions against the real algorithm files: synthetic camera frames with a
known ground truth, synthetic magnetometer traces, and the full verdict table
including the negative cases. It proves the blob filter rejects a window and a
streak while keeping a disc, proves an intermittent sticker never accumulates
persistence, and proves a magnetic spike alone can never go RED.

It runs with plain `node` in under a second, with no dependencies installed.

---

## Things to say unprompted

- **Open in airplane mode.** Pull down the notification shade first. Two
  seconds, no slide needed.
- **Say "we do not certify a room as safe"** before anyone asks. It buys more
  credibility than any feature.
- **Show a rejected blob.** "This frame had four bright spots. Three were
  thrown out for being the wrong size or shape. Here is which and why."
- **Concede the category upfront.** "Camera detectors exist. Here is
  specifically what they get wrong."
