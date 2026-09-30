/**
 * jmon/harmony — in a key.
 *
 * A key is a tonic and a mode; from it come a scale, chords built on its
 * degrees, progressions the roman numerals name or the circle draws, chords
 * under a melody, and the solfège of a pitch. What the voices do from one
 * chord to the next is jmon/voices, which knows no key.
 *
 * @license GPL-3.0-or-later
 */

import { chordify, chordifyMany } from "../algorithms/theory/harmony/Chordify.js";
import { Voice } from "../algorithms/theory/harmony/Voice.js";

export { Key, key } from "../algorithms/theory/harmony/Key.js";
export { Progression } from "../algorithms/theory/harmony/Progression.js";
export { chordDistance, isChordTone } from "../algorithms/theory/harmony/Solfege.js";
import * as Solfege from "../algorithms/theory/harmony/Solfege.js";

/**
 * The chord built on a pitch in a key: the pitch, and the scale degrees
 * above it (a triad by default).
 *
 * @param {number} pitch - The root, a MIDI pitch
 * @param {Object} options
 * @param {Object} [options.key] - A key context; or `tonic` and `mode` directly
 * @param {Array<number>} [options.degrees=[0, 2, 4]] - Which scale degrees, from the root
 * @returns {Array<number>} MIDI pitches
 *
 * @example
 * chord(62, { key: jm.key("D", "minor") });  // [62, 65, 69]
 */
export function chord(pitch, options = {}) {
  return chordify(pitch, withKey(options));
}

/**
 * The chords built on several pitches in a key: `chord` for each.
 * @param {Array<number>} pitches
 * @param {Object} options - As for `chord`
 * @returns {Array<Array<number>>}
 */
export function chords(pitches, options = {}) {
  return chordifyMany(pitches, withKey(options));
}

/**
 * Chords under a melody: one chord per measure, built in the key on the
 * melody's pitch nearest each measure's start, or one chord per note.
 *
 * @param {Array} melody - JMON notes
 * @param {Object} options
 * @param {Object} [options.key] - A key context; or `tonic` and `mode` directly
 * @param {number} [options.measureLength=4] - Beats per chord
 * @param {boolean} [options.perNote=false] - A chord on every note instead
 * @param {Array<number>} [options.degrees=[0, 2, 4]] - Which scale degrees make a chord
 * @param {number} [options.transpose=0] - Semitones to move the chords by
 * @param {'chords'|'notes'|'bass'} [options.output='chords'] - Chords as pitch arrays, as JMON chord notes, or their roots only
 * @returns {Array} What `output` says
 *
 * @example
 * harmonize(melody, { key: jm.key("D", "minor"), measureLength: 4, output: "notes" });
 */
export function harmonize(melody, options = {}) {
  const { perNote = false, output = "chords", ...rest } = options;
  const voice = new Voice({ ...withKey(rest), extractRoots: !perNote, output: output === "notes" ? "track" : output });
  return voice.generate(melody);
}

/**
 * The scale degree of a pitch in a key, 0 (DO) to 6 (TI), counted from the
 * relative major's tonic; `null` for a note outside the key.
 * @param {number} pitch - A MIDI pitch
 * @param {Object} key - A key context, or `{ key }`, or `{ tonic, mode }`
 * @returns {number|null}
 */
export function degree(pitch, key) {
  return Solfege.degree(pitch, withKey(key));
}

/**
 * The solfège syllable of a pitch in a key (DO, RE, MI, FA, SO, LA, TI), or
 * `null` for a note outside the key. In minor the tonic is LA.
 * @param {number} pitch - A MIDI pitch
 * @param {Object} key - A key context, or `{ key }`, or `{ tonic, mode }`
 * @returns {string|null}
 *
 * @example
 * solfege(64, jm.key("D", "minor"));  // "MI"
 */
export function solfege(pitch, key) {
  return Solfege.solfege(pitch, withKey(key));
}

/**
 * How stable a pitch is in a key: 0 for DO, then SO, MI, LA, RE, TI, FA at 6;
 * 7 for a note outside the key.
 * @param {number} pitch - A MIDI pitch
 * @param {Object} options - A key context, or `{ key, order }`, or `{ tonic, mode, order }`
 * @param {Array<number>} [options.order] - Seven weights, DO to TI, higher meaning more stable
 * @returns {number} 0 to 7
 */
export function stability(pitch, options) {
  const { order, ...key } = withKey(options);
  return Solfege.stability(pitch, key, order ? { order } : {});
}

/**
 * A key context, `{ key }` or `{ tonic, mode }` as the `{ tonic, mode, ... }`
 * the underlying helpers read.
 */
function withKey(options = {}) {
  const { key, ...rest } = options;
  if (key && typeof key === "object") return { tonic: key.tonic, mode: key.mode, ...rest };
  if (options.tonic !== undefined && !(options.constructor === Object)) {
    return { tonic: options.tonic, mode: options.mode };
  }
  return rest;
}
