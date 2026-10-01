import { random } from '../../shared/random.js';

/**
 * A walk by steps drawn from a list: each step adds one of `steps` to the
 * position, kept within `range`. The walk may branch (a second walker sets
 * off from the same place) and branches may merge back when they meet.
 *
 * @example
 * // One line of 16 values between 0 and 7, stepping by -1, 0 or 1
 * new Chain({ range: [0, 7], start: 3 }).line({ length: 16, seed: 42 });
 *
 * // Branching walks, as notes: a chord wherever two walkers sound at once
 * const chain = new Chain({ range: [60, 72], start: 64, branching: 0.1, merging: 0.2 });
 * chain.notes(chain.generate({ length: 16, seed: 1 }), { durations: [0.5] });
 */
export class Chain {
  /**
   * @param {Object} [options]
   * @param {Array<number>} [options.range] - `[low, high]` the position stays within; unbounded if absent
   * @param {number} [options.start] - The first position; the middle of `range`, or 0
   * @param {Array<number>|{mean: number, std: number}} [options.steps=[-1, 0, 1]] - The steps drawn from, or a normal distribution of them
   * @param {number} [options.roundTo] - Decimals a normal step is rounded to
   * @param {number} [options.branching=0] - Probability, per step, that a walker branches
   * @param {number} [options.merging=0] - Probability that two walkers at the same place merge
   */
  constructor({ range = null, start, steps = [-1, 0, 1], roundTo = null, branching = 0, merging = 0 } = {}) {
    this.range = range;
    this.start = start ?? (range ? Math.floor((range[1] - range[0]) / 2) + range[0] : 0);
    this.steps = steps;
    this.roundTo = roundTo;
    this.branching = branching;
    this.merging = merging;
  }

  /**
   * The walks: one list per walker, `length` long, `null` where the walker
   * is not alive (before it branched off, after it merged).
   * @param {Object} options
   * @param {number} options.length - How many positions
   * @param {number} [options.seed] - The same seed gives the same walks
   * @returns {Array<Array<number|null>>}
   */
  generate({ length, seed } = {}) {
    if (!(length > 0)) throw new Error('Chain.generate: `length` is how many positions, at least 1');
    const rng = seed === undefined ? Math.random : random(seed);
    const walks = [this._walk(length)];
    let positions = [this.start];

    for (let step = 1; step < length; step++) {
      const next = [...positions];
      const born = [];
      for (let w = 0; w < positions.length; w++) {
        if (positions[w] === null) {
          walks[w][step] = null;
          continue;
        }
        const moved = this._bounded(positions[w] + this._step(rng));
        walks[w][step] = moved;
        next[w] = moved;
        if (rng() < this.branching) {
          const branch = this._walk(length, null);
          branch[step] = this._bounded(positions[w] + this._step(rng));
          born.push(branch);
          next.push(branch[step]);
        }
      }
      walks.push(...born);
      positions = this._merge(walks, next, step, rng);
    }
    return walks;
  }

  /**
   * One walk, flat, without branching: `length` positions.
   * @param {Object} options
   * @param {number} options.length
   * @param {number} [options.seed]
   * @returns {Array<number>}
   */
  line({ length, seed } = {}) {
    const single = new Chain({ range: this.range, start: this.start, steps: this.steps, roundTo: this.roundTo });
    return single.generate({ length, seed })[0];
  }

  /**
   * Walks as notes, one step after the other: a note where one walker is
   * alive, a chord where several are.
   * @param {Array<Array<number|null>>} walks - From `generate`
   * @param {Object} [options]
   * @param {Array<number>} [options.durations=[1]] - Cycled over the steps
   * @returns {Array} JMON notes
   */
  notes(walks, { durations = [1] } = {}) {
    const notes = [];
    let time = 0;
    let i = 0;
    const length = Math.max(...walks.map((w) => w.length));
    for (let step = 0; step < length; step++) {
      const alive = walks.map((w) => w[step]).filter((p) => p !== null && p !== undefined);
      if (alive.length === 0) continue;
      const duration = durations[i % durations.length];
      notes.push({ pitch: alive.length === 1 ? alive[0] : alive, duration, time });
      time += duration;
      i++;
    }
    return notes;
  }

  /** @private */
  _walk(length, first = this.start) {
    const walk = new Array(length).fill(null);
    walk[0] = first;
    return walk;
  }

  /** @private One step, from the list or the distribution. */
  _step(rng) {
    if (Array.isArray(this.steps)) return this.steps[Math.floor(rng() * this.steps.length)];
    const { mean, std } = this.steps;
    let u1;
    do { u1 = rng(); } while (u1 === 0);
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rng());
    const step = mean + std * z;
    return this.roundTo === null ? step : parseFloat(step.toFixed(this.roundTo));
  }

  /** @private */
  _bounded(position) {
    if (this.range === null) return position;
    return Math.min(this.range[1], Math.max(this.range[0], position));
  }

  /** @private Walkers at the same place may merge: the later one ends. */
  _merge(walks, positions, step, rng) {
    const next = [...positions];
    const tolerance = this.roundTo !== null ? this.roundTo : 0.001;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] === null) continue;
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[j] === null) continue;
        if (Math.abs(positions[i] - positions[j]) <= tolerance && rng() < this.merging) {
          next[j] = null;
          for (let k = step; k < walks[j].length; k++) walks[j][k] = null;
        }
      }
    }
    return next;
  }
}
