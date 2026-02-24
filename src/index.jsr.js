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
  midiToJmon,
  supercollider,
  tonejs,
  wav,
  musicxml,
} from "./converters/index.js";
import * as jmonUtils from "./utils/jmon-utils.js";

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
 * Note: render(), play(), and score() functions are not available in the JSR package.
 * These require the npm package for full browser playback and rendering support.
 */
const jm = {
  // Core
  validate: validateJmon,

  // Converters
  converters: {
    midi,
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
