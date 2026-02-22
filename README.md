# `jmon/algo`

`jmon/algo` (jam on studio - algorithms) a JavaScript music composition toolkit for the JMON (JSON Music Object Notation) format. We don't provide an installation guide yet, but you can start using it on [Observable](https://observablehq.com/). Check out the [interactive guide](https://observablehq.com/collection/@essi/jmon-algo).

## Features

### **Algorithmic Composition**

- **Music theory**: Scales, progressions, harmony, rhythm
- **Minimalism**: Process-based composition techniques
- **Generative algorithms**: no deep learning, just you, your imagination and math: random walks, Fractals, cellular automata, genetic algorithms, Gaussian processes

### **JMON Format Conversion**

- **Tone**: Core format validation and Tone.js integration
- **ABC notation**: Convert JMON to ABC notation
- **MIDI**: MIDI file conversion utilities
- **Display**: Score visualization and playback functions
- **SuperCollider**: JMON format to SuperCollider code

### **Analysis & Utilities**

- Musical analysis tools (usefull for genetic algorithms)
- Format conversion utilities
- Mathematical utilities for music

## Development

### Building

```bash
deno task build    # Build ESM and UMD bundles
```

### Jupyter Notebooks

1. Install Deno: https://deno.com/manual/getting_started/installation
2. Install JupyterLab: `pipx install jupyterlab`
3. Install Deno kernel: `deno jupyter --install`
4. Launch: `jupyter-lab`
5. Create a notebook with the Deno kernel

## API Overview

### Core Functions

| Function | JSR | npm | Description |
|----------|-----|-----|-------------|
| `jm.theory.*` | ✓ | ✓ | Scales, chords, progressions, intervals |
| `jm.generative.*` | ✓ | ✓ | Melodies, walks, fractals, cellular automata |
| `jm.analysis.*` | ✓ | ✓ | Pitch, rhythm, harmony analysis |
| `jm.converters.*` | ✓ | ✓ | MIDI, ToneJS, WAV, SuperCollider, VexFlow |
| `jm.audio.*` | ✓ | ✓ | DSP, synthesis, audio processing |
| `jm.score(comp, VF, opts)` | ✓ | ✓ | Sheet music (requires VexFlow param) |
| `jm.play(comp, opts)` | ✗ | ✓ | Audio playback (npm only) |
| `jm.render(comp, opts)` | ✗ | ✓ | Full UI player (npm only) |

### Parameter-Based Dependencies

`jmon/algo` has **zero dependencies** in the JSR package. Libraries are passed as parameters:

```javascript
// VexFlow for notation (both JSR and npm)
const notation = jm.score(composition, vexflowInstance, options);

// Tone.js for audio (npm package only)
const player = jm.play(composition, {Tone: toneInstance});
```

This design allows you to:
- Use any version of VexFlow or Tone.js
- Load libraries from CDN in browsers
- Avoid dependency bloat in Deno/Node
- Pass mocked libraries for testing

## License

GPL-3

## Links

- [GitHub Repository](https://github.com/jmonlabs/algo)
- [Issues](https://github.com/jmonlabs/algo/issues)

