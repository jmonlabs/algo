import { ComplexPlaneFractal } from './ComplexPlaneFractal.js';

/**
 * Mandelbrot set fractal generator for musical composition.
 * z₀ = 0, c = point in plane, iterate z = z² + c
 */
export class Mandelbrot extends ComplexPlaneFractal {
  constructor(options = {}) {
    const defaults = { xMin: -2.5, xMax: 1.5, yMin: -2.0, yMax: 2.0 };
    super({ ...defaults, ...options });
  }

  get type() { return 'mandelbrot'; }

  iterate(point) {
    let zReal = 0, zImag = 0;
    for (let i = 0; i < this.maxIterations; i++) {
      const newReal = zReal * zReal - zImag * zImag + point.real;
      const newImag = 2 * zReal * zImag + point.imaginary;
      zReal = newReal;
      zImag = newImag;
      if (zReal * zReal + zImag * zImag > 4) return i;
    }
    return this.maxIterations;
  }

  /** Backward-compatible alias */
  mandelbrotIterations(c) {
    return this.iterate(c);
  }
}
