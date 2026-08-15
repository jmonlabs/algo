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
| Covers | `Ornament` — `grace_note`, `trill`, `mordent`, `turn`, `arpeggio`, and their parameters. `Articulation` (**static** `Articulation.apply()`, unlike `Ornament`'s instance method) — the 12 types from `staccato` to `diminuendo`. `Strum` / `strum`, `Arpeggiate` / `arpeggiate` — note that `strum`'s `direction: 'up'` reverses pitch order, guitar-style, while `arpeggiate`'s does not. `jm.constants.listOrnaments()` / `.listArticulations()` / `.describe()`. |
| Assumes | I.1, I.2 |
| Source | **partial → new** — ornaments appear briefly in 02; `Articulation`, `Strum` and `Arpeggiate` have **no coverage at all**. |

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
| Covers | `jm.converters.*` — `midi` / `midiBytes` / `midiBase64` / `midiPlayer`, `midiToJmon` (import direction), `wav` / `downloadWav`, `musicxml` / `downloadMusicXML`, `supercollider`, `tonejs`. `jm.score()` and `jm.scoreSVG()` via Verovio. What survives each format and what does not — microtuning, custom synths and effects do not round-trip through Standard MIDI File. |
| Assumes | I.1 |
| Source | **new** — currently scattered through 01 and 05. |

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
