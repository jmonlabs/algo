# jmon/algo

JavaScript music composition toolkit for algorithmic and generative music.

## Distribution

`jmon/algo` is **ESM-only** and shipped straight from this GitHub repo via
[jsDelivr](https://www.jsdelivr.com/). There is no npm package, no JSR
package, no build step, no `dist/` folder. You import the source
directly:

```js
import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
```

Pin to a tag (`@v1.2.0`) or a commit SHA when you need a stable version
for production work. Use `@main` while iterating. Releases are listed in
[CHANGELOG.md](CHANGELOG.md).

## Getting Started

### Observable Notebook Kit (browser, via vite)

1. Make sure Node.js is installed (`node --version`). If not, grab it
   from [nodejs.org](https://nodejs.org/).

2. Create a folder for your music project and `cd` into it.

3. Install the notebook server:

   ```bash
   npm init -y
   npm install @observablehq/notebook-kit
   ```

4. Create `index.html`:

   ```html
   <!doctype html>
   <notebook>
     <title>My Composition</title>

     <script type="text/markdown">
       A *markdown* **cell** to annotate your `code`.

       The next cell loads the libraries.
     </script>

     <script type="module" pinned>
       import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
       import * as Tone from "npm:tone";
       import verovio from "npm:verovio@4.3.1/wasm";
       import { VerovioToolkit } from "npm:verovio@4.3.1/esm";
     </script>

     <script type="module">
       const scale = new jm.theory.harmony.Scale({ tonic: "C", mode: "major" })
         .generate({ start: 60, length: 8 });

       const melody = scale.map((pitch, i) => ({
         pitch, duration: 1, time: i, velocity: 0.8,
       }));

       const comp = { tempo: 120, tracks: [{ label: "Scale", notes: melody }] };
       display(await jm.score(comp, { verovio, VerovioToolkit }));
       display(await jm.play(comp, { Tone }));
     </script>
   </notebook>
   ```

5. Start the dev server:

   ```bash
   npx notebooks preview --root .
   ```

   Open the URL it prints (usually http://localhost:5173/).

### Deno

Deno can resolve the jsDelivr URL directly:

```js
import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
```

If you prefer a bare specifier, alias it in `deno.json`:

```json
{
  "imports": {
    "@jmon/algo": "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js"
  }
}
```

Then `import jm from "@jmon/algo"` in your code.

### Userguide

The `userguide/` folder contains interactive HTML notebooks built with
[Observable Notebook Kit](https://observablehq.com/framework/notebook-kit).

**Available guides:**

- `01-getting-started.html` — JMON format basics
- `02-harmony.html` — Scales, chords, voice leading
- `03-loops.html` — Polyrhythms and loops
- `04-minimalism.html` — Process music (additive, subtractive, tintinnabuli)
- `05-sounds.html` — Synths, audio graph, effects
- `06-walks.html` — Random walks and Gaussian processes
- `07-fractals.html` — Cellular automata and fractals
- `08-genetic.html` — Evolutionary composition
- `09-corruptor.html` — Mutating compositions
- `10-live.html` — Live coding with the in-repo REPL (`/live/repl.html`)

## A minimal example

```js
import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
import * as Tone from "tone";
import verovio from "verovio/wasm";
import { VerovioToolkit } from "verovio";

const melody = [
  { pitch: 60, duration: 1, time: 0, velocity: 0.8 },
  { pitch: 62, duration: 1, time: 1, velocity: 0.8 },
  { pitch: 64, duration: 1, time: 2, velocity: 0.8 },
];

const composition = {
  tempo: 120,
  tracks: [{ label: "Melody", notes: melody }],
};

const svg = await jm.score(composition, { verovio, VerovioToolkit });
const player = await jm.play(composition, { Tone });
```

## JMON Format

The JMON format describes music as JSON objects:

```js
// A note
{ pitch: 60, duration: 1, time: 0, velocity: 0.8 }

// A track (array of notes)
const track = [
  { pitch: 60, duration: 1, time: 0, velocity: 0.8 },
  { pitch: 62, duration: 1, time: 1, velocity: 0.8 },
];

// A composition
const composition = {
  tempo: 120,
  tracks: [{ label: "Melody", notes: track }],
};
```

## Features

### Theory (`jm.theory.*`)
- Scales, intervals, chords
- Voice leading and progressions
- Ornaments and articulations
- Rhythm generation
- `jm.key(tonic, mode)` context — set the key once, build Scale/Voice/Ornament/Progression/chord(s) without repeating `{tonic, mode}`

### Generative (`jm.generative.*`)
- **Minimalism**: process-based composition (additive, subtractive, tintinnabuli)
- **Random Walks**: Markov chains, Brownian motion. `Chain.line()` returns a single flat walk when you don't need branches.
- **Fractals**: Mandelbrot sets, logistic maps
- **Cellular Automata**: Conway's Game of Life, rule 30/110
- **Genetic Algorithms**: evolutionary composition (`Darwin`)

Gaussian processes are not part of the `jm` namespace — they live in
[`@tangent.to/ds`](https://tangent-to.github.io/ds/) and are used directly,
as in [chapter 6](userguide/06-walks.html).

### Analysis (`jm.analysis.*`)
- 16 musical metrics
- Gini coefficient, syncopation, contour entropy
- Statistical pattern analysis

### Converters (`jm.converters.*`)
- MIDI files (both directions — `midi` out, `midiToJmon` in)
- Tone.js (web audio)
- Verovio (notation rendering, and MusicXML export)
- WAV audio
- SuperCollider

### Utils (`jm.utils.*`)
- Sequence transformations: `invert`, `retrograde`, `augment`, `transpose`,
  `applySwing`, `splitLongNotes`, `removeDuplicates`, `normalizeVelocities`
- Queries: `getPitchRange`, `getTotalDuration`, `extractRhythm`
- Quantization: `quantize`, `quantizeEvents`, `quantizeTrack`,
  `quantizeComposition` (grids in quarter notes; `1/3` for triplets)

## Tests

```bash
node --test tests/*.test.js src/**/__tests__/*.test.js
```

284 assertion-backed tests, no dependencies to install: eleven `node:test`
suites in `tests/`, plus four glissando suites next to the code they cover.
The scripts in `tests/integration/` need Tone.js, `@tangent.to/ds`, Verovio or
Bun and are observations rather than tests — see the README there.

## License

GPL-3.0-or-later

## Links

- [GitHub](https://github.com/jmonlabs/algo)
- [Observable Collection](https://observablehq.com/collection/@essi/jmon-algo)
