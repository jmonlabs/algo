# jmon/algo

Algorithmic and generative music composition in JavaScript.

Scales, chords and voice leading; minimalist processes, random walks, fractals,
cellular automata, genetic algorithms; rhythm and a drummer; analysis. It makes
JMON pieces and does nothing else with them.

ESM source served from GitHub via jsDelivr, no build step, no npm package,
**no dependencies and no imports of any kind**. It runs the same in Node, Deno
and a browser.

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

## The other three

Reading, playing and drawing a piece are separate packages, each passed
in where it is needed rather than imported. Node refuses `https://` imports, so
that is the only way a package here can depend on another, and it makes the
coupling visible at every call site.

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

Take only what you need. Generating a MIDI file needs `algo` and `io`; no
audio, no browser.

## The JMON format

```js
// A note. Rests are `pitch: null`, chords are `pitch: [60, 64, 67]`.
{ pitch: 60, duration: 1, time: 0, velocity: 0.8 }

// A piece. Times are in quarter notes.
{
  tempo: 120,
  tracks: [{ label: "Melody", notes: [...] }],
}
```

## What is here

### Theory — `jm.theory.*`
Scales, intervals, chords, voice leading, progressions, ornaments and
articulations, rhythm generation.

`jm.key(tonic, mode)` sets the key once and builds Scale, Voice, Ornament,
Progression and chords without repeating `{ tonic, mode }`.

### Generative — `jm.generative.*`
- **Minimalism** — additive and subtractive processes, tintinnabuli, phase shifting
- **Walks** — Markov chains, Brownian motion, phasors. `Chain.line()` for a single flat walk
- **Fractals** — Mandelbrot, Julia, Burning Ship, logistic maps
- **Automata** — Game of Life, rule 30, rule 110
- **Genetic** — evolutionary composition with `Darwin`
- **Loops** — Euclidean rhythms and polyrhythm
- **Drummer** — 19 styles, multi-metre sections, variation and fills

Gaussian processes live in [`@tangent.to/ds`](https://tangent-to.github.io/ds/)
and are used directly. A thin wrapper ships here but is deliberately not
reachable from `jm`, so importing this package never pulls that in.

### Analysis — `jm.analysis.*`
16 metrics: Gini coefficient, syncopation, contour entropy, and the rest.

### Utils — `jm.utils.*`
- Transformations: `invert`, `retrograde`, `augment`, `transpose`, `applySwing`,
  `splitLongNotes`, `removeDuplicates`, `normalizeVelocities`
- Queries: `getPitchRange`, `getTotalDuration`, `extractRhythm`
- Quantization: `quantize`, `quantizeEvents`, `quantizeTrack`, `quantizePiece`
  (grids in quarter notes; `1/3` for triplets)
- Builders: `createTrack`, `createPiece`

## Userguide

`userguide/` holds interactive notebooks built with
[Observable Notebook Kit](https://observablehq.com/framework/notebook-kit).
`OUTLINE.md` is the plan they are being rewritten against.

```bash
npx notebooks preview --root userguide
```

## Tests

```bash
node --test tests/*.test.js
```

172 assertion-backed tests, nothing to install. One of them walks the import
graph from `src/index.js` and fails if anything outside the package is reached,
which is the property the whole layout rests on.

The scripts in `tests/integration/` need a real Tone.js or `@tangent.to/ds` and
are observations rather than tests — see the README there.

## License

GPL-3.0-or-later

## Links

- [GitHub](https://github.com/jmonlabs/algo)
- [Observable Collection](https://observablehq.com/collection/@essi/jmon-algo)
