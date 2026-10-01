/**
 * A fractal on the complex plane, sampled on a grid: each cell holds how
 * many iterations its point took to escape (or `maxIterations` if it never
 * did). The window is given as a center and a size.
 *
 * Subclasses give `iterate(point)`: Mandelbrot, Julia, BurningShip.
 */
export class ComplexPlaneFractal {
  /**
   * @param {Object} [options]
   * @param {{x: number, y: number}} [options.center] - Middle of the window
   * @param {{w: number, h: number}} [options.size] - Width and height of the window
   * @param {number} [options.width=100] - Cells across
   * @param {number} [options.height=100] - Cells down
   * @param {number} [options.maxIterations=100]
   */
  constructor({ center, size, width = 100, height = 100, maxIterations = 100, ...rest } = {}) {
    const old = ['xMin', 'xMax', 'yMin', 'yMax'].filter((k) => rest[k] !== undefined);
    if (old.length) throw new Error('fractals: xMin/xMax/yMin/yMax are gone; give center { x, y } and size { w, h } instead');
    this.width = width;
    this.height = height;
    this.maxIterations = maxIterations;
    this._center = center ? { x: center.x, y: center.y } : { x: -0.5, y: 0 };
    this._size = size ? { w: size.w, h: size.h } : { w: 4, h: 4 };
    this.xMin = this._center.x - this._size.w / 2;
    this.xMax = this._center.x + this._size.w / 2;
    this.yMin = this._center.y - this._size.h / 2;
    this.yMax = this._center.y + this._size.h / 2;
  }

  get center() { return { ...this._center }; }
  get size() { return { ...this._size }; }

  /** @param {{real: number, imaginary: number}} point @returns {number} Iterations to escape */
  iterate(point) { // eslint-disable-line no-unused-vars
    throw new Error('ComplexPlaneFractal: a subclass gives iterate(point)');
  }

  /**
   * The grid: `height` rows of `width` iteration counts.
   * @returns {Array<Array<number>>}
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
   * The grid as one `{ x, y, value }` per cell, for a plot.
   * @param {Array<Array<number>>} [grid] - From `generate`; computed if absent
   * @returns {Array<{x: number, y: number, value: number}>}
   */
  toPlotData(grid = null) {
    const data = grid || this.generate();
    const plotData = [];
    data.forEach((row, y) => row.forEach((value, x) => plotData.push({ x, y, value })));
    return plotData;
  }

  /**
   * A series read off the grid along a path.
   * @param {Object} [options]
   * @param {'diagonal'|'border'|'spiral'|'row'|'column'} [options.path='diagonal']
   * @param {number} [options.index=0] - Which row or column
   * @returns {Array<number>}
   *
   * @example
   * new Mandelbrot({ width: 16, height: 16 }).sequence({ path: 'spiral' });
   */
  sequence({ path = 'diagonal', index = 0 } = {}) {
    const data = this.generate();
    switch (path) {
      case 'diagonal': return diagonal(data);
      case 'border': return border(data);
      case 'spiral': return spiral(data);
      case 'column': return column(data, index);
      case 'row': return row(data, index);
      default: throw new Error(`fractals: unknown path "${path}" (diagonal, border, spiral, row, column)`);
    }
  }

  /**
   * The grid as notes on a piano roll: a column is a step in time, a row a
   * pitch (the top row the highest), a cell sounds when its iteration count
   * sits between `min` and `max` of `maxIterations`; consecutive cells of
   * one pitch merge into one note. The velocity follows how steeply the
   * count changes around the cell.
   *
   * @param {Object} options
   * @param {Array<number>} options.pitches - One per row, low to high
   * @param {Array<Array<number>>} [options.grid] - From `generate`; computed if absent
   * @param {number} [options.min=0.1] - Lowest share of `maxIterations` that sounds
   * @param {number} [options.max=0.95] - Highest share that sounds
   * @param {number} [options.duration=1] - Beats per column
   * @param {number} [options.maxDuration=Infinity] - Longest merged note
   * @returns {Array} JMON notes
   */
  notes({ grid, pitches, min = 0.1, max = 0.95, duration = 1, maxDuration = Infinity } = {}) {
    if (!pitches || pitches.length === 0) throw new Error('fractals.notes: pitches is required and must not be empty');
    const data = grid || this.generate();
    const height = data.length;
    const width = data[0]?.length || 0;
    if (height === 0 || width === 0) return [];

    const lo = min * this.maxIterations;
    const hi = max * this.maxIterations;

    const gradient = [];
    let maxGrad = 0;
    for (let y = 0; y < height; y++) {
      gradient[y] = [];
      for (let x = 0; x < width; x++) {
        const dx = (data[y][Math.min(x + 1, width - 1)] - data[y][Math.max(x - 1, 0)]) / 2;
        const dy = ((data[Math.min(y + 1, height - 1)] || data[y])[x] - (data[Math.max(y - 1, 0)])[x]) / 2;
        gradient[y][x] = Math.sqrt(dx * dx + dy * dy);
        if (gradient[y][x] > maxGrad) maxGrad = gradient[y][x];
      }
    }
    if (maxGrad === 0) maxGrad = 1;

    const raw = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const v = data[y][x];
        if (v >= lo && v <= hi) {
          const pitch = pitches[Math.min(height - 1 - y, pitches.length - 1)];
          raw.push({ pitch, time: x * duration, duration, velocity: 0.2 + 0.8 * (gradient[y][x] / maxGrad) });
        }
      }
    }
    if (raw.length === 0) return [];

    raw.sort((a, b) => a.pitch - b.pitch || a.time - b.time);
    const merged = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = raw[i];
      if (curr.pitch === prev.pitch && Math.abs(curr.time - (prev.time + prev.duration)) < 0.001 && prev.duration < maxDuration) {
        const total = prev.duration + curr.duration;
        prev.velocity = (prev.velocity * prev.duration + curr.velocity * curr.duration) / total;
        prev.duration = total;
      } else {
        merged.push({ ...curr });
      }
    }
    merged.sort((a, b) => a.time - b.time || a.pitch - b.pitch);
    return merged;
  }
}

/* --- paths through a grid ------------------------------------------------ */

function diagonal(data) {
  const n = Math.min(data.length, data[0]?.length || 0);
  const out = [];
  for (let i = 0; i < n; i++) out.push(data[i][i]);
  return out;
}

function border(data) {
  const out = [];
  const height = data.length;
  const width = data[0]?.length || 0;
  if (height === 0 || width === 0) return out;
  for (let x = 0; x < width; x++) out.push(data[0][x]);
  for (let y = 1; y < height; y++) out.push(data[y][width - 1]);
  if (height > 1) for (let x = width - 2; x >= 0; x--) out.push(data[height - 1][x]);
  if (width > 1) for (let y = height - 2; y > 0; y--) out.push(data[y][0]);
  return out;
}

function spiral(data) {
  const out = [];
  const height = data.length;
  const width = data[0]?.length || 0;
  if (height === 0 || width === 0) return out;
  let top = 0, bottom = height - 1, left = 0, right = width - 1;
  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) out.push(data[top][x]);
    top++;
    for (let y = top; y <= bottom; y++) out.push(data[y][right]);
    right--;
    if (top <= bottom) {
      for (let x = right; x >= left; x--) out.push(data[bottom][x]);
      bottom--;
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) out.push(data[y][left]);
      left++;
    }
  }
  return out;
}

function column(data, index) {
  const width = data[0]?.length || 0;
  const i = Math.max(0, Math.min(index, width - 1));
  return data.filter((r) => r[i] !== undefined).map((r) => r[i]);
}

function row(data, index) {
  const i = Math.max(0, Math.min(index, data.length - 1));
  return data[i] ? [...data[i]] : [];
}
