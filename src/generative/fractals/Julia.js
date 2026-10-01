import { ComplexPlaneFractal } from './ComplexPlaneFractal.js';

/**
 * Julia set fractal generator for musical piece.
 * z₀ = point in plane, c = fixed parameter, iterate z = z² + c
 *
 * @example
 * new Julia({ c: { real: -0.7, imaginary: 0.27015 } })
 *
 * @example
 * new Julia({
 *   c: { real: -0.8, imaginary: 0.156 },
 *   center: { x: 0, y: 0 },
 *   size: { w: 4, h: 4 }
 * })
 */
export class Julia extends ComplexPlaneFractal {
  /**
   * @param {Object} options
   * @param {{real: number, imaginary: number}} options.c - The fixed c parameter
   */
  constructor(options = {}) {
    if (!options.c) {
      throw new Error('Julia set requires a c parameter: { real, imaginary }');
    }
    // Default viewing window: centered at origin, 4×4
    const defaults = { center: { x: 0, y: 0 }, size: { w: 4, h: 4 } };
    super({ ...defaults, ...options });
    this.c = { real: options.c.real, imaginary: options.c.imaginary };
  }

  get type() { return 'julia'; }

  iterate(point) {
    let zReal = point.real, zImag = point.imaginary;
    for (let i = 0; i < this.maxIterations; i++) {
      const newReal = zReal * zReal - zImag * zImag + this.c.real;
      const newImag = 2 * zReal * zImag + this.c.imaginary;
      zReal = newReal;
      zImag = newImag;
      if (zReal * zReal + zImag * zImag > 4) return i;
    }
    return this.maxIterations;
  }
}
