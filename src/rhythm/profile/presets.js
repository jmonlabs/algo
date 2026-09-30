import { Profile } from './Profile.js';

/**
 * The profiles the two books draw, as data. Each is one transcriber's
 * histogram of one repertoire; build your own with `Profile.fromPositions`.
 *
 * Source: Tamas Bodzsar, *The Rhythm Code* (2022) and *The Emotional Map of
 * Melody* (2026). The weights are read off the books' diagrams; the text and
 * the song transcriptions are not reproduced here.
 */

/**
 * The Rhythm Code, 2-3 orientation. Sixteen eighth-note places over two bars
 * of 4/4. Weights: 0 rare ("X"), 1 occasional, 2 frequent. Bar A is the "2"
 * side of the son clave (onsets on beats 2 and 3), bar B the "3" side. The
 * frequent places nearly coincide with the clave, except that beat 1 of the
 * "3" side is usually anticipated: place 8 (the "and" of 4 in bar A) carries
 * the weight instead of place 9.
 *
 * Rotate by 8 for 3-2.
 */
export const RHYTHM_CODE_23 = Object.freeze([
    1, 1, 2, 0, 2, 1, 1, 2, // bar A: 1  1+ 2  2+ 3  3+ 4  4+
    1, 1, 0, 2, 1, 1, 2, 1, // bar B: 1  1+ 2  2+ 3  3+ 4  4+
]);

/**
 * The Tonality Code over the 12 pitch classes, tonic at index 0, major key.
 * Pentatonic degrees (DO RE MI SO LA) weigh 2, the remaining diatonic degrees
 * (FA TI) weigh 1, chromatic notes weigh 0. Rotate by the tonic's pitch class
 * to move it to another key; for a minor key rotate by the relative major's
 * tonic.
 */
export const TONALITY_CODE = Object.freeze([
    2, 0, 2, 0, 2, 1, 0, 2, 0, 2, 0, 1,
]);

/**
 * Bodzsar's stability order of the seven solfège degrees, as a weight per
 * degree of the relative major (DO=0 … TI=6). Higher is more stable:
 * DO 6, SO 5, MI 4, LA 3, RE 2, TI 1, FA 0. `Solfege.stability` reports the
 * rank (6 minus this), so DO is rank 0 and FA rank 6.
 */
export const STABILITY_MAJOR = Object.freeze([
    6, // DO
    2, // RE
    4, // MI
    0, // FA
    5, // SO
    3, // LA
    1, // TI
]);

export const presets = {
    /** @returns {Profile} 16-place Rhythm Code in the given orientation */
    rhythmCode(orientation = '2-3') {
        const base = new Profile({ weights: RHYTHM_CODE_23, name: 'rhythmCode 2-3' });
        if (orientation === '2-3') return base;
        if (orientation === '3-2') {
            const p = base.rotate(8);
            p.name = 'rhythmCode 3-2';
            return p;
        }
        throw new Error(`rhythmCode: unknown orientation "${orientation}" (use "2-3" or "3-2")`);
    },

    /**
     * 12-pitch-class Tonality Code rotated to a tonic.
     * @param {number} [tonicPitchClass=0]
     */
    tonalityCode(tonicPitchClass = 0) {
        return new Profile({ weights: TONALITY_CODE, name: 'tonalityCode' }).rotate(tonicPitchClass);
    },

    /** 7-degree stability weights of the relative major. */
    stability() {
        return new Profile({ weights: STABILITY_MAJOR, name: 'stability' });
    },
};
