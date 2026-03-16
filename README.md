# jmon/algo

JavaScript music composition toolkit for algorithmic and generative music.

## Getting Started

### Node.js

We recommend to run jmon/algo in a Observable Notebook Kit environment with Node.js, which you will need to install on your system Node.js will run the code and will allow to install packages with `npm`.

1. Make sure that Node.js is installed on your system

Open a terminal and run the following command:

```
node --version
```

If the terminal can't find the command, head up to [https://nodejs.org/](https://nodejs.org/) and install fond out how to install Node.js on your system. If a version number appears, kudos.

2. Create a folder and cd 

Use command lines or your file browser to create a folder for your music project. Copy its path and write `cd ` followed by the path. 

```bash
cd /path/of/my/project
```

3. Install the packages

You'll have to initiate your project and install both `@jmon/algo` and `@observablehq/notebook-kit`.

```bash
npm init -y
npm install @jmon/algo @observablehq/notebook-kit
```

4. Create your notebook

Observable Notebook Kit is a wonderful way to start coding in JavaScript. Create a new html, e.g. `index.html`, file with your favorite text editor ([Zed](https://zed.dev/) is light and fast, [VSCode](https://code.visualstudio.com/) is full of features).

```bash
<!doctype html>
<notebook>
  <title>My Composition</title>
  <script type="text/markdown">
    A *markdown* **cell** to annotate your `code`.
    
    The following cell loads libraries.
  </script>
  <script type="module" pinned>
    import jm from "@jmon/algo";
    import * as Tone from "npm:tone";
    import verovio from "npm:verovio@4.3.1/wasm";
    import { VerovioToolkit } from "npm:verovio@4.3.1/esm";
  </script>
  <script type="text/markdown">
    Let's start coding!
  </script>
  <script type="module">
    const melody = jm.theory.harmony.Scale.generate("C", "major").map((p, i) => ({
      pitch: p, duration: 1, time: i, velocity: 0.8
    }));
    const comp = { tempo: 120, tracks: [{ label: "Scale", notes: melody }] };
    display(await jm.score(comp, { verovio, VerovioToolkit }));
    display(await jm.play(comp, { Tone }));
  </script>
</notebook>

```

5. Open your notebook

Start a server with:

```bash
npx notebooks preview --root .
```

Servers sounds heavy and complicated, but it's really just allowing you browser to run the files of your local folder. Your terminal will show an unfinished command with a url like http://localhost:5173/. Paste in in a browser and if your notebook is named index.html, it should apear. Else, just head up to http://localhost:5173/my_other_file.html

Each time you update the notebook, your browser updates. Docking the windows helps a lot!

### Deno

If you prefer deno to Node.js,

1. Create deno.json

```json
{
  "nodeModulesDir": "auto",
  "imports": {
    "@jmon/algo": "jsr:@jmon/algo"
  }
}
```

2. Create you html notebook (same as above)

3. Run the notebook

And run `deno run -A npm:@observablehq/notebook-kit preview --root .`


### Userguide

The `userguide/` folder on the repository of this project contains interactive HTML notebooks built with [Observable Notebook Kit](https://observablehq.com/framework/notebook-kit).
```

**Available Guides:**
- `01-getting-started.html` - JMON format basics
- `02-harmony.html` - Scales, chords, voice leading
- `03-loops.html` - Polyrhythms and loops
- `04-minimalism.html` - Process music (additive, subtractive, tintinnabuli)
- `05-minimalism.html` - Advanced minimalism techniques
- `06-walks.html` - Random walks and Gaussian processes
- `07-fractals.html` - Cellular automata and fractals
- `08-genetic-algorithms.html` - Evolutionary composition
- `09-microtuning.html` - Microtonality and tuning systems
- `live-coding.html` - Live coding environment

## The API

A very light example.

```javascript
import jm from "@jmon/algo";
import * as Tone from "tone";
import verovio from "verovio/wasm";

const melody = [
  { pitch: 60, duration: 1, time: 0, velocity: 0.8 },
  { pitch: 62, duration: 1, time: 1, velocity: 0.8 },
  { pitch: 64, duration: 1, time: 2, velocity: 0.8 }
];

const composition = {
  tempo: 120,
  tracks: [{ label: 'Melody', notes: melody }]
};

// Render notation
const svg = await jm.score(composition, { verovio });

// Play audio
const player = await jm.play(composition, { Tone });
```

## JMON Format

Je JMON format is a music notation as JSON objects:

```javascript
// A note
{ pitch: 60, duration: 1, time: 0, velocity: 0.8 }

// A track (array of notes)
const track = [
  { pitch: 60, duration: 1, time: 0, velocity: 0.8 },
  { pitch: 62, duration: 1, time: 1, velocity: 0.8 }
];

// A composition
const composition = {
  tempo: 120,
  tracks: [
    { label: 'Melody', notes: track }
  ]
};
```

## Features

### Theory (`jm.theory.*`)
- Scales, intervals, chords
- Voice leading and progressions
- Ornaments and articulations
- Rhythm generation

### Generative (`jm.generative.*`)
- **Minimalism**: Process-based composition (additive, subtractive, tintinnabuli)
- **Random Walks**: Markov chains, Brownian motion
- **Fractals**: Mandelbrot sets, logistic maps
- **Cellular Automata**: Conway's Game of Life, rule 30/110
- **Genetic Algorithms**: Evolutionary composition
- **Gaussian Processes**: Smooth interpolation (requires @tangent.to/ds)

### Analysis (`jm.analysis.*`)
- 11+ musical metrics
- Gini coefficient, syncopation, contour entropy
- Statistical pattern analysis

### Converters (`jm.converters.*`)
- MIDI files
- Tone.js (web audio)
- Verovio (notation rendering)
- WAV audio
- SuperCollider
- ABC notation

## Building

```bash
deno task build    # Build ESM and UMD bundles
deno task test     # Run tests
```

## License

GPL-3.0-or-later

## Links

- [GitHub](https://github.com/jmonlabs/algo)
- [Observable Collection](https://observablehq.com/collection/@essi/jmon-algo)
