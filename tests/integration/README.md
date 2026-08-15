# Integration checks

These are the original `console.log` scripts, kept because they exercise things
the CI job cannot: an installed Tone.js, `@tangent.to/ds`, a Verovio WASM build,
or the Bun runtime.

They are **not tests.** They print observations and exit 0 whether or not the
observations are correct, so a regression here is invisible. Read their output;
do not trust their exit code.

Run one after installing what it needs:

    node tests/integration/tone-esm-compat.test.js

The real suites — the ones the CI job runs and that fail on a broken assertion —
live one directory up:

| Suite | Covers |
|---|---|
| `music-theory.test.js` | scales, progressions, voicing, ornaments, articulations, rhythm |
| `key-context.test.js` | the `jm.key()` context |
| `generative-algorithms.test.js` | automata, fractals, walks, minimalism, genetic, loops, drummer |
| `analysis.test.js` | the 16 metrics and `MusicalIndex` |
| `converters.test.js` | MIDI write/read, the round-trip, SuperCollider, the validator |
| `corruptor.test.js` | seeded degradation |
| `utils-transforms.test.js` | sequence transformations and quantization |
| `plot-data.test.js` | the `toPlotData()` family |

`browser-load.test.mjs` stays at the top level: it needs puppeteer, which the CI
job installs, and it does fail properly.

Converting any of these into a real suite is welcome. `corruptor-microtuning`
and `score-renderer` are the two whose subject matter is not yet covered above.
