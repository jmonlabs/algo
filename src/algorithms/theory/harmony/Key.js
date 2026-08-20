import { Scale } from './Scale.js';
import { Voice } from './Voice.js';
import { Ornament } from './Ornament.js';
import { Progression } from './Progression.js';
import { chordify, chordifyMany } from './Chordify.js';

/**
 * A reusable key context that collapses the repeated `{tonic, mode}`
 * boilerplate across `Scale`, `Voice`, `Ornament`, `Progression`,
 * `chordify`, and `chordifyMany`.
 *
 * Instead of writing `tonic: 'C', mode: 'major'` at every call site, set
 * the key once and ask the context for the harmony objects you need —
 * tonic/mode are merged in automatically and can still be overridden
 * per-call.
 *
 * @example
 * ```js
 * const k = jm.key('C', 'major');
 *
 * const scale = k.scale().generate({ length: 8 });
 * const voice = k.voice({ measureLength: 4, output: 'track' });
 * const trill = k.ornament({ type: 'trill', parameters: { by: 1 } });
 * const prog  = k.progression().generate(['I', 'IV', 'V', 'I']);
 * const chord = k.chord(60);          // chordify(60, {tonic:'C', mode:'major'})
 * const chords = k.chords([60, 62, 64]);
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

    /** @returns {Scale} */
    scale(options = {}) { return new Scale(this._opts(options)); }

    /** @returns {Voice} */
    voice(options = {}) { return new Voice(this._opts(options)); }

    /** @returns {Ornament} */
    ornament(options = {}) { return new Ornament(this._opts(options)); }

    /** @returns {Progression} */
    progression(options = {}) { return new Progression(this._opts(options)); }

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
}

/**
 * Factory for a `Key` context. Prefer this over `new Key(...)` — it keeps
 * the common `tonic, mode` shorthand positional since the two are never
 * ambiguous, while the class itself takes a single options object.
 *
 * @example
 * const k = key('C', 'major');
 * k.voice({ measureLength: 4 });
 */
export function key(tonic, mode) {
    return new Key({ tonic, mode });
}
