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

import algorithms from "./algorithms/index.js";
import * as notes from "./notes/index.js";
import * as performance from "./performance/index.js";
import * as harmony from "./harmony/index.js";
import * as voices from "./voices/index.js";
import * as rhythm from "./rhythm/index.js";
import * as generative from "./generative/index.js";

/**
 * The composition API.
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
  //   k.progression().generate(4, { seed: 1 });
  //   jm.harmony.chord(62, k);
  key: harmony.key,

  // The names of 4.x for theory.*, kept for one release while the pieces
  // move to jm.harmony, jm.voices and jm.rhythm. Nothing new goes here.
  theory: {
    ...algorithms.theory,
    harmony: {
      ...algorithms.theory.harmony,
      counterpoint: voices.counterpoint,
      parallelPerfects: voices.parallelPerfects,
      voiceChorale: voices.lead,
      chordify: harmony.chord,
      chordifyMany: harmony.chords,
    },
    rhythm: {
      ...rhythm,
      onsets: rhythm.grid,
      fromOnsets: rhythm.fromGrid,
      clave: (options = {}) => {
        const { name, ...rest } = options;
        return rhythm.clave(name, rest);
      },
      clavePattern: (name, orientation) => rhythm.clavePattern(name, { orientation }),
      euclidPattern: (steps, pulses, rotation) => rhythm.euclidPattern({ steps, pulses, rotation }),
    },
    profile: algorithms.theory.profile,
  },
  processors: algorithms.processors,
  analysis: algorithms.analysis,
  constants: algorithms.constants,

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

  // The names of 4.x, kept for one release while the pieces move to jm.notes
  // and jm.performance. Nothing new goes here.
  utils: {
    sustained: performance.sustain,
    bow: performance.bow,
    humanize: performance.humanize,
    expressivize: performance.embellish,
    applySwing: performance.swing,
    gcd: algorithms.utils.gcd,
    lcm: algorithms.utils.lcm,
    beatsToTime: notes.beatsToTime,
    timeToBeats: notes.timeToBeats,
    createTrack: notes.track,
    createPiece: notes.piece,
    chordNotes: notes.chordNotes,
    shiftTime: notes.shift,
    transpose: notes.transpose,
    diatonic: notes.diatonic,
    transposeDiatonic: notes.transposeDiatonic,
    canon: notes.canon,
    truncate: notes.truncate,
    tile: notes.tile,
    augment: notes.augment,
    retrograde: notes.reverse,
    invert: notes.invert,
    concatenateNotes: notes.concatenate,
    combineNotes: notes.combine,
    quantize: notes.quantize,
    removeDuplicates: notes.deduplicate,
    splitLongNotes: notes.split,
    normalizeVelocities: notes.normalize,
    extractRhythm: notes.onsets,
    getPitchRange: notes.range,
    getTotalDuration: notes.span,
  },

  // Keep in step with package.json; tests/utils-transforms asserts they match.
  VERSION: "5.0.0",
};

export { jm };
export default jm;
