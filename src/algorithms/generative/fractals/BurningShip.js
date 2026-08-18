import { ComplexPlaneFractal } from './ComplexPlaneFractal.js';

/**
 * Burning Ship fractal generator for musical piece.
 * z₀ = 0, c = point in plane, iterate z = (|Re(z)| + i|Im(z)|)² + c
 *
 * @example
 * new BurningShip({
 *   center: { x: -0.5, y: -0.5 },
 *   size: { w: 4, h: 3 },
 *   width: 400, height: 400
 * })
 */
export class BurningShip extends ComplexPlaneFractal {
  constructor(options = {}) {
    const defaults = { center: { x: -0.5, y: -0.5 }, size: { w: 4, h: 3 } };
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
