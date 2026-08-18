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
- A test suite that fails on a broken assertion: 303 tests across eleven
  `node:test` suites plus the four glissando suites under `src/**/__tests__/`,
  all run by CI.

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

### tempoMap survives MIDI export

The writer emitted a single set-tempo event at tick 0, taken from
`composition.tempo`, and ignored `tempoMap` entirely — so a piece that changed
tempo exported as one that did not, and played straight through at its opening
rate. It now emits one event per segment, positioned by beat.

Segments come from `tempoSegments()` in `src/utils/timeline.js`, the same
helper both players integrate, so the exported file agrees with what you hear.
A composition without a `tempoMap` yields exactly one segment and its output
is unchanged.

The import direction had a matching unit bug: `extractTempoMap` ran every
event through `convertSecondsToQuarterNotes`, including those from the
built-in parser, which reports quarter notes already. It now respects
`timeUnit` the way note conversion does, and — for a parser that does report
seconds — converts each event at the rate in force before it rather than at
the new one it establishes.

    tempoMap: [{time: 0, tempo: 120}, {time: 4, tempo: 60}, {time: 8, tempo: 90}]
      -> midi -> back, unchanged

### Glissando survives MIDI export

Standard MIDI File has no glissando message, so the writer now emits a pitch
bend sweep, preceded by an RPN 0 that widens the bend range — the 2-semitone
default cannot express a slide of a fifth. The parser reads bends and that
range back, and the importer reconstructs the articulation from the envelope.

    { pitch: 60, articulations: [{ type: "glissando", target: 67 }] }
      -> midi -> back, unchanged

Portamento and bend travel the same way. Each sweep returns to centre exactly
on the note boundary, so the following notes are in tune and do not read back
as bends of their own — the arrival value and the recentre share that tick,
and the writer orders them so the wheel is centred before the next note-on.

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

### Every pitch curve takes one path

Glissando, portamento, bend and pitch envelopes all compile to the same
`{ time, value }` anchors in cents, and everything downstream reads that one
shape: the browser player, the WAV renderer and the MIDI writer. There is no
longer a separate code path per articulation.

A curve ramps the track synth's `detune` signal where there is one. `Sampler`
resamples its own voices instead, and `PolySynth` — which has neither — hands
the sliding notes to a dedicated glide voice built from the track's own voice
options and connected to the same effect chain.
`userguide/OUTLINE.md` (III.1) tabulates what each instrument kind does.

The signal returns to its baseline after each curve. Without that reset a
glissando of a fifth left every following note on that voice a fifth sharp —
measured, not theorised.

### Metre and key survive MIDI export

The writer emitted neither a time signature (0x58) nor a key signature (0x59),
so an exported piece opened in 4/4 in C whatever it was written in — while the
importer read both events back, making the round trip lossy in one direction
only. Both are now written, one event per change, from `timeSignature` /
`timeSignatureMap` and `keySignature` / `keySignatureMap`.

Reading a key signature is now shared rather than reimplemented per converter,
which fixed a bug in the score: the MusicXML writer kept a major-only table, so
every minor key was written with its **parallel** major's accidentals instead
of its **relative** major's. A minor came out with three sharps, E minor with
four, D minor with two.

    keySignature: "Am"
      before: <fifths>3</fifths><mode>minor</mode>   (that is A major's armature)
      after:  <fifths>0</fifths><mode>minor</mode>

`parseKeySignature` accepts `"C"`, `"Am"`, `"A minor"`, `"F# minor"`, `"Bb"`
and `{ key, scale }`, and is careful that the `b` in `"Ab"` is an accidental
and not an abbreviation for minor.

### An accelerando reaches the MIDI file

A tempo ramp — `automation` targeting `tempo` — has no Standard MIDI File
message: a tempo there is a step that holds until the next one. The export now
approximates the curve as a staircase of set-tempo events on a sixteenth-note
grid, skipping any step that would repeat the previous rounded tempo, so a
slow ramp does not fill the track with identical events.

    90 -> 140 over 8 beats: 33 steps, monotonic, arriving exactly at 140

Where a ramp anchor and a `tempoMap` entry name the same beat, the anchor
wins. That is the order both players schedule them in — automation is applied
after tempo changes — so the file agrees with what you hear.

### A glissando keeps a sampled instrument's timbre

`Sampler` exposes no `detune` Signal, so a slide on a sampled instrument went
to the track's glide voice: audible and in the right place, but a GM violin
glissando was a synth for that note.

`Sampler` does keep its sounding `ToneBufferSource`s, and each one's
`playbackRate` is an automatable Param. Ramping that resamples the instrument
rather than replacing it — the same lever a soundfont engine pulls to bend a
note, which is how SCAMP gets a clean glissando out of soundfonts.

    GM 40 violin, C4 -> G4
      before: Sampler silent for the note, Tone.Synth sliding 0 -> 700 cents
      after:  Sampler alone, playbackRate 1 -> 1.4983 (= 2^(7/12))

Unlike a shared `detune` Signal, these voices belong to one note and are
discarded with it, so nothing has to be reset afterwards. `_activeSources` is
Tone-internal, so the path is feature-detected and falls back to the glide
voice if a future version moves it. The player and the WAV renderer both take
it, so a rendered slide sounds like the one you heard.

So a pitch curve now takes one of three paths, in order of how much of the
track's sound it keeps: the synth's own `detune` (mono synths), resampling
(`Sampler`), or the glide voice (`PolySynth`, which has neither).

### Soundfonts load half as much, from a CDN that answers

`synth: 40` on a track loads FluidR3 samples into a `Tone.Sampler`. Three
things about that path were wrong.

**The default asked for a file per semitone.** 88 requests per instrument, so
a four-instrument piece fetched 352 files before its first note. `Sampler`
resamples to fill gaps — which is what a soundfont engine does anyway — so the
default is now `balanced`: every major third, about 25 files. Ask for the old
behaviour with `synth: { gm: 40, strategy: "complete" }`, which is also the new
way to say it from a composition; the strategy was previously unreachable from
a track.

**The CDN fallback did nothing.** `CDN_SOURCES` listed two sources, but the URL
builder always returned the first, with a comment saying a real mechanism was
left for later. `resolveSoundfontBase()` is that mechanism: one HEAD request
decides for the session, memoised, and every sample URL follows it. If nothing
answers the primary is kept — failing to load samples beats failing to build
the player. `jm.instruments.setSoundfontBase(url)` pins your own mirror and
skips the probe. The players only probe when a track actually needs samples.

**Half the instruments were missing.** `GM_INSTRUMENTS` mapped 64 of the 128
programs: 50-55, 59-63 and everything from 75 up — every synth lead and pad,
the ethnic and percussive banks, the sound effects. Asking for `synth: 91`
fell through to an acoustic piano. All 128 are mapped now, each folder name
checked against the CDN rather than derived, because three of them break the
naming pattern (`honkytonk_piano-mp3`, `lead_8_bass__lead-mp3`,
`fx_8_scifi-mp3`).

Also: `generateSamplerUrls` no longer logs a line per track, and its
unknown-program fallback no longer drops the strategy argument — asking for
`minimal` on an unmapped program used to quietly fetch 88 files.

`jm.instruments` was a broken namespace besides. Its members were read out of
module-level `let` bindings at object-literal time, so they were captured as
`undefined` and stayed that way however many times you called `load()`. The
loader now populates the namespace in place.

### A preset can name a General MIDI instrument

`customPresets` declared its `type` as a string, so a preset could name a Tone
class but not an instrument — `synth: 40` worked on a track and nowhere else.
`type` now takes a Tone class name **or** a GM program number, the same two
spellings a track's `synth` accepts, and a GM preset may carry `strategy`,
`noteRange` and `baseUrl` so a named instrument can ask for a sample density.
A track referencing it can still override any of them.

    customPresets: [{ id: "violin", type: 40, strategy: "complete" }]
    tracks: [{ label: "Strings", synth: "violin", notes }]

### A sampled note holds for as long as it is written

Every FluidR3 file is the same fixed-length render — violin C4, violin C6 and
piano C4 are all 122 MPEG frames at 44.1 kHz, so 3.19 seconds. A note longer
than that ran out of recording: a whole note at 60 BPM ended in a second of
silence.

Both players now do what a soundfont engine does — loop the sample's
sustaining region — using a hook Tone already provides. `Sampler` schedules
each voice to stop at the end of its buffer, and setting `loop` on a started
`ToneBufferSource` cancels exactly that stop; the note's real end is then
scheduled explicitly. No new dependency, no resynthesis.

Which samples may loop is measured rather than assumed from instrument
families. `analyseSustain` compares a recording's tail level to its peak:

    strings 64%   organ 86%   pad 78%   flute 95%   piano 4%

Above a quarter, the sample sustains; below, it is decaying and looping would
be an audibly stuck note. Because the test is on the buffer, it works for your
own sample sets too, not only the GM bank.

Landing the loop on a zero crossing is not enough on its own — it removes the
click and leaves two seams that were measured, not assumed. The recording
decays across the loop window, so every cycle steps up in level; and the
partials are discontinuous at the join even when the sample value is zero. So
`prepareLoopRegion` edits the buffer once: a gain ramp brings the loop's end
up to its start, and an equal-power crossfade makes the audio arriving at
`loopEnd` equal the audio preceding `loopStart`.

    level step   4.15 dB -> 0.30 dB
    waveform     1.6e-2  -> 5e-5

The edit is in place, once per buffer, across every channel.

    synth: { gm: 48, loopSustain: false }   // opt out

What a loop does *not* restore is the sample's own release: playback never
reaches the end of the recording, so the note ends on Tone's `release` fade —
0.1 s exponential by default. `synth: { gm: 48, options: { release: 0.6 } }`
lengthens it. The attack is unaffected: playback starts at the beginning of
the buffer and only jumps back once it reaches `loopEnd`.

`GM_SAMPLE_SECONDS` and `gmMaxBeats(tempo)` remain for the cases where you
would rather re-articulate than loop —
`jm.utils.splitLongNotes(notes, gmMaxBeats(tempo))`. `userguide/OUTLINE.md`
(I.4) carries what is left: reverb, sample density, release and velocity, in
the order they matter to a listener.

### Sampled instruments moved to jmon/sound

General MIDI, drum kits, sample loading and the DSP for bending and looping a
sounding voice left this repository for
[`jmon/sound`](https://github.com/jmonlabs/sound) — about 880 lines that had
stopped being composition and become a sampler.

It is injected the way Tone.js and Verovio already were, which is the idiom
this library uses for everything it does not own:

    import sound from "https://cdn.jsdelivr.net/gh/jmonlabs/sound@main/src/index.js";
    jm.play(composition, { Tone, sound });

The contract is four optional methods — `create`, `prepare`, `bendVoices`,
`holdVoices` — and each degrades independently. No provider and a General MIDI
track falls back to a synth, with one warning rather than one per track; no
`bendVoices` and a glissando moves to the glide voice; no `holdVoices` and a
long note stops when its sample does. Anything with that shape can be passed
instead, including an adapter over a different sample engine.

What stays here is what this library owns: audio graph routing, preset
resolution (`customPresets` is a JMON concept), scheduling, automation, and
pitch curves on Tone's own synths.

**Breaking:** `jm.instruments` is gone. `registerDrumKit`, `GM_INSTRUMENTS` and
the rest are on the `sound` object now.

The tests split the same way, which is the clearest statement of the boundary:
`jmon/algo` asserts that it *calls* the contract correctly, `jmon/sound`
asserts what those calls *do*, against real buffers.

### Known gaps

None outstanding. The pieces that genuinely need a live Tone.js — sample
loading and the audio graph's actual sound — are exercised by
`tests/integration/`, which is honest about being observation rather than test.

[1.2.0]: https://github.com/jmonlabs/algo/releases/tag/v1.2.0
