import { Mandelbrot } from './Mandelbrot.js';
import { Julia } from './Julia.js';
import { BurningShip } from './BurningShip.js';

const TYPES = {
  mandelbrot: Mandelbrot,
  julia: Julia,
  burningship: BurningShip,
};

/**
 * Factory for creating complex plane fractals by type name.
 *
 * @param {string} type - 'mandelbrot', 'julia', or 'burningship'
 * @param {Object} options - Options passed to the fractal constructor
 * @returns {import('./ComplexPlaneFractal.js').ComplexPlaneFractal}
 *
 * @example
 * Fractal('mandelbrot', { center: { x: -0.5, y: 0 }, size: { w: 3, h: 3 } })
 * Fractal('julia', { c: { real: -0.7, imaginary: 0.27015 } })
 */
export function Fractal(type, options = {}) {
  const FractalClass = TYPES[type];
  if (!FractalClass) {
    throw new Error(
      `Unknown fractal type: "${type}". Supported: ${Object.keys(TYPES).join(', ')}`
    );
  }
  return new FractalClass(options);
}

Fractal.types = () => Object.keys(TYPES);
