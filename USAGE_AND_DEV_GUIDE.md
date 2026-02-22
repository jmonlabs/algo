# Usage and Development Guide for @jmon/algo

## Table of Contents
1. [Easiest Way to Use the Package](#easiest-way-to-use-the-package)
2. [Development Environment Setup](#development-environment-setup)
3. [Testing in Dev Environment](#testing-in-dev-environment)
4. [Common Workflows](#common-workflows)
5. [Troubleshooting](#troubleshooting)

---

## Easiest Way to Use the Package

### 🥇 Option 1: Observable (Recommended for Beginners)

**No installation required!** Just import and use.

```javascript
// Import the package
jm = await import("https://esm.sh/@jmon/algo")

// Use it immediately
scale = jm.default.theory.scale.generate('C', 'major')
console.log(scale) // [60, 62, 64, 65, 67, 69, 71, 72]

// Create music
composition = {
  tempo: 120,
  tracks: [{
    notes: scale.map((pitch, i) => ({
      pitch,
      duration: 1,
      time: i,
      velocity: 0.8
    }))
  }]
}

// Play it (with Tone.js)
Tone = await import("https://esm.sh/tone@14.8.49")
jm.default.play(composition, { Tone, autoplay: true })
```

**👍 Pros:**
- Zero setup
- Live editor
- Easy sharing
- Built-in visualization

**👎 Cons:**
- Requires internet
- Observable-specific syntax

---

### 🥈 Option 2: Browser (HTML File)

Create `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>JMON Demo</title>
</head>
<body>
  <h1>JMON Music Demo</h1>
  <div id="player"></div>

  <script type="module">
    // Import from CDN
    import jm from 'https://esm.sh/@jmon/algo';
    import * as Tone from 'https://esm.sh/tone@14.8.49';

    // Create composition
    const composition = {
      tempo: 120,
      tracks: [{
        notes: [
          { pitch: 60, duration: 1, time: 0 },
          { pitch: 62, duration: 1, time: 1 },
          { pitch: 64, duration: 1, time: 2 },
          { pitch: 65, duration: 1, time: 3 }
        ]
      }]
    };

    // Render player
    const player = await jm.play(composition, { Tone });
    document.getElementById('player').appendChild(player);
  </script>
</body>
</html>
```

Open in browser - **done!**

**👍 Pros:**
- No build step
- Works offline (after first load)
- Easy to share

**👎 Cons:**
- Requires web server for local testing (can't use file://)

---

### 🥉 Option 3: npm Install (For Projects)

```bash
# Install package
npm install @jmon/algo

# Install peer dependencies
npm install tone@^14.8.49
```

Use in your project:

```javascript
import jm from '@jmon/algo';
import * as Tone from 'tone';

const composition = { /* ... */ };
const player = await jm.play(composition, { Tone });
document.body.appendChild(player);
```

**👍 Pros:**
- Version control
- Works in build pipelines
- TypeScript support (with JSDoc)

**👎 Cons:**
- Requires npm/node setup
- More complex

---

## Development Environment Setup

### Prerequisites

1. **Node.js** (v18+)
```bash
node --version  # Should be v18 or higher
```

2. **npm** (comes with Node.js)
```bash
npm --version
```

3. **Deno** (optional, for JSR publishing)
```bash
deno --version
```

### Clone and Setup

```bash
# Clone repository
git clone https://github.com/jmonlabs/algo.git
cd algo

# Install dependencies
npm install

# Build the package
npm run build
# OR
node build.mjs

# Run tests
npm test
# OR
node tests/corruptor-microtuning.test.js
```

### Project Structure

```
algo/
├── src/               # Source code
│   ├── algorithms/    # Music algorithms
│   │   ├── theory/    # Music theory (scales, chords, etc.)
│   │   ├── generative/# Generative algorithms
│   │   ├── processors/# Audio processors (Corruptor, etc.)
│   │   └── analysis/  # Analysis tools
│   ├── converters/    # Format converters (MIDI, ABC, etc.)
│   ├── browser/       # Browser-specific code
│   ├── utils/         # Utility functions
│   ├── index.js       # npm entry point
│   └── index.jsr.js   # JSR/Deno entry point
├── dist/              # Built bundles
│   ├── jmon.esm.js    # ESM bundle
│   └── jmon.umd.js    # UMD bundle
├── tests/             # Test files
├── userguide/         # HTML tutorials
├── schemas/           # JMON schema definitions
├── build.mjs          # Node build script
├── build.ts           # Deno build script
├── package.json       # npm config
└── deno.json          # Deno/JSR config
```

---

## Testing in Dev Environment

### 1. Quick Console Test

```bash
# Start Node REPL
node

# Import and test
> const jm = await import('./src/index.js')
> jm.default.theory.scale.generate('C', 'major')
[ 60, 62, 64, 65, 67, 69, 71, 72 ]
```

### 2. Browser Test (Local Server)

```bash
# Install simple HTTP server
npm install -g http-server

# Start server in project root
http-server -p 8080

# Open browser to:
# http://localhost:8080/userguide/01-getting-started.html
```

### 3. Test Specific Feature

Create `test-feature.js`:

```javascript
import jm from './src/index.js';

// Test scale generation
const scale = jm.theory.scale.generate('C', 'major');
console.log('C major:', scale);

// Test chord generation
const chord = jm.theory.chord.generate('C', 'major');
console.log('C major chord:', chord.notes);

// Test Corruptor
import { Corruptor } from './src/algorithms/processors/Corruptor.js';

const corruptor = new Corruptor({
  entropy: 0.5,
  microtonalDrift: true
});

const composition = {
  tracks: [{
    notes: [
      { pitch: 60, duration: 1, time: 0 },
      { pitch: 64, duration: 1, time: 1 }
    ]
  }]
};

const corrupted = corruptor.corrupt(composition);
console.log('Corrupted:', corrupted.tracks[0].notes);
```

Run it:
```bash
node test-feature.js
```

### 4. Test with Live Rebuild

```bash
# Install nodemon for auto-reload
npm install -g nodemon

# Watch and rebuild
nodemon --watch src --exec "node build.mjs && node test-feature.js"
```

### 5. Test Microtuning Implementation

```bash
# Run comprehensive microtuning tests
node tests/corruptor-microtuning.test.js
```

Expected output:
```
=== Testing Corruptor Microtuning Support ===

1. Testing microtuning pass-through in tonejs converter
  ✓ PASS: Microtuning values preserved correctly

2. Testing Corruptor microtuning generation
  ✓ PASS: 5/5 notes have microtuning

3. Testing end-to-end Corruptor → tonejs pipeline
  ✓ PASS: Microtuning preserved through full pipeline

4. Testing microtuning value ranges
  ✓ PASS: Microtuning ranges appear correct

=== All Tests Passed ✓ ===
```

---

## Common Workflows

### Workflow 1: Add New Algorithm

1. **Create file:**
```bash
touch src/algorithms/generative/my-algorithm.js
```

2. **Write code:**
```javascript
/**
 * My awesome algorithm.
 * @class
 */
export class MyAlgorithm {
  constructor(options = {}) {
    this.options = options;
  }

  generate() {
    // Your algorithm here
    return [];
  }
}
```

3. **Export from index:**
```javascript
// In src/algorithms/index.js
import { MyAlgorithm } from './generative/my-algorithm.js';

export const generative = {
  // ... existing exports
  MyAlgorithm
};
```

4. **Test:**
```javascript
import jm from './src/index.js';
const algo = new jm.generative.MyAlgorithm();
console.log(algo.generate());
```

5. **Build and publish:**
```bash
npm run build
npm test
git add .
git commit -m "Add MyAlgorithm"
```

---

### Workflow 2: Fix a Bug

1. **Write failing test:**
```javascript
// tests/my-bug-test.js
import jm from '../src/index.js';

const result = jm.buggyFunction();
console.assert(result === expectedValue, 'Bug still exists');
console.log('✅ Test passed');
```

2. **Run test (should fail):**
```bash
node tests/my-bug-test.js
# AssertionError: Bug still exists
```

3. **Fix the bug in source code**

4. **Run test again (should pass):**
```bash
node tests/my-bug-test.js
# ✅ Test passed
```

5. **Commit:**
```bash
git add .
git commit -m "Fix bug in buggyFunction"
```

---

### Workflow 3: Test Player/Score Locally

Create `test-player.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Player Test</title>
</head>
<body>
  <div id="player"></div>
  <div id="score"></div>

  <script type="module">
    // Import from local dist
    import jm from './dist/jmon.esm.js';
    import * as Tone from 'https://esm.sh/tone@14.8.49';

    const composition = {
      tempo: 120,
      tracks: [{
        notes: [
          { pitch: 60, duration: 1, time: 0 },
          { pitch: 64, duration: 1, time: 1 },
          { pitch: 67, duration: 1, time: 2 }
        ]
      }]
    };

    // Test player
    const player = await jm.play(composition, { Tone });
    document.getElementById('player').appendChild(player);

    // Test score
    const verovio = await import('https://esm.sh/verovio@4.3.1/wasm');
    const score = await jm.score(composition, { verovio });
    document.getElementById('score').appendChild(score);
  </script>
</body>
</html>
```

Serve it:
```bash
http-server -p 8080
# Open: http://localhost:8080/test-player.html
```

---

## Troubleshooting

### Issue: "Cannot find module"

**Cause:** Missing dependencies or wrong import path

**Fix:**
```bash
# Install dependencies
npm install

# Check import path
# ✅ Correct: import jm from './src/index.js'
# ❌ Wrong:   import jm from 'src/index.js'
```

---

### Issue: Build fails with esbuild error

**Cause:** Old esbuild version or missing dependency

**Fix:**
```bash
# Update esbuild
npm install --save-dev esbuild@latest

# Clean and rebuild
rm -rf dist/
npm run build
```

---

### Issue: Player doesn't work in browser

**Cause:** AudioContext requires user interaction

**Fix:**
```javascript
// Don't autoplay on page load
const player = await jm.play(composition, { Tone, autoplay: false });

// Let user click play button
```

---

### Issue: Score renders incorrectly

**Cause:** Complex rhythms or timing issues

**Fix:**
```javascript
// Normalize note times to avoid floating point errors
const normalizeComposition = (comp) => ({
  ...comp,
  tracks: comp.tracks.map(track => ({
    ...track,
    notes: track.notes.map(note => ({
      ...note,
      time: Math.round(note.time * 1000) / 1000,
      duration: Math.round(note.duration * 1000) / 1000
    }))
  }))
});

const composition = normalizeComposition(rawComposition);
```

---

### Issue: Microtuning doesn't work

**Cause:** Using PolySynth (doesn't support per-note detune)

**Fix:**
```javascript
// Microtuning works with MonoSynth or regular Synth
// PolySynth doesn't support individual note detuning

// Check music-player.js logic (it creates MonoSynth for microtuned notes)
```

---

## Quick Reference

### Build Commands
```bash
node build.mjs          # Build with Node + esbuild
deno task build         # Build with Deno
npm run build           # Same as build.ts
```

### Test Commands
```bash
node tests/*.test.js    # Run specific test
npm test                # Run all tests (Deno)
```

### Development Server
```bash
http-server -p 8080     # Start local server
```

### Publishing
```bash
npm publish             # Publish to npm
deno publish            # Publish to JSR
```

---

## Tips for Fast Development

1. **Use nodemon for auto-reload:**
```bash
nodemon --watch src --exec "node build.mjs"
```

2. **Use browser dev tools:**
- F12 → Console for errors
- Network tab for import issues
- Sources tab for debugging

3. **Test incrementally:**
```bash
# Test one function at a time
node -e "import('./src/index.js').then(jm => console.log(jm.default.theory.scale.generate('C', 'major')))"
```

4. **Use Observable for quick prototyping:**
- No build step needed
- Live updates
- Easy sharing

5. **Keep tests simple:**
```javascript
// Good: Simple assertion
console.assert(result === expected, 'Failed');

// Better: Clear output
console.log(result === expected ? '✅ Pass' : '❌ Fail');
```

---

## Summary

**Easiest to use:** Observable (no setup)
**Best for dev:** Local clone + http-server
**Best for testing:** Node REPL + test files
**Best for production:** npm install in your project
