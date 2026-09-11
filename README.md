# jmon/algo

Algorithmic and generative music composition in JavaScript.

Scales, chords and voice leading; minimalist processes, random walks, fractals, cellular automata, genetic algorithms; rhythm and a drummer; analysis. It makes
JMON pieces and does nothing else with them. ESM source served from GitHub via jsDelivr. It runs the same in Node, Deno and a browser.

```js
import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";

const scale = new jm.theory.harmony.Scale({ tonic: "C", mode: "major" })
  .generate({ start: 60, length: 8 });

const piece = {
  tempo: 120,
  tracks: [{
    label: "Scale",
    notes: scale.map((pitch, i) => ({ pitch, duration: 1, time: i, velocity: 0.8 })),
  }],
};
```

## Three complementary packages

Reading, playing and drawing a piece are separate packages, each passed in where it is needed rather than imported. Node refuses `https://` imports, so that is the only way a package here can depend on another, and it makes the coupling visible at every call site.

| | |
|---|---|
| [`jmon/io`](https://github.com/jmonlabs/io) | the format: what it means, and how it serialises. MIDI both ways, MusicXML. |
| [`jmon/show`](https://github.com/jmonlabs/show) | playback, live coding, WAV rendering, score engraving. |
| [`jmon/sound`](https://github.com/jmonlabs/sound) | sampled instruments for Tone.js: General MIDI, drum kits, your own samples. |

```js
import jm    from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
import io    from "https://cdn.jsdelivr.net/gh/jmonlabs/io@main/src/index.js";
import show  from "https://cdn.jsdelivr.net/gh/jmonlabs/show@main/src/index.js";
import sound from "https://cdn.jsdelivr.net/gh/jmonlabs/sound@main/src/index.js";
import * as Tone from "npm:tone";

show.play(piece, { Tone, io, sound });
io.midi(piece);
```

Take only what you need. Generating a MIDI file needs `algo` and `io`; no audio, no browser.

For all four at once, [`jmon/studio`](https://github.com/jmonlabs/studio) assembles them and binds the injections, so a call site names what it does rather than where it comes from:

```js
import studio from "https://cdn.jsdelivr.net/gh/jmonlabs/studio@main/src/index.js";
const jm = await studio();

jm.play(piece);
jm.midi(piece);
```

## The JMON format

```js
// A note. Rests are `pitch: null`, chords are `pitch: [60, 64, 67]`.
const note = { pitch: 60, duration: 1, time: 0, velocity: 0.8 }

// A track is an array of notes
const track = [
  { pitch: 60, duration: 1, time: 0, velocity: 0.8 },
  { pitch: 62, duration: 1, time: 1, velocity: 0.8 },
  { pitch: 64, duration: 1, time: 2, velocity: 0.8 }
];

// A piece. Times are in quarter notes.
{
  tempo: 120,
  tracks: [{ label: "Melody", notes: track }],
}
```

## What is here

### Theory — `jm.theory.*`
Scales, intervals, chords, voice leading, progressions, ornaments and articulations, rhythm generation. `Rhythm.random()` and `Rhythm.darwin()` return JMON notes, with `pitches` cycled across them the way `euclid` does.

`jm.key(tonic, mode)`, or `jm.key({ tonic, mode })` like every class here, sets the key once and builds Scale, Voice, Ornament, Progression and chords without repeating `{ tonic, mode }`. It also answers `k.solfege(pitch)` and `k.stability(pitch)`: the syllable relative to the relative major (a minor tonic is LA) and its rank on the stability order DO SO MI LA RE TI FA.

- `theory.rhythm.clave` — son, rumba, bossa, tresillo and afro claves as grids or notes, in 2-3 or 3-2. `metricStrengths` grades the places of any meter into downbeat, half-bar, beat, upbeat.
- `theory.profile.Profile` — a weight per position over a cycle, with `fit`, `rotate`, `bestRotation` and `fromPositions`. Bodzsar's Rhythm Code (16 eighth-note places), Tonality Code (12 pitch classes) and stability order (7 degrees) ship as presets; a profile folded out of your own tracks is the same object.
- `theory.harmony.Solfege` — degree, syllable, stability rank and distance to the nearest chord tone.

### Generative — `jm.generative.*`
- Minimalism: `MinimalismProcess` (additive and subtractive), `Tintinnabuli`, `phaseShift(pattern, { cycles, shift })`
- Walks: `Chain` (Markov), `RandomWalk` (Brownian), `Phasor` and `PhasorSystem`. `Chain.line()` for a single flat walk
- Fractals: Mandelbrot, Julia, Burning Ship and logistic maps
- Automata: `CellularAutomata`
- Genetic: `Darwin` breeds variations of a phrase toward targets. Phrases go in and come out as JMON notes; `getBestGenome()` exposes the raw `[pitch, duration, time]` form the operators work on
- Loops: Euclidean rhythms and polyrhythm
- Drummer: 19 styles, multi-metre sections, variations and fills. `orientation: '2-3' | '3-2'` reweights the kick by the Rhythm Code over a two-bar cycle; `decorations` adds ghost snares, open hats, phrase crashes, a clave sidestick and several fill shapes.

`Darwin` takes `metrics` (`{ name, fn(phrase, ctx), target, weight }`), a `context` (key, chords, profile, pulse), position-aware `operators`, and `crossoverMode: 'time'` to splice parents on a bar boundary. `generative.genetic.metrics` provides clave fit, anticipation rate, upbeat ratio, emotional-map sweetness and balance, last-note stability and more; `generative.genetic.operators` provides anticipate, delay, restify, to-chord-tone, to-non-chord-tone and step-stability moves.

Gaussian processes live in [`@tangent.to/ds`](https://tangent-to.github.io/ds/) and are used directly. A thin wrapper ships here but is deliberately not reachable from `jm`, so importing this package never pulls that in.

### Analysis — `jm.analysis.*`
`MusicalAnalysis` is the one set of metrics: gini, spread, motif, motifStrength, dissonance, measureFit, contour entropy, syncopation, density and the rest. `MusicalIndex` is an instance view over the same functions, and `Darwin`'s weights and targets are keyed by the same names, so a score is the same number wherever it appears.

- `analysis.rhythm` — a track as a binary onset grid, after Bodzsar's *Rhythm Code*: stops, eighth- and quarter-note anticipations, upbeat ratio, fit to a profile in either clave orientation, `detectOrientation`, and `profileFromTracks` to learn a profile from a corpus.
- `analysis.melody` — Bodzsar's *Emotional Map of Melody*: every note placed by solfège stability and distance from the chord under it, quadrant shares, the four behaviours at a chord change, and `pillars` to pick a non-chord tone per chord to land on.
- `analysis.salience` — which notes those two look at: stops, accents, contour peaks, notes on chord changes, long or repeated notes, motif edges.

The books' tables are data, not rules: every score is a measurement, and every table is a preset you can swap for one folded out of your own material.

### Utils — `jm.utils.*`
- Transformations: `invert`, `retrograde`, `augment`, `transpose`, `applySwing`, `splitLongNotes`, `removeDuplicates`, `normalizeVelocities`
- `jm.processors.groove` slides stops to heavier places on a rhythm profile; `anticipate` moves chosen onsets earlier when the target is free; `applySteps` runs Bodzsar's four-step procedure.
- Queries: `getPitchRange`, `getTotalDuration`, `extractRhythm`
- Quantization: `quantize`, `quantizeEvents`, `quantizeTrack`, `quantizePiece` (grids in quarter notes; `1/3` for triplets)
- Builders: `createTrack`, `createPiece`, `chordTrack` (a progression laid out as JMON chord notes: playable, and what the analyses and `Darwin` read as `chords`)

## Conventions

- A class takes one options object: `new Scale({ tonic, mode })`. A function takes its subject first, then one scalar or one options object: `invert(notes, pivot)`, `phaseShift(pattern, { cycles, shift })`. `jm.key()` takes either `(tonic, mode)` or `{ tonic, mode }`.
- Everything that enters or leaves a generator is a list of JMON notes, `{ pitch, duration, time, velocity }`, with time in quarter notes. A chord is an array of pitches; a chord on a timeline is a JMON note whose `pitch` is that array (`chordTrack`).
- Names are camelCase, classes appear under their own name in the namespaces, and there are no aliases: one thing, one name.
- A time given as `"bars:beats:ticks"` is read the same way everywhere, by `timeToBeats`.

## Changes in 3.0

Breaking, and the compositions written against 2.x stay on the `v2.1.0` tag.

- `generative.automata.CellularAutomata`, `generative.walks.RandomWalk`, `Phasor`, `PhasorSystem`, `generative.minimalism.MinimalismProcess` replace the short keys `Cellular`, `Random`, `Phasor.Vector`, `Phasor.System`, `Process`.
- `MusicTheoryConstants.scaleIntervals`, `chromaticScale`, `chromaticScaleFlats`, `flatToSharp`; drum map keys `tomLow`, `tomMid`, `tomHigh`.
- `createPart`, `createComposition`, `offsetNotes`, `concatenateSequences`, `combineSequences`, `setOffsetsAccordingToDurations`, `sequenceToPart`, `Loop#toJMonTracks`, `Loop#toJMonSequences` are gone; use `createTrack`, `createPiece`, `shiftTime`, `concatenateTracks`, `combineTracks`, `setTimeAccordingToDurations`, `notesToTrack`.
- `MusicalIndex` methods are `gini`, `spread`, `motifStrength`, `dissonance`, `measureFit`, `restProportion`, each the same function as in `MusicalAnalysis`; `balance`, `motif`, `rhythmic` on the index are gone. `Darwin` weights and targets use these names.
- `Darwin` accepts JMON notes in `initialPhrases` and returns notes from `getBestIndividual()`; `getBestGenome()` returns the triples.
- `Rhythm.random()` and `Rhythm.darwin()` return JMON notes with a `pitch`.
- `phaseShift(pattern, { cycles, shift })`, `getDegreeFromPitch(pitch, { scale, tonic })`, `getPitchFromDegree(degree, { scale, tonic })`, `scaleList(numbers, { toMin, toMax, from, to })`, `repeatPolyloops(dict, { measures, measureLength })`.

## Tests

```bash
node --test tests/*.test.js
```

272 assertion-backed tests, nothing to install. One of them walks the import graph from `src/index.js` and fails if anything outside the package is reached, which is the property the whole layout rests on.

The scripts in `tests/integration/` need a real Tone.js or `@tangent.to/ds` and are observations rather than tests — see the README there.

## Sources

The rhythm and melody analyses implement methods from Tamas Bodzsar, *The Rhythm Code* (2022) and *The Emotional Map of Melody* (2026), howtowritebettersongs.com. The weights in `theory/profile/presets.js` are read from the books' diagrams; the text and song transcriptions are not reproduced.

## License

GPL-3.0-or-later

## Links

- [GitHub](https://github.com/jmonlabs)
