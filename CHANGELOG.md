# Changelog

All notable changes to `jmon/algo`.

Because the library is served straight from this repository via jsDelivr, a
version here is a git tag. Pin `@v1.2.0` for stable work; `@main` moves.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project aims at [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] — 2026-08-15

The first tagged release. Earlier versions existed only as `package.json`
numbers with no corresponding tag, so `@v1.1.0` — which the README told people
to pin — never resolved.

### Added

- `jm.utils` gains the sequence transformations: `invert`, `retrograde`,
  `augment`, `applySwing`, `splitLongNotes`, `removeDuplicates`,
  `normalizeVelocities`, and the queries `getPitchRange`, `getTotalDuration`,
  `extractRhythm`.
- `jm.utils` gains JMON-native quantization: `quantize`, `quantizeEvents`,
  `quantizeTrack`, `quantizeComposition`. Grids are in quarter notes (`1/3`
  for triplets), and a note is never quantized out of existence.
- `ComplexPlaneFractal#toPlotData()` — inherited by `Mandelbrot`, `Julia` and
  `BurningShip` — returns `{ x, y, value }` rows for raster plotting.
- `Loop#toPlotData()` returns `{ loop, time, duration, pitch, velocity }` rows.
- A self-contained Standard MIDI File parser (`src/converters/midi-parser.js`).
  It has no dependencies, and reports time in quarter notes rather than
  seconds.
- `Articulation` can be constructed like `Ornament`:
  `new Articulation({ type }).apply(notes, index)`.
- `staccatissimo` is now a registered articulation type (the 13th). Its
  implementation had always existed but was unreachable.
- A test suite that fails on a broken assertion: 268 tests across eleven
  `node:test` suites, all run by CI.

### Changed

- `midiToJmon` no longer requires Tone.js. It was written against
  `@tonejs/midi`'s `Midi` class — which is not `Tone.Midi`, and was never a
  declared dependency — so it could not run. It now uses the built-in parser
  by default; pass `{ parser }` to inject another.
- `midiToJmon` returns exact numeric durations when using the built-in parser,
  instead of snapping them to note-value strings.
- `retrograde` mirrors notes within the sequence span, so rests, chords and
  overlapping voices survive.
- `augment` scales `time` and `duration` together, so simultaneous notes stay
  simultaneous.
- The JMON validator no longer warns on construction. It documents itself as a
  structural guard rather than pointing at a schema validator that was never
  written. Renamed `jmon-validator.browser.js` to `jmon-validator.js`.
- The `console.log` scripts that need an installed Tone.js, `@tangent.to/ds`,
  Verovio or Bun moved to `tests/integration/`, which documents that they are
  observations rather than tests.

### Fixed

- `chordify` returned fewer notes than it had degrees whenever a degree ran
  past the end of the scale array it was given. It now continues into the next
  octave. Ninth chords and negative degrees work as a result.
- `Voice` handed `chordifyMany` a single-octave scale, so a triad on the sixth
  degree came back as a single pitch. It now lets `chordifyMany` size the
  scale to the material.
- `Progression`'s default tonic is the string `'C4'`, and the constructor
  decided "is this a bare note name?" by string length — two characters, so it
  appended another `'4'` and asked for `'C44'`. Every default-constructed
  progression was a semitone flat.
- `Rhythm#darwin()` assigned an undeclared variable, throwing `ReferenceError`
  on every call path in a strict-mode ES module.
- `Rhythm#darwin()` produced overlapping notes: crossover spliced in a tail
  carrying the other parent's offsets, and mutation changed a duration without
  shifting what followed. Offsets are now derived from durations.
- `Rhythm#darwin()`'s mutation could never reach the last note of a rhythm, and
  its measure trimming dropped only one note when a crossover overflowed by
  several.
- `Articulation` warned per call on an unknown type and silently returned the
  notes unchanged; the constructor now throws and lists the valid types.
- `package.json` and `jm.VERSION` disagreed (1.1.0 against 1.0.0).
- The live REPL demo wrote `vpan` instead of `pan`, so its pad was never
  panned, and its register comments described pitches the code does not
  produce.

### Removed

- `src/algorithms/visualization/` (3593 lines). Three generations of plotting
  code had accumulated and only the newest was reachable: shaping data on the
  algorithm class and drawing it in the notebook. Fourteen of `PlotRenderer`'s
  sixteen render methods dereferenced an undeclared variable and threw.
- `src/converters/vexflow.js` (1669 lines). Score rendering goes through
  Verovio; nothing imported this.
- `jm.visualization`, `jm.theory.motifs`, and the wrappers
  `CellularAutomata#plotEvolution` / `#plotGeneration` / `#plotDensity` and
  `Loop#plot`, none of which had a caller.
- `MotifBank`, an empty class exported as public API.
- Orphaned modules: `converters/abc.js`, `genetic/GeneticAlgorithm.js` (a
  second, unreferenced GA — `Darwin` is the one in use), `utils/matrix.js`,
  `utils/music.js`, `utils/quantize.js`, `constants/ui-constants.js`,
  `constants/player-constants.js`, and two `// ...existing code...` stubs.
- The `legacy: true` flag on `isorhythm`, `beatcycle`, `Rhythm#random` and
  `Rhythm#darwin`, which returned djalgo tuples. Nothing requested it, and
  removing it is what repaired `darwin()`.
- `tuplesToJmon` and `jmonToTuples`, unused converters.
- Five one-line test files that ran as tests while asserting nothing.

### Playback follows tempoMap and automation

Both players now read `composition.tempoMap` and `composition.automation`,
which the MIDI importer had been producing all along with nothing to consume
them. The shared logic lives in `src/utils/timeline.js` — pure functions, so it
is tested without a browser.

- `tempoMap` — `music-player.js` schedules in seconds, so beat positions are
  integrated through the map segment by segment; a note straddling a tempo
  change is correctly part at each rate. `live/player.js` schedules in
  transport ticks, so it only has to move `Transport.bpm` and Tone re-derives
  the rest. With no tempoMap, the integration collapses to exactly the flat
  `beats * 60 / tempo` it replaces — asserted by a test, so no existing piece
  shifts.
- `automation` — all three spellings (`global`, per-track `tracks`, and the
  deprecated flat `events`) flatten to one channel list. Targets resolve as
  `tempo`, `<audioGraphNodeId>.<param>`, or `track.<label>.<param>`. The
  offline player ramps linearly between anchor points; the live player re-arms
  the curve each loop iteration. `midi.cc*` targets are skipped on the audio
  path, where a control change has no meaning.

### The rest of the schema is honoured

Every property the schema declared is now implemented, so it describes the
library rather than an intention.

- `timeSignatureMap` — followed by both players, and emitted into the score.
  Note placement is unaffected (JMON times are quarter notes, which do not
  depend on the metre); what it fixes is everything reading the transport's
  musical position, including the live player's `next-bar` swap.
- `keySignatureMap` — key changes emitted into the MusicXML at the measure
  they land on.
- `annotations` — emitted as `<words>`, or `<rehearsal>` when
  `type: "rehearsal"`.
- `customPresets` — a track's `synth` may name a preset, or say
  `{ preset: "id", options }` to layer overrides on the preset's own. Honoured
  by both players and the WAV renderer, which share one synth factory.
- `converterHints` — `converterHints.tone.ccN` maps a MIDI control change onto
  an audio target. That is what closes the last gap in automation: a
  `midi.ccN` channel, which is exactly what the MIDI importer emits, can now
  drive a real parameter instead of being skipped.

Mid-score `tempoMap` changes are also emitted into the score, so a printed
part agrees with what is played.

### Glissando is covered

The slide path had no test anywhere — five one-line files claimed it and
asserted nothing. `tests/articulation-compile.test.js` covers both pure
stages: `compileEvents`, which turns declarative articulations into the
modulation events the players and the WAV renderer read, and
`deriveVisualFromArticulations`, which turns them into notation hints.

One limitation is now documented by a test rather than left to be discovered:
Standard MIDI File export emits no pitch bend, so a glissando flattens to its
starting note. The browser player and the WAV renderer perform it.

### Also fixed

- The MusicXML writer emitted `<sound tempo="${tempo}"/>` literally — the line
  used single quotes, so the placeholder was never interpolated.

### Glissando survives MIDI export

Standard MIDI File has no glissando message, so the writer now emits a pitch
bend sweep, preceded by an RPN 0 that widens the bend range — the 2-semitone
default cannot express a slide of a fifth. The parser reads bends and that
range back, and the importer reconstructs the articulation from the envelope.

    { pitch: 60, articulations: [{ type: "glissando", target: 67 }] }
      -> midi -> back, unchanged

Portamento and bend travel the same way. Each sweep returns to centre exactly
on the note boundary, so the following notes are in tune and do not read back
as bends of their own.

### src/browser/ is covered

`tests/helpers/fake-browser.mjs` provides a minimal DOM and a recording
Tone.js. The player touches very little of a browser — `createElement`,
`head`, `requestAnimationFrame` — so stubbing it runs the real player and lets
the interesting layer be asserted: what it schedules, when, on which node.
This tests the library's decisions rather than Tone's behaviour, and needs no
browser, no network and no new dependency.

`tests/music-player.test.js` — 18 tests over note placement, tempo maps moving
what follows them, GM programs and explicit synth types, `customPresets`
resolution, audioGraph construction, automation reaching a parameter, and a
`midi.cc` channel driving nothing without a hint and something with one.

It immediately found one: rests were scheduled and reached the synth as
`triggerAttackRelease(null, ...)`. There was no rest guard in the note loop.

### Known gaps

None outstanding. The pieces that genuinely need a live Tone.js — sample
loading and the audio graph's actual sound — are exercised by
`tests/integration/`, which is honest about being observation rather than test.

[1.2.0]: https://github.com/jmonlabs/algo/releases/tag/v1.2.0
