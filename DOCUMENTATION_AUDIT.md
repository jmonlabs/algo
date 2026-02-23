# Documentation Audit: Critical Inconsistencies

## Summary
The package documentation has severe inconsistencies regarding which music rendering library is used. The **actual code uses Verovio**, but documentation incorrectly references ABCjs.

---

## Findings

### 1. **Actual Implementation** ✅
- **File**: `src/browser/score-renderer.js:422`
- **Uses**: `verovio` exclusively
- **Import**: `import verovio from "npm:verovio@4.3.1/wasm"`
- **Method**: Converts JMON → MusicXML → Verovio rendering

### 2. **Package Dependencies** ✅
- **File**: `package.json:72`
- **Dependency**: `"verovio": "^5.6.0"` ✅
- **NO ABCjs dependency** ❌

### 3. **Code Documentation** ❌ WRONG
- **File**: `src/index.js:151`
- **JSDoc example**:
  ```javascript
  const svg = jm.score(composition, { ABCJS, width: 938, scale: 0.6 });
  ```
- **Problem**: Says to use `ABCJS` but implementation only accepts `verovio`

### 4. **User Guide HTML Files** ❌ WRONG
- **Files**: All files in `userguide/`
  - `01-getting-started.html`
  - `02-harmony.html`
  - `03-loops.html`
  - `04-minimalism.html`
  - `05-minimalism.html`
  - `live-coding.html`
- **All import**: `import * as ABCJS from "npm:abcjs";`
- **Problem**: ABCjs is NOT a package dependency and NOT used in the library

### 5. **Observable Guide** ⚠️ MISLEADING
- **File**: `OBSERVABLE_GUIDE.md:24-27`
- **Shows both**:
  ```javascript
  // For score rendering
  verovio = await import("https://esm.sh/verovio@4.3.1/wasm")

  // For ABC notation rendering
  ABCJS = await import("https://esm.sh/abcjs")
  ```
- **Problem**: Implies both are options, but only verovio works

### 6. **Observable Guide Examples** ⚠️ CORRECT BUT CONFUSING
- **File**: `OBSERVABLE_GUIDE.md:59`
- **Example**: `jm.default.score(composition, { verovio, scale: 40 })`
- **Status**: Correct, but contradicts earlier mention of ABCjs

---

## What Actually Works

```javascript
// ✅ CORRECT - This is what the code actually does
import verovio from "npm:verovio@4.3.1/wasm"
jm.score(composition, { verovio, scale: 40 })
```

```javascript
// ❌ WRONG - This is what the docs say but doesn't work
import * as ABCJS from "npm:abcjs"
jm.score(composition, { ABCJS, width: 938, scale: 0.6 })
```

---

## Required Fixes

### Priority 1: Fix Code Documentation
**File**: `src/index.js:151`
```diff
- * const svg = jm.score(composition, { ABCJS, width: 938, scale: 0.6 });
+ * const svg = await jm.score(composition, { verovio, scale: 40 });
```

### Priority 2: Fix User Guide Files
**Files**: All `userguide/*.html` files
- Remove: `import * as ABCJS from "npm:abcjs";`
- Add: `import verovio from "npm:verovio@4.3.1/wasm";`
- Update all score rendering examples to use verovio

### Priority 3: Clarify Observable Guide
**File**: `OBSERVABLE_GUIDE.md`
- Remove ABCjs from dependencies section
- Only document verovio as the rendering option
- OR: Add actual ABCjs support to the library (more complex)

### Priority 4: Update README
Check if README.md has similar inconsistencies

---

## Decision Required

**Two options:**

### Option A: Standardize on Verovio (Recommended)
- Remove all ABCjs references from docs
- Update all examples to use verovio
- Keep verovio as the sole dependency
- **Pros**: Matches current implementation
- **Cons**: None, this is what already works

### Option B: Add ABCjs Support
- Add abcjs as a dependency
- Implement ABCjs rendering alongside Verovio
- Allow users to choose either
- **Pros**: More flexibility
- **Cons**: More code, more testing, more maintenance

---

## Impact

**Users affected**: Anyone following the docs will fail because:
1. ABCjs is not installed as a dependency
2. The score() function doesn't accept ABCJS parameter
3. Examples won't work as documented

**Why this matters**:
- Package is fundamentally broken for new users
- Documentation contradicts implementation
- Examples fail immediately on first try
