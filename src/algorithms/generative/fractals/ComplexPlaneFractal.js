/**
 * @typedef {Object} ComplexPoint
 * @property {number} real - Real component
 * @property {number} imaginary - Imaginary component
 */

/**
 * Base class for complex plane fractals (Mandelbrot, Julia, Burning Ship, etc.)
 *
 * Supports two coordinate formats:
 * - Bounds: `{ xMin, xMax, yMin, yMax }`
 * - Center + size: `{ center: { x, y }, size: { w, h } }`
 *
 * Subclasses must implement `iterate(point)` and the `type` getter.
 */
export class ComplexPlaneFractal {
  constructor(options = {}) {
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.maxIterations = options.maxIterations || 100;

    if (options.center && options.size) {
      this.xMin = options.center.x - options.size.w / 2;
      this.xMax = options.center.x + options.size.w / 2;
      this.yMin = options.center.y - options.size.h / 2;
      this.yMax = options.center.y + options.size.h / 2;
    } else {
      this.xMin = options.xMin ?? -2.5;
      this.xMax = options.xMax ?? 1.5;
      this.yMin = options.yMin ?? -2.0;
      this.yMax = options.yMax ?? 2.0;
    }
  }

  /** @returns {string} Fractal type identifier */
  get type() {
    throw new Error('Subclasses must implement the type getter');
  }

  /** @returns {{x: number, y: number}} Center of the viewing window */
  get center() {
    return { x: (this.xMin + this.xMax) / 2, y: (this.yMin + this.yMax) / 2 };
  }

  /** @returns {{w: number, h: number}} Size of the viewing window */
  get size() {
    return { w: this.xMax - this.xMin, h: this.yMax - this.yMin };
  }

  /** @returns {{xMin: number, xMax: number, yMin: number, yMax: number}} Bounds */
  get bounds() {
    return { xMin: this.xMin, xMax: this.xMax, yMin: this.yMin, yMax: this.yMax };
  }

  /**
   * Calculate iterations for a point in the complex plane.
   * Subclasses must implement this.
   * @param {ComplexPoint} point - Point in the complex plane
   * @returns {number} Number of iterations before escape
   */
  iterate(point) {
    throw new Error('Subclasses must implement iterate()');
  }

  /**
   * Generate fractal data as a 2D grid of iteration counts.
   * @returns {number[][]} 2D array of iteration counts
   */
  generate() {
    const data = [];

    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const real = this.xMin + (x / this.width) * (this.xMax - this.xMin);
        const imaginary = this.yMin + (y / this.height) * (this.yMax - this.yMin);
        row.push(this.iterate({ real, imaginary }));
      }
      data.push(row);
    }

    return data;
  }

  /**
   * Extract sequence from fractal data using various methods
   * @param {'diagonal'|'border'|'spiral'|'column'|'row'} [method='diagonal']
   * @param {number} [index=0] - Index for column/row extraction
   * @returns {number[]} Extracted sequence
   */
  extractSequence(method = 'diagonal', index = 0) {
    const data = this.generate();

    switch (method) {
      case 'diagonal': return this.extractDiagonal(data);
      case 'border':   return this.extractBorder(data);
      case 'spiral':   return this.extractSpiral(data);
      case 'column':   return this.extractColumn(data, index);
      case 'row':      return this.extractRow(data, index);
      default:         return this.extractDiagonal(data);
    }
  }

  extractDiagonal(data) {
    const sequence = [];
    const minDimension = Math.min(data.length, data[0]?.length || 0);
    for (let i = 0; i < minDimension; i++) {
      sequence.push(data[i][i]);
    }
    return sequence;
  }

  extractBorder(data) {
    const sequence = [];
    const height = data.length;
    const width = data[0]?.length || 0;
    if (height === 0 || width === 0) return sequence;

    for (let x = 0; x < width; x++) sequence.push(data[0][x]);
    for (let y = 1; y < height; y++) sequence.push(data[y][width - 1]);
    if (height > 1) {
      for (let x = width - 2; x >= 0; x--) sequence.push(data[height - 1][x]);
    }
    if (width > 1) {
      for (let y = height - 2; y > 0; y--) sequence.push(data[y][0]);
    }
    return sequence;
  }

  extractSpiral(data) {
    const sequence = [];
    const height = data.length;
    const width = data[0]?.length || 0;
    if (height === 0 || width === 0) return sequence;

    let top = 0, bottom = height - 1;
    let left = 0, right = width - 1;

    while (top <= bottom && left <= right) {
      for (let x = left; x <= right; x++) sequence.push(data[top][x]);
      top++;
      for (let y = top; y <= bottom; y++) sequence.push(data[y][right]);
      right--;
      if (top <= bottom) {
        for (let x = right; x >= left; x--) sequence.push(data[bottom][x]);
        bottom--;
      }
      if (left <= right) {
        for (let y = bottom; y >= top; y--) sequence.push(data[y][left]);
        left++;
      }
    }
    return sequence;
  }

  extractColumn(data, columnIndex) {
    const sequence = [];
    const width = data[0]?.length || 0;
    const clampedIndex = Math.max(0, Math.min(columnIndex, width - 1));
    for (const row of data) {
      if (row[clampedIndex] !== undefined) sequence.push(row[clampedIndex]);
    }
    return sequence;
  }

  extractRow(data, rowIndex) {
    const clampedIndex = Math.max(0, Math.min(rowIndex, data.length - 1));
    return data[clampedIndex] ? [...data[clampedIndex]] : [];
  }

  /**
   * Map fractal values to musical scale pitches
   * @param {Object} options
   * @param {number[]} options.sequence - Fractal sequence to map
   * @param {number[]} options.pitches - MIDI pitch values to map to
   * @returns {number[]} MIDI note sequence
   */
  mapToScale({ sequence, pitches }) {
    if (sequence.length === 0) return [];
    if (!pitches || pitches.length === 0) {
      throw new Error('pitches array is required and must not be empty');
    }

    const minVal = Math.min(...sequence);
    const maxVal = Math.max(...sequence);
    const range = maxVal - minVal || 1;

    return sequence.map(value => {
      const normalized = (value - minVal) / range;
      const index = Math.floor(normalized * (pitches.length - 1));
      return pitches[index];
    });
  }

  /**
   * Generate rhythmic pattern from fractal data
   * @param {Object} options
   * @param {number[]} options.sequence - Fractal sequence
   * @param {number[]} [options.subdivisions=[1, 2, 4, 8, 16]]
   * @returns {number[]} Rhythmic durations
   */
  mapToRhythm({ sequence, subdivisions = [1, 2, 4, 8, 16] }) {
    if (sequence.length === 0) return [];

    const minVal = Math.min(...sequence);
    const maxVal = Math.max(...sequence);
    const range = maxVal - minVal || 1;

    return sequence.map(value => {
      const normalized = (value - minVal) / range;
      const subdivisionIndex = Math.floor(normalized * subdivisions.length);
      const clampedIndex = Math.max(0, Math.min(subdivisionIndex, subdivisions.length - 1));
      return 1 / subdivisions[clampedIndex];
    });
  }
}
