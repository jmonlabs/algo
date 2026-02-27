import { ComplexPlaneFractal } from './ComplexPlaneFractal.js';

/**
 * Burning Ship fractal generator for musical composition.
 * z₀ = 0, c = point in plane, iterate z = (|Re(z)| + i|Im(z)|)² + c
 */
export class BurningShip extends ComplexPlaneFractal {
  constructor(options = {}) {
    const defaults = { xMin: -2.5, xMax: 1.5, yMin: -2.0, yMax: 1.0 };
    super({ ...defaults, ...options });
  }

  get type() { return 'burningship'; }

  iterate(point) {
    let zReal = 0, zImag = 0;
    for (let i = 0; i < this.maxIterations; i++) {
      const absReal = Math.abs(zReal);
      const absImag = Math.abs(zImag);
      const newReal = absReal * absReal - absImag * absImag + point.real;
      const newImag = 2 * absReal * absImag + point.imaginary;
      zReal = newReal;
      zImag = newImag;
      if (zReal * zReal + zImag * zImag > 4) return i;
    }
    return this.maxIterations;
  }
}
