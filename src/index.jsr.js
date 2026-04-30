/**
 * JSR (Deno) entry point for algo
 * Excludes browser-specific functionality (render/play) that requires CDN imports
 *
 * JSR users can access:
 * - algorithms (theory, generative, analysis, audio, visualization)
 * - converters (midi, tonejs, wav, supercollider, musicxml)
 * - utils and constants
 * - validation
 */

import { JmonValidator } from "./utils/jmon-validator.browser.js";
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
  musicxml,
} from "./converters/index.js";
import * as jmonUtils from "./utils/jmon-utils.js";
import { scoreSVG } from "./score.js";
import { notebookPlayer } from "./notebook-player.js";
import * as env from "./env.js";

/**
 * Play a composition in a notebook kernel. Spawns the REAL Tone.js player
 * inside an iframe — full JMON fidelity (per-track synths, audioGraph,
 * effects, vibrato, glissando, microtuning) is preserved by reusing the
 * browser music-player code inside the iframe's browser context.
 *
 * The caller **must** provide a Tone.js URL via `options.Tone`. jmon/algo
 * does not pick a CDN for you — same pattern as `jm.score({toolkit})`.
 *
 * @param {Object} jmonObj - The JMON composition to play
 * @param {Object} options
 * @param {string} options.Tone - **Required.** URL of a Tone.js UMD script
 * @returns {Promise<Object>} Displayable MIME bundle
 *
 * @example
 * await jm.play(composition, {
 *   Tone: "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js"
 * });
 */
async function play(jmonObj, options = {}) {
  const bundle = await notebookPlayer(jmonObj, options);
  return env.hasDisplay() ? env.displayable(bundle) : bundle;
}

/**
 * Headless score helper. Renders to SVG and, when running in a notebook
 * kernel with `globalThis.display`, auto-forwards the SVG to the host.
 * Returns the SVG string either way.
 */
async function score(jmonObj, options = {}) {
  const { svg, svgs, pages } = await scoreSVG(jmonObj, options);
  // Return a displayable text/html bundle so we can wrap the SVGs in a
  // responsive container and stack all pages vertically. Jupyter prefers
  // text/html over image/svg+xml, so the wrapped version takes precedence;
  // first-page raw SVG is still included for hosts that prefer it. Use
  // `jm.scoreSVG()` for the raw string array.
  if (env.hasDisplay()) {
    return env.displayable({
      "text/html": wrapScoreHtml(svgs),
      "image/svg+xml": svg,
      "text/plain": `[score: ${pages} page${pages === 1 ? "" : "s"}]`,
    });
  }
  return svg;
}

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
 * Validates and normalizes a JMON object.
 *
 * @param {Object} obj - The JMON object to validate
 * @returns {Object} Validated and normalized JMON object
 *
 * @example
 * ```ts
 * const validated = validateJmon({
 *   format: 'jmon',
 *   version: '1.0',
 *   sequences: []
 * });
 * ```
 */
function validateJmon(obj) {
  const validator = new JmonValidator();
  return validator.validateAndNormalize(obj);
}

/**
 * Main JMON API object providing access to all music composition and analysis tools.
 *
 * @property {Function} validate - Validate and normalize JMON objects
 * @property {Object} converters - Format conversion utilities (MIDI, ToneJS, WAV, MusicXML, etc.)
 * @property {Object} theory - Music theory utilities (scales, chords, progressions)
 * @property {Object} generative - Generative composition algorithms
 * @property {Object} analysis - Music analysis tools
 * @property {Object} constants - Musical constants and reference data
 * @property {Object} audio - Audio processing utilities
 * @property {Object} visualization - Visualization tools for algorithms
 * @property {Object} utils - Utility functions and helpers
 * @property {string} VERSION - Library version number
 *
 * @remarks
 * Note: render() and play() functions are not available in the JSR package.
 * These require the npm package for full browser playback support.
 * `score()` and `scoreSVG()` are available and work headlessly — pass a
 * Verovio toolkit to render notation from Deno/Node/notebook scripts.
 */
const jm = {
  // Core
  validate: validateJmon,
  play,
  score,
  scoreSVG,

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
    musicxml,
    supercollider,
  },

  // Namespaces from algorithms
  theory: algorithms.theory,
  generative: algorithms.generative,
  analysis: algorithms.analysis,
  constants: algorithms.constants,
  audio: algorithms.audio,
  visualization: algorithms.visualization,

  // Utils
  utils: {
    ...algorithms.utils,
    JmonValidator,
    jmon: jmonUtils,
  },

  VERSION: "1.0.0",
};

/**
 * Main JMON API object (default export).
 *
 * @default
 * @example
 * ```ts
 * import jm from "jsr:@jmon/jmon-algo";
 * const scale = jm.theory.scale.generate('C', 'major');
 * ```
 */
export default jm;

/**
 * Main JMON API object (named export).
 *
 * @example
 * ```ts
 * import { jm } from "jsr:@jmon/jmon-algo";
 * const progression = jm.theory.chord.progression('C', ['I', 'IV', 'V']);
 * ```
 */
export { jm };

/**
 * Audio processing utilities including DSP, synthesis, and analysis tools.
 *
 * @example
 * ```ts
 * import { audio } from "jsr:@jmon/jmon-algo";
 * const fft = audio.fft.transform(samples);
 * ```
 */
export const audio = algorithms.audio;
