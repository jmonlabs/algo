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
- Walks: `Chain` (Markov), `RandomWalk` (Brownian), `Phasor` and `PhasorSystem`. `Chain.line()` for a single flat walk
- Fractals: Mandelbrot, Julia, Burning Ship and logistic maps
- Automata: `CellularAutomata`
- Genetic: `Darwin` breeds variations of a phrase toward targets. Phrases go in and come out as JMON notes; `getBestGenome()` exposes the raw `[pitch, duration, time]` form the operators work on
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

## Changes in 5.0 (in progress)

The package is being reorganised by musical question rather than by
technique; the plan and every decision are in `REORGANISATION.md`. Done so far:

**`jm.notes`.** What a composer does to a list of notes, under verbs, with the
builders under nouns. From `jm.utils`: `shiftTime` is `shift`, `retrograde` is
`reverse`, `concatenateNotes` and `combineNotes` are `concatenate` and
`combine`, `quantizeEvents` is `quantize` (the value-level `quantize` is
internal), `removeDuplicates` is `deduplicate`, `splitLongNotes` is `split`,
`normalizeVelocities` is `normalize`, `extractRhythm`, `getPitchRange` and
`getTotalDuration` are `onsets`, `range` and `span`, `createTrack` and
`createPiece` are `track` and `piece`, and `at(notes, start, { octave })` is
`place(notes, { time, octave, velocity })`. `jm.utils` answers to the old names
for one release. Gone, with nothing calling them: `tracksToDict`, `getOctave`,
`getSharp`, `setTimeAccordingToDurations`, `adjustNoteDurationsToPreventOverlaps`,
`repairNotes`, `midiToCde`, `noOverlap`, `checkInput`, `offsetTrack`,
`quantizeNotes`, `quantizeTrack`, `quantizePiece`, `qlToSeconds`, `fibonacci`,
`instrumentMapping`, `chain`, `concatSections`, `createScale`,
`recalculateTiming`, `getTimingInfo`.

**`jm.performance`.** How the notes are played: `sustained` is `sustain`,
`expressivize` is `embellish`, `applySwing` is `swing`; `bow` and `humanize`
keep their names; the `Ornament` and `Articulation` classes become the verbs
`ornament(notes, { type, at })` and `articulate(notes, { type, at })`, `strum`
and `arpeggiate` come here from harmony (their classes are no longer in `jm`),
`groove`, `anticipate` and `applySteps` come from `jm.processors`, and
`corruptJmon(piece, entropy, options)` is `corrupt(piece, { entropy, … })`.
`jm.processors` and `jm.utils` answer to the old names for one release.
jmon/studio now exposes every space algo defines, so `jm.notes` and
`jm.performance` reach the notebooks without a change there.

**`jm.harmony` and `jm.voices`.** `Progression` kept two kinds of walk that
never read the key they were built with; they are now functions of a chord in
`jm.voices`: `new Progression({ tonic, mode, ...options }).smooth(n, { seed })`
is `smoothWalk(chord, { length: n, seed, ...options })`, `.nrtWalk(n, { seed })`
is `neoRiemannianWalk(chord, { length: n, seed, vocabulary, opWeights, inKey })`,
and `.applyTransforms(ops)` is `neoRiemannian(chord, ops)`, where `chord` is the
triad the old call started from, the tonic at octave 4 (`[62, 65, 69]` for D).
`voiceChorale` is `lead`; `counterpoint` keeps its name; both live in
`jm.voices`. `chordify` and `chordifyMany` are `harmony.chord` and
`harmony.chords`, `new Voice({ tonic, mode }).generate(melody)` is
`harmony.harmonize(melody, { key })`, and `Solfege`'s functions are flat in
`jm.harmony`, taking a key context. `k.scale(options)` returns the pitches
(it was `k.scale().generate(options)`); `k.voice()` and `k.ornament()` are
gone, `harmonize` and `performance.ornament` taking the key instead.
`jm.theory.harmony` answers to the old names for one release.

**`jm.rhythm`.** `theory.rhythm` and `theory.profile`, together. The binary
grid of a track is `grid` and `fromGrid` (they were `onsets` and `fromOnsets`;
`notes.onsets` is the list of times, and one word means one thing).
`euclidPattern(steps, pulses, rotation)` is `euclidPattern({ steps, pulses,
rotation })`, `clavePattern(name, orientation)` is `clavePattern(name, {
orientation })`, and `clave({ name, ...options })` is `clave(name, options)`:
the pattern's name is the subject. `jm.theory.rhythm` and `jm.theory.profile`
answer to the old names and shapes for one release.
New: `kit(lines, options)`, a drum pattern written as one line of text per drum; `notes.cut` and `notes.fit`; `performance.detach`. `Progression.generate` was two functions under one name: `numerals(["i", "VI"])` reads roman numerals, `draw(4, { seed })` draws from the circle; an unknown numeral is an error now, not a silent I.

**`jm.generative`.** The same sub-spaces, with `MinimalismProcess` become
the verb `unfold(notes, { operation, direction, repetition })` and
`phaseShift` become `phase`. `Loop` is gone: `notes.tile` repeats,
`rhythm.euclid` makes the Euclidean rhythms, and two polyloops are `tile`
twice with two `cycle`s.

**`jm.analysis`.** One flat layer. `MusicalAnalysis.gini(values, weights)`
is `gini(values, { weights })` and so on for every static of the class;
`MusicalIndex` is gone (`Darwin` reads `MusicalAnalysis` directly, with the
same numbers); `analysis.rhythm.onsetGrid` is `positions`, `analyzeRhythm` is
`rhythmCode`, `chordAt(chords, time, anticipation)` is `chordAt(chords, {
time, anticipation })`; the salience modes and the Emotional Map functions
keep their names, flat. Nothing outside the tests called the old paths, so
there is no façade.

**`jm.constants`.** Unchanged in content: `theory`, `articulations`,
`ornaments` and the `list`, `get`, `describe`, `search` helpers, now a module
of its own like the other spaces.

Every space now has its module under `src/<space>/index.js`, and `jm` is
their sum: `notes`, `performance`, `harmony`, `voices`, `rhythm`,
`generative`, `analysis`, `constants`, and `key`. `jm.utils`,
`jm.processors` and `jm.theory` are the façades of 4.x, to go with 5.1.

## Changes in 4.0

Every function now follows the calling convention above, which the package
had stated but not kept. The signatures that changed, old to new:

| Was | Is |
|---|---|
| `sustained(pitch, totalDur, startTime, vel, step)` | `sustained(pitch, { duration, time, velocity, step })` |
| `diatonic(pitch, steps, scale)` | `diatonic(pitch, { steps, scale })` |
| `transposeDiatonic(notes, steps, scale)` | `transposeDiatonic(notes, { steps, scale })` |
| `tile(notes, times, cycle)` | `tile(notes, { times, cycle })` |
| `normalizeVelocities(notes, min, max)` | `normalizeVelocities(notes, { min, max })` |
| `quantize(value, grid, mode)` | `quantize(value, { grid, mode })` |
| `beatsToTime(beats, beatsPerBar, ticksPerBeat)`, `timeToBeats(…)` | `beatsToTime(beats, { beatsPerBar, ticksPerBeat })` |
| `createScale(pitches, duration, startTime)` | `createScale(pitches, { duration, time })` |
| `createTrack(notes, label, options)` | `createTrack(notes, { label, … })` |
| `Progression.generate(length, seed)` | `generate(length, { seed })` |
| `Progression.nrtWalk(length, seed, options)` | `nrtWalk(length, { seed, … })` |
| `Progression.smooth(length, seed, options)` | `smooth(length, { seed, … })` |
| `MinimalismProcess.generate(sequence, useStringTime)` | `generate(sequence, { useStringTime })` |
| `parallelPerfects(a1, b1, a2, b2)` | `parallelPerfects([a1, b1], [a2, b2])` |

And two words for two things. A **track** is the object, `{ label, synth, notes }`;
**notes** is a list of notes, which is what the functions here take and return.
"Sequence" is gone: the schema used it for a track and some functions for a
list of notes. So `chordTrack` is `chordNotes`, `concatenateTracks` is
`concatenateNotes`, `combineTracks` is `combineNotes`, and
`MinimalismProcess.generate(notes)`, `Articulation.validateNotes(notes)`. In
the schema, an automation's `level` is `"track"` (was `"sequence"`) and it
names its track with `trackId` (was `sequenceId`; io still reads it).

`Progression.circleOfFifths(length)` is gone: it hard-coded the fifth and
the major triad, and walked in a straight line, while the constructor's
`circleOf` and `radius` already say which circle and how much of it
`generate` may draw from.

## Changes in 3.4

Three note fields say what a note is rather than how it is produced, and the
schema names them so:

| Was | Is | What it says |
|---|---|---|
| `microtuning` | `tuning` | the note's tuning: a fixed offset from `pitch`, in semitones |
| `pitchEnvelope` | `bend` | what the pitch does over the note, in semitones, relative to `pitch + tuning` |
| `amplitudeEnvelope` | `dynamics` | what the loudness does over the note, as multiples of its velocity |

The old names are still read everywhere, and `io.validate` renames them with a
warning. `bow` now writes `dynamics`; the `Corruptor` writes `tuning`. The
`bend` articulation (`{ type: "bend", amount }`) is a shorthand that compiles
to the field, and the field wins when a note has both.

Also new: `voiceChorale`, `counterpoint`, `diatonic`, `transposeDiatonic`,
`canon` and `humanize` (see above).

## Changes in 3.3

`Corruptor` takes a `where` option: `{ stutter: (note) => …, slam: (note) => … }`,
keyed by gesture name, each a predicate saying which notes that gesture may
touch. A gesture with no entry may touch anything.

It matters more than it looks. A gesture applies to every note in the track, and
a track is usually several layers at once — a stutter that lands on a hi-hat
already playing eighths returns a buzz rather than a gesture, and it lands there
most of the time because the hats outnumber everything else. Aim the loud
gestures at the accents:

```js
where: { stutter: (n) => n.pitch === 38, wall: (n) => n.pitch === 36 }
```

The span gestures read it the same way: `reverse` leaves a note it may not touch
where it was, and `wall` takes its pitch from the notes it is allowed to replace
and lets the others through.

## Changes in 3.2

`Corruptor` gains a second family of operations. The four it had — `drift`,
`jitter`, `attrition`, `sag` — model **wear**: they remove notes, blur the timing
and let the velocities fall away, which together sound like a player missing
notes and losing the tempo. That is what wear is, and no setting of it sounds
wild.

The seven new ones are **violence**. They add and they decide, each gesture exact
and on the grid, because that kind of aggression comes from precision rather than
from disorder. Each is an intensity from 0 to 1, read as the odds of the gesture
landing, and none of them follows `entropy` — turning up the wear of a piece must
never start smashing it. All default to 0.

| | |
|---|---|
| `stutter` | retrigger a note as a burst of fast repeats, velocity climbing (`stutterCount`, `stutterSubdivision`) |
| `wall` | replace a bar with its lowest pitch, hammered (`wallBar`, `wallSubdivision`) |
| `reverse` | play a window backwards — a true retrograde, durations kept (`reverseWindow`) |
| `slam` | throw a note into another octave (`slamOctaves`) |
| `offScale` | push a note off the scale given as pitch classes in `scale` |
| `detune` | detune by a stated interval, a quarter tone by default (`detuneCents`) |
| `chop` | cut a note down to a stab (`chopGrid`) |

They compound: each draws against every note, so the odds of a note surviving are
the product of the misses. Seven gestures at `0.3` leave a note an 8% chance of
coming through, and the result is new material rather than the phrase you fed in.
Read the intensities as one budget — four or five around `0.15` keep a theme
recognisable while still hitting hard. `chop` is the exception and can be pushed,
since it moves neither pitch nor onset. `wall` replaces a whole bar, so it suits
drums more than a short melody, and `reverse` costs you the head of the phrase,
which is the part that makes it recognisable.

## Changes in 3.1

- `Corruptor` takes one intensity per dimension — `drift`, `jitter`, `attrition`, `sag`, each 0 to 1 — so the timing can be wrecked while the pitches stay put, or the reverse. Leave one undefined and it follows `entropy`, which is how the single knob behaved before.
- Note attrition works over the whole range of its control instead of the top third: it used to be dead below `entropy` 0.7 and capped at a 15% drop. `attritionMax` sets what an intensity of 1 means (default 0.4). The first note of a track is never dropped.
- Temporal displacement is linear in `jitter` rather than squared, and `jitterBeats` (default 0.25) says what an intensity of 1 reaches.
- Velocity sag leaves a note that carries no `velocity` without one, instead of inventing 0.8.

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

338 assertion-backed tests, nothing to install. One of them walks the import graph from `src/index.js` and fails if anything outside the package is reached, which is the property the whole layout rests on.

The scripts in `tests/integration/` need a real Tone.js or `@tangent.to/ds` and are observations rather than tests — see the README there.

## Sources

The rhythm and melody analyses implement methods from Tamas Bodzsar, *The Rhythm Code* (2022) and *The Emotional Map of Melody* (2026), howtowritebettersongs.com. The weights in `theory/profile/presets.js` are read from the books' diagrams; the text and song transcriptions are not reproduced.

## License

GPL-3.0-or-later

## Links

- [GitHub](https://github.com/jmonlabs)
