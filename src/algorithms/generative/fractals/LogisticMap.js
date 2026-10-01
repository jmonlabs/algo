/**
 * The logistic map, x → r·x·(1 − x): a series in the unit interval that is
 * periodic for small r and chaotic from r ≈ 3.57 on.
 *
 * @example
 * new LogisticMap({ r: 3.8, x0: 0.5, iterations: 32 }).generate();
 */
export class LogisticMap {
  /**
   * @param {Object} [options]
   * @param {number} [options.r=3.8] - The parameter; 3.8 is in the chaotic regime
   * @param {number} [options.x0=0.5] - The first value
   * @param {number} [options.iterations=1000] - How many values to keep
   * @param {number} [options.skipTransient=100] - How many to run first and drop
   */
  constructor({ r = 3.8, x0 = 0.5, iterations = 1000, skipTransient = 100 } = {}) {
    this.r = r;
    this.x0 = x0;
    this.iterations = iterations;
    this.skipTransient = skipTransient;
  }

  /**
   * The series, after the transient.
   * @returns {Array<number>} `iterations` values in [0, 1]
   */
  generate() {
    const sequence = [];
    let x = this.x0;
    for (let i = 0; i < this.iterations + this.skipTransient; i++) {
      x = this.r * x * (1 - x);
      if (i >= this.skipTransient) sequence.push(x);
    }
    return sequence;
  }

  /**
   * The bifurcation diagram: for each `r` from `from` to `to`, the last
   * fifty values of the map, as parallel lists `{ r, x }`.
   * @param {Object} [options]
   * @param {number} [options.from=2.5]
   * @param {number} [options.to=4]
   * @param {number} [options.steps=1000] - How many values of r
   * @returns {{r: Array<number>, x: Array<number>}}
   */
  bifurcation({ from = 2.5, to = 4.0, steps = 1000 } = {}) {
    const r = [];
    const x = [];
    const step = (to - from) / steps;
    for (let i = 0; i < steps; i++) {
      const value = from + i * step;
      const map = new LogisticMap({ r: value, x0: this.x0, iterations: this.iterations, skipTransient: this.skipTransient });
      for (const settled of map.generate().slice(-50)) {
        r.push(value);
        x.push(settled);
      }
    }
    return { r, x };
  }
}
