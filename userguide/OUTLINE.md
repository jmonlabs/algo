# jmon/algo — user guide outline

Four parts. **Only Part I is a sequence**; Parts II–IV are collections whose
chapters stand alone and can be read in any order.

That distinction is the point of the structure. A collection does not *end* —
it extends. A new generator joins Part II, a new transformation joins Part III,
and nothing gets renumbered, because chapters are numbered **within their part**
(`II.3`), never globally.

Every chapter in a collection opens with a short **"Assumes"** box so a reader
can enter there directly, without having read what precedes it.

Status legend: **existing** — lift from the current chapter · **partial** —
material exists but is scattered · **new** — nothing written yet.

---

## Part I — Foundations

Read once, in order. This is the only linear part.

### I.1 Getting started

| | |
|---|---|
| Covers | The JMON format: `{ pitch, duration, time, velocity }`, tracks, compositions. `jm.play()`, `jm.score()`, `jm.validate()`. Rests as `pitch: null`, chords as `pitch: [60, 64, 67]`. |
| Assumes | Nothing. |
| Source | **existing** — `01-getting-started.html` |

Note: fix "8 chapters" in the intro, and the CDN-vs-`../src/` import split
(chapters 01–02 load from jsDelivr, 03–10 from the local source — worth stating
once, here, that the guide runs from a clone).

### I.2 Harmony

| | |
|---|---|
| Covers | `jm.key()` as the idiom. `Scale` (incl. registering a custom scale on `MusicTheoryConstants.scale_intervals`, and the `start`-selects-the-octave quirk), `Progression`, `Voice`, `chordify` / `chordifyMany`, `Key`. |
| Assumes | I.1 |
| Source | **existing** — `02-harmony.html` |

### I.3 Rhythm

| | |
|---|---|
| Covers | `Rhythm` (`.random()`, `.darwin()`), `isorhythm`, `beatcycle`. Then **`jm.generative.drummer`**: 19 styles, `bars` vs `sections` for multi-meter, `variation` (`fixed` / `live` / `follow` / `diverge`), `leader`, `fillEvery`, `humanize`, `seed`, `drumMap`. Drum kits via `jm.instruments.registerDrumKit`. |
| Assumes | I.1 |
| Source | **partial → new** — `isorhythm`/`beatcycle` are scattered across 03, 04 and 06; the drummer has **no chapter at all** and is the largest undocumented module in the library. |

This is the biggest gap in the current guide. Rhythm is treated as a side-effect
of other topics rather than a foundation.

### I.4 Sound

| | |
|---|---|
| Covers | Per-track `synth` (Tone.js class name, GM program number, or `{type, options}`), `pan`, the `audioGraph`, effects, `jm.instruments` and the GM bank, `jm.audioGraph.master.*` mastering chains (`dark`, `light`, `warm`, `cinematic`, `intimate`, `broadcast`, `vinyl`, `lush`). |
| Assumes | I.1 |
| Source | **existing** — `05-sounds.html`. The mastering presets are undocumented; add them. |

`customPresets` belongs here too: define a synth once at composition level and
name it from a track (`synth: "warmPad"`, or `{ preset: "warmPad", options }`
to layer overrides). A preset's `type` may be a Tone class name **or a GM
program number**, so a named instrument works the same way. Both players and
the WAV renderer share one synth factory, so a preset sounds the same live,
offline and exported.

**Getting GM to sound like a soundfont** deserves its own section here — it is
the question a reader arrives with, and the honest answer has one hard limit
and four soft ones.

Start with the fact that explains the rest: **every FluidR3 sample is a fixed
3.19-second render**. A soundfont engine loops the sustaining part of a
recording to hold a note indefinitely, and the library now does the same — so
a held note no longer runs out of sound. Whether a sample *may* loop is
measured from the recording's tail (strings 64% of peak, organ 86%, flute 95%,
piano 4%), so decaying instruments are left to die away as they should.
`synth: { gm: 48, loopSustain: false }` opts out; a note that fits inside the
sample is untouched either way.

Re-articulating instead of looping is still available, and is what you want
when the repeated attack is the point:

    jm.utils.splitLongNotes(notes, jm.instruments.gmMaxBeats(tempo));

The four remaining differences from a soundfont engine, in order of how much
they matter:

| | |
|---|---|
| **Reverb** | fluidsynth applies reverb by default; these samples are dry, which reads as "flat" before it reads as "wrong". An `audioGraph` reverb, or one of the `jm.audioGraph.master.*` chains, is the single biggest improvement. |
| **Sample density** | the default `balanced` resamples up to ±2 semitones, which shifts formants — audible on voice, strings and brass, inaudible on percussion. `{ gm: 40, strategy: "complete" }` gives a native sample per semitone at the cost of 88 requests. |
| **Release** | `{ gm: 40, options: { release: 0.6 } }` — without a release tail, notes cut off squarely where a real instrument decays. |
| **Velocity** | midi-js samples are single-velocity, so dynamics are gain alone: a fortissimo is a louder mezzo, not a brighter one. Layering a filtered duplicate track, or driving a filter cutoff from velocity, is the workaround. |

Order matters in the writing: a reader who adds reverb first will stop asking
the question.

One consequence of the synth choice is easy to miss and belongs in III.1:
a glissando on the default `PolySynth` loses the track's timbre, while any
other instrument keeps it. Cross-link rather than repeat.

---

## Part II — Generators

Independent chapters. Each assumes Part I and nothing else. **New generators go
here.**

### II.1 Minimalism

| | |
|---|---|
| Covers | `MinimalismProcess` — `additive`/`subtractive` × `forward`/`backward`/`inward`/`outward`, `repetition`. `Tintinnabuli`. `phaseShift` (returns `{ voice1, voice2 }`). |
| Assumes | I.1, I.2 |
| Source | **existing** — `04-minimalism.html`; djalgo original in `djalgo-guide/04-minimalism.py` |

`phaseShift` — Reich's technique — is currently undocumented.

### II.2 Walks

| | |
|---|---|
| Covers | `Chain` (`.generate()` for branches, `.line()` for one flat walk, `walkRange`/`walkStart`/`walkProbability`/`roundTo`/`branchingProbability`, seeding for reproducibility), `RandomWalk`, `Phasor` / `PhasorSystem` (celestial walks). Gaussian processes via `@tangent.to/ds` — an external library, deliberately not in the `jm` namespace. |
| Assumes | I.1, I.2 |
| Source | **existing** — `06-walks.html`; djalgo original in `djalgo-guide/05-walks.py` |

The strongest prose in the current guide. Keep it.

### II.3 Fractals and cellular automata

| | |
|---|---|
| Covers | `CellularAutomata` (rule number, width as range, `toPlotData()`, `gridToPlotData()`, `stripToPitches()`), `Mandelbrot`, `Julia`, `BurningShip`, the `Fractal()` factory, `LogisticMap`. `extractSequence()` methods, `gridToNotes()`, `toPlotData()`. |
| Assumes | I.1, I.2 |
| Source | **existing** — `07-fractals.html`; djalgo original in `djalgo-guide/06_fractals.py` |

Plotting convention worth stating explicitly here, since it is the library's
rule everywhere: **the algorithm class shapes the data (`toPlotData()`), the
notebook draws it (Observable Plot).** There is no plotting layer in `jmon/algo`.

### II.4 Genetic composition

| | |
|---|---|
| Covers | `Darwin` — phrases as `[pitch, duration, offset]` tuples, `evolve()`, `evolveGenerations()`, `getBestIndividual()`, `getEvolutionHistory()` (returns an object, not an array), `getPopulationStats()`, seeding. Fitness via `MusicalIndex`. |
| Assumes | I.1, I.2, and III.4 for the fitness metrics |
| Source | **existing** — `08-genetic.html`; djalgo original in `djalgo-guide/07_genetic.py` |

### II.5 Loops and polyrhythm

| | |
|---|---|
| Covers | `Loop`, `Loop.euclidean()`, `Loop.fromTrack()`, `Loop.fromPattern()`, `toJMonSequences()`, `toPlotData()`. Polyrhythm by superposing loops of different lengths. |
| Assumes | I.1, I.3 |
| Source | **existing** — `03-loops.html` |

---

## Part III — Transforming

What you do to material once it exists. **New transformations go here.**

### III.1 Ornaments and articulations

| | |
|---|---|
| Covers | `Ornament` — `grace_note`, `trill`, `mordent`, `turn`, `arpeggio`, and their parameters. `Articulation` — built and applied exactly like `Ornament` (`new Articulation({ type }).apply(notes, index)`), 13 types from `staccato` to `diminuendo`, with a static `Articulation.apply()` as the low-level form. `Strum` / `strum`, `Arpeggiate` / `arpeggiate` — note that `strum`'s `direction: 'up'` reverses pitch order, guitar-style, while `arpeggiate`'s does not. `jm.constants.listOrnaments()` / `.listArticulations()` / `.describe()`. |
| Assumes | I.1, I.2 |
| Source | **partial → new** — ornaments appear briefly in 02; `Articulation`, `Strum` and `Arpeggiate` have **no coverage at all**. |

**How a slide is actually performed**, worth a short section of its own — it is
the one articulation whose result depends on the track's instrument:

| Track's `synth` | What happens | Timbre |
|---|---|---|
| `MonoSynth`, `Synth`, `FMSynth`, … | its own `detune` Signal ramps in cents | kept |
| GM number (a `Sampler`) | its sounding voices' `playbackRate` ramps — the instrument is resampled, which is what a soundfont engine does to bend a note | kept |
| `PolySynth` (the default) | Tone gives it neither a rampable `detune` nor reachable voices, so the track gets a dedicated glide voice — a `Tone.Synth` built from the track's voice options, connected to the same effect chain | **lost for that note** |

So the practical advice for a reader: a glissando keeps the track's sound
everywhere except on the default `PolySynth`. Naming a `MonoSynth`, or a GM
program, fixes it. Worth stating plainly rather than leaving to be discovered.

Cents are the unit throughout: C4 to G4 is a perfect fifth, so 700 cents, or a
playback rate of 2^(7/12) ≈ 1.498.

Two behaviours worth a sentence each, because both are surprising when you
meet them without warning:

- On a detune Signal the value **returns to its baseline** after each curve.
  It has to: the signal is shared by every note on that voice, so without the
  reset a glissando of a fifth leaves everything after it a fifth sharp. The
  `Sampler` path needs no reset — its voices belong to one note and are
  discarded with it. Worth one sentence, because it explains why the two paths
  are not symmetric.
- All four pitch articulations — `glissando`, `portamento`, `bend`, and pitch
  envelopes — compile to the **same** representation, a list of
  `{ time, value }` anchors in cents. They differ in how the anchors are
  generated, not in how they are played. Explaining that once saves
  explaining it four times.

### III.2 Transformations

| | |
|---|---|
| Covers | `invert`, `retrograde`, `augment`, `transpose` — the classical operations. `applySwing`, `splitLongNotes`, `removeDuplicates`, `normalizeVelocities`. Queries: `getPitchRange`, `getTotalDuration`, `extractRhythm`. Quantization: `quantize`, `quantizeEvents`, `quantizeTrack`, `quantizeComposition` (grids in quarter notes, `1/3` for triplets). |
| Assumes | I.1 |
| Source | **new** — nothing written. All of it lives in `jm.utils.*`. |

Worth making explicit: `retrograde` mirrors notes inside the sequence span, so
rests, chords and overlapping voices survive; `augment` scales `time` and
`duration` together, so simultaneous notes stay simultaneous.

### III.3 Corruptor

| | |
|---|---|
| Covers | `Corruptor`, `corruptJmon` — controlled degradation of an existing composition. |
| Assumes | I.1 |
| Source | **existing** — `09-corruptor.html` |

### III.4 Analysis

| | |
|---|---|
| Covers | `MusicalAnalysis` — 16 metrics: `gini`, `balance`, `autocorrelation`, `motif`, `dissonance`, `rhythmic`, `fibonacciIndex`, `syncopation`, `contourEntropy`, `intervalVariance`, `density`, `gapVariance`, `onsets`, `densityCurve`, `velocityEnvelope`, `rhythmicSignature`, plus `analyze()`. `MusicalIndex` — takes a **flat array of pitches**, and `similarity()` compares two instances. |
| Assumes | I.1 |
| Source | **new** — no chapter; only referenced in passing from 08. |

Reads naturally as a pair with II.4, since `MusicalIndex` is Darwin's fitness
function. Cross-link them rather than merging.

---

## Part IV — Playing and exporting

### IV.1 Live coding

| | |
|---|---|
| Covers | The iframe player and its `postMessage` protocol (`update` / `stop` / `resume` / `reset` / `setTempo` / `enableMidi` / `setMidiOutput`). Swap modes: `next-loop`, `next-bar`, `immediate`. The standalone REPL, its persistent `scope` object, and the `esm.sh`-not-jsDelivr import rule. Per-track `midiChannel` routing to a DAW through a virtual MIDI port. Loop events for syncing. |
| Assumes | I.1, I.4 |
| Source | **existing** — `10-live.html`, already accurate |

### IV.2 Exporting

| | |
|---|---|
| Covers | `jm.converters.*` — `midi` / `midiBytes` / `midiBase64` / `midiPlayer`, `midiToJmon` (import direction), `wav` / `downloadWav`, `musicxml` / `downloadMusicXML`, `supercollider`, `tonejs`. `jm.score()` and `jm.scoreSVG()` via Verovio. What survives each format and what does not. |
| Assumes | I.1 |
| Source | **new** — currently scattered through 01 and 05. |

What survives Standard MIDI File, since this is the question readers will
actually have:

- **Round-trips exactly**: pitches, times, durations, tracks, tempo and
  `tempoMap` (one set-tempo event per segment), `timeSignature` /
  `timeSignatureMap`, `keySignature` / `keySignatureMap`, and glissando /
  portamento / bend — written as a pitch bend sweep with the range widened via
  RPN 0 and read back into an articulation.
- **Round-trips approximately**: velocity, to within MIDI's 7 bits (1/127).
  And an accelerando: a tempo *ramp* written as `automation` targeting
  `"tempo"` has no SMF message, so it is sampled as a staircase of set-tempo
  events on a sixteenth grid. You hear the acceleration; you do not get the
  curve back as automation on re-import — it returns as a `tempoMap`.
- **Does not survive**: custom synths, the `audioGraph`, effects, microtuning.
  Those are Tone-side, and SMF has nowhere to put them.

The staircase is worth one honest sentence in the chapter: MIDI has no notion
of a continuous tempo change, so every DAW that shows you an accelerando is
showing you steps too. This is not a limitation of the library.

`midiToJmon` needs no audio library — a MIDI file is bytes. Worth saying,
because it used to require Tone.js and could not run.

---

## Appendix — Coming from Djalgo

Not a chapter; a lookup table, useful enough to earn its own page.

- Note representation: djalgo's `(pitch, duration, offset)` tuple → JMON's
  `{ pitch, duration, time, velocity }`. `offset` becomes `time`.
- Namespace names differ from class names: `MinimalismProcess` →
  `jm.generative.minimalism.**Process**`, `RandomWalk` →
  `jm.generative.walks.**Random**`, `CellularAutomata` →
  `jm.generative.automata.**Cellular**`, `Phasor` →
  `jm.generative.walks.Phasor.**Vector**`.
- What JMON adds that Djalgo has no equivalent for: `jm.key()` contexts,
  per-track synths and the `audioGraph`, live coding.
- Still tuple-native on purpose: `Darwin`'s phrases, `MinimalismProcess`
  input (so djalgo code can be pasted in), `quantizeNotes`,
  `findClosestPitchAtMeasureStart`.
- The original djalgo notebooks for chapters II.1, II.2, II.3 and II.4 are in
  `userguide/djalgo-guide/`.

---

## Vocabulary — one word per thing

From the `funny-gauss` branch, which went through the guide and found the same
concept named three ways. Pick one word each and hold it, because the reader
builds a mental model out of the nouns:

| Use | Not | Why |
|---|---|---|
| **track** | part, sequence, voice, line | it is what the schema calls it, and what `tracks:` is keyed on |
| **note** | event, item | `event` is what the *player* schedules, which is a different thing |
| **composition** | piece, song | `jm.play(composition)` — the parameter is already named |
| **Jmon** | JMON, JMon | in identifiers. `JMON` stays in prose for the format itself |

`funny-gauss` went further and renamed the public helpers
(`createPart` → `createTrack`, `createComposition` → `createPiece`). Half of
that is now in: `createTrack` exists and `createPart` is kept as an alias.
`createPiece` is an alias too, but **composition** is the word this outline
uses — if you prefer *piece*, that is a decision to make once, here, and then
apply everywhere including `jm.play`'s docs.

Its other finding is fixed rather than documented: `createPart` used to emit
`{ name }` and `createComposition` a stray `bpm`, neither of which anything
downstream reads. Both now emit what the schema declares.

Two more from that branch worth a line in the guide:

- `@tangent.to/ds` is loaded lazily, so importing `jm` does not pull it in.
  That is why Gaussian processes are used directly rather than through
  `jm.generative` — mention it in II.2 instead of leaving the asymmetry
  unexplained.
- `Mandelbrot` answers to `mandelbrotIterations()` as well as its own method
  name, for people arriving from Djalgo. Belongs in the appendix, not in II.3.

---

## Proposed file tree

The guide is Observable Notebook Kit, so a chapter is one `.html` file. Two
things drive the layout: a reader should be able to open one file and be in
the right place, and adding a chapter to a collection should touch nothing
else.

```
userguide/
  index.html              landing page: the four parts, linked
  OUTLINE.md              this file — the plan, not shipped to readers

  1-foundations/
    1-getting-started.html
    2-harmony.html
    3-rhythm.html
    4-sound.html

  2-generators/
    1-minimalism.html
    2-walks.html
    3-fractals.html
    4-genetic.html
    5-loops.html

  3-transforming/
    1-ornaments.html
    2-transformations.html
    3-corruptor.html
    4-analysis.html

  4-playing/
    1-live.html
    2-exporting.html

  appendix/
    from-djalgo.html      the lookup table
    djalgo-guide/         the original .py notebooks, kept as reference

  shared/
    header.js             the import block every chapter opens with
    style.css

  package.json            unchanged — `npx notebooks preview --root .`
  vite.config.js
```

Why this rather than the current flat `01-`…`10-`:

- **The number carries the part.** `2-generators/3-fractals.html` says where
  it sits without a global counter. A sixth generator is `2-generators/6-…`
  and nothing renames — which is the whole reason for the part structure.
- **Directories are the only thing that reorders.** Moving a chapter between
  parts is a `git mv`, not a renumber of everything after it.
- **`shared/`** is what stops the import block drifting. Right now every
  chapter repeats the jsDelivr URL, so a version bump is ten edits and one
  of them gets missed.
- **`appendix/`** keeps `djalgo-guide/` where it belongs — reference material,
  not a chapter — instead of sitting at the top level looking like one.

One thing to decide before moving files: the current names are what the README
and every external link point at. Either keep redirect stubs at the old paths,
or accept that links break once and fix the README in the same commit. For a
guide read mostly from `index.html`, the second is probably fine.

---

## Mapping from the current guide

| Now | Becomes |
|---|---|
| 01 Getting started | I.1 |
| 02 Harmony | I.2 |
| 03 Loops | II.5 |
| 04 Minimalism | II.1 |
| 05 Sounds | I.4 |
| 06 Walks | II.2 |
| 07 Fractals | II.3 |
| 08 Genetic | II.4 |
| 09 Corruptor | III.3 |
| 10 Live coding | IV.1 |
| — | **I.3 Rhythm** (drummer) |
| — | **III.1 Ornaments and articulations** |
| — | **III.2 Transformations** |
| — | **III.4 Analysis** |
| — | **IV.2 Exporting** |

Ten chapters become sixteen: nothing is dropped, five gaps are filled, and one
chapter (03 Loops) moves from the linear spine into the generator collection.
