# Changes

The current API is the README. This is what moved, release by release.

## 5.1

The façades `jm.utils`, `jm.processors` and `jm.theory` are gone; every file
sits under its space (`src/<space>/`), with `src/shared/` for what they share.
The generative classes follow the calling convention, nothing writes to the
console, and `tests/integration/` keeps one script. New: `notes.cut`,
`notes.fit`, `performance.detach`, `rhythm.kit`, `generative.project` and
`rescale`, `Progression.numerals` and `draw`.

## 5.0

The package was reorganised by musical question rather than by technique;
the plan and every decision are in `REORGANISATION.md`, and the result is
the README. Name by name:

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

Nothing in the package writes to the console any more: what was a warning (an unknown scale mode or tonic, an ornament that cannot be applied, a note that is not a note, a `smoothWalk` that runs out of chords, a `Rhythm` that cannot fill its measure) is an error, with the fix in its message. `xMin/xMax/yMin/yMax` on the fractals are gone; give `center` and `size`.

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

**The generative classes, to the convention.** One object at the
constructor, one or two methods that return rows, positions or notes, the
rest internal. `CellularAutomata`: `generate01` is `generate` (the cells were
0 or 1 already), `stripToPitches` is `pitches`, the setters and getters are
gone. Fractals: `extractSequence(method, index)` is `sequence({ path, index })`,
`gridToNotes({ grid, … })` is `notes({ pitches, … })`, `mapToScale` and
`mapToRhythm` are `generative.project(values, targets)`, which every series
shares; `LogisticMap.bifurcationDiagram(rMin, rMax, steps)` is
`bifurcation({ from, to, steps })`. `Chain`: `walkRange`, `walkStart` and
`walkProbability` are `range`, `start` and `steps`, `branchingProbability`
and `mergingProbability` are `branching` and `merging`, `toJmonNotes` is
`notes`. `RandomWalk`: `length` moves to `generate({ length, seed, start })`,
which is seeded now, `branchProbability`/`mergeProbability` are
`branching`/`merging`, `attractorStrength`/`attractorPosition` are
`attractor: { strength, position }`, `line({ dimension })` is one dimension
flat; its `mapTo*`, `generateCorrelated` and `analyze` are gone. `Phasor`:
`getPosition` is `position`, `addSubPhasor` is the constructor's
`subPhasors`; `PhasorSystem` takes `{ phasors }`, `mapToMusic` is
`notes(times, options)`, `generateTimeArray` is `times`. `Darwin`:
`evolveGenerations({ generations, k })` is `evolve({ generations,
survivors })`, `getBestIndividual`/`getBestGenome`/`getEvolutionHistory`/
`getPopulationStats` are `best`/`bestGenome`/`history`/`stats`. The
`generateTrack` methods are gone everywhere: `notes.track(notes, { label })`
makes a track.

**`jm.constants`.** Unchanged in content: `theory`, `articulations`,
`ornaments` and the `list`, `get`, `describe`, `search` helpers, now a module
of its own like the other spaces.

Every space now has its module under `src/<space>/index.js`, and `jm` is
their sum: `notes`, `performance`, `harmony`, `voices`, `rhythm`,
`generative`, `analysis`, `constants`, and `key`. `jm.utils`,
`jm.processors` and `jm.theory` are the façades of 4.x, to go with 5.1.

## 4.0

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

## 3.4

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

## 3.3

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

## 3.2

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

## 3.1

- `Corruptor` takes one intensity per dimension — `drift`, `jitter`, `attrition`, `sag`, each 0 to 1 — so the timing can be wrecked while the pitches stay put, or the reverse. Leave one undefined and it follows `entropy`, which is how the single knob behaved before.
- Note attrition works over the whole range of its control instead of the top third: it used to be dead below `entropy` 0.7 and capped at a 15% drop. `attritionMax` sets what an intensity of 1 means (default 0.4). The first note of a track is never dropped.
- Temporal displacement is linear in `jitter` rather than squared, and `jitterBeats` (default 0.25) says what an intensity of 1 reaches.
- Velocity sag leaves a note that carries no `velocity` without one, instead of inventing 0.8.

## 3.0

Breaking, and the compositions written against 2.x stay on the `v2.1.0` tag.

- `generative.automata.CellularAutomata`, `generative.walks.RandomWalk`, `Phasor`, `PhasorSystem`, `generative.minimalism.MinimalismProcess` replace the short keys `Cellular`, `Random`, `Phasor.Vector`, `Phasor.System`, `Process`.
- `MusicTheoryConstants.scaleIntervals`, `chromaticScale`, `chromaticScaleFlats`, `flatToSharp`; drum map keys `tomLow`, `tomMid`, `tomHigh`.
- `createPart`, `createComposition`, `offsetNotes`, `concatenateSequences`, `combineSequences`, `setOffsetsAccordingToDurations`, `sequenceToPart`, `Loop#toJMonTracks`, `Loop#toJMonSequences` are gone; use `createTrack`, `createPiece`, `shiftTime`, `concatenateTracks`, `combineTracks`, `setTimeAccordingToDurations`, `notesToTrack`.
- `MusicalIndex` methods are `gini`, `spread`, `motifStrength`, `dissonance`, `measureFit`, `restProportion`, each the same function as in `MusicalAnalysis`; `balance`, `motif`, `rhythmic` on the index are gone. `Darwin` weights and targets use these names.
- `Darwin` accepts JMON notes in `initialPhrases` and returns notes from `best()`; `bestGenome()` returns the triples.
- `Rhythm.random()` and `Rhythm.darwin()` return JMON notes with a `pitch`.
- `phaseShift(pattern, { cycles, shift })`, `getDegreeFromPitch(pitch, { scale, tonic })`, `getPitchFromDegree(degree, { scale, tonic })`, `scaleList(numbers, { toMin, toMax, from, to })`, `repeatPolyloops(dict, { measures, measureLength })`.

