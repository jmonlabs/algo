/**
 * A weight per position over a cyclic domain.
 *
 * Bodzsar's Rhythm Code (how often a stop lands on each of 16 eighth-note
 * places), his Tonality Code (pentatonic > diatonic > chromatic) and the
 * stability order of the Emotional Map (DO SO MI LA RE TI FA) are all this
 * one object with a different period. So are the things the books do not
 * cover: a bell pattern over 12 pulses, a 7/8 groove, a profile folded out of
 * your own MIDI folder. The books' tables ship as presets in `presets.js`;
 * nothing in the code depends on them.
 *
 * `fit` is the mean weight at the given positions, scaled by the maximum
 * weight, so it lands in [0, 1] whatever units the weights use.
 */
export class Profile {
    /**
     * @param {Object} options
     * @param {Array<number>} options.weights - One non-negative weight per position. Its length is the period.
     * @param {string} [options.name] - Label, kept through rotations.
     * @param {number} [options.phase=0] - How far this profile has been rotated from its canonical form.
     */
    constructor({ weights, name = 'profile', phase = 0 } = {}) {
        if (!Array.isArray(weights) || weights.length === 0) {
            throw new Error('Profile requires a non-empty weights array');
        }
        if (weights.some((w) => typeof w !== 'number' || !Number.isFinite(w) || w < 0)) {
            throw new Error('Profile weights must be finite, non-negative numbers');
        }
        this.weights = weights.slice();
        this.name = name;
        this.phase = phase;
    }

    /** Number of positions in one cycle. */
    get period() {
        return this.weights.length;
    }

    /** Largest weight, used to normalise `fit`. */
    get max() {
        return Math.max(...this.weights);
    }

    /**
     * Weight at an absolute position, folded into the cycle.
     * @param {number} position - Integer position, any sign
     * @returns {number}
     */
    at(position) {
        const p = this.period;
        return this.weights[((Math.round(position) % p) + p) % p];
    }

    /**
     * Fold absolute positions into the cycle.
     * @param {Array<number>} positions
     * @returns {Array<number>} Each position modulo the period
     */
    fold(positions) {
        const p = this.period;
        return positions.map((x) => ((Math.round(x) % p) + p) % p);
    }

    /**
     * Mean weight at the positions, over the maximum weight. 1 means every
     * event sits on a strongest place, 0 means every event sits on a
     * zero-weight place. Empty input scores 0.
     * @param {Array<number>} positions
     * @returns {number} 0..1
     */
    fit(positions) {
        if (positions.length === 0) return 0;
        const max = this.max;
        if (max === 0) return 0;
        const sum = positions.reduce((s, x) => s + this.at(x), 0);
        return sum / (positions.length * max);
    }

    /**
     * Fraction of positions sitting at or below `threshold` weight — Bodzsar's
     * "stops on the X".
     * @param {Array<number>} positions
     * @param {number} [threshold=0]
     * @returns {number} 0..1
     */
    rareRate(positions, threshold = 0) {
        if (positions.length === 0) return 0;
        const rare = positions.filter((x) => this.at(x) <= threshold).length;
        return rare / positions.length;
    }

    /**
     * A copy shifted later by `k` positions: the new weight at `p` is the old
     * weight at `p - k`. Rotating a two-bar clave profile by half its period
     * swaps 2-3 for 3-2; rotating a pitch-class profile by the tonic moves it
     * from C to any key.
     * @param {number} k
     * @returns {Profile}
     */
    rotate(k) {
        const p = this.period;
        const shift = ((Math.round(k) % p) + p) % p;
        const weights = new Array(p);
        for (let i = 0; i < p; i++) {
            weights[i] = this.weights[((i - shift) % p + p) % p];
        }
        return new Profile({ weights, name: this.name, phase: (this.phase + shift) % p });
    }

    /**
     * Which rotation of this profile best explains the positions. With no
     * `candidates` every rotation is tried, which finds the phase of any
     * cyclic pattern; pass `[0, period / 2]` to decide only between the two
     * clave orientations.
     * @param {Array<number>} positions
     * @param {Object} [options]
     * @param {Array<number>} [options.candidates] - Rotations to consider
     * @returns {{ rotation: number, fit: number, profile: Profile }}
     */
    bestRotation(positions, { candidates } = {}) {
        const list = candidates ?? Array.from({ length: this.period }, (_, i) => i);
        let best = null;
        for (const k of list) {
            const rotated = this.rotate(k);
            const fit = rotated.fit(positions);
            if (best === null || fit > best.fit) best = { rotation: k, fit, profile: rotated };
        }
        return best;
    }

    /**
     * Rescale so the largest weight equals `top`. Bodzsar draws three levels
     * (0, 1, 2); a histogram from a corpus has counts. Both compare once
     * normalised.
     * @param {number} [top=1]
     * @returns {Profile}
     */
    normalize(top = 1) {
        const max = this.max;
        if (max === 0) return new Profile({ weights: this.weights, name: this.name, phase: this.phase });
        return new Profile({
            weights: this.weights.map((w) => (w / max) * top),
            name: this.name,
            phase: this.phase,
        });
    }

    /**
     * Quantise weights to `levels` evenly spaced steps — turns a smooth
     * histogram into the 0/1/2 map the book draws.
     * @param {number} [levels=3]
     * @returns {Profile}
     */
    quantize(levels = 3) {
        const max = this.max;
        if (max === 0 || levels < 2) return this.normalize(0);
        const step = max / (levels - 1);
        return new Profile({
            weights: this.weights.map((w) => Math.round(w / step)),
            name: this.name,
            phase: this.phase,
        });
    }

    /**
     * Fold positions into a histogram and make it a profile. This is what
     * Bodzsar did by hand over Cuban recordings: count where the stops land
     * across a two-bar cycle. `positions` are integer pulses; pass the output
     * of `analysis.onsetGrid(...)` or anything else that yields them.
     * @param {Array<number>} positions
     * @param {Object} options
     * @param {number} options.period - Cycle length in positions
     * @param {string} [options.name]
     * @returns {Profile}
     */
    static fromPositions(positions, { period, name = 'corpus' } = {}) {
        if (!Number.isInteger(period) || period <= 0) {
            throw new Error('Profile.fromPositions requires a positive integer period');
        }
        const weights = new Array(period).fill(0);
        for (const x of positions) {
            weights[((Math.round(x) % period) + period) % period]++;
        }
        return new Profile({ weights, name });
    }

    toJSON() {
        return { name: this.name, phase: this.phase, weights: this.weights.slice() };
    }
}
