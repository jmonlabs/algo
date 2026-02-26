/**
 * @typedef {Object} MandelbrotOptions
 * @property {number} [width=100] - Width of the fractal grid
 * @property {number} [height=100] - Height of the fractal grid
 * @property {number} [maxIterations=100] - Maximum iterations for convergence
 * @property {number} [xMin=-2.5] - Minimum x coordinate
 * @property {number} [xMax=1.5] - Maximum x coordinate
 * @property {number} [yMin=-2.0] - Minimum y coordinate
 * @property {number} [yMax=2.0] - Maximum y coordinate
 */

/**
 * @typedef {Object} ComplexPoint
 * @property {number} real - Real component
 * @property {number} imaginary - Imaginary component
 */

/**
 * Mandelbrot set fractal generator for musical composition
 * Based on the Python djalgo fractal module
 */
export class Mandelbrot {
  /**
   * @param {MandelbrotOptions} [options={}] - Configuration options
   */
  constructor(options = {}) {
    this.width = options.width || 100;
    this.height = options.height || 100;
    this.maxIterations = options.maxIterations || 100;
    this.xMin = options.xMin || -2.5;
    this.xMax = options.xMax || 1.5;
    this.yMin = options.yMin || -2.0;
    this.yMax = options.yMax || 2.0;
  }

  /**
   * Generate Mandelbrot set data
   * @returns {number[][]} 2D array of iteration counts
   */
  generate() {
    const data = [];
    
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const real = this.xMin + (x / this.width) * (this.xMax - this.xMin);
        const imaginary = this.yMin + (y / this.height) * (this.yMax - this.yMin);
        
        const iterations = this.mandelbrotIterations({ real, imaginary });
        row.push(iterations);
      }
      data.push(row);
    }
    
    return data;
  }

  /**
   * Extract sequence from Mandelbrot data using various methods
   * @param {'diagonal'|'border'|'spiral'|'column'|'row'} [method='diagonal'] - Extraction method
   * @param {number} [index=0] - Index for column/row extraction
   * @returns {number[]} Extracted sequence
   */
  extractSequence(method = 'diagonal', index = 0) {
    const data = this.generate();
    
    switch (method) {
      case 'diagonal':
        return this.extractDiagonal(data);
      
      case 'border':
        return this.extractBorder(data);
      
      case 'spiral':
        return this.extractSpiral(data);
      
      case 'column':
        return this.extractColumn(data, index);
      
      case 'row':
        return this.extractRow(data, index);
      
      default:
        return this.extractDiagonal(data);
    }
  }

  /**
   * Calculate Mandelbrot iterations for a complex point
   * @param {ComplexPoint} c - Complex point to test
   * @returns {number} Number of iterations before escape
   */
  mandelbrotIterations(c) {
    const z = { real: 0, imaginary: 0 };

    for (let i = 0; i < this.maxIterations; i++) {
      // z = z^2 + c
      const zReal = z.real * z.real - z.imaginary * z.imaginary + c.real;
      const zImaginary = 2 * z.real * z.imaginary + c.imaginary;

      z.real = zReal;
      z.imaginary = zImaginary;
      
      // Check if point escapes
      if (z.real * z.real + z.imaginary * z.imaginary > 4) {
        return i;
      }
    }
    
    return this.maxIterations;
  }

  /**
   * Extract diagonal sequence
   * @param {number[][]} data - 2D fractal data
   * @returns {number[]} Diagonal sequence
   */
  extractDiagonal(data) {
    const sequence = [];
    const minDimension = Math.min(data.length, data[0]?.length || 0);
    
    for (let i = 0; i < minDimension; i++) {
      sequence.push(data[i][i]);
    }
    
    return sequence;
  }

  /**
   * Extract border sequence (clockwise)
   * @param {number[][]} data - 2D fractal data
   * @returns {number[]} Border sequence
   */
  extractBorder(data) {
    const sequence = [];
    const height = data.length;
    const width = data[0]?.length || 0;
    
    if (height === 0 || width === 0) return sequence;
    
    // Top row
    for (let x = 0; x < width; x++) {
      sequence.push(data[0][x]);
    }
    
    // Right column (excluding top corner)
    for (let y = 1; y < height; y++) {
      sequence.push(data[y][width - 1]);
    }
    
    // Bottom row (excluding right corner, reverse order)
    if (height > 1) {
      for (let x = width - 2; x >= 0; x--) {
        sequence.push(data[height - 1][x]);
      }
    }
    
    // Left column (excluding corners, reverse order)
    if (width > 1) {
      for (let y = height - 2; y > 0; y--) {
        sequence.push(data[y][0]);
      }
    }
    
    return sequence;
  }

  /**
   * Extract spiral sequence (from outside to inside)
   * @param {number[][]} data - 2D fractal data
   * @returns {number[]} Spiral sequence
   */
  extractSpiral(data) {
    const sequence = [];
    const height = data.length;
    const width = data[0]?.length || 0;
    
    if (height === 0 || width === 0) return sequence;
    
    let top = 0, bottom = height - 1;
    let left = 0, right = width - 1;
    
    while (top <= bottom && left <= right) {
      // Top row
      for (let x = left; x <= right; x++) {
        sequence.push(data[top][x]);
      }
      top++;
      
      // Right column
      for (let y = top; y <= bottom; y++) {
        sequence.push(data[y][right]);
      }
      right--;
      
      // Bottom row
      if (top <= bottom) {
        for (let x = right; x >= left; x--) {
          sequence.push(data[bottom][x]);
        }
        bottom--;
      }
      
      // Left column
      if (left <= right) {
        for (let y = bottom; y >= top; y--) {
          sequence.push(data[y][left]);
        }
        left++;
      }
    }
    
    return sequence;
  }

  /**
   * Extract specific column
   * @param {number[][]} data - 2D fractal data
   * @param {number} columnIndex - Column index to extract
   * @returns {number[]} Column sequence
   */
  extractColumn(data, columnIndex) {
    const sequence = [];
    const width = data[0]?.length || 0;
    const clampedIndex = Math.max(0, Math.min(columnIndex, width - 1));
    
    for (const row of data) {
      if (row[clampedIndex] !== undefined) {
        sequence.push(row[clampedIndex]);
      }
    }
    
    return sequence;
  }

  /**
   * Extract specific row
   * @param {number[][]} data - 2D fractal data
   * @param {number} rowIndex - Row index to extract
   * @returns {number[]} Row sequence
   */
  extractRow(data, rowIndex) {
    const clampedIndex = Math.max(0, Math.min(rowIndex, data.length - 1));
    return data[clampedIndex] ? [...data[clampedIndex]] : [];
  }

  /**
   * Map fractal values to musical scale pitches
   * @param {Object} options - Mapping options
   * @param {number[]} options.sequence - Fractal sequence to map
   * @param {number[]} options.pitches - Array of MIDI pitch values to map to
   * @returns {number[]} MIDI note sequence
   *
   * @example
   * const mbSequence = [10, 25, 15, 30, 5];
   * const gMajorPitches = [55, 57, 59, 60, 62, 64, 66, 67]; // G major scale
   * const mapped = mb.mapToScale({ sequence: mbSequence, pitches: gMajorPitches });
   * // Maps each value to a pitch based on normalized position
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
      // Normalize to 0-1
      const normalized = (value - minVal) / range;

      // Map to pitch array index
      const index = Math.floor(normalized * (pitches.length - 1));
      return pitches[index];
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

  /**
   * Generate rhythmic pattern from fractal data
   * @param {Object} options - Mapping options
   * @param {number[]} options.sequence - Fractal sequence
   * @param {number[]} [options.subdivisions=[1, 2, 4, 8, 16]] - Rhythmic subdivisions
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