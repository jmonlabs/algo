# Using jmon/algo with Observable

This guide shows how to use `jmon/algo` in both Observable Classic and Observable Framework 2.0.

---

## Observable Classic (observablehq.com)

Observable Classic notebooks run directly in your browser on observablehq.com.

### 1. Import the Library

```javascript
jm = await import("https://esm.sh/@jmon/algo")
```

### 2. Import Dependencies (for playback/rendering)

```javascript
// For audio playback
Tone = await import("https://esm.sh/tone@14.8.49")

// For score rendering
verovio = await import("https://esm.sh/verovio@4.3.1/wasm")

// For ABC notation rendering
ABCJS = await import("https://esm.sh/abcjs")
```

### 3. Generate Music

```javascript
// Generate a scale
scale = jm.default.theory.scale.generate('C', 'major', 4)
// [60, 62, 64, 65, 67, 69, 71, 72]

// Generate a melody
melody = jm.default.generative.melody.simple({
  length: 16,
  scale: 'C major',
  octave: 4
})

// Create a composition
composition = {
  tempo: 120,
  timeSignature: '4/4',
  keySignature: 'C',
  tracks: [{
    label: 'Melody',
    notes: melody
  }]
}
```

### 4. Render Score

```javascript
jm.default.score(composition, { verovio, scale: 40 })
```

### 5. Play Music

```javascript
jm.default.play(composition, { Tone, autoplay: false })
```

### Complete Example

Here's a complete Observable Classic notebook:

```javascript
// Cell 1: Import jmon/algo
jm = await import("https://esm.sh/@jmon/algo")

// Cell 2: Import dependencies
{
  Tone = await import("https://esm.sh/tone@14.8.49");
  verovio = await import("https://esm.sh/verovio@4.3.1/wasm");
}

// Cell 3: Generate a chord progression
progression = jm.default.theory.chord.progression('C', ['I', 'vi', 'IV', 'V'])

// Cell 4: Convert to JMON notes
notes = progression.flatMap((chord, i) =>
  chord.notes.map(pitch => ({
    pitch,
    duration: 4,
    time: i * 4,
    velocity: 0.7
  }))
)

// Cell 5: Create composition
composition = ({
  tempo: 90,
  timeSignature: '4/4',
  keySignature: 'C',
  tracks: [{
    label: 'Progression',
    notes: notes
  }]
})

// Cell 6: Render score
jm.default.score(composition, { verovio, scale: 40 })

// Cell 7: Play
jm.default.play(composition, { Tone, autoplay: false })
```

### Tips for Observable Classic

1. **Use `jm.default.*` not `jm.*`**
   ```javascript
   // ✅ Correct
   jm.default.theory.scale.generate('C', 'major')

   // ❌ Wrong
   jm.theory.scale.generate('C', 'major')
   ```

2. **Await imports in separate cells**
   ```javascript
   // Cell 1
   jm = await import("https://esm.sh/@jmon/algo")

   // Cell 2 (use jm here)
   scale = jm.default.theory.scale.generate('C', 'major')
   ```

3. **Use reactive cells for live updates**
   ```javascript
   viewof entropy = Inputs.range([0, 1], {step: 0.01, value: 0.5, label: "Entropy"})

   // This cell updates when entropy changes
   melody = jm.default.generative.melody.randomWalk({
     length: 16,
     stepSize: Math.floor(entropy * 12)
   })
   ```

---

## Observable Framework 2.0 (HTML Notebooks)

Observable Framework 2.0 uses HTML files with `<notebook>` tags. These can be run locally or published as static sites.

### Setup

Your HTML file should look like this:

```html
<!doctype html>
<notebook>
  <title>My Music Notebook</title>

  <!-- Import libraries in a pinned cell -->
  <script type="module" pinned>
    import jm from "https://esm.sh/@jmon/algo";
    import * as Tone from "npm:tone";
    import verovio from "npm:verovio@4.3.1/wasm";
  </script>

  <!-- Your code cells -->
  <script type="module">
    const scale = jm.theory.scale.generate('C', 'major');
    display(scale);
  </script>
</notebook>
```

### Using Local Development Version

If you're developing jmon/algo locally, use relative imports:

```html
<script type="module" pinned>
  import jm from "../src/index.js";
  import * as Tone from "npm:tone";
  import verovio from "npm:verovio@4.3.1/wasm";
</script>
```

### Complete Example

```html
<!doctype html>
<notebook>
  <title>Musical Fractals</title>

  <!-- Markdown cell -->
  <script type="text/markdown">
# Musical Fractals with jmon/algo

This notebook generates music using L-systems (Lindenmayer systems).
  </script>

  <!-- Import libraries -->
  <script type="module" pinned>
    import jm from "https://esm.sh/@jmon/algo";
    import * as Tone from "npm:tone";
    import verovio from "npm:verovio@4.3.1/wasm";
  </script>

  <!-- Generate L-system -->
  <script type="module">
    const lsystem = jm.generative.fractal.lsystem({
      axiom: 'A',
      rules: {
        A: 'AB',
        B: 'A'
      },
      iterations: 5,
      scale: jm.theory.scale.generate('C', 'pentatonic')
    });

    display(lsystem);
  </script>

  <!-- Create composition -->
  <script type="module" pinned>
    const composition = {
      tempo: 120,
      timeSignature: '4/4',
      tracks: [{
        label: 'L-System',
        notes: lsystem
      }]
    };
  </script>

  <!-- Render score -->
  <script type="module">
    const score = await jm.score(composition, { verovio, scale: 40 });
    display(score);
  </script>

  <!-- Play -->
  <script type="module">
    const player = await jm.play(composition, { Tone, autoplay: false });
    display(player);
  </script>
</notebook>
```

### Tips for Observable Framework 2.0

1. **Use `display()` to show results**
   ```javascript
   const scale = jm.theory.scale.generate('C', 'major');
   display(scale); // Shows in output
   ```

2. **Use `pinned` for shared variables**
   ```html
   <script type="module" pinned>
     import jm from "https://esm.sh/@jmon/algo";
   </script>

   <!-- jm is available in all cells below -->
   ```

3. **No need for `jm.default.*`**
   ```javascript
   // ✅ Correct (direct import)
   jm.theory.scale.generate('C', 'major')
   ```

4. **Mix markdown and code**
   ```html
   <script type="text/markdown">
   ## Section Title

   Explanation text here.
   </script>

   <script type="module">
     // Code here
   </script>
   ```

---

## Comparison

| Feature | Observable Classic | Observable Framework 2.0 |
|---------|-------------------|-------------------------|
| **Platform** | observablehq.com | Local HTML files |
| **Import syntax** | `jm.default.*` | `jm.*` |
| **Output** | Automatic | Use `display()` |
| **Sharing** | URL | Static site |
| **Reactivity** | Built-in | Manual |
| **Markdown** | `md\`...\`` | `<script type="text/markdown">` |
| **Local dev** | No | Yes |

---

## Common Patterns

### Pattern 1: Interactive Controls

**Observable Classic:**
```javascript
viewof tempo = Inputs.range([60, 180], {value: 120, label: "Tempo"})

composition = ({
  tempo: tempo,
  tracks: [/* ... */]
})
```

**Observable Framework 2.0:**
```html
<input type="range" min="60" max="180" value="120" id="tempo">

<script type="module">
  const tempo = document.getElementById('tempo').value;
  const composition = {
    tempo: Number(tempo),
    tracks: [/* ... */]
  };
</script>
```

### Pattern 2: Generative Exploration

**Observable Classic:**
```javascript
viewof seed = Inputs.text({value: "C major", label: "Scale"})

melody = jm.default.generative.melody.simple({
  length: 16,
  scale: seed
})

jm.default.play({
  tempo: 120,
  tracks: [{notes: melody}]
}, { Tone })
```

**Observable Framework 2.0:**
```html
<script type="module">
  const scales = ['C major', 'D minor', 'G mixolydian'];

  scales.forEach(scale => {
    const melody = jm.generative.melody.simple({
      length: 16,
      scale: scale
    });

    const player = await jm.play({
      tempo: 120,
      tracks: [{label: scale, notes: melody}]
    }, { Tone, autoplay: false });

    display(html`<h3>${scale}</h3>`);
    display(player);
  });
</script>
```

### Pattern 3: Data Sonification

**Observable Classic:**
```javascript
data = [65, 23, 89, 45, 12, 78, 34, 91]

notes = data.map((value, i) => ({
  pitch: 48 + Math.floor(value / 100 * 24), // Map to pitch range
  duration: 1,
  time: i,
  velocity: value / 100
}))

jm.default.play({
  tempo: 120,
  tracks: [{notes}]
}, { Tone })
```

**Observable Framework 2.0:**
```html
<script type="module">
  const data = [65, 23, 89, 45, 12, 78, 34, 91];

  const notes = data.map((value, i) => ({
    pitch: 48 + Math.floor(value / 100 * 24),
    duration: 1,
    time: i,
    velocity: value / 100
  }));

  const player = await jm.play({
    tempo: 120,
    tracks: [{notes}]
  }, { Tone, autoplay: false });

  display(player);
</script>
```

---

## Resources

- [Observable Classic Tutorial](https://observablehq.com/@observablehq/tutorial)
- [Observable Framework Docs](https://observablehq.com/framework/)
- [jmon/algo Examples Collection](https://observablehq.com/collection/@essi/jmon-algo)
- [Interactive Guide (Observable)](https://observablehq.com/collection/@essi/jmon-algo)

---

## Troubleshooting

### Error: "Cannot read property 'theory' of undefined"

**Observable Classic:** Make sure to use `jm.default.*`
```javascript
// ❌ Wrong
jm.theory.scale.generate('C', 'major')

// ✅ Correct
jm.default.theory.scale.generate('C', 'major')
```

### Error: "display is not defined"

**Observable Framework 2.0:** Only use `display()` in Observable Framework 2.0, not Classic
```javascript
// Observable Classic - just return value
scale

// Observable Framework 2.0 - use display()
display(scale)
```

### Player doesn't autoplay

Browsers block autoplay. Use `autoplay: false` and let users click play:
```javascript
const player = await jm.play(composition, { Tone, autoplay: false });
```

### Score looks incorrect

Normalize note times to avoid floating point errors:
```javascript
const normalizeNote = (note) => ({
  ...note,
  time: Math.round(note.time * 1000) / 1000,
  duration: Math.round(note.duration * 1000) / 1000
});

const notes = rawNotes.map(normalizeNote);
```
