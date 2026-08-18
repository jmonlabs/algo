/**
 * jmon/algo — composing music.
 *
 * Scales, chords and voice leading; minimalist processes, random walks,
 * fractals, cellular automata, genetic algorithms; rhythm and a drummer;
 * analysis. Everything that makes a JMON composition, and nothing that reads,
 * plays or draws one.
 *
 * It imports nothing. Three sibling packages take it from here, each passed in
 * where it is needed rather than imported, because Node refuses `https://`
 * imports and this repository is tested under Node:
 *
 *   jmon/io     the format: what it means, and how it serialises
 *   jmon/show   playback, live coding, WAV, score
 *   jmon/sound  sampled instruments for Tone.js
 *
 *   import jm    from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
 *   import io    from "https://cdn.jsdelivr.net/gh/jmonlabs/io@main/src/index.js";
 *   import show  from "https://cdn.jsdelivr.net/gh/jmonlabs/show@main/src/index.js";
 *   import sound from "https://cdn.jsdelivr.net/gh/jmonlabs/sound@main/src/index.js";
 *
 *   const piece = { tempo: 120, tracks: [{ label: "Lead", notes }] };
 *   show.play(piece, { Tone, io, sound });
 *   io.midi(piece);
 *
 * @license GPL-3.0-or-later
 */

import algorithms from "./algorithms/index.js";
import * as jmonUtils from "./utils/jmon-utils.js";

/**
 * The composition API.
 *
 * `jm.play`, `jm.score` and `jm.converters` used to live here. They moved to
 * `jmon/show` and `jmon/io`, which is why this package now imports nothing and
 * runs the same in Node, Deno and a browser.
 */
const jm = {
  // Key context — set tonic and mode once and produce harmony objects
  // (Scale, Voice, Ornament, Progression, chord(s)) without repeating
  // `{ tonic, mode }` at every call site.
  //
  //   const k = jm.key("C", "major");
  //   k.scale().generate({ length: 8 });
  //   k.voice({ measureLength: 4, output: "track" }).generate(melody);
  //   k.ornament({ type: "trill", parameters: { by: 1 } }).apply(notes, 0);
  key: (tonic, mode) => algorithms.theory.harmony.key(tonic, mode),

  theory: algorithms.theory,
  generative: algorithms.generative,
  processors: algorithms.processors,
  analysis: algorithms.analysis,
  constants: algorithms.constants,

  utils: {
    ...algorithms.utils,
    ...jmonUtils,
  },

  // Keep in step with package.json; tests/utils-transforms asserts they match.
  VERSION: "2.0.0",
};

export { jm };
export default jm;
