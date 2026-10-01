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

### Notes — `jm.notes.*`
What a composer does to a list of notes. Every function takes the list first and returns a new one.
- Move and repeat: `shift(notes, beats)`, `place(notes, { time, octave, velocity })`, `truncate(notes, beats)`, `cut(notes, { from, to })` (a slice, moved to 0), `tile(notes, { times, cycle })`, `concatenate(lists)`, `combine(lists)`
- Change the pitches: `transpose(notes, semitones)`, `transposeDiatonic(notes, { steps, scale })`, `diatonic(pitch, { steps, scale })`, `invert(notes, pivot)`, `canon(notes, { delay, steps, scale, octave })`
- Change the time: `augment(notes, factor)`, `fit(notes, beats)` (stretched to a length), `reverse(notes)`, `quantize(notes, { grid, mode })`, `split(notes, maxDuration)`, `deduplicate(notes, tolerance)`, `normalize(notes, { min, max })`
- Measure: `span(notes)`, `range(notes)`, `onsets(notes)`
- Build: `track(notes, { label, synth })`, `piece(tracks, { tempo })`, `chordNotes(chords, { duration })` (a progression laid out as chord notes: playable, and what the analyses and `Darwin` read as `chords`), `beatsToTime`, `timeToBeats`

### Performance — `jm.performance.*`
How the notes are played, written back into them. A verb for each.
- A held note as strokes: `sustain(pitch, { duration, time, velocity, step })`; the shape of a bow stroke: `bow(notes, { attack, swell, peak, fade })`; the breath between two: `detach(notes, { gap })`
- A hand: `humanize(notes, { seed, timing, velocity, lag })`; `embellish(notes, { seed, bendProb, vibratoProb })` for bends and vibratos on the long notes
- A style: `ornament(notes, { type, at, key })`, `articulate(notes, { type, at })`, `strum(notes, { direction, speed })`, `arpeggiate(notes, { order, delay })`
- A rhythm's feel: `swing(notes, { ratio })`; `groove(notes, { profile, reach })` slides stops to heavier places on a rhythm profile, `anticipate` moves chosen onsets earlier when the target is free, `applySteps` runs Bodzsar's four-step procedure (`steps` holds the presets)
- A whole piece, worn: `corrupt(piece, { entropy, seed, … })`

### Harmony — `jm.harmony.*`
In a key. `jm.key(tonic, mode)` sets it once: `k.scale({ start, length })` is its pitches, `k.pitchClasses()` its pitch classes, `k.progression({ circleOf, radius })` a `Progression`, `k.chord(pitch)` and `k.solfege(pitch)` shortcuts for the functions below, and the key is handed to the rest as `{ key: k }` or as `k` itself.
- Chords: `chord(pitch, { key, degrees })` stacks scale degrees on a pitch, `chords(pitches, { key })` does it for several, `harmonize(melody, { key, measureLength, output })` puts a chord under each measure of a melody (or under each note with `perNote`), as pitch arrays, as chord notes or as roots.
- Progressions: `key.progression()` (a `Progression`) reads roman numerals, `numerals(["i", "VI", "III", "VII"])`, or draws chords on a circle of intervals, `draw(4, { seed })` with `circleOf` and `radius`.
- Solfège, after Bodzsar: `solfege(pitch, key)` is the syllable relative to the relative major (a minor tonic is LA), `degree(pitch, key)` its number, `stability(pitch, { key, order })` its rank on the order DO SO MI LA RE TI FA; `chordDistance(pitch, chord)` and `isChordTone(pitch, chord)` look at a chord instead.

### Voices — `jm.voices.*`
What the voices do from one chord to the next. No key here: a chord is three pitches, and the next one comes from where the voices can go.
- Neo-Riemannian moves: `neoRiemannian(chord, ["P", "L", "R"])` applies moves in order, each keeping two of three notes; `neoRiemannianWalk(chord, { length, seed, vocabulary, opWeights, inKey })` draws them, `inKey` keeping the walk inside a key's pitch classes.
- The smoothest next chord: `smoothWalk(chord, { length, seed, maxVoiceLeading, qualities, bassRange, octaveBounds })` picks, among all major and minor triads, the ones the voices reach by moving least.
- Chorale: `lead(chords, { ranges, top })` writes chords given as `{ bass, pitchClasses }` for any number of voices: every voicing in the ranges is tried, and the sequence kept is the one where the voices move least, uncrossed and without parallel fifths or octaves, the way back to the first chord included. `counterpoint(voices, { beatsPerBar })` reads voices already written and reports those parallels, and the harshest clashes, as data (`{ kind, time, bar, beat, voices, pitches }`).

### Rhythm — `jm.rhythm.*`
Where the notes fall. A rhythm is a grid, one place per step, hit or not: `grid(notes, { subdivision, beats })` reads one off notes, `fromGrid("x..x..x.", { pitches, subdivision })` lays one out as notes, `draw(notes)` prints either.
- A kit as lines of text, one per drum: `kit({ kick: "x.......x.x.....", snare: "....X.......X...", hihat: "x.x.x.x.x.x.x.x." }, { subdivision, repeat, velocity })`, `X` an accent, a digit `1`–`9` a hit at that many tenths of the velocity, a drum named or given as its pitch.
- Patterns: `euclid({ steps, pulses, rotation, pitches })` and `euclidPattern({ steps, pulses })`; `clave("son", { orientation, pitches })` and `clavePattern("son", { orientation })` for the son, rumba, bossa, tresillo and afro claves, in 2-3 or 3-2 (`CLAVES` holds them); `isorhythm({ pitches, durations })` and `beatcycle({ pitches, durations })` cycle pitches over durations; `new Rhythm({ measureLength, durations }).random({ seed })` and `.darwin({ seed })` return notes with `pitches` cycled across them. `metricStrengths` grades the places of any meter into downbeat, half-bar, beat, upbeat.
- Profiles: `Profile` is a weight per position over a cycle, with `fit`, `rotate`, `bestRotation` and `fromPositions`. Bodzsar's Rhythm Code (16 eighth-note places), Tonality Code (12 pitch classes) and stability order (7 degrees) ship as `presets`; a profile folded out of your own tracks is the same object.

### Generative — `jm.generative.*`
- Minimalism: `unfold(notes, { operation, direction, repetition })` plays a phrase again and again, gaining or losing a note each time (`additive` or `subtractive`; `forward`, `backward`, `inward`, `outward`); `phase(notes, { cycles, shift })` sets two voices on one pattern, the second drifting behind; `Tintinnabuli`
- Walks: `new Chain({ range, start, steps, branching, merging })` steps by offsets drawn from a list, `.line({ length, seed })` one flat walk, `.generate(…)` the branching walks and `.notes(walks, { durations })` those as notes; `new RandomWalk({ dimensions, stepSize, bounds, attractor })` is Brownian, `.generate({ length, seed, start })` positions, `.line(…)` one dimension; `Phasor` and `PhasorSystem` turn points around points, `.simulate(times)` and `.notes(times, { pitchRange, pitches })`
- Fractals: `new Mandelbrot({ center, size, width, height, maxIterations })`, `Julia({ c, … })`, `BurningShip`: `.generate()` the grid, `.sequence({ path, index })` a series along a diagonal, border, spiral, row or column, `.notes({ pitches, min, max, duration })` the grid as a piano roll; `new LogisticMap({ r, x0, iterations }).generate()` and `.bifurcation({ from, to, steps })`
- Any series onto a list: `project(values, pitches)` picks, for each value, the target at its rank between the lowest and the highest; `rescale(values, { min, max })` for velocities
- Automata: `new CellularAutomata({ ruleNumber, width, initialState }).generate(steps)` is the rows, `CellularAutomata.pitches(rows, pitchSet)` reads them as notes and chords
- Genetic: `Darwin` breeds variations of a phrase toward targets: `.evolve({ generations, survivors })`, `.best()` as JMON notes, `.bestGenome()` the raw `[pitch, duration, time]` form the operators work on, `.history()`, `.stats()`
- Drummer: 19 styles, multi-metre sections, variations and fills. `orientation: '2-3' | '3-2'` reweights the kick by the Rhythm Code over a two-bar cycle; `decorations` adds ghost snares, open hats, phrase crashes, a clave sidestick and several fill shapes.

`Darwin` takes `metrics` (`{ name, fn(phrase, ctx), target, weight }`), a `context` (key, chords, profile, pulse), position-aware `operators`, and `crossoverMode: 'time'` to splice parents on a bar boundary. `generative.genetic.metrics` provides clave fit, anticipation rate, upbeat ratio, emotional-map sweetness and balance, last-note stability and more; `generative.genetic.operators` provides anticipate, delay, restify, to-chord-tone, to-non-chord-tone and step-stability moves.

Gaussian processes live in [`@tangent.to/ds`](https://tangent-to.github.io/ds/) and are used directly. A thin wrapper ships here but is deliberately not reachable from `jm`, so importing this package never pulls that in.

### Analysis — `jm.analysis.*`
Measurements, in one flat layer: each takes notes or values first and returns a number, a series or a report; none changes the notes. `Darwin`'s weights and targets are keyed by the same names, so a score is the same number wherever it appears.
- Over a series of values (pitches, durations, anything): `gini`, `balance`, `spread`, `motif`, `motifStrength`, `measureFit`, `restProportion`, `autocorrelation`, `dissonance(pitches, { scale })`, `fibonacciIndex`, `contourEntropy`, `intervalVariance`; over onsets in beats: `rhythmic`, `syncopation`, `gapVariance`; over notes: `density`, `densityCurve`, `velocityEnvelope`, `rhythmicSignature`, and `analyze(notes)` for all of them at once.
- Which notes carry the melody: `salience(notes, { mode })` is a weight per note, `salient(notes, { mode, threshold })` the notes that pass; the modes are functions too: `stops`, `accents`, `contourPeaks`, `chordChanges`, `long`, `repeated`, `motifEdges`, `anchors`.
- Bodzsar's *Rhythm Code*: `positions(notes, { pulse, salience })` are a track's places on the pulse grid; `anticipations`, `metricHistogram`, `upbeatRatio`, `stopRate`, `anticipationRate` and `profileFit(positions, { profile })` read them; `rhythmCode(notes, { pulse, profile })` is the whole report, `detectOrientation` says 2-3 or 3-2, `profileFromTracks` learns a profile from a corpus.
- Bodzsar's *Emotional Map of Melody*: `emotionalMap(melody, { key, chords })` places every note by solfège stability and distance from the chord under it and reports quadrant shares and the behaviours at chord changes; `mapNotes` is the points alone, `pillars(chords, { key })` picks a non-chord tone per chord to land on, `chordAt(chords, { time })` the chord a moment belongs to.

The books' tables are data, not rules: every score is a measurement, and every table is a preset you can swap for one folded out of your own material.

### Constants — `jm.constants.*`
The tables: `theory` (note names, scale intervals, interval names), `articulations` and `ornaments` as the performance functions know them, and `list()`, `get(category)`, `describe(category, name)`, `search(text)` to look through them.

### Theory, Utils — `jm.theory.*`, `jm.utils.*`, `jm.processors.*`
The names of 4.x, kept for one release over the spaces above: `theory.harmony`, `theory.rhythm` and `theory.profile` over `jm.harmony`, `jm.voices` and `jm.rhythm`; `utils` over `jm.notes` and `jm.performance`; `processors` over `jm.performance`. Nothing new goes here.

## Conventions

- A class takes one options object: `new Scale({ tonic, mode })`. A function or a method takes its subject first — the notes, the pitch, the chords — and then either one number whose meaning the name gives away (`transpose(notes, 12)`, `truncate(notes, 32)`) or one options object where everything is named (`humanize(notes, { seed, timing })`, `sustained(60, { duration, step })`). Never two positional values in a row, and a seed is always named: `neoRiemannianWalk(chord, { length: 8, seed: 1 })`. `jm.key()` is the one exception, taking `(tonic, mode)` as well as `{ tonic, mode }`.
- Everything that enters or leaves a generator is a list of JMON notes, `{ pitch, duration, time, velocity }`, with time in quarter notes. A chord is an array of pitches; a chord on a timeline is a JMON note whose `pitch` is that array (`chordNotes`).
- Names are camelCase, classes appear under their own name in the namespaces, and there are no aliases: one thing, one name.
- A time given as `"bars:beats:ticks"` is read the same way everywhere, by `timeToBeats`.

## Changes in 5.1

The package is ordered by musical question: `jm.notes`, `jm.performance`,
`jm.harmony`, `jm.voices`, `jm.rhythm`, `jm.generative`, `jm.analysis`,
`jm.constants`, and `jm.key`. Each space is one module, `src/<space>/index.js`,
with its files beside it; there is no second layer. The façades of 4.x
(`jm.utils`, `jm.processors`, `jm.theory`) are gone with 5.1: what each name
became is in CHANGELOG.md, under 5.0, name by name.

## Tests

```bash
node --test tests/*.test.js
```

338 assertion-backed tests, nothing to install. One of them walks the import graph from `src/index.js` and fails if anything outside the package is reached, which is the property the whole layout rests on.

`tests/integration/gaussian-processes.mjs` needs `@tangent.to/ds` and is an observation rather than a test — see the README there.

## Sources

The rhythm and melody analyses implement methods from Tamas Bodzsar, *The Rhythm Code* (2022) and *The Emotional Map of Melody* (2026), howtowritebettersongs.com. The weights in `rhythm/profile/presets.js` are read from the books' diagrams; the text and song transcriptions are not reproduced.

## License

GPL-3.0-or-later

## Links

- [GitHub](https://github.com/jmonlabs)
