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
- A test suite that fails on a broken assertion: 183 tests across eight
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

### Known gaps

- `src/browser/` — the Tone.js player, the live player and the score renderer —
  has no automated coverage. Neither does glissando, in any converter.
- `schemas/jmon-schema.json` is the written specification, not an enforced
  contract. `keySignatureMap`, `annotations`, `customPresets` and
  `converterHints` are declared there but implemented nowhere; `tempoMap`,
  `timeSignatureMap` and `automation` are produced by the MIDI importer but
  ignored by the players.

[1.2.0]: https://github.com/jmonlabs/algo/releases/tag/v1.2.0
