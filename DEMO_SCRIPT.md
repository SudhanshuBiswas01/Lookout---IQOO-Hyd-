# Demo script - 4 minutes on stage

Rehearse this in the actual venue lighting. Glint detection is lighting
dependent and the room you practised in is not the room you present in.

---

## Before you walk up

- [ ] Phone in **airplane mode**, notification shade pulled down so the icon
      shows
- [ ] App already open on the Home screen
- [ ] Torch works, battery above 40%
- [ ] Test lens on the table: a real webcam or a spare phone camera
- [ ] A reflective sticker or screw head on the table, for the contrast demo
- [ ] A small dark box as a fallback if the stage lights are brutal
- [ ] Laptop open at `npm run selftest`, ready to run if the demo dies

---

## 0:00 - 0:30  The problem

> Hidden cameras in hotel rooms, PGs and trial rooms are a real problem in
> India. The people most at risk have no way to check. Professional detectors
> cost thousands and nobody carries one.
>
> The free apps that exist are RF scanners. They miss the common case
> completely: a cheap camera recording to an SD card, transmitting nothing.

---

## 0:30 - 1:00  The physics

Hold up the phone with the torch on.

> A camera lens is a retroreflector. Light going in gets focused on the sensor
> and bounces back out along the same path. So if the torch sits next to the
> camera, a hidden lens throws a bright point straight back at you.
>
> That is how every commercial detector works. We built it on-device.

**Lead with this, always.** Never open with the magnetometer.

---

## 1:00 - 2:00  The live scan

Start the Lens Scan. Sweep toward the planted camera.

> Watch the number next to the circle.

Let it climb. Then say the line that wins the demo:

> That count is consecutive frames. A lens keeps reflecting as I move. A shiny
> sticker only catches the light at one angle.

Now point at the sticker. Let it flash and reset.

> That one never gets past two. It never turns red.

Then sweep empty wall.

> And on a clean surface it says nothing. A detector that fires everywhere is
> worse than no detector.

---

## 2:00 - 2:30  The metal pre-filter

> The magnetometer runs the whole time. It finds ferrous metal - **not**
> cameras. It cannot tell a camera from a screw and we do not pretend it can.
>
> It is a cheap filter that tells you where to point the real scan. In our
> logic a magnetic spike **can never** produce a red result on its own.

If a judge was about to raise this, you have just taken it off the table.

---

## 2:30 - 3:15  The evidence screen

Finish the scan. Open a flagged spot.

> Every other app gives you "camera found" and nothing else. Here is what we
> give you instead.

Point at each item:

> The actual frame. The exact spot that fired. It held for six frames, peak
> brightness 248 out of 255, the cutoff we used was 251. The blob measured 29
> pixels, roundness 0.74.
>
> And this line - three other bright spots in this frame were rejected, for
> being the wrong size or shape.
>
> No confidence score anywhere. We have not measured accuracy on a real
> sample, so any number would be invented. You check it yourself.

---

## 3:15 - 3:45  Privacy and the phone

> This has been in airplane mode the whole time.

Show the shade.

> There is no network code in the source. The internet permission is blocked
> in the manifest, so the built APK cannot phone home even if it wanted to.
> Frames live in memory and are gone when you close the app.
>
> An app that scans bedrooms cannot have a cloud pipeline. That is not a
> limitation we worked around - it is why you would trust it.

Then the phone-necessity line:

> This needs the magnetometer, and it needs a torch mounted next to the camera
> lens - retroreflection only works when the light is on the optical axis.
> Neither exists on a laptop. And you use it standing in a hotel room at 11pm.

---

## 3:45 - 4:00  Close

> We do not certify a room as safe. Absence of signal is not proof of absence,
> and the app says so on the home screen.
>
> What it does is point you at the spots worth looking at, and show you why,
> offline, on a phone you already own.

---

## If the live demo fails

Do not panic and do not retry more than twice. Switch to the laptop:

```bash
npm run selftest
```

> The detection logic is pure functions, separated from the camera. Here it is
> running against synthetic frames with known ground truth - a disc that
> should be kept, a window that should be rejected, a streak that should be
> rejected, a sticker that flashes and must never accumulate persistence, and
> the full verdict table including the negative cases. Thirty-three
> assertions.

That recovery is genuinely impressive to technical judges. It shows the
architecture was designed so the algorithm is testable without the hardware.

---

## Do not say

- "the room is safe" or "the room is clean"
- any accuracy or confidence percentage
- "it detects cameras magnetically"
- "this is the first app to do this"
- "it works 100% of the time"
