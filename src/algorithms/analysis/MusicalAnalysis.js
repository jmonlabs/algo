/**
 * @typedef {Object} AnalysisOptions
 * @property {number[]} [scale] - Scale to use for dissonance calculation
 * @property {number[]} [weights] - Weights for analysis
 * @property {number} [sampleRate] - Sample rate for analysis
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {number} gini - Gini coefficient
 * @property {number} balance - Balance/center of mass
 * @property {number} motif - Motif score
 * @property {number} dissonance - Dissonance score
 * @property {number} rhythmic - Rhythmic grid alignment
 * @property {number} fibonacciIndex - Fibonacci ratio index
 * @property {number} syncopation - Syncopation score
 * @property {number} contourEntropy - Contour entropy
 * @property {number} intervalVariance - Interval variance
 * @property {number} density - Note density
 * @property {number} gapVariance - Gap variance
 */

/**
 * @typedef {Object} JMonNote
 * @property {string|number} [time] - Note timing
 * @property {string|number|Array<string|number>} [note] - Note value(s)
 * @property {string|number} duration - Note duration
 */

/**
 * Musical analysis tools inspired by the Python djalgo analysis module
 * Provides statistical and musical evaluation metrics for sequences
 */
/**
 * MusicalAnalysis
 * Provides static methods for musical sequence analysis, including Gini coefficient calculation and other metrics.
 *
 * @class
 */
export class MusicalAnalysis {
  /**
   * Calculate Gini coefficient for inequality measurement
   * @param {number[]} values - Values to analyze
   * @param {number[]} [weights] - Optional weights
   * @returns {number} Gini coefficient (0-1)
   */
  static gini(values, weights) {
    if (values.length === 0) return 0;

    const n = values.length;
    const w = weights || Array(n).fill(1);

    // Sort values with corresponding weights
    const pairs = values.map((v, i) => ({ value: v, weight: w[i] }))
      .sort((a, b) => a.value - b.value);

    const sortedValues = pairs.map((p) => p.value);
    const sortedWeights = pairs.map((p) => p.weight);

    const totalWeight = sortedWeights.reduce((sum, w) => sum + w, 0);
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const cumWeight = sortedWeights.slice(0, i + 1).reduce(
        (sum, w) => sum + w,
        0,
      );
      numerator += sortedWeights[i] *
        (2 * cumWeight - sortedWeights[i] - totalWeight) * sortedValues[i];
      denominator += sortedWeights[i] * sortedValues[i] * totalWeight;
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate center of mass (balance point) of a sequence
   * @param {number[]} values - Values to analyze
   * @param {number[]} [weights] - Optional weights
   * @returns {number} Balance point
   */
  static balance(values, weights) {
    if (values.length === 0) return 0;

    const w = weights || Array(values.length).fill(1);
    const weightedSum = values.reduce((sum, val, i) => sum + val * w[i], 0);
    const totalWeight = w.reduce((sum, weight) => sum + weight, 0);

    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  }

  /**
   * Calculate autocorrelation for pattern detection
   * @param {number[]} values - Values to analyze
   * @param {number} [maxLag] - Maximum lag to calculate
   * @returns {number[]} Autocorrelation array
   */
  static autocorrelation(values, maxLag) {
    const n = values.length;
    const lag = maxLag || Math.floor(n / 2);
    const result = [];

    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

    for (let k = 0; k <= lag; k++) {
      let covariance = 0;
      for (let i = 0; i < n - k; i++) {
        covariance += (values[i] - mean) * (values[i + k] - mean);
      }
      covariance /= n - k;
      result.push(variance === 0 ? 0 : covariance / variance);
    }

    return result;
  }

  /**
   * Detect and score musical motifs
   * @param {number[]} values - Values to analyze
   * @param {number} [patternLength=3] - Length of patterns to detect
   * @returns {number} Motif score
   */
  static motif(values, patternLength = 3) {
    if (values.length < patternLength * 2) return 0;

    const patterns = new Map();

    for (let i = 0; i <= values.length - patternLength; i++) {
      const pattern = values.slice(i, i + patternLength).join(",");
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    const maxOccurrences = Math.max(...patterns.values());
    const totalPatterns = patterns.size;

    return totalPatterns === 0 ? 0 : maxOccurrences / totalPatterns;
  }

  /**
   * Calculate dissonance/scale conformity
   * @param {number[]} pitches - MIDI pitch values
   * @param {number[]} [scale=[0, 2, 4, 5, 7, 9, 11]] - Scale to check against
   * @returns {number} Dissonance score (0-1)
   */
  static dissonance(pitches, scale = [0, 2, 4, 5, 7, 9, 11]) {
    if (pitches.length === 0) return 0;

    let conformingNotes = 0;

    for (const pitch of pitches) {
      const pitchClass = ((pitch % 12) + 12) % 12;
      if (scale.includes(pitchClass)) {
        conformingNotes++;
      }
    }

    return 1 - (conformingNotes / pitches.length);
  }

  /**
   * Calculate rhythmic fit to a grid
   * @param {number[]} onsets - Onset times
   * @param {number} [gridDivision=16] - Grid division
   * @returns {number} Rhythmic alignment score
   */
  static rhythmic(onsets, gridDivision = 16) {
    if (onsets.length === 0) return 0;

    let gridAlignedCount = 0;
    const tolerance = 0.1; // Allow slight timing variations

    for (const onset of onsets) {
      const gridPosition = onset * gridDivision;
      const nearestGrid = Math.round(gridPosition);
      const deviation = Math.abs(gridPosition - nearestGrid);

      if (deviation <= tolerance) {
        gridAlignedCount++;
      }
    }

    return gridAlignedCount / onsets.length;
  }

  /**
   * Calculate Fibonacci/golden ratio index
   * @param {number[]} values - Values to analyze
   * @returns {number} Fibonacci index
   */
  static fibonacciIndex(values) {
    if (values.length < 2) return 0;

    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    let fibonacciScore = 0;

    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        const ratio = values[i] / values[i - 1];
        const deviation = Math.abs(ratio - goldenRatio);
        fibonacciScore += 1 / (1 + deviation);
      }
    }

    return fibonacciScore / (values.length - 1);
  }

  /**
   * Calculate syncopation (off-beat emphasis)
   * @param {number[]} onsets - Onset times
   * @param {number} [beatDivision=4] - Beat division
   * @returns {number} Syncopation score
   */
  static syncopation(onsets, beatDivision = 4) {
    if (onsets.length === 0) return 0;

    let syncopatedCount = 0;

    for (const onset of onsets) {
      const beatPosition = (onset * beatDivision) % 1;
      // Strong beats are at 0, 0.5; weak beats are at 0.25, 0.75
      const isOffBeat = beatPosition > 0.2 && beatPosition < 0.8 &&
        Math.abs(beatPosition - 0.5) > 0.2;

      if (isOffBeat) {
        syncopatedCount++;
      }
    }

    return syncopatedCount / onsets.length;
  }

  /**
   * Calculate contour entropy (melodic direction randomness)
   * @param {number[]} pitches - Pitch values
   * @returns {number} Contour entropy
   */
  static contourEntropy(pitches) {
    if (pitches.length < 2) return 0;

    const directions = [];

    for (let i = 1; i < pitches.length; i++) {
      const diff = pitches[i] - pitches[i - 1];
      if (diff > 0) directions.push(1); // Up
      else if (diff < 0) directions.push(-1); // Down
      else directions.push(0); // Same
    }

    const counts = { up: 0, down: 0, same: 0 };
    for (const dir of directions) {
      if (dir > 0) counts.up++;
      else if (dir < 0) counts.down++;
      else counts.same++;
    }

    const total = directions.length;
    const probabilities = [
      counts.up / total,
      counts.down / total,
      counts.same / total,
    ]
      .filter((p) => p > 0);

    return -probabilities.reduce((entropy, p) => entropy + p * Math.log2(p), 0);
  }

  /**
   * Calculate interval variance (pitch stability)
   * @param {number[]} pitches - Pitch values
   * @returns {number} Interval variance
   */
  static intervalVariance(pitches) {
    if (pitches.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < pitches.length; i++) {
      intervals.push(Math.abs(pitches[i] - pitches[i - 1]));
    }

    const mean = intervals.reduce((sum, interval) => sum + interval, 0) /
      intervals.length;
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - mean, 2),
        0,
      ) / intervals.length;

    return variance;
  }

  /**
   * Calculate note density (notes per unit time)
   * @param {JMonNote[]} notes - Array of notes
   * @param {number} [timeWindow=1] - Time window for density calculation
   * @returns {number} Note density
   */
  static density(notes, timeWindow = 1) {
    if (notes.length === 0) return 0;

    // Convert time to numeric for calculation
    const numericTimes = notes.map((note) => {
      if (typeof note.time === "string") {
        // Simple conversion for demonstration - would need proper time parsing
        return parseFloat(note.time) || 0;
      }
      return note.time || 0;
    });

    const minTime = Math.min(...numericTimes);
    const maxTime = Math.max(...numericTimes);
    const totalTime = maxTime - minTime || 1;

    return notes.length / (totalTime / timeWindow);
  }

  /**
   * Calculate gap variance (timing consistency)
   * @param {number[]} onsets - Onset times
   * @returns {number} Gap variance
   */
  static gapVariance(onsets) {
    if (onsets.length < 2) return 0;

    const gaps = [];
    for (let i = 1; i < onsets.length; i++) {
      gaps.push(onsets[i] - onsets[i - 1]);
    }

    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance =
      gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length;

    return variance;
  }

  /**
   * Sorted onset times extracted from notes
   * @param {JMonNote[]} notes - Array of notes
   * @returns {number[]} Sorted onset times
   */
  static onsets(notes) {
    return notes
      .map((note) =>
        typeof note.time === "number" ? note.time : parseFloat(note.time) || 0
      )
      .sort((a, b) => a - b);
  }

  /**
   * Density per fixed-size time window (vector form of `density`)
   * @param {JMonNote[]} notes - Array of notes
   * @param {number} [windowSize=1] - Window size in time units
   * @returns {number[]} Note count per window, from min to max time
   */
  static densityCurve(notes, windowSize = 1) {
    if (notes.length === 0) return [];

    const times = notes.map((note) =>
      typeof note.time === "number" ? note.time : parseFloat(note.time) || 0
    );
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const numWindows = Math.max(
      1,
      Math.floor((maxTime - minTime) / windowSize) + 1,
    );
    const curve = new Array(numWindows).fill(0);

    for (const t of times) {
      const idx = Math.min(
        Math.floor((t - minTime) / windowSize),
        numWindows - 1,
      );
      curve[idx]++;
    }

    return curve;
  }

  /**
   * Mean velocity per fixed-size time window
   * @param {JMonNote[]} notes - Array of notes (with optional `velocity` field)
   * @param {number} [windowSize=1] - Window size in time units
   * @returns {number[]} Mean velocity per window (0 for empty windows)
   */
  static velocityEnvelope(notes, windowSize = 1) {
    if (notes.length === 0) return [];

    const times = notes.map((note) =>
      typeof note.time === "number" ? note.time : parseFloat(note.time) || 0
    );
    const velocities = notes.map((note) =>
      typeof note.velocity === "number" ? note.velocity : 1
    );
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const numWindows = Math.max(
      1,
      Math.floor((maxTime - minTime) / windowSize) + 1,
    );
    const sums = new Array(numWindows).fill(0);
    const counts = new Array(numWindows).fill(0);

    for (let i = 0; i < notes.length; i++) {
      const idx = Math.min(
        Math.floor((times[i] - minTime) / windowSize),
        numWindows - 1,
      );
      sums[idx] += velocities[i];
      counts[idx]++;
    }

    return sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
  }

  /**
   * Rhythmic signature: normalized histogram of onset positions within
   * a unit-1 cycle. With `bins=16` and time in bars, this gives a
   * 16th-note grid profile of where notes tend to land.
   * Useful as a compact rhythm fingerprint to bias a follow/diverge
   * drummer.
   * @param {JMonNote[]} notes - Array of notes
   * @param {number} [bins=16] - Number of bins per cycle
   * @returns {number[]} Probability distribution across bins (sums to 1, or all zeros if empty)
   */
  static rhythmicSignature(notes, bins = 16) {
    const histogram = new Array(bins).fill(0);
    if (notes.length === 0) return histogram;

    for (const note of notes) {
      const t = typeof note.time === "number"
        ? note.time
        : parseFloat(note.time) || 0;
      const phase = ((t % 1) + 1) % 1;
      const idx = Math.min(Math.floor(phase * bins), bins - 1);
      histogram[idx]++;
    }

    const total = histogram.reduce((s, v) => s + v, 0);
    return total === 0 ? histogram : histogram.map((v) => v / total);
  }

  /**
   * Comprehensive analysis of a musical sequence
   * @param {JMonNote[]} notes - Array of notes to analyze
   * @param {AnalysisOptions} [options={}] - Analysis options
   * @returns {AnalysisResult} Analysis results
   */
  static analyze(notes, options = {}) {
    const { scale = [0, 2, 4, 5, 7, 9, 11] } = options;

    // Extract pitch and timing data
    const pitches = notes.map((note) => {
      if (typeof note.note === "number") return note.note;
      if (typeof note.note === "string") {
        // Simple MIDI note conversion - would need proper note parsing
        return 60; // Default to middle C
      }
      return Array.isArray(note.note) ? note.note[0] : 60;
    });

    const onsets = notes.map((note) => {
      if (typeof note.time === "number") return note.time;
      return parseFloat(note.time) || 0;
    });

    return {
      gini: this.gini(pitches),
      balance: this.balance(pitches),
      motif: this.motif(pitches),
      dissonance: this.dissonance(pitches, scale),
      rhythmic: this.rhythmic(onsets),
      fibonacciIndex: this.fibonacciIndex(pitches),
      syncopation: this.syncopation(onsets),
      contourEntropy: this.contourEntropy(pitches),
      intervalVariance: this.intervalVariance(pitches),
      density: this.density(notes),
      gapVariance: this.gapVariance(onsets),
    };
  }
}
