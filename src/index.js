/**
 * JMON Studio entrypoint
 * Exposes a unified `jm` API consumed by build and tests.
 *
 * This file intentionally avoids side-effects at module top-level so it can
 * be safely imported in Node test environments and browser bundles.
 */

import { JmonValidator } from "./utils/jmon-validator.js";
import algorithms from "./algorithms/index.js";
import {
  midi,
  midiBytes,
  midiBase64,
  midiDisplay,
  midiPlayer,
  midiToJmon,
  supercollider,
  tonejs,
  wav,
  downloadWav,
  musicxml,
  downloadMusicXML,
} from "./converters/index.js";
import * as jmonUtils from "./utils/jmon-utils.js";
import { drumKits, registerDrumKit, getDrumKit } from "./utils/drumkits.js";
import * as audioGraphModule from "./audioGraph/index.js";
import * as scoreRenderer from "./browser/score-renderer.js";
import { scoreSVG as pureScoreSVG } from "./score.js";
import * as env from "./env.js";
// notebook-player.js is loaded lazily so headless callers don't pay for
// it up front and browser callers never touch it.

// Lazy-load browser player
let createPlayer;
async function __loadPlayer() {
  if (!createPlayer) {
    const playerModule = await import("./browser/music-player.js");
    createPlayer = playerModule.createPlayer;
  }
  return createPlayer;
}

/**
 * GM instrument helpers, loaded lazily so importing `jm` does not pull in the
 * 128-program table.
 *
 * The helpers are copied *onto this object*, which is the one `jm.instruments`
 * spreads. Assigning to module-level `let` bindings instead — as this did —
 * left `jm.instruments.GM_INSTRUMENTS` undefined forever, because the object
 * literal captured their values before `load()` ever ran.
 */
const __gmHelpers = {};

const __GM_EXPORTS = [
  "GM_INSTRUMENTS",
  "createGMInstrumentNode",
  "findGMProgramByName",
  "generateSamplerUrls",
  "getPopularInstruments",
  // Sample source: probed once per session across CDN_SOURCES, or pinned to
  // your own mirror with setSoundfontBase(url).
  "CDN_SOURCES",
  "getSoundfontBase",
  "setSoundfontBase",
  "resolveSoundfontBase",
  // The 3.19 s ceiling on every FluidR3 sample, and the beat count it buys.
  "GM_SAMPLE_SECONDS",
  "gmMaxBeats",
];

/** Lazy-load GM instrument helpers. Cached after the first call. */
async function __loadGmInstruments() {
  if (!__gmHelpers.GM_INSTRUMENTS) {
    const gm = await import("./utils/gm-instruments.js");
    for (const name of __GM_EXPORTS) __gmHelpers[name] = gm[name];
    // Also onto the namespace itself, so `jm.instruments.setSoundfontBase(...)`
    // reads the way the docs write it.
    Object.assign(jm.instruments, __gmHelpers);
  }
  return __gmHelpers;
}

/**
 * Minimal validation/normalization entry
 */
function validateJmon(obj) {
  const validator = new JmonValidator();
  return validator.validateAndNormalize(obj);
}

/**
 * Render a player UI (browser environments)
 */
async function render(jmonObj, options = {}) {
  if (!jmonObj || typeof jmonObj !== "object") {
    throw new Error("render() requires a valid JMON object");
  }
  const player = await __loadPlayer();
  return player(jmonObj, options);
}

/**
 * Play a composition. Single entry point — picks the right backend
 * automatically based on the environment:
 *
 *   - **Browser (with DOM):** Tone.js-backed live player. Preserves the
 *     full JMON feature set: per-track synths, audioGraph, effects,
 *     articulations, microtuning, glissando, vibrato. Requires Tone.js
 *     (either passed in `options.Tone` or auto-loaded from a CDN).
 *     Returns an `HTMLElement` you can append to the page.
 *
 *   - **Notebook / headless (no DOM):** exports the composition to MIDI
 *     and returns an iframe bundle embedding the `html-midi-player` web
 *     component (Magenta + Tone.js + GM SoundFont, loaded from a CDN).
 *     Works in Deno Jupyter, JupyterLab, nteract, Observable, Colab, and
 *     VS Code notebooks. Note: features that don't round-trip through
 *     Standard MIDI File (microtuning, custom synths, effects) are lost
 *     in this path — use the browser path for full fidelity.
 *
 * @param {Object} jmonObj - The JMON composition to play
 * @param {Object} [options]
 * @param {Object} [options.Tone] - Tone.js instance (browser path only)
 * @param {boolean} [options.autoplay=false] - Start playback immediately
 *   (browser path only)
 * @param {boolean} [options.visualizer=true] - Show piano-roll visualizer
 *   (notebook path only)
 * @param {string} [options.soundFont] - SoundFont URL (notebook path only)
 * @returns {HTMLElement | Object | Promise<HTMLElement>} Browser path:
 *   an HTMLElement (or Promise thereof on first load). Notebook path: a
 *   displayable MIME bundle that the kernel renders inline.
 *
 * @example
 * // Notebook (one liner, no imports beyond jm)
 * await jm.play(composition);
 *
 * @example
 * // Browser with Tone.js (Tone is a live module)
 * import * as Tone from "tone";
 * document.body.appendChild(await jm.play(composition, { Tone }));
 *
 * @example
 * // Notebook / headless (Tone is a URL string — the iframe loads it)
 * await jm.play(composition, {
 *   Tone: "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js"
 * });
 */
function play(jmonObj, options = {}) {
  // Headless path (notebook kernel, Deno, Node, anywhere without `document`):
  // return an iframe that embeds the REAL Tone.js player via the
  // notebookPlayer helper. The iframe loads the jmon/algo ESM source from
  // jsDelivr and runs `jm.play()` in a browser context where `isBrowser()`
  // is true, so the full music-player.js code executes — preserving all
  // JMON features (per-track synths, audioGraph, effects, vibrato,
  // glissando, microtuning). Callers use `await jm.play(...)` either way.
  if (!env.isBrowser()) {
    return (async () => {
      const { notebookPlayer } = await import("./notebook-player.js");
      const bundle = await notebookPlayer(jmonObj, options);
      return env.hasDisplay() ? env.displayable(bundle) : bundle;
    })();
  }

  // Browser path: use the full Tone.js-backed player. This preserves the
  // JMON feature set that Standard MIDI File can't carry — microtuning,
  // glissando, vibrato, per-track synths, custom audio graphs — at the
  // cost of requiring Tone.js to be available (or loadable from a CDN).
  const { Tone: externalTone, autoplay = false, ...otherOptions } = options;
  const playOptions = { Tone: externalTone, autoplay, ...otherOptions };

  const toneAvailable = externalTone || (typeof globalThis !== 'undefined' && globalThis.Tone) || (typeof globalThis.Tone !== 'undefined' ? globalThis.Tone : null);
  const needsAsync = !toneAvailable || autoplay || playOptions.preloadTone;

  if (!needsAsync && toneAvailable) {
    if (!createPlayer) {
      return (async () => {
        const playerModule = await import("./browser/music-player.js");
        createPlayer = playerModule.createPlayer;
        return createPlayer(jmonObj, playOptions);
      })();
    }
    return createPlayer(jmonObj, playOptions);
  }

  return (async () => {
    const player = await __loadPlayer();
    return player(jmonObj, playOptions);
  })();
}

/**
 * Render sheet music notation using Verovio.
 *
 * Environment behavior:
 *   - In a browser (DOM present): returns an `HTMLElement` wrapping the SVG.
 *   - In a notebook kernel (globalThis.display present): returns the SVG
 *     string *and* routes it through `present()` so nteract/Deno/Jupyter
 *     render it inline automatically.
 *   - In plain Node/Deno (no DOM, no display): returns the SVG string.
 *
 * @param {Object} jmonObj - The JMON composition to render
 * @param {Object} options - Rendering options (see src/score.js scoreSVG)
 * @returns {Promise<HTMLElement|string>}
 *
 * @example
 * // Browser (npm bundler)
 * import verovio from "verovio/wasm";
 * import { VerovioToolkit } from "verovio";
 * const el = await jm.score(composition, { verovio, VerovioToolkit });
 *
 * @example
 * // Deno / notebook — use the self-contained CDN bundle (avoids Deno's
 * // npm: WASM-loader quirks):
 * const v = await import("https://www.verovio.org/javascript/5.6.0/verovio-toolkit-wasm.js");
 * await jm.score(composition, { toolkit: new v.default.toolkit() });
 *
 * @example
 * // Headless — get the raw SVG string
 * const { svg } = await jm.scoreSVG(composition, { toolkit });
 */
async function score(jmonObj, options = {}) {
  // Browser: return the live DOM element (caller decides what to do with it).
  if (env.isBrowser()) {
    return scoreRenderer.score(jmonObj, options);
  }

  // Headless: render every page of the score and return a displayable
  // wrapper. When the cell's last expression is `await jm.score(...)`,
  // the kernel sees the Symbol.for("Jupyter.display") on the wrapper and
  // renders the HTML inline.
  //
  // We return `text/html` (not raw image/svg+xml) so we can wrap the SVGs
  // in a responsive container that stacks multi-page scores vertically.
  // Jupyter's MIME renderer ranks text/html above image/svg+xml, so this
  // takes precedence. The first page's raw SVG is still included for
  // hosts that prefer a single-page vector.
  const { svg, svgs, pages } = await pureScoreSVG(jmonObj, options);
  if (env.hasDisplay()) {
    return env.displayable({
      "text/html": wrapScoreHtml(svgs),
      "image/svg+xml": svg,
      "text/plain": `[score: ${pages} page${pages === 1 ? "" : "s"}]`,
    });
  }
  return svg;
}

/**
 * Wrap one or more Verovio-rendered responsive SVGs in a container that
 * fills the cell width. Each SVG already carries `width="100%"` as an
 * attribute, so we just need a block-level wrapper with a small vertical
 * gap between pages for multi-page scores.
 */
function wrapScoreHtml(svgs) {
  const pages = Array.isArray(svgs) ? svgs : [svgs];
  const pageHtml = pages
    .map((s, i) =>
      '<div style="margin:' +
      (i === 0 ? "0" : "12px 0 0 0") +
      '">' + s + "</div>"
    )
    .join("");
  return (
    '<div style="width:100%;max-width:100%;overflow-x:auto;line-height:0">' +
    pageHtml +
    "</div>"
  );
}

/**
 * Pure, DOM-free score rendering. Returns `{ svg, mei, musicxml }`.
 * Use this from Node/Deno scripts, test suites, or anywhere you need
 * the raw notation payload rather than a DOM element.
 */
function scoreSVG(jmonObj, options = {}) {
  return pureScoreSVG(jmonObj, options);
}

// Compose the jm API object expected by build and tests
const jm = {
  // Core
  render,
  play,
  score,
  scoreSVG,
  validate: validateJmon,

  // Key context — set tonic/mode once and produce harmony objects
  // (Scale, Voice, Ornament, Progression, chord(s)) without repeating
  // `{tonic, mode}` at every call site.
  //
  //   const k = jm.key('C', 'major');
  //   k.scale().generate({ length: 8 });
  //   k.voice({ measureLength: 4, output: 'track' }).generate(melody);
  //   k.ornament({ type: 'trill', parameters: { by: 1 } }).apply(notes, 0);
  key: (tonic, mode) => algorithms.theory.harmony.key(tonic, mode),

  // Environment helpers (isBrowser, hasDisplay, present, ...)
  env,

  // Converters
  converters: {
    midi,
    midiBytes,
    midiBase64,
    midiDisplay,
    midiPlayer,
    midiToJmon,
    tonejs,
    wav,
    downloadWav,
    musicxml,
    downloadMusicXML,
    supercollider,
  },

  // Namespaces from algorithms
  theory: algorithms.theory,
  generative: algorithms.generative,
  processors: algorithms.processors,
  analysis: algorithms.analysis,
  constants: algorithms.constants,
  audio: algorithms.audio,

  // Utils
  utils: {
    ...algorithms.utils,
    ...jmonUtils,
    JmonValidator,
  },

  // audioGraph — pre-built fragments to splice into a piece's audioGraph.
  // Master mastering chains: jm.audioGraph.master.lush, .warm, .dark, etc.
  // Splice manually with vanilla JS:
  //   piece.audioGraph = [
  //     ...piece.audioGraph.map(n => n.target === "destination"
  //       ? { ...n, target: "master_lowshelf" } : n),
  //     ...jm.audioGraph.master.lush,
  //   ];
  audioGraph: audioGraphModule,

  // Instruments (optional; may be undefined in non-browser builds)
  instruments: {
    // Lazy loader to initialize GM instrument helpers on demand
    // Usage: await jm.instruments.load()
    load: __loadGmInstruments,
    // These remain undefined until load() is called in environments where
    // gm-instruments are not preloaded.
    // Populated in place by load(); empty until then.
    helpers: __gmHelpers,
    // Drum kits — registry is mutable, register custom kits with
    // jm.instruments.registerDrumKit(name, { baseUrl, samples }).
    drumKits,
    registerDrumKit,
    getDrumKit,
  },

  // Keep in step with package.json; tests/converters asserts they match.
  VERSION: "1.2.0",
};

// Named and default exports
export { jm };
export const audio = algorithms.audio;
export default jm;
