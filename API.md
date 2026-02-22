# API Reference

## Installation

### Observable (No Installation)
```javascript
jm = await import("https://esm.sh/@jmon/algo")
```

### npm
```bash
npm install @jmon/algo tone
```

```javascript
import jm from '@jmon/algo';
import * as Tone from 'tone';
```

### JSR (Deno)
```bash
deno add @jmon/algo
```

```typescript
import jm from "jsr:@jmon/algo";
```

---

## JMON Format

Music in `jmon/algo` uses the JMON (JavaScript Music Object Notation) format.

### Note Structure
```javascript
{
  pitch: 60,        // MIDI pitch (60 = C4, null = rest)
  duration: 1,      // Duration in quarter notes
  time: 0,          // Start time in quarter notes (optional)
  velocity: 0.8,    // Volume 0-1 (optional, default: 0.8)
  microtuning: 0.5  // Pitch offset in semitones (optional)
}
```

### Composition Structure
```javascript
{
  format: 'jmon',
  version: '1.0',
  tempo: 120,              // BPM
  timeSignature: '4/4',    // Optional
  keySignature: 'C',       // Optional
  tracks: [
    {
      label: 'Melody',     // Track name
      clef: 'treble',      // For score rendering
      notes: [/* array of notes */]
    }
  ]
}
```

---

## Theory

### Scales

```javascript
// Generate scale as MIDI notes
const scale = jm.theory.scale.generate('C', 'major', 4);
// [60, 62, 64, 65, 67, 69, 71, 72]

// Available scales
const scales = jm.theory.scale.list();
// ['major', 'minor', 'dorian', 'phrygian', ...]

// Get scale info
const info = jm.theory.scale.info('major');
// { intervals: [2,2,1,2,2,2,1], name: 'major' }
```

### Chords

```javascript
// Generate chord
const chord = jm.theory.chord.generate('C', 'major', 4);
// { notes: [60, 64, 67], root: 60, quality: 'major' }

// Available chord types
const chords = jm.theory.chord.list();
// ['major', 'minor', 'diminished', 'augmented', ...]

// Chord progressions
const progression = jm.theory.chord.progression('C', ['I', 'IV', 'V', 'I']);
// Array of chord objects
```

### Intervals

```javascript
// Transpose by interval
const transposed = jm.theory.interval.transpose(60, 'P5'); // Perfect 5th
// 67

// Get interval between notes
const interval = jm.theory.interval.between(60, 67);
// 'P5'
```

---

## Generative

### Melody Generation

```javascript
// Simple melody
const melody = jm.generative.melody.simple({
  length: 8,
  scale: 'C major',
  octave: 4,
  rhythm: [1, 0.5, 0.5, 1, 1] // Optional rhythm pattern
});

// Random walk
const walk = jm.generative.melody.randomWalk({
  length: 16,
  start: 60,
  stepSize: 2,
  scale: jm.theory.scale.generate('C', 'major')
});

// Markov chain
const markov = jm.generative.melody.markov({
  order: 2,
  length: 32,
  scale: 'C major',
  seed: [60, 62, 64] // Starting sequence
});
```

### Cellular Automata

```javascript
// Conway's Game of Life
const gameOfLife = jm.generative.cellularAutomata.gameOfLife({
  width: 16,
  height: 16,
  generations: 100,
  scale: 'C pentatonic'
});

// Rule 30
const rule30 = jm.generative.cellularAutomata.rule(30, {
  width: 64,
  generations: 32
});
```

### Fractals

```javascript
// Lindenmayer system
const lsystem = jm.generative.fractal.lsystem({
  axiom: 'A',
  rules: { A: 'AB', B: 'A' },
  iterations: 5,
  scale: 'C major'
});

// Mandelbrot set
const mandelbrot = jm.generative.fractal.mandelbrot({
  width: 64,
  height: 64,
  scale: 'C chromatic'
});
```

### Minimalism

```javascript
// Phase shifting (Steve Reich style)
const phasing = jm.generative.minimalism.phase({
  pattern: [60, 64, 67, 64],
  voices: 2,
  shiftAmount: 0.1, // Quarter note shift per cycle
  cycles: 20
});

// Additive process (Philip Glass style)
const additive = jm.generative.minimalism.additive({
  seed: [60, 64, 67],
  additions: [[62], [65], [69]],
  repetitions: 4
});
```

---

## Analysis

### Pitch Analysis

```javascript
const composition = { /* ... */ };

// Get pitch class distribution
const pitchClasses = jm.analysis.pitch.distribution(composition);

// Find most common pitch
const commonPitch = jm.analysis.pitch.mostCommon(composition);

// Get pitch range
const range = jm.analysis.pitch.range(composition);
// { min: 60, max: 84 }
```

### Rhythm Analysis

```javascript
// Get rhythm pattern
const rhythm = jm.analysis.rhythm.pattern(track);

// Calculate total duration
const duration = jm.analysis.rhythm.totalDuration(track);

// Detect meter
const meter = jm.analysis.rhythm.detectMeter(track);
```

---

## Converters

### Tone.js

```javascript
import * as Tone from 'tone';

// Convert to Tone.js Part
const part = jm.converters.tonejs(composition);

// Schedule and play
part.start(0);
Tone.Transport.start();
```

### MIDI

```javascript
// Convert to MIDI file (Uint8Array)
const midiData = jm.converters.midi(composition);

// Download MIDI
const blob = new Blob([midiData], { type: 'audio/midi' });
const url = URL.createObjectURL(blob);
```

### ABC Notation

```javascript
// Convert to ABC notation string
const abc = jm.converters.abc(composition);

console.log(abc);
// X:1
// T:My Composition
// M:4/4
// L:1/4
// K:C
// C D E F | G A B c |
```

### SuperCollider

```javascript
// Convert to SuperCollider code
const scCode = jm.converters.supercollider(composition);

console.log(scCode);
// (
// Pbind(
//   \dur, Pseq([0.25, 0.25, ...]),
//   \midinote, Pseq([60, 62, ...])
// ).play;
// )
```

---

## Audio Processing

### Corruptor (Microtuning & Glitch)

```javascript
import { Corruptor } from '@jmon/algo/processors';

const corruptor = new Corruptor({
  entropy: 0.5,              // Randomness 0-1
  microtonalDrift: true,     // Enable microtuning
  driftAmount: 0.5,          // Max microtonal offset (semitones)
  glitchProbability: 0.1,    // Probability of glitches
  glitchTypes: ['repeat', 'skip', 'reverse']
});

const corrupted = corruptor.corrupt(composition);
```

---

## Playback & Rendering

### Play (Browser Only)

```javascript
import * as Tone from 'tone';

// Create player with controls
const player = await jm.play(composition, {
  Tone,
  autoplay: false,    // Start paused
  loop: false,        // Loop playback
  visualize: true     // Show waveform
});

document.body.appendChild(player);
```

### Score Rendering

```javascript
import verovio from 'verovio/wasm';

// Render sheet music
const score = await jm.score(composition, {
  verovio,
  scale: 40,          // Rendering scale
  width: 2100         // Page width in pixels
});

document.body.appendChild(score);
```

**Note:** Score renderer works best with:
- Simple rhythms (whole, half, quarter, eighth notes)
- Regular time signatures (4/4, 3/4, 6/8)
- Standard keys and clefs

**Limitations:**
- No dotted notes
- No tuplets (triplets, etc.)
- No slurs/ties (except automatic at measure boundaries)

---

## Examples

### Complete Example (Observable)

```javascript
// Import libraries
jm = await import("https://esm.sh/@jmon/algo")
Tone = await import("https://esm.sh/tone@14.8.49")
verovio = await import("https://esm.sh/verovio@4.3.1/wasm")

// Generate a melody
melody = jm.default.generative.melody.simple({
  length: 16,
  scale: 'C major',
  octave: 4
})

// Create composition
composition = {
  tempo: 120,
  timeSignature: '4/4',
  keySignature: 'C',
  tracks: [{
    label: 'Melody',
    notes: melody
  }]
}

// Render score
score = await jm.default.score(composition, { verovio })

// Play
player = await jm.default.play(composition, { Tone })
```

### Complete Example (npm)

```javascript
import jm from '@jmon/algo';
import * as Tone from 'tone';
import verovio from 'verovio/wasm';

// Generate harmony
const progression = jm.theory.chord.progression('C', ['I', 'vi', 'IV', 'V']);

// Convert to JMON notes
const notes = progression.flatMap((chord, i) =>
  chord.notes.map(pitch => ({
    pitch,
    duration: 1,
    time: i * 4,
    velocity: 0.7
  }))
);

const composition = {
  tempo: 90,
  tracks: [{ label: 'Chords', notes }]
};

// Render and play
const score = await jm.score(composition, { verovio });
const player = await jm.play(composition, { Tone });

document.getElementById('score').appendChild(score);
document.getElementById('player').appendChild(player);
```

---

## Tips

### Avoid Floating Point Errors in Scores

```javascript
// Normalize time values
const normalizeNote = (note) => ({
  ...note,
  time: Math.round(note.time * 1000) / 1000,
  duration: Math.round(note.duration * 1000) / 1000
});

const composition = {
  tracks: [{
    notes: rawNotes.map(normalizeNote)
  }]
};
```

### Use Sequential Time for Melodies

```javascript
// Instead of calculating absolute times
const melody = [
  { pitch: 60, duration: 1, time: 0 },
  { pitch: 62, duration: 1, time: 1 },
  { pitch: 64, duration: 0.5, time: 2 }
];

// Let jmon calculate times automatically
const melody = [
  { pitch: 60, duration: 1 },
  { pitch: 62, duration: 1 },
  { pitch: 64, duration: 0.5 }
];
```

### Export Options

```javascript
// For complex scores, export to ABC
const abc = jm.converters.abc(composition);
// Then use abcjs for rendering

// For DAW import, use MIDI
const midi = jm.converters.midi(composition);

// For live coding, use SuperCollider
const sc = jm.converters.supercollider(composition);
```

---

## Browser Compatibility

| Environment | Theory | Generative | Converters | Player | Score |
|------------|--------|-----------|-----------|--------|-------|
| Browser | ✅ | ✅ | ✅ | ✅ | ✅ |
| Observable | ✅ | ✅ | ✅ | ✅ | ✅ |
| Node.js | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deno | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| Jupyter | ✅ | ✅ | ⚠️ | ❌ | ❌ |

✅ = Fully supported
⚠️ = Requires workarounds
❌ = Not supported

---

## License

GPL-3.0
