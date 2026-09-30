import { Scale } from './Scale.js';
import { Progression } from './Progression.js';
import { chordify, chordifyMany } from './Chordify.js';
import { solfege, stability, degree } from './Solfege.js';

/**
 * A key: a tonic and a mode, set once, and everything the key answers from
 * there — its scale, its chords, its progressions, the solfège of a pitch.
 * The functions of jm.harmony and jm.performance that need a key take it
 * as `key`.
 *
 * @example
 * ```js
 * const k = jm.key('C', 'major');
 *
 * const scale = k.scale({ start: 60, length: 8 });   // MIDI pitches, C4 to C5
 * const prog  = k.progression().generate(['I', 'IV', 'V', 'I']);
 * const chord = k.chord(60);          // [60, 64, 67], jm.harmony.chord(60, k) as well
 * const chords = k.chords([60, 62, 64]);
 * k.solfege(64);                      // 'MI'
 * ```
 */
export class Key {
    /**
     * @param {Object} [options={}]
     * @param {string} [options.tonic='C'] - Tonic note ('C', 'D#', 'Bb'). Also accepts `options.key`.
     * @param {string} [options.mode='major'] - Scale mode.
     */
    constructor(options = {}) {
        this.tonic = options.tonic ?? options.key ?? 'C';
        this.mode = options.mode ?? 'major';
    }

    /** Merge this key's tonic/mode with the caller's options (caller wins). */
    _opts(extra = {}) {
        return { tonic: this.tonic, mode: this.mode, ...extra };
    }

    /**
     * The scale of the key, as MIDI pitches.
     * @param {Object} [options]
     * @param {number|string} [options.start] - The first pitch (a MIDI number or a name such as 'D3'); the tonic at octave 4 by default
     * @param {number|string} [options.end] - The last pitch
     * @param {number} [options.length] - How many pitches
     * @returns {Array<number>}
     */
    scale(options = {}) { return new Scale(this._opts()).generate(options); }

    /** @returns {Progression} */
    progression(options = {}) { return new Progression(this._opts(options)); }

    /**
     * The pitch classes of this key, tonic first — the same answer
     * `Progression.pitchClasses()` gives, from the same source.
     *
     * Use it to test or constrain without building a harmony object: an
     * `inKey` set, a filter, a membership check.
     *
     * @returns {Array<number>} Pitch classes 0-11, in scale order.
     *
     * @example
     * k.pitchClasses();  // C major -> [0, 2, 4, 5, 7, 9, 11]
     * k.progression({ inKey: k.pitchClasses() }).nrtWalk(6, 3);
     */
    pitchClasses() { return new Progression(this._opts()).pitchClasses(); }

    /**
     * Build a chord on a single pitch — wraps `chordify`.
     * @returns {Array<number>}
     */
    chord(pitch, options = {}) { return chordify(pitch, this._opts(options)); }

    /**
     * Build chords for many pitches — wraps `chordifyMany`.
     * @returns {Array<Array<number>>}
     */
    chords(pitches, options = {}) { return chordifyMany(pitches, this._opts(options)); }

    /**
     * Solfège syllable of a pitch in this key ('DO' … 'TI', or `null` when
     * chromatic). Minor keys read the tonic as LA.
     * @returns {string|null}
     */
    solfege(pitch) { return solfege(pitch, this._opts()); }

    /** Solfège degree 0 (DO) … 6 (TI), or `null` when chromatic. */
    degree(pitch) { return degree(pitch, this._opts()); }

    /**
     * Stability rank of a pitch, 0 (DO, most stable) … 6 (FA), 7 when
     * chromatic — the horizontal axis of the Emotional Map.
     * @returns {number}
     */
    stability(pitch, options = {}) { return stability(pitch, this._opts(), options); }
}

/**
 * Factory for a `Key` context. Takes the common `tonic, mode` shorthand
 * positionally, since the two are never ambiguous, or the same options
 * object the classes take, so both conventions of the package apply:
 *
 *     key('C', 'major')
 *     key({ tonic: 'C', mode: 'major' })
 *
 * @param {string|Object} tonic - Tonic note, or `{ tonic, mode }` (also `{ key, mode }`)
 * @param {string} [mode]
 * @returns {Key}
 *
 * @example
 * const k = key('C', 'major');
 * k.voice({ measureLength: 4 });
 */
export function key(tonic, mode) {
    if (tonic !== null && typeof tonic === 'object') return new Key(tonic);
    return new Key({ tonic, mode });
}
