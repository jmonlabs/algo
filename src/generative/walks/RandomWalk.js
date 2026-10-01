import { random } from '../../shared/random.js';

/**
 * A Brownian walk in one or more dimensions: at each step the velocity
 * takes a random push, decays a little, and may be pulled toward an
 * attractor; the position bounces off its bounds. Walkers may branch and
 * merge; the recorded position is their average.
 *
 * @example
 * // 32 positions in one dimension, pulled toward 0
 * new RandomWalk({ stepSize: 2, bounds: [-12, 12], attractor: { strength: 0.05 } })
 *   .line({ length: 32, seed: 7 });
 */
export class RandomWalk {
  /**
   * @param {Object} [options]
   * @param {number} [options.dimensions=1]
   * @param {number} [options.stepSize=1] - Largest random push per step
   * @param {Array<number>} [options.bounds=[-100, 100]] - `[low, high]`, in every dimension
   * @param {number} [options.branching=0.05] - Probability, per step and walker, of a branch
   * @param {number} [options.merging=0.02] - Probability that two close walkers merge
   * @param {{strength: number, position: Array<number>}} [options.attractor] - A pull toward `position` (the origin by default), `strength` per unit of distance
   */
  constructor({ dimensions = 1, stepSize = 1, bounds = [-100, 100], branching = 0.05, merging = 0.02, attractor = {} } = {}) {
    this.dimensions = dimensions;
    this.stepSize = stepSize;
    this.bounds = bounds;
    this.branching = branching;
    this.merging = merging;
    this.attractor = {
      strength: attractor.strength ?? 0,
      position: attractor.position ?? Array(dimensions).fill(0),
    };
  }

  /**
   * The positions, one per step: each an array of `dimensions` numbers.
   * @param {Object} options
   * @param {number} options.length - How many steps
   * @param {number} [options.seed] - The same seed gives the same walk
   * @param {Array<number>} [options.start] - Where the walk begins; the origin by default
   * @returns {Array<Array<number>>}
   */
  generate({ length, seed, start } = {}) {
    if (!(length > 0)) throw new Error('RandomWalk.generate: `length` is how many steps, at least 1');
    const rng = seed === undefined ? Math.random : random(seed);
    const d = this.dimensions;
    let walkers = [{ position: [...(start ?? Array(d).fill(0))], velocity: Array(d).fill(0) }];
    const history = [];

    for (let step = 0; step < length; step++) {
      for (const w of walkers) {
        for (let i = 0; i < d; i++) {
          const push = (rng() - 0.5) * 2 * this.stepSize;
          const pull = -this.attractor.strength * (w.position[i] - this.attractor.position[i]);
          w.velocity[i] = w.velocity[i] * 0.9 + push + pull;
          w.position[i] += w.velocity[i];
          if (w.position[i] < this.bounds[0]) {
            w.position[i] = this.bounds[0];
            w.velocity[i] *= -0.5;
          } else if (w.position[i] > this.bounds[1]) {
            w.position[i] = this.bounds[1];
            w.velocity[i] *= -0.5;
          }
        }
      }
      history.push(Array.from({ length: d }, (_, i) => walkers.reduce((s, w) => s + w.position[i], 0) / walkers.length));

      const born = [];
      for (const w of walkers) {
        if (rng() < this.branching) {
          born.push({ position: [...w.position], velocity: w.velocity.map((v) => v + (rng() - 0.5) * this.stepSize) });
        }
      }
      walkers.push(...born);

      if (walkers.length > 1) {
        const gone = new Set();
        const near = this.stepSize * 2;
        for (let i = 0; i < walkers.length; i++) {
          if (gone.has(i)) continue;
          for (let j = i + 1; j < walkers.length; j++) {
            if (gone.has(j) || rng() >= this.merging) continue;
            const a = walkers[i], b = walkers[j];
            const distance = Math.sqrt(a.position.reduce((s, p, k) => s + (p - b.position[k]) ** 2, 0));
            if (distance < near) {
              for (let k = 0; k < d; k++) {
                a.position[k] = (a.position[k] + b.position[k]) / 2;
                a.velocity[k] = (a.velocity[k] + b.velocity[k]) / 2;
              }
              gone.add(j);
            }
          }
        }
        walkers = walkers.filter((_, i) => !gone.has(i));
      }
    }
    return history;
  }

  /**
   * One dimension of the walk, flat.
   * @param {Object} options - As for `generate`, plus `dimension`
   * @param {number} [options.dimension=0]
   * @returns {Array<number>}
   */
  line({ dimension = 0, ...options } = {}) {
    return this.generate(options).map((p) => p[dimension] ?? 0);
  }
}
