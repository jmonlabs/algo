import { ComplexPlaneFractal } from './ComplexPlaneFractal.js';

/**
 * Mandelbrot set fractal generator for musical composition.
 * z₀ = 0, c = point in plane, iterate z = z² + c
 *
 * @example
 * new Mandelbrot({
 *   center: { x: -0.5, y: 0 },
 *   size: { w: 3, h: 3 },
 *   width: 600, height: 600,
 *   maxIterations: 100
 * })
 */
export class Mandelbrot extends ComplexPlaneFractal {
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
}
