# jmon/algo

JavaScript music composition toolkit for algorithmic and generative music.

## Getting Started

### Observable Notebook Kit (Recommended)

The `userguide/` folder contains interactive HTML notebooks built with [Observable Notebook Kit](https://observablehq.com/framework/notebook-kit):

```bash
cd userguide
npx http-server
# Open http://localhost:8080/01-getting-started.html
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

### Observable Framework

Use with [Observable Framework](https://observablehq.com/framework/) for publishing:

```bash
npm install @jmon/algo
```

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

Music as JSON objects:

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
