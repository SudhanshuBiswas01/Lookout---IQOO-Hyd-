# Device tests - run these FIRST, before writing or tuning anything

These take about 20 minutes total and they can delete an entire feature before
you waste hours on it. Do them in the first hour of the hackathon.

Write the measured numbers into `src/config.js`.

---

## Test 1 - Can this phone see infrared? (10 minutes)

This decides whether the Dark Room Scan exists at all.

**Setup:** a dark room, a TV remote or any IR remote, the phone.

1. Open the phone's normal camera app on the **front** camera.
2. Point the remote's LED directly at the front camera lens, about 10cm away.
3. Press and hold any button on the remote.
4. Watch the screen. A faint purple or white glow from the LED means the
   camera sees IR.
5. **Repeat on the rear camera.**

**Results:**

| Outcome | Action |
| --- | --- |
| Front camera sees the glow | Set `IR.ENABLED_ON_THIS_DEVICE = true` and `IR.CAMERA = "front"` |
| Only the rear camera sees it | Set `true` and `IR.CAMERA = "back"` - the same blob pipeline works, near-zero extra cost |
| Neither sees it | **Cut the feature now.** Leave the flag `false`. The mode greys out with an honest explanation, and you say so on stage |

Most modern flagships fail this test because of the IR-cut filter. Failing it
is a perfectly good outcome - a cut feature costs nothing, a half-built one
costs hours.

```
RESULT:  front [ ]  rear [ ]  neither [ ]
```

---

## Test 2 - Glint range and behaviour (5 minutes)

This is the primary signal. You need to know its working envelope before you
design the demo around it.

**Setup:** a webcam, a spare phone's camera, or any small lens. A dim room.

1. Turn the torch on. Hold the phone so the torch is close to the camera lens.
2. Point at the target lens from 30cm. Confirm you see a bright point.
3. Back away slowly. Note the distance where it stops being obvious.
4. Now move side to side while staying pointed at it. **A real lens keeps
   reflecting. Note that it holds.**
5. Point at a reflective sticker or a screw head and do the same. **Note that
   it flashes once and vanishes.**

Step 4 versus step 5 is the entire argument for the persistence filter. Watch
it yourself so you can describe it on stage from experience rather than theory.

```
Working distance:  from ______ cm  to ______ cm
Lens holds across movement?   yes [ ]  no [ ]
Sticker flashes and vanishes? yes [ ]  no [ ]
```

---

## Test 3 - Magnetometer baseline (5 minutes)

Sets the spike threshold. The default of 15% is a guess until you measure.

1. Run the app, open the Magnetometer Sweep.
2. Walk a normal room away from obvious metal. Note the **resting range** -
   how much the number drifts on its own.
3. Hold the phone near a known metal object: a door hinge, a laptop, a screw
   in a wall plate. Note the **peak**.
4. Set `MAGNETOMETER.SPIKE_RATIO` comfortably between the two.

If resting drift is 44-47 uT and metal reads 60 uT, then 15% (about 52 uT)
sits nicely between them. If the room is noisy and drift alone hits 15%, raise
the threshold until the quiet room stops firing.

**The test that matters: walk the room with the sweep running and the app must
stay silent.** A detector that fires everywhere is worse than no detector, and
a judge will notice within ten seconds.

```
Resting range:  ______ to ______ uT
Near metal:     ______ uT
Chosen SPIKE_RATIO:  ______
Quiet room stays silent?  yes [ ]  no [ ]
```

---

## Test 4 - Frame rate reality check (2 minutes)

Open the Lens Scan. The stats chip in the top left shows live fps.

Expect 2-3 fps. If you get under 1.5 fps, drop `GLINT.PROCESS_WIDTH` and
`PROCESS_HEIGHT` to 128x96 and re-measure.

If frames error out, check the error line at the bottom of the sweep screen.

```
Measured fps: ______
```

---

## Test 5 - Airplane mode (1 minute)

1. Turn on airplane mode.
2. Run a full scan: home to sweep to results.
3. Confirm everything works.

**Do the stage demo this way, with the notification shade pulled down first so
the judges see the airplane icon.** It proves the offline claim in two seconds
without a single slide.

```
Full flow works offline?  yes [ ]  no [ ]
```
