import { MusicTheoryConstants } from '../../constants/MusicTheoryConstants.js';
import { STABILITY_MAJOR } from '../profile/presets.js';

export const SYLLABLES = Object.freeze(['DO', 'RE', 'MI', 'FA', 'SO', 'LA', 'TI']);

/** Interval from a mode's tonic up to the tonic of its relative major. */
const RELATIVE_MAJOR_OFFSET = Object.freeze({
    'major': 0,
    'dorian': 10,
    'phrygian': 8,
    'lydian': 7,
    'mixolydian': 5,
    'minor': 3,
    'melodic minor descending': 3,
    'locrian': 1,
});

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function tonicPitchClass(tonic) {
    if (typeof tonic === 'number') return ((tonic % 12) + 12) % 12;
    // 'C', 'Bb', 'F#' — a bare name; with an octave ('C4') fall through to MIDI parsing
    const bare = MusicTheoryConstants.convertFlatToSharp(String(tonic).trim());
    const idx = MusicTheoryConstants.chromatic_scale.indexOf(bare);
    if (idx !== -1) return idx;
    return MusicTheoryConstants.noteNameToMidi(tonic) % 12;
}

/**
 * Pitch class of the relative major's tonic — the DO of the key. In minor,
 * DO is a minor third above the tonic, so the tonic is LA; that is what makes
 * the stability order key-independent, as the book has it.
 * @param {{ tonic: string|number, mode?: string }} key
 * @returns {number} 0..11
 */
export function doPitchClass({ tonic = 'C', mode = 'major' } = {}) {
    const offset = RELATIVE_MAJOR_OFFSET[mode];
    if (offset === undefined) {
        throw new Error(`Solfege: mode "${mode}" has no relative major; use a diatonic mode`);
    }
    return (tonicPitchClass(tonic) + offset) % 12;
}

/**
 * Solfège degree of a pitch, 0 (DO) to 6 (TI), relative to the key's
 * relative major. `null` for a chromatic note.
 * @param {number} pitch - MIDI
 * @param {{ tonic: string|number, mode?: string }} key
 * @returns {number|null}
 */
export function degree(pitch, key) {
    const rel = (((pitch - doPitchClass(key)) % 12) + 12) % 12;
    const idx = MAJOR.indexOf(rel);
    return idx === -1 ? null : idx;
}

/**
 * Syllable of a pitch in a key, or `null` for a chromatic note.
 * @param {number} pitch
 * @param {{ tonic: string|number, mode?: string }} key
 * @returns {string|null}
 */
export function solfege(pitch, key) {
    const d = degree(pitch, key);
    return d === null ? null : SYLLABLES[d];
}

/**
 * Stability rank of a pitch: 0 is the most stable (DO), 6 the least (FA),
 * following the book's order DO SO MI LA RE TI FA. Chromatic notes rank 7,
 * one past the end, so a metric can treat them as "less stable than FA".
 *
 * Pass `order` to use a different ranking: seven weights per degree DO..TI,
 * higher meaning more stable, as in `theory.profile.STABILITY_MAJOR`.
 *
 * @param {number} pitch
 * @param {{ tonic: string|number, mode?: string }} key
 * @param {Object} [options]
 * @param {Array<number>} [options.order=STABILITY_MAJOR]
 * @returns {number} 0..7
 */
export function stability(pitch, key, { order = STABILITY_MAJOR } = {}) {
    const d = degree(pitch, key);
    if (d === null) return 7;
    const max = Math.max(...order);
    return max - order[d];
}

/**
 * Semitone distance from a pitch to the nearest chord tone, by pitch class.
 * 0 means the pitch is a chord tone.
 * @param {number} pitch
 * @param {Array<number>} chord - MIDI pitches of the chord
 * @returns {number} 0..6
 */
export function chordDistance(pitch, chord) {
    if (!Array.isArray(chord) || chord.length === 0) return 0;
    const pc = ((pitch % 12) + 12) % 12;
    let best = 6;
    for (const c of chord) {
        const cpc = ((c % 12) + 12) % 12;
        const diff = Math.abs(pc - cpc);
        best = Math.min(best, diff, 12 - diff);
    }
    return best;
}

/**
 * @param {number} pitch
 * @param {Array<number>} chord
 * @returns {boolean}
 */
export function isChordTone(pitch, chord) {
    return chordDistance(pitch, chord) === 0;
}

/**
 * The root, third and fifth of a chord given as any set of pitches, assuming
 * the lowest is the root. The book counts only the triad as chord tones; a
 * seventh on top is a non-chord tone to it. Use this when your chords carry
 * extensions and you want the book's reading.
 * @param {Array<number>} chord
 * @returns {Array<number>}
 */
export function triadOf(chord) {
    if (!Array.isArray(chord) || chord.length <= 3) return chord ?? [];
    return chord.slice(0, 3);
}

/**
 * Pitch classes of the key, DO first.
 * @param {{ tonic: string|number, mode?: string }} key
 * @returns {Array<number>}
 */
export function scalePitchClasses(key) {
    const d0 = doPitchClass(key);
    return MAJOR.map((i) => (d0 + i) % 12);
}

export default {
    SYLLABLES,
    doPitchClass,
    degree,
    solfege,
    stability,
    chordDistance,
    isChordTone,
    triadOf,
    scalePitchClasses,
};
