/**
 * @typedef {Object} ComplexPoint
 * @property {number} real - Real component
 * @property {number} imaginary - Imaginary component
 */

/**
 * Base class for complex plane fractals (Mandelbrot, Julia, Burning Ship, etc.)
 *
 * Constructor accepts `center` and `size`:
 *   { center: { x, y }, size: { w, h } }
 *
 * `xMin/xMax/yMin/yMax` are deprecated — pass center and size instead.
 *
 * Subclasses must implement `iterate(point)` and the `type` getter.
 */
export class ComplexPlaneFractal {
  constructor(options = {}) {
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.maxIterations = options.maxIterations || 100;

    if (options.center && options.size) {
      // Primary API: center and size
      this._center = { x: options.center.x, y: options.center.y };
      this._size = { w: options.size.w, h: options.size.h };
    } else if (options.xMin !== undefined || options.xMax !== undefined ||
               options.yMin !== undefined || options.yMax !== undefined) {
      // Deprecated: xMin/xMax/yMin/yMax
      console.warn('[jmon/algo] xMin/xMax/yMin/yMax are deprecated. Use center and size instead.');
      const xMin = options.xMin ?? -2.5;
      const xMax = options.xMax ?? 1.5;
      const yMin = options.yMin ?? -2.0;
      const yMax = options.yMax ?? 2.0;
      this._center = { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 };
      this._size = { w: xMax - xMin, h: yMax - yMin };
    } else {
      // Defaults: full Mandelbrot view
      this._center = { x: -0.5, y: 0 };
      this._size = { w: 4, h: 4 };
    }

    // Internal bounds computed from center and size
    this.xMin = this._center.x - this._size.w / 2;
    this.xMax = this._center.x + this._size.w / 2;
    this.yMin = this._center.y - this._size.h / 2;
    this.yMax = this._center.y + this._size.h / 2;
  }

  /** @returns {string} Fractal type identifier */
  get type() {
    throw new Error('Subclasses must implement the type getter');
  }

  /** @returns {{x: number, y: number}} Center of the viewing window */
  get center() {
    return { ...this._center };
  }

  /** @returns {{w: number, h: number}} Size of the viewing window */
  get size() {
    return { ...this._size };
  }

  /** @returns {{xMin: number, xMax: number, yMin: number, yMax: number}} Bounds (computed from center and size) */
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
   * Convert the 2D iteration grid to flat plot data, one row per cell.
   * Returns data rather than a rendered figure — draw it with whichever
   * plotting library you like (Observable Plot, d3, Vega, ...).
   *
   * @param {number[][]} [grid] - Optional grid to convert (defaults to `generate()`)
   * @returns {Array<{x: number, y: number, value: number}>} Flat plot data
   *
   * @example
   * const mb = new Mandelbrot({ width: 600, height: 600, maxIterations: 100 });
   * const plotData = mb.toPlotData();
   * // Use with Observable Plot:
   * Plot.plot({
   *   color: { scheme: "viridis" },
   *   marks: [Plot.raster(plotData, { x: "x", y: "y", fill: "value" })]
   * })
   *
   * @example Reuse a grid you already generated
   * const grid = mb.generate();
   * const notes = mb.gridToNotes({ grid, pitches });
   * const plotData = mb.toPlotData(grid);   // no second pass over the plane
   */
  toPlotData(grid = null) {
    const data = grid || this.generate();
    const plotData = [];

    data.forEach((row, y) => {
      row.forEach((value, x) => {
        plotData.push({ x, y, value });
      });
    });

    return plotData;
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

  /**
   * Treat the 2D iteration grid as a piano roll.
   * x-axis = time, y-axis = pitch. Boundary pixels (iteration counts
   * between thresholdMin and thresholdMax fractions of maxIterations)
   * become active notes. Velocity is derived from the local iteration
   * gradient magnitude. Consecutive same-pitch notes are merged into
   * single longer notes.
   *
   * @param {Object} options
   * @param {number[][]} options.grid - 2D iteration-count array (from generate())
   * @param {number[]} options.pitches - MIDI pitch values, one per grid row (length must equal grid height)
   * @param {number} [options.thresholdMin=0.1] - Lower boundary fraction of maxIterations
   * @param {number} [options.thresholdMax=0.95] - Upper boundary fraction of maxIterations
   * @param {number} [options.duration=1] - Duration of each time step in quarter notes
   * @param {number} [options.maxDuration=Infinity] - Maximum merged note duration in quarter notes
   * @returns {{ pitch: number, time: number, duration: number, velocity: number }[]} JMON note array
   */
  gridToNotes({ grid, pitches, thresholdMin = 0.1, thresholdMax = 0.95, duration = 1, maxDuration = Infinity }) {
    const height = grid.length;
    const width = grid[0]?.length || 0;
    if (height === 0 || width === 0 || !pitches || pitches.length === 0) return [];

    const lo = thresholdMin * this.maxIterations;
    const hi = thresholdMax * this.maxIterations;

    // Compute gradient magnitude for velocity
    const gradient = [];
    for (let y = 0; y < height; y++) {
      gradient[y] = [];
      for (let x = 0; x < width; x++) {
        const dx = (grid[y][Math.min(x + 1, width - 1)] - grid[y][Math.max(x - 1, 0)]) / 2;
        const dy = ((grid[Math.min(y + 1, height - 1)] || grid[y])[x] - (grid[Math.max(y - 1, 0)])[x]) / 2;
        gradient[y][x] = Math.sqrt(dx * dx + dy * dy);
      }
    }

    // Find max gradient for normalization
    let maxGrad = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (gradient[y][x] > maxGrad) maxGrad = gradient[y][x];
      }
    }
    if (maxGrad === 0) maxGrad = 1;

    // Build raw note events — row 0 maps to the highest pitch (top of piano roll)
    const raw = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const v = grid[y][x];
        if (v >= lo && v <= hi) {
          const pitchIndex = height - 1 - y; // flip: top row = high pitch
          const pitch = pitches[Math.min(pitchIndex, pitches.length - 1)];
          const vel = 0.2 + 0.8 * (gradient[y][x] / maxGrad);
          raw.push({ pitch, time: x * duration, duration, velocity: vel });
        }
      }
    }

    // Merge consecutive same-pitch notes
    if (raw.length === 0) return [];

    // Sort by pitch then time
    raw.sort((a, b) => a.pitch - b.pitch || a.time - b.time);

    const merged = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = raw[i];
      if (curr.pitch === prev.pitch && Math.abs(curr.time - (prev.time + prev.duration)) < 0.001 && prev.duration < maxDuration) {
        // Merge: extend duration, average velocity
        const totalDur = prev.duration + curr.duration;
        prev.velocity = (prev.velocity * prev.duration + curr.velocity * curr.duration) / totalDur;
        prev.duration = totalDur;
      } else {
        merged.push({ ...curr });
      }
    }

    // Sort final output by time then pitch
    merged.sort((a, b) => a.time - b.time || a.pitch - b.pitch);

    return merged;
  }
}
