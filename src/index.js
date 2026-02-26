/**
 * JMON Studio entrypoint
 * Exposes a unified `jm` API consumed by build and tests.
 *
 * This file intentionally avoids side-effects at module top-level so it can
 * be safely imported in Node test environments and browser bundles.
 */

import { JmonValidator } from "./utils/jmon-validator.browser.js";
import algorithms from "./algorithms/index.js";
import {
  midi,
  midiToJmon,
  supercollider,
  tonejs,
  wav,
  downloadWav,
  musicxml,
  downloadMusicXML,
} from "./converters/index.js";
import * as jmonUtils from "./utils/jmon-utils.js";
import * as scoreRenderer from "./browser/score-renderer.js";

// Lazy-load browser player to avoid JSR analyzing CDN imports
let createPlayer;
async function __loadPlayer() {
  if (!createPlayer) {
    const playerModule = await import("./browser/music-player.js");
    createPlayer = playerModule.createPlayer;
  }
  return createPlayer;
}

// GM instruments helpers (optional); load lazily when needed to avoid top-level await in UMD
let GM_INSTRUMENTS, createGMInstrumentNode, findGMProgramByName, generateSamplerUrls, getPopularInstruments;
/**
 * Lazy-load GM instrument helpers.
 * Returns a cached module after first load.
 */
async function __loadGmInstruments() {
  if (!GM_INSTRUMENTS && !createGMInstrumentNode) {
    const gm = await import("./utils/gm-instruments.js");
    GM_INSTRUMENTS = gm.GM_INSTRUMENTS;
    createGMInstrumentNode = gm.createGMInstrumentNode;
    findGMProgramByName = gm.findGMProgramByName;
    generateSamplerUrls = gm.generateSamplerUrls;
    getPopularInstruments = gm.getPopularInstruments;
  }
  return {
    GM_INSTRUMENTS,
    createGMInstrumentNode,
    findGMProgramByName,
    generateSamplerUrls,
    getPopularInstruments,
  };
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
 * Play a composition using Tone.js
 *
 * @param {Object} jmonObj - The JMON composition to play
 * @param {Object} options - Playback options
 * @param {Object} options.Tone - Tone.js library instance (optional, will auto-load if not provided)
 * @param {boolean} [options.autoplay=false] - Whether to start playback immediately
 * @param {boolean} [options.showDebug=false] - Show debug information
 * @param {Object} [options.customInstruments={}] - Custom instrument configurations
 * @param {boolean} [options.autoMultivoice=true] - Enable automatic multivoice splitting
 * @param {number} [options.maxVoices=4] - Maximum number of voices per track
 * @param {boolean} [options.preloadTone=false] - Preload Tone.js even if autoplay is false
 * @returns {Promise<HTMLElement>|HTMLElement} Returns Promise on first call (loading player module) or when async work needed (loading Tone.js, starting AudioContext, autoplay). Returns element synchronously on subsequent calls when Tone is available and autoplay is false.
 *
 * @example
 * // First call or when async work needed - use await
 * const player = await jm.play(composition, { Tone, autoplay: false });
 *
 * @example
 * // Subsequent calls with Tone available - synchronous
 * const player2 = jm.play(composition2, { Tone, autoplay: false });
 */
function play(jmonObj, options = {}) {
  // Extract Tone from options if provided
  const { Tone: externalTone, autoplay = false, ...otherOptions } = options;
  const playOptions = { Tone: externalTone, autoplay, ...otherOptions };

  // Check if we can return synchronously
  const toneAvailable = externalTone || (typeof globalThis !== 'undefined' && globalThis.Tone) || (typeof globalThis.Tone !== 'undefined' ? globalThis.Tone : null);
  const needsAsync = !toneAvailable || autoplay || playOptions.preloadTone;

  if (!needsAsync && toneAvailable) {
    // Synchronous path: Tone is available and no async initialization needed
    if (!createPlayer) {
      // Need to load the player module - must be async
      return (async () => {
        const playerModule = await import("./browser/music-player.js");
        createPlayer = playerModule.createPlayer;
        return createPlayer(jmonObj, playOptions);
      })();
    }
    return createPlayer(jmonObj, playOptions);
  }

  // Async path: need to load Tone.js, start AudioContext, or autoplay
  return (async () => {
    const player = await __loadPlayer();
    return player(jmonObj, playOptions);
  })();
}

/**
 * Render sheet music notation using verovio
 *
 * @param {Object} jmonObj - The JMON composition to render
 * @param {Object} options - Rendering options
 * @param {Function} options.verovio - verovio WASM module factory (import from "npm:verovio@4.3.1/wasm")
 * @param {Function} options.VerovioToolkit - VerovioToolkit class (import { VerovioToolkit } from "npm:verovio@4.3.1/esm")
 * @param {number} [options.width] - Staff width in pixels (default: 2100)
 * @param {number} [options.scale] - Scale factor for rendering (default: 40)
 * @returns {Promise<HTMLElement>} DOM element containing the rendered score
 *
 * @example
 * // Basic usage
 * const svg = await jm.score(composition, { verovio, VerovioToolkit });
 *
 * @example
 * // Fixed width mode
 * const svg = await jm.score(composition, { verovio, VerovioToolkit, width: 2100 });
 *
 * @example
 * // With custom dimensions and scale
 * const svg = await jm.score(composition, { verovio, VerovioToolkit, scale: 40 });
 */
function score(jmonObj, options = {}) {
  // Check for browser environment
  if (typeof document === "undefined") {
    throw new Error("Score rendering requires a DOM environment.");
  }

  // Import the score renderer from browser module
  return scoreRenderer.score(jmonObj, options);
}

// Compose the jm API object expected by build and tests
const jm = {
  // Core
  render,
  play,
  score,
  validate: validateJmon,

  // Converters
  converters: {
    midi,
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
  visualization: algorithms.visualization,

  // Utils
  utils: {
    ...algorithms.utils,
    ...jmonUtils,
    JmonValidator,
  },

  // Instruments (optional; may be undefined in non-browser builds)
  instruments: {
    // Lazy loader to initialize GM instrument helpers on demand
    // Usage: await jm.instruments.load()
    load: __loadGmInstruments,
    // These remain undefined until load() is called in environments where
    // gm-instruments are not preloaded.
    GM_INSTRUMENTS,
    generateSamplerUrls,
    createGMInstrumentNode,
    findGMProgramByName,
    getPopularInstruments,
  },

  VERSION: "1.0.0",
};

// Named and default exports
export { jm };
export const audio = algorithms.audio;
export default jm;
