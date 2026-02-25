import { PlotRenderer } from '../plots/PlotRenderer.js';

/**
 * @typedef {Object} FractalVisualizationOptions
 * @property {string} [colorScheme='viridis'] - Color scheme for visualization
 * @property {number} [iterations] - Number of iterations
 * @property {number} [threshold] - Threshold value
 * @property {number} [zoom] - Zoom level
 * @property {number} [centerX] - Center X coordinate
 * @property {number} [centerY] - Center Y coordinate
 * @property {string} [title] - Plot title
 * @property {number} [width] - Plot width
 * @property {number} [height] - Plot height
 * @property {boolean} [showAxis] - Whether to show axis
 * @property {HTMLCanvasElement} [canvas] - Canvas element for rendering
 */

/**
 * @typedef {Object} LogisticMapData
 * @property {number} r - Growth parameter
 * @property {number} x - Population value
 * @property {number} iteration - Iteration number
 */

/**
 * @typedef {Object} MandelbrotPoint
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 * @property {number} iterations - Iterations to escape
 * @property {boolean} escaped - Whether point escaped
 */

export class FractalVisualizer {
  
  /**
   * Visualize logistic map bifurcation diagram
   * @param {number} [rMin=2.8] - Minimum r value
   * @param {number} [rMax=4.0] - Maximum r value
   * @param {number} [rSteps=1000] - Number of r steps
   * @param {number} [iterations=1000] - Iterations per r value
   * @param {number} [skipTransient=500] - Transient iterations to skip
   * @param {FractalVisualizationOptions} [options={}] - Visualization options
   * @returns {Object} Plot data object
   */
  static plotLogisticMap(
    rMin = 2.8,
    rMax = 4.0,
    rSteps = 1000,
    iterations = 1000,
    skipTransient = 500,
    options = {}
  ) {
    const { 
      title = 'Logistic Map Bifurcation',
      width = 800,
      height = 600,
      colorScheme = 'viridis'
    } = options;

    const plotData = [];
    
    for (let i = 0; i < rSteps; i++) {
      const r = rMin + (i / rSteps) * (rMax - rMin);
      let x = 0.5; // Initial condition
      
      // Skip transient behavior
      for (let j = 0; j < skipTransient; j++) {
        x = r * x * (1 - x);
      }
      
      // Collect attractors
      const attractors = new Set();
      for (let j = 0; j < iterations; j++) {
        x = r * x * (1 - x);
        attractors.add(Math.round(x * 10000) / 10000); // Round for stability
      }
      
      // Plot each attractor value
      attractors.forEach(value => {
        plotData.push({
          x: r,
          y: value,
          color: this.getColorForValue(value, colorScheme)
        });
      });
    }

    const data = {
      x: plotData.map(d => d.x),
      y: plotData.map(d => d.y),
      color: plotData.map(d => d.color)
    };

    return PlotRenderer.scatter(data, {
      title,
      width,
      height,
      showAxis: true
    });
  }

  /**
   * Visualize any complex plane fractal (Mandelbrot, Julia, BurningShip, etc.)
   * @param {import('../../generative/fractals/ComplexPlaneFractal.js').ComplexPlaneFractal} fractal - Fractal instance
   * @param {FractalVisualizationOptions} [options={}] - Visualization options
   * @returns {Object} Plot data object or canvas
   */
  static plotFractal(fractal, options = {}) {
    const {
      title = `${fractal.type.charAt(0).toUpperCase() + fractal.type.slice(1)} Set`,
      width = 600,
      height = 600,
      colorScheme = 'plasma',
      canvas = null,
      resolution = fractal.width
    } = options;

    if (canvas) {
      return this.renderFractalCanvas(canvas, fractal, resolution, colorScheme);
    }

    const data = fractal.generate();
    const matrix = data.map(row =>
      row.map(val => val / fractal.maxIterations)
    );

    return PlotRenderer.heatmap(matrix, { title, width, height, showAxis: false });
  }

  /**
   * Render any complex plane fractal directly to Canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {import('../../generative/fractals/ComplexPlaneFractal.js').ComplexPlaneFractal} fractal - Fractal instance
   * @param {number} resolution - Grid resolution
   * @param {string} [colorScheme='plasma'] - Color scheme
   * @returns {HTMLCanvasElement} The canvas element
   */
  static renderFractalCanvas(canvas, fractal, resolution, colorScheme = 'plasma') {
    const ctx = canvas.getContext('2d');
    canvas.width = resolution;
    canvas.height = resolution;

    const imageData = ctx.createImageData(resolution, resolution);
    const pixels = imageData.data;

    const dx = (fractal.xMax - fractal.xMin) / resolution;
    const dy = (fractal.yMax - fractal.yMin) / resolution;

    for (let py = 0; py < resolution; py++) {
      const imag = fractal.yMin + py * dy;
      for (let px = 0; px < resolution; px++) {
        const real = fractal.xMin + px * dx;
        const iterations = fractal.iterate({ real, imaginary: imag });
        const normalized = iterations / fractal.maxIterations;

        const color = this.getColorComponents(normalized, colorScheme);
        const idx = (py * resolution + px) * 4;
        pixels[idx] = color.r;
        pixels[idx + 1] = color.g;
        pixels[idx + 2] = color.b;
        pixels[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Generate Mandelbrot set visualization (backward-compatible wrapper)
   * @param {number} [xMin=-2.5] - Minimum x coordinate
   * @param {number} [xMax=1.0] - Maximum x coordinate
   * @param {number} [yMin=-1.25] - Minimum y coordinate
   * @param {number} [yMax=1.25] - Maximum y coordinate
   * @param {number} [resolution=400] - Grid resolution
   * @param {number} [maxIterations=100] - Maximum iterations
   * @param {FractalVisualizationOptions} [options={}] - Visualization options
   * @returns {Object} Plot data object
   */
  static plotMandelbrot(
    xMin = -2.5,
    xMax = 1.0,
    yMin = -1.25,
    yMax = 1.25,
    resolution = 400,
    maxIterations = 100,
    options = {}
  ) {
    const {
      title = 'Mandelbrot Set',
      width = 600,
      height = 600,
      colorScheme = 'plasma',
      canvas = null
    } = options;

    if (canvas) {
      return this.renderMandelbrotCanvas(
        canvas, xMin, xMax, yMin, yMax, resolution, maxIterations, colorScheme
      );
    }

    const matrix = [];
    const dx = (xMax - xMin) / resolution;
    const dy = (yMax - yMin) / resolution;

    for (let py = 0; py < resolution; py++) {
      const row = [];
      const y = yMin + py * dy;

      for (let px = 0; px < resolution; px++) {
        const x = xMin + px * dx;
        const iterations = this.mandelbrotIterations(x, y, maxIterations);
        row.push(iterations / maxIterations);
      }
      matrix.push(row);
    }

    return PlotRenderer.heatmap(matrix, {
      title,
      width,
      height,
      showAxis: false
    });
  }

  /**
   * Render Mandelbrot set directly to Canvas (backward-compatible wrapper)
   */
  static renderMandelbrotCanvas(
    canvas,
    xMin, xMax, yMin, yMax,
    resolution, maxIterations,
    colorScheme
  ) {
    const ctx = canvas.getContext('2d');
    canvas.width = resolution;
    canvas.height = resolution;

    const imageData = ctx.createImageData(resolution, resolution);
    const data = imageData.data;

    const dx = (xMax - xMin) / resolution;
    const dy = (yMax - yMin) / resolution;

    for (let py = 0; py < resolution; py++) {
      const y = yMin + py * dy;

      for (let px = 0; px < resolution; px++) {
        const x = xMin + px * dx;
        const iterations = this.mandelbrotIterations(x, y, maxIterations);
        const normalized = iterations / maxIterations;

        const color = this.getColorComponents(normalized, colorScheme);
        const index = (py * resolution + px) * 4;

        data[index] = color.r;     // Red
        data[index + 1] = color.g; // Green
        data[index + 2] = color.b; // Blue
        data[index + 3] = 255;     // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Visualize cellular automata evolution
   * @param {number[][]} history - CA evolution history
   * @param {FractalVisualizationOptions} [options={}] - Visualization options
   * @returns {Object} Plot data object
   */
  static plotCellularAutomata(history, options = {}) {
    const {
      title = 'Cellular Automata Evolution',
      width = 600,
      height = 400,
      canvas = null
    } = options;

    if (canvas) {
      return this.renderCACanvas(canvas, history, options);
    }

    return PlotRenderer.matrix(history, {
      title,
      width,
      height,
      showAxis: false
    });
  }

  /**
   * Render cellular automata to Canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number[][]} history - CA evolution history
   * @param {FractalVisualizationOptions} options - Visualization options
   * @returns {HTMLCanvasElement} The canvas element
   */
  static renderCACanvas(canvas, history, options = {}) {
    const ctx = canvas.getContext('2d');
    const cellSize = options.cellSize || 4;
    
    canvas.width = history[0].length * cellSize;
    canvas.height = history.length * cellSize;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'black';
    
    for (let y = 0; y < history.length; y++) {
      for (let x = 0; x < history[y].length; x++) {
        if (history[y][x] === 1) {
          ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
          );
        }
      }
    }
    
    return canvas;
  }

  /**
   * Helper: Calculate Mandelbrot iterations
   * @param {number} x - Real coordinate
   * @param {number} y - Imaginary coordinate
   * @param {number} maxIterations - Maximum iterations
   * @returns {number} Number of iterations before escape
   */
  static mandelbrotIterations(x, y, maxIterations) {
    let zx = 0;
    let zy = 0;
    let iteration = 0;

    while (zx * zx + zy * zy < 4 && iteration < maxIterations) {
      const temp = zx * zx - zy * zy + x;
      zy = 2 * zx * zy + y;
      zx = temp;
      iteration++;
    }

    return iteration;
  }

  /**
   * Helper: Get color for value based on color scheme
   * @param {number} value - Normalized value (0-1)
   * @param {string} scheme - Color scheme name
   * @returns {string} CSS color string
   */
  static getColorForValue(value, scheme) {
    const normalized = Math.max(0, Math.min(1, value));
    
    switch (scheme) {
      case 'viridis':
        return `hsl(${240 + normalized * 120}, 60%, ${30 + normalized * 40}%)`;
      case 'plasma':
        return `hsl(${300 - normalized * 60}, 80%, ${20 + normalized * 60}%)`;
      case 'turbo':
        return `hsl(${normalized * 360}, 70%, 50%)`;
      case 'heat':
        return `hsl(${(1 - normalized) * 60}, 100%, 50%)`;
      case 'rainbow':
        return `hsl(${normalized * 300}, 70%, 50%)`;
      default:
        return `hsl(${normalized * 240}, 70%, 50%)`;
    }
  }

  /**
   * Helper: Get RGB color components
   * @param {number} value - Normalized value (0-1)
   * @param {string} scheme - Color scheme name
   * @returns {Object} RGB color object
   */
  static getColorComponents(value, scheme) {
    const colorStr = this.getColorForValue(value, scheme);
    
    // Convert HSL to RGB for canvas rendering
    if (colorStr.startsWith('hsl')) {
      const matches = colorStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (matches) {
        const h = parseInt(matches[1]) / 360;
        const s = parseInt(matches[2]) / 100;
        const l = parseInt(matches[3]) / 100;
        
        return this.hslToRgb(h, s, l);
      }
    }
    
    // Fallback
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Helper: Convert HSL to RGB
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {Object} RGB color object
   */
  static hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // Achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Helper: Create center initial state for CA
   * @param {number} width - Width of the CA
   * @returns {number[]} Initial state array
   */
  static createCenterInitialState(width) {
    const state = new Array(width).fill(0);
    state[Math.floor(width / 2)] = 1;
    return state;
  }

  /**
   * Extract strips from CA evolution for musical use
   * @param {number[][]} history - CA evolution history
   * @param {number[][]} stripRanges - Array of [start, end] strip ranges
   * @returns {number[][][]} Extracted strips
   */
  static extractStrips(history, stripRanges) {
    const strips = [];
    
    for (const [start, end] of stripRanges) {
      const strip = [];
      for (const generation of history) {
        strip.push(generation.slice(start, end + 1));
      }
      strips.push(strip);
    }
    
    return strips;
  }

  /**
   * Convert strips to musical sequences
   * @param {number[][][]} strips - Extracted strips
   * @param {Object} options - Conversion options
   * @returns {number[][]} Musical sequences
   */
  static stripsToSequences(strips, options = {}) {
    const { values = null } = options;
    
    return strips.map(strip => {
      // Flatten strip into sequence
      const sequence = [];
      for (const generation of strip) {
        for (let i = 0; i < generation.length; i++) {
          if (generation[i] === 1) {
            sequence.push(values ? values[i % values.length] : i);
          }
        }
      }
      return sequence;
    });
  }

  /**
   * Generate Canvas element for visualization
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {HTMLCanvasElement} Canvas element
   */
  static createCanvas(width, height) {
    // For Node.js environments, this would need canvas package
    // For browser environments, this works directly
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    } else {
      // Node.js environment - would need canvas package
      console.warn('Canvas rendering not available in Node.js environment');
      return null;
    }
  }
}
