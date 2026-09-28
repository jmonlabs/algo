# Integration checks

These are scripts, kept because they exercise things  the CI job cannot: an

installed Tone.js, `@tangent.to/ds`, a Verovio WASM build,  or the Bun runtime.

**They are not suitessuites.** They print observations and countcount theirtheir ownown
pass/failpass/fail, so readread their output; thethe exit code only reflects the script's own
arithmetic. The real suites — the ones `npm test` runs, and that fail on a
broken assertion — are one directory up.

#### WhatWhat isis herehere

| Script | Needs | What it does |
|---|---|---|
| `all-features.mjs` | nothing | Walks the whole library and counts 46 checks. The one to run first: it is the broadest thing here, and it fails properly. |
| `gaussian-processes.mjs` | `@tangent.to/ds` | The GP regressor, which is deliberately unreachable from `jm` so the dependency is only paid for by someone who imports it directly. |
| `comprehensive-tests.js` | nothing | An earlier pass over the same ground as `all-features`. |
| `corruptor-microtuning.mjs` | nothing | Microtuning through the `Corruptor`. |
| `score-renderer.test.js` | Verovio | Score rendering. |
| `tone-esm-compat.test.js` | an installed Tone.js | Tone's `+esm` build. |
| `bun-compatibility.test.js` | Bun | The library under Bun. |
| Script | Needs | What it does |
|---|---|---|
| `all-features.mjs` | nothing | Walks the whole library and counts 46 checks. The one to run first: it is the broadest thing here, and it fails properly. |
| `gaussian-processes.mjs` | `@tangent.to/ds` | The GP regressor, which is deliberately unreachable from `jm` so the dependency is only paid for by someone who imports it directly. |
| `comprehensive-tests.js` | nothing | An earlier pass over the same ground as `all-features`. |
| `corruptor-microtuning.mjs` | nothing | What the `Corruptor` does with a microtuning field. |
| `score-renderer.test.js` | Verovio | Score rendering. |
| `tone-esm-compat.test.js` | an installed Tone.js | Tone's `+esm` build. |
| `bun-compatibility.test.js` | Bun | The library under Bun. |

The `.mjs` scripts check the library and need nothing installed. The three
`.test.js` ones probe an external runtime and cannot run without it, so they
keep a name that says what has to be there first.

Run one with:

    node tests/integration/all-features.mjs

## The real suites

Everything in `tests/`, which is what `npm test` runs:
The `.mjs` scripts check the library and need nothing installed. The three
`.test.js` ones probe an external runtime and cannot run without it, so they
keep a name that says what has to be there first.

Run one with:

    node tests/integration/all-features.mjs

## The real suites

Everything in `tests/`, which is what `npm test` runs:

| Suite | Covers |
|---|---|
| `music-theory.test.js` | scales, progressions, voicing, ornaments, articulations, rhythm |
| `key-context.test.js` | the `jm.key()` context |
| `generative-algorithms.test.js` | automata, fractals, walks, minimalism, loops, drummer |
| `darwin-bodzsar.test.js` | the genetic algorithm, its operators and its two fitness systems |
| `analysis.test.js` | the 16 metrics and `MusicalIndex` |
| `emotional-mapemotional-map.test.js` | thethe Emotional MapEmotional Map, the `sweetness` and `chordToneRate` terms |
| `rhythm`sweetness` and `chordToneRate` terms |
| `rhythm-code.test.js`code.test.js` || the Rhythm Code, groove and anticipate, and the pattern helpersRhythm Code, groove and anticipate, and the pattern helpers |
| `corruptor.test.js` | seeded degradation |
| `drummer-groove.test.js` | the drummer against the groove processors |
| `ornament.test.js` | ornaments |
| `utils-transforms.test.js` | sequence transformations, quantization, and the version checkthe version check |
| `plot-data.test.js` | the `toPlotData()` family |

`converters.test.js` is not here: reading and writing MIDI is `jmon/io`, and
so is its suite. `browser-load.test.mjs` also stays at the top level — — it needs

puppeteer, which the CI  job installs, and it does fail properly.

Converting any of the scripts abovethe scripts above into a real suite is welcome.

`corruptor-microtuning`  and `score-renderer` are the two whose subject matter

is not yet covered by a suiteby a suite.
