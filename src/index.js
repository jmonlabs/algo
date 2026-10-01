/**
 * jmon/algo — composing music.
 *
 * Scales, chords and voice leading; minimalist processes, random walks,
 * fractals, cellular automata, genetic algorithms; rhythm and a drummer;
 * analysis. Everything that makes a JMON piece, and nothing that reads,
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

import * as notes from "./notes/index.js";
import * as performance from "./performance/index.js";
import * as harmony from "./harmony/index.js";
import * as voices from "./voices/index.js";
import * as rhythm from "./rhythm/index.js";
import * as generative from "./generative/index.js";
import * as analysis from "./analysis/index.js";
import * as constants from "./constants/index.js";
import { arrange } from "./arrange.js";

/**
 * The composition API: one space per musical question, and `key`.
 *
 * `jm.play`, `jm.score` and `jm.converters` used to live here. They moved to
 * `jmon/show` and `jmon/io`, which is why this package now imports nothing and
 * runs the same in Node, Deno and a browser.
 */
const jm = {
  // A key: tonic and mode, given once. The one call that takes two plain
  // arguments, because "D minor" is how a key is said.
  //
  //   const k = jm.key("D", "minor");
  //   k.scale({ start: 50, length: 8 });
  //   k.progression().draw(4, { seed: 1 });
  //   jm.harmony.chord(62, k);
  key: harmony.key,

  // The montage of a piece: sections end to end, each playing some of the
  // parts. Returns the piece, ready for play.
  arrange,

  // What a composer does to a list of notes: shift, transpose, canon, tile,
  // reverse, concatenate, quantize… and the builders track, piece, chordNotes.
  notes,

  // How the notes are played: sustain, bow, humanize, embellish, swing,
  // ornament, articulate, strum, arpeggiate, groove, corrupt.
  performance,

  // In a key: key, Progression, chord, chords, harmonize, solfege…
  harmony,

  // What the voices do from one chord to the next: neoRiemannian,
  // neoRiemannianWalk, smoothWalk, lead, counterpoint.
  voices,

  // Where the notes fall: grid, fromGrid, draw, euclid, clave, isorhythm,
  // beatcycle, Rhythm, Profile and its presets.
  rhythm,

  // The material: minimalism (unfold, phase, Tintinnabuli), walks, fractals,
  // automata, genetic, drummer.
  generative,

  // Measurements, flat: gini, density, salience, rhythmCode, emotionalMap…
  analysis,

  // The tables: theory, articulations, ornaments, and list/get/describe/search.
  constants,

  // Keep in step with package.json; tests/notes.test.js asserts they match.
  VERSION: "5.1.0",
};

export { jm };
export default jm;
