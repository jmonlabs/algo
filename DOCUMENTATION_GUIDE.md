# Documentation Guide for @jmon/algo

## Where to Insert JSDoc in JavaScript

JSDoc comments go **directly above** the function, class, or variable you're documenting.

### ✅ Correct Placement

```javascript
/**
 * Generate a musical scale.
 *
 * @param {string} root - Root note (e.g., 'C', 'D#')
 * @param {string} scaleName - Scale type (e.g., 'major', 'minor')
 * @returns {Array<number>} Array of MIDI note numbers
 *
 * @example
 * const scale = generate('C', 'major');
 * // Returns: [60, 62, 64, 65, 67, 69, 71, 72]
 */
function generate(root, scaleName) {
  // implementation
}
```

### ❌ Incorrect Placement

```javascript
// DON'T: Inside the function
function generate(root, scaleName) {
  /**
   * This won't be picked up by JSDoc
   */
  // implementation
}

// DON'T: Far away from the function
/**
 * Generate a scale
 */

// Some other code here...

function generate(root, scaleName) {
  // JSDoc won't associate with this
}
```

---

## JSDoc Best Practices for @jmon/algo

### 1. Function Documentation

```javascript
/**
 * Brief one-line description.
 *
 * Longer description with more details. Can span multiple
 * paragraphs if needed.
 *
 * @param {Type} paramName - Description
 * @param {Type} [optionalParam] - Optional parameter (square brackets)
 * @param {Type} [optionalParam=defaultValue] - Optional with default
 * @returns {Type} What the function returns
 * @throws {Error} When it might throw an error
 *
 * @example
 * // Example usage
 * const result = myFunction('input', 42);
 *
 * @example
 * // Another example
 * const result2 = myFunction('other');
 */
function myFunction(paramName, optionalParam = null) {
  // implementation
}
```

### 2. Class Documentation

```javascript
/**
 * Represents a musical scale generator.
 *
 * This class provides methods for generating scales in various
 * modes and keys.
 *
 * @class
 * @example
 * const generator = new ScaleGenerator('C');
 * const major = generator.major();
 */
class ScaleGenerator {
  /**
   * Create a scale generator.
   *
   * @param {string} root - Root note
   */
  constructor(root) {
    this.root = root;
  }

  /**
   * Generate major scale.
   *
   * @returns {Array<number>} MIDI note numbers
   */
  major() {
    // implementation
  }
}
```

### 3. Object/Type Documentation

```javascript
/**
 * @typedef {Object} JmonNote
 * @property {number} pitch - MIDI pitch (0-127)
 * @property {number} duration - Duration in quarter notes
 * @property {number} [time] - Start time in quarter notes
 * @property {number} [velocity=0.8] - Velocity (0-1)
 * @property {number} [microtuning] - Microtuning in semitones
 */

/**
 * Create a note.
 *
 * @param {number} pitch - MIDI pitch
 * @returns {JmonNote} A JMON note object
 */
function createNote(pitch) {
  return { pitch, duration: 1, time: 0, velocity: 0.8 };
}
```

### 4. Constants Documentation

```javascript
/**
 * Standard MIDI note number for middle C.
 * @constant {number}
 * @default 60
 */
const MIDDLE_C = 60;

/**
 * Available scale types.
 * @enum {string}
 */
const ScaleType = {
  /** Major scale (Ionian mode) */
  MAJOR: 'major',
  /** Natural minor scale (Aeolian mode) */
  MINOR: 'minor',
  /** Harmonic minor scale */
  HARMONIC_MINOR: 'harmonic-minor'
};
```

### 5. Module/File Documentation

```javascript
/**
 * Scale generation utilities.
 *
 * This module provides functions for generating musical scales
 * in various modes and keys.
 *
 * @module theory/scale
 * @author JMON Labs
 */

// Functions in this module...
```

---

## Documentation Generation Tools

### 1. JSDoc (Recommended)

**Install:**
```bash
npm install --save-dev jsdoc
```

**Configure:** Create `jsdoc.json`:
```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".+\\.js(doc|x)?$",
    "excludePattern": "(node_modules|dist|tests)"
  },
  "opts": {
    "template": "node_modules/docdash",
    "encoding": "utf8",
    "destination": "./docs/",
    "recurse": true,
    "readme": "./README.md"
  },
  "plugins": ["plugins/markdown"],
  "templates": {
    "cleverLinks": true,
    "monospaceLinks": false
  }
}
```

**Generate:**
```bash
npx jsdoc -c jsdoc.json
```

**With Better Template (Docdash):**
```bash
npm install --save-dev docdash
npx jsdoc -c jsdoc.json
```

### 2. Documentation.js

**Install:**
```bash
npm install --save-dev documentation
```

**Generate HTML:**
```bash
npx documentation build src/** -f html -o docs
```

**Generate Markdown:**
```bash
npx documentation build src/** -f md > API.md
```

### 3. TypeDoc (for TypeScript-style JSDoc)

**Install:**
```bash
npm install --save-dev typedoc
```

**Generate:**
```bash
npx typedoc --entryPointStrategy expand src
```

---

## Recommended Setup for @jmon/algo

### Option A: JSDoc + Docdash (Easiest)

1. **Install:**
```bash
npm install --save-dev jsdoc docdash
```

2. **Create jsdoc.json:**
```json
{
  "source": {
    "include": ["src"],
    "exclude": ["src/browser", "tests"]
  },
  "opts": {
    "template": "node_modules/docdash",
    "destination": "./docs/api",
    "recurse": true,
    "readme": "./README.md"
  },
  "templates": {
    "default": {
      "staticFiles": {
        "include": ["./examples"]
      }
    }
  }
}
```

3. **Add npm script to package.json:**
```json
{
  "scripts": {
    "docs": "jsdoc -c jsdoc.json",
    "docs:serve": "npx serve docs/api"
  }
}
```

4. **Generate:**
```bash
npm run docs
npm run docs:serve
```

### Option B: Documentation.js (Modern)

1. **Install:**
```bash
npm install --save-dev documentation
```

2. **Add script:**
```json
{
  "scripts": {
    "docs": "documentation build src/** -f html -o docs --theme node_modules/documentation-theme-light",
    "docs:md": "documentation build src/** -f md --markdown-toc > API.md"
  }
}
```

3. **Generate:**
```bash
npm run docs
```

---

## Documentation Hosting Options

### 1. GitHub Pages (Free)

```bash
# Build docs
npm run docs

# Create gh-pages branch
git checkout -b gh-pages
git add docs/
git commit -m "Add documentation"
git push origin gh-pages

# Enable GitHub Pages in repo settings → Pages → Source: gh-pages
```

### 2. Netlify (Free)

```bash
# Build docs to docs/ folder
npm run docs

# Create netlify.toml
cat > netlify.toml << EOF
[build]
  publish = "docs"
EOF

# Deploy
npx netlify deploy --prod
```

### 3. Vercel (Free)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 4. JSR Docs (Automatic for JSR packages)

JSR automatically generates documentation from JSDoc comments when you publish. No setup needed!

```bash
deno publish
# Docs available at: https://jsr.io/@jmon/algo/doc
```

---

## Improving Current Documentation

### Current State Analysis

**Strengths:**
- ✅ Many functions have JSDoc comments
- ✅ Type annotations present
- ✅ Examples in some places

**Weaknesses:**
- ⚠️ Inconsistent formatting
- ⚠️ Missing @example tags in many places
- ⚠️ No @module tags
- ⚠️ No @typedef for complex objects
- ⚠️ Browser code not excluded from docs

### Quick Wins

1. **Add Module Tags:**
```javascript
// At top of each major file
/**
 * @module algorithms/theory/scale
 */
```

2. **Add Type Definitions:**
```javascript
/**
 * @typedef {Object} JmonComposition
 * @property {string} format - Always "jmon"
 * @property {string} version - JMON version
 * @property {number} tempo - Tempo in BPM
 * @property {Array<JmonTrack>} tracks - Musical tracks
 */
```

3. **Add Examples:**
```javascript
/**
 * @example
 * const scale = generate('C', 'major');
 * console.log(scale); // [60, 62, 64, 65, 67, 69, 71, 72]
 */
```

4. **Exclude Browser Code:**
```json
{
  "source": {
    "exclude": ["src/browser", "src/**/__tests__"]
  }
}
```

---

## Interactive Documentation with Examples

### Using Observable Notebooks

Create an Observable notebook that imports your package and demonstrates usage:

```js
// @jmon/algo Documentation
jm = await import("https://esm.sh/@jmon/algo")

// Example: Generate a scale
scale = jm.default.theory.scale.generate('C', 'major')

// Example: Create a progression
progression = jm.default.theory.chord.progression('C', ['I', 'IV', 'V', 'I'])
```

**Benefits:**
- Live, runnable examples
- Can play music directly
- Easy to share
- No build step

**How to Create:**
1. Go to observablehq.com
2. Create new notebook
3. Import your package
4. Add examples
5. Publish

---

## Example: Documenting a Complete Module

```javascript
/**
 * Musical scale generation and manipulation.
 *
 * This module provides utilities for working with musical scales including
 * generation, transposition, and mode rotation.
 *
 * @module theory/scale
 * @author JMON Labs
 */

/**
 * Scale intervals in semitones.
 * @typedef {Array<number>} ScalePattern
 * @example
 * // Major scale pattern
 * [2, 2, 1, 2, 2, 2, 1]
 */

/**
 * Scale definition with notes and metadata.
 * @typedef {Object} Scale
 * @property {Array<number>} notes - MIDI note numbers
 * @property {string} root - Root note name
 * @property {string} name - Scale name
 * @property {ScalePattern} pattern - Interval pattern
 */

/**
 * Available scale types.
 * @enum {string}
 */
export const SCALE_TYPES = {
  MAJOR: 'major',
  MINOR: 'minor',
  DORIAN: 'dorian',
  PHRYGIAN: 'phrygian'
};

/**
 * Generate a musical scale.
 *
 * Creates an array of MIDI note numbers representing the specified scale
 * starting from the given root note.
 *
 * @param {string} root - Root note (e.g., 'C', 'D#', 'Bb')
 * @param {string} scaleName - Scale type (from SCALE_TYPES)
 * @param {number} [octave=4] - Starting octave (0-10)
 * @returns {Scale} Scale object with notes and metadata
 * @throws {Error} If root note or scale name is invalid
 *
 * @example
 * // Generate C major scale
 * const scale = generate('C', 'major');
 * console.log(scale.notes);
 * // [60, 62, 64, 65, 67, 69, 71, 72]
 *
 * @example
 * // Generate D minor scale in octave 5
 * const scale = generate('D', 'minor', 5);
 * console.log(scale.notes);
 * // [74, 76, 77, 79, 81, 82, 84, 86]
 */
export function generate(root, scaleName, octave = 4) {
  // Implementation...
}
```

---

## Summary

**Best Tool:** JSDoc + Docdash
**Easiest Hosting:** GitHub Pages
**For JSR:** Automatic (just add good JSDoc)
**For Interactive Examples:** Observable notebooks

**Quick Start:**
```bash
npm install --save-dev jsdoc docdash
npx jsdoc -c jsdoc.json
npx serve docs/api
```
