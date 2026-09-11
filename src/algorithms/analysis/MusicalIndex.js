import { MusicalAnalysis } from './MusicalAnalysis.js';

/**
 * An instance view over `MusicalAnalysis` for one sequence of values
 * (pitches, durations, or offsets). Every method calls the same static
 * function of `MusicalAnalysis`, so a score here is comparable with a score
 * there. Rests (null entries) are dropped for every metric except
 * `restProportion`.
 *
 * @example
 * const index = new MusicalIndex([60, 62, 64, 62, 60]);
 * index.motifStrength();   // same number as MusicalAnalysis.motifStrength([...])
 */
export class MusicalIndex {
  /**
   * @param {Array} sequence - Values; null entries are rests
   */
  constructor(sequence) {
    this.originalSequence = sequence;
    this.sequence = sequence.filter((v) => v !== null && v !== undefined);
  }

  /** Inequality of the values, 0 (all equal) to 1. */
  gini() { return MusicalAnalysis.gini(this.sequence); }

  /** Coefficient of variation around the mean. */
  spread() { return MusicalAnalysis.spread(this.sequence); }

  /** How much the sequence repeats itself (patterns of length 2 to `maxMotifLength`). */
  motifStrength(maxMotifLength = 4) { return MusicalAnalysis.motifStrength(this.sequence, maxMotifLength); }

  /** Share of values whose pitch class is outside `scale`. */
  dissonance(scale) {
    if (!scale || scale.length === 0) return 0;
    return MusicalAnalysis.dissonance(this.sequence, scale.map((p) => ((p % 12) + 12) % 12));
  }

  /** How well the values, read as durations, tile measures of `measureLength`. */
  measureFit(measureLength = 4) { return MusicalAnalysis.measureFit(this.sequence, measureLength); }

  /** Share of rests in the original sequence. */
  restProportion() { return MusicalAnalysis.restProportion(this.originalSequence); }

  /**
   * Every metric at once.
   * @param {Array<number>} [scale] - For `dissonance`; omitted gives 0
   * @param {number} [measureLength=4]
   */
  calculateAll(scale = null, measureLength = 4) {
    return {
      gini: this.gini(),
      spread: this.spread(),
      motifStrength: this.motifStrength(),
      dissonance: scale ? this.dissonance(scale) : 0,
      measureFit: this.measureFit(measureLength),
      rest: this.restProportion(),
    };
  }

  /** Mean, standard deviation, min, max and range of the values. */
  getStats() {
    if (this.sequence.length === 0) return { mean: 0, std: 0, min: 0, max: 0, range: 0 };
    const mean = this.sequence.reduce((s, v) => s + v, 0) / this.sequence.length;
    const variance = this.sequence.reduce((s, v) => s + (v - mean) ** 2, 0) / this.sequence.length;
    const min = Math.min(...this.sequence);
    const max = Math.max(...this.sequence);
    return { mean, std: Math.sqrt(variance), min, max, range: max - min };
  }

  /**
   * Similarity to another index, 0..1: one minus the mean normalised
   * difference over every metric of `calculateAll`.
   * @param {MusicalIndex} other
   */
  similarity(other, scale = null, measureLength = 4) {
    const a = this.calculateAll(scale, measureLength);
    const b = other.calculateAll(scale, measureLength);
    let total = 0;
    let count = 0;
    for (const [key, va] of Object.entries(a)) {
      const vb = b[key];
      if (typeof va !== 'number' || typeof vb !== 'number') continue;
      total += 1 - Math.abs(va - vb) / Math.max(Math.abs(va), Math.abs(vb), 1);
      count++;
    }
    return count === 0 ? 0 : total / count;
  }
}
