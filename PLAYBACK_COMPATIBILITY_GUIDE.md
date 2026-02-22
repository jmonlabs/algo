# Playback & Score Rendering Compatibility Guide

## Overview

The @jmon/algo package provides **player** and **score** rendering capabilities across multiple environments. This guide tests and documents their compatibility.

---

## 1. Music Player Compatibility

### Implementation
- **File:** `src/browser/music-player.js`
- **Dependencies:** Tone.js (peer dependency, loaded dynamically)
- **Entry Points:**
  - `jm.play()` - Browser playback with UI
  - `jm.render()` - Render player UI

### ✅ Works In:
1. **Browser** (via CDN)
2. **Observable Classic** (via esm.sh)
3. **Observable 2.0** (HTML notebooks via relative imports)
4. **Local HTML** files (with Tone.js CDN)

### ⚠️ Limitations:
- **NOT for Jupyter** (requires browser environment + AudioContext)
- **NOT for Node.js** (requires DOM)
- **NOT for Deno** (requires browser globals)

### Usage Examples

#### Browser (HTML file):
```html
<script type="module">
  import jm from 'https://esm.sh/@jmon/algo';
  import * as Tone from 'https://esm.sh/tone@14.8.49';

  const composition = {
    tempo: 120,
    tracks: [{
      notes: [
        { pitch: 60, duration: 1, time: 0 }
      ]
    }]
  };

  const player = await jm.play(composition, { Tone, autoplay: false });
  document.body.appendChild(player);
</script>
```

#### Observable Classic:
```js
jm = await import("https://esm.sh/@jmon/algo")
Tone = await import("https://esm.sh/tone@14.8.49")

composition = {
  tempo: 120,
  tracks: [{ notes: [{ pitch: 60, duration: 1 }] }]
}

jm.default.play(composition, { Tone, autoplay: false })
```

#### Observable 2.0 (HTML Notebooks):
```html
<notebook>
  <script type="module" pinned>
    import jm from "../src/index.js";
    import * as Tone from "npm:tone";
  </script>

  <script type="module">
    const composition = { /* ... */ };
    const player = await jm.play(composition, { Tone });
    display(player);
  </script>
</notebook>
```

---

## 2. Score Renderer Compatibility

### Implementation
- **File:** `src/browser/score-renderer.js`
- **Format:** JMON → MusicXML → SVG (via Verovio)
- **Dependencies:** Verovio (must be provided)

### ✅ Works In:
1. **Browser** (with Verovio WASM)
2. **Observable Classic** (via esm.sh)
3. **Observable 2.0** (HTML notebooks)
4. **Deno** (with DOM shim)

### ⚠️ Score Rendering Reliability Issues

#### Known Issues:
1. **Measure Splitting** (lines 177-278)
   - Complex logic for notes crossing measure boundaries
   - Floating point precision issues (uses 0.001 tolerance)
   - May produce incorrect rhythms for edge cases

2. **Rest Filling** (lines 191-222, 256-271)
   - Automatic rest insertion between notes
   - Can create unexpected rests with imprecise timing

3. **Duration Type Mapping** (lines 310-317)
   - Simple threshold-based (whole/half/quarter/eighth/16th/32nd)
   - No support for dotted notes
   - No support for tuplets

4. **Chord Handling** (lines 127-145)
   - Works for simple chords
   - No voice leading or stem direction

#### Reliability Score: **7/10**
- ✅ Works for simple melodies (4/4, regular rhythms)
- ✅ Handles multiple tracks
- ✅ Proper clef, key, time signature
- ⚠️ Struggles with complex rhythms
- ⚠️ No tuplet support
- ⚠️ No dotted notes
- ❌ No ties or slurs (except automatic at measure boundaries)

### Usage Examples

#### Observable Classic:
```js
jm = await import("https://esm.sh/@jmon/algo")
verovio = await import("https://esm.sh/verovio@4.3.1/wasm")

composition = {
  tempo: 120,
  timeSignature: '4/4',
  keySignature: 'C',
  tracks: [{
    label: 'Melody',
    notes: [
      { pitch: 60, duration: 1, time: 0 },
      { pitch: 62, duration: 1, time: 1 }
    ]
  }]
}

jm.default.score(composition, { verovio, scale: 40 })
```

#### Observable 2.0 (HTML Notebooks):
```html
<script type="module" pinned>
  import jm from "../src/index.js";
  import verovio from "npm:verovio@4.3.1/wasm";
</script>

<script type="module">
  const composition = { /* ... */ };
  const score = await jm.score(composition, { verovio, scale: 40 });
  display(score);
</script>
```

---

## 3. Jupyter Compatibility

### ⚠️ Limited Support

**What Works:**
- ✅ Theory utilities (scales, chords, progressions)
- ✅ Generative algorithms (cellular automata, fractals, etc.)
- ✅ Converters (MIDI, ABC, SuperCollider)
- ✅ Analysis tools

**What DOESN'T Work:**
- ❌ `jm.play()` - Requires AudioContext (browser only)
- ❌ `jm.score()` - Requires DOM
- ❌ `jm.render()` - Browser-only UI

**Workaround for Jupyter:**
```python
# In Jupyter, use converters to export
from IPython.display import Audio, display
import subprocess

# Use MIDI converter
composition = {"tempo": 120, "tracks": [...]}

# Export via command line
subprocess.run(["node", "-e", """
const jm = require('@jmon/algo');
const fs = require('fs');
const composition = %s;
const midiData = jm.converters.midi(composition);
fs.writeFileSync('output.mid', Buffer.from(midiData));
""" % json.dumps(composition)])

# Display in Jupyter
Audio('output.mid')
```

---

## 4. Environment Compatibility Matrix

| Feature | Browser | Observable Classic | Observable 2.0 | Jupyter | Deno | Node.js |
|---------|---------|-------------------|----------------|---------|------|---------|
| **Theory** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Generative** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Converters** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Player** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Score** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| **MIDI Export** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **WAV Export** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

Legend:
- ✅ Fully supported
- ⚠️ Requires workarounds
- ❌ Not supported

---

## 5. Score Rendering Recommendations

### For Reliable Scores:
1. **Use Simple Rhythms**
   - Stick to whole, half, quarter, eighth notes
   - Avoid complex syncopation
   - Use regular measures (4/4 preferred)

2. **Explicit Timing**
   - Always specify `time` for each note
   - Use precise values (e.g., 0, 1, 2, not 0.333)

3. **Test Before Publishing**
   ```js
   // Test your composition
   const composition = { /* your music */ };
   const score = await jm.score(composition, { verovio });

   // Inspect MusicXML if issues
   const musicXML = jmonToMusicXML(composition);
   console.log(musicXML);
   ```

### For Production Use:
Consider using ABC notation for complex scores:
```js
const abcNotation = jm.converters.abc(composition);
// Then use abcjs for rendering (more mature)
```

---

## 6. Testing Checklist

### Player Testing:
- [ ] Loads without errors
- [ ] Play button works
- [ ] Stop button works
- [ ] Timeline scrubbing works
- [ ] Multiple tracks play together
- [ ] Tempo is correct
- [ ] Notes sound at correct pitch
- [ ] Microtuning works (if using Corruptor)

### Score Testing:
- [ ] Renders without errors
- [ ] Correct time signature displayed
- [ ] Correct key signature displayed
- [ ] Notes on correct pitches
- [ ] Rhythms look correct
- [ ] Multiple tracks shown as separate staves
- [ ] Clefs are appropriate
- [ ] Measures are properly barred

---

## 7. Known Bugs & Workarounds

### Bug: Floating Point Rest Errors
**Issue:** Rests appear where they shouldn't due to floating point precision

**Workaround:**
```js
// Round note times to 3 decimal places
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

### Bug: Notes Across Measure Boundaries
**Issue:** Long notes split incorrectly at measure boundaries

**Workaround:**
```js
// Keep notes within measure boundaries
const maxNoteDuration = 4; // 4 quarter notes = 1 measure in 4/4
const safeDuration = Math.min(note.duration, maxNoteDuration);
```

---

## 8. Future Improvements

### Score Renderer:
1. Add dotted note support
2. Add tuplet support (triplets, quintuplets)
3. Add tie/slur rendering
4. Add articulation marks (staccato, accent, etc.)
5. Improve measure-splitting algorithm
6. Add grace notes support

### Player:
1. Add loop region selection
2. Add tempo adjustment in UI
3. Add volume controls per track
4. Add solo/mute buttons
5. Add export to WAV button
6. Add metronome toggle

---

## Summary

**Player:** ✅ Production-ready for browser environments
**Score:** ⚠️ Good for simple music, limited for complex scores

Use the score renderer for:
- Simple melodies and chord progressions
- Educational materials
- Quick visualizations

For complex scores:
- Export to ABC notation → use abcjs
- Export to MIDI → use MuseScore
- Export to MusicXML → use external renderer
