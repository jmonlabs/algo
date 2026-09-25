/**
 * Naming a chord, and putting one in a register.
 *
 * Both of these get hand-rolled in every notebook that compares progressions,
 * because a progression is an array of arrays of MIDI numbers and neither the
 * eye nor the ear reads that. They belong here.
 */

import { midiToCde } from '../../utils.js';

/**
 * Interval sets, measured in semitones from the root, and the suffix each one
 * takes. Order matters only in that the first match wins, so the triads come
 * before the sevenths that contain them.
 */
const QUALITIES = [
  [[0, 4, 7], ''],
  [[0, 3, 7], 'm'],
  [[0, 3, 6], 'dim'],
  [[0, 4, 8], 'aug'],
  [[0, 2, 7], 'sus2'],
  [[0, 5, 7], 'sus4'],
  [[0, 4, 7, 11], 'maj7'],
  [[0, 4, 7, 10], '7'],
  [[0, 3, 7, 10], 'm7'],
  [[0, 3, 6, 10], 'm7b5'],
  [[0, 3, 6, 9], 'dim7'],
  [[0, 4, 8, 10], '7#5'],
  [[0, 3, 7, 11], 'mMaj7'],
];

const pitchClass = (pitch) => ((pitch % 12) + 12) % 12;
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Name a chord from its pitches: `[50, 53, 57]` is `"Dm"`.
 *
 * Inversions are named by the chord they invert, not by the note at the bottom:
 * `[52, 57, 60]` is `"Am"`, because every rotation is tried as a candidate root
 * and the first one that matches a known quality wins. Doubled notes and octave
 * spacing make no difference — the pitches are reduced to pitch classes first.
 *
 * A chord whose intervals match nothing in the table is named by its lowest
 * pitch followed by `?`, rather than guessed at: `"F?"` says "something built
 * on F that this function cannot name", which is more use than a wrong name.
 *
 * @example
 * chordName([50, 53, 57]);        // "Dm"
 * chordName([53, 57, 60]);        // "F"
 * chordName([52, 56, 59, 62]);    // "E7"
 * chordName([57, 60, 64, 62]);    // "Am" with the ninth doubled — still "Am"
 *
 * @param {Array<number>} chord - MIDI pitches, in any order and any octave
 * @returns {string} The chord's name
 */
export function chordName(chord) {
  if (!Array.isArray(chord) || chord.length === 0) return '';

  const pitches = chord.filter((p) => typeof p === 'number');
  if (pitches.length === 0) return '';

  const lowest = Math.min(...pitches);
  const classes = [...new Set(pitches.map(pitchClass))].sort((a, b) => a - b);

  for (const root of classes) {
    const intervals = classes.map((c) => ((c - root) + 12) % 12).sort((a, b) => a - b);
    for (const [shape, suffix] of QUALITIES) {
      if (sameSet(intervals, shape)) {
        return midiToCde(root + 60).replace(/-?\d+$/, '') + suffix;
      }
    }
  }

  return `${midiToCde(lowest).replace(/-?\d+$/, '')}?`;
}

/**
 * Transpose a chord by whole octaves until its lowest note sits in a register.
 *
 * Progressions that come from different generators land wherever their
 * algorithms left them, an octave or two apart, and cannot be compared by ear
 * until they share a register. This moves a chord without changing it: every
 * note shifts by the same number of octaves, so the voicing, the spacing and
 * the inversion all survive.
 *
 * `low` and `high` bound the LOWEST note, not the whole chord — a chord wider
 * than the window still fits, its upper notes simply reach above `high`.
 *
 * @example
 * toRegister([74, 77, 81], { low: 45, high: 57 });  // [50, 53, 57] — down two octaves
 * progression.map((c) => toRegister(c));            // a whole progression in one register
 *
 * @param {Array<number>} chord - MIDI pitches
 * @param {Object} [options]
 * @param {number} [options.low=45] - Lowest acceptable bottom note (45 is A2)
 * @param {number} [options.high=57] - Highest acceptable bottom note (57 is A3)
 * @returns {Array<number>} The chord, sorted low to high, moved into the register
 */
export function toRegister(chord, { low = 45, high = 57 } = {}) {
  if (!Array.isArray(chord) || chord.length === 0) return [];
  if (!(high >= low)) throw new Error('toRegister: `high` must not be below `low`');

  let notes = chord.filter((p) => typeof p === 'number').sort((a, b) => a - b);
  if (notes.length === 0) return [];

  // The window is at least an octave wide in practice, but a narrow one would
  // loop forever on a chord that steps over it, so bail out after a full range.
  for (let guard = 0; notes[0] > high && guard < 12; guard++) notes = notes.map((p) => p - 12);
  for (let guard = 0; notes[0] < low && guard < 12; guard++) notes = notes.map((p) => p + 12);

  return notes;
}

export default { chordName, toRegister };
