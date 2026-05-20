/**
 * Observable-specific tools for Mandelbrot fractal sequence extraction and musical conversion
 * These tools are designed to work with Observable's reactive environment and Plot library
 */

import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class ObservableMandelbrotTools {
  
  /**
   * Create an interactive Mandelbrot visualization with sequence path selection
   * @param {number[][]} mandelbrotData - 2D array of iteration counts
   * @param {Object} options - Visualization options
   * @returns {Object} Interactive plot with path selection
   */
  static createInteractiveMandelbrotPlot(mandelbrotData, options = {}) {
    const {
      width = 600,
      height = 600,
      title = "Mandelbrot Set - Click to select sequence paths",
      xMin = -2.5,
      xMax = 1.0,
      yMin = -1.25,
      yMax = 1.25,
      colorScheme = 'viridis'
    } = options;

    // Convert matrix to plottable data
    const plotData = [];
    for (let y = 0; y < mandelbrotData.length; y++) {
      for (let x = 0; x < mandelbrotData[y].length; x++) {
        const iterations = mandelbrotData[y][x];
        const realX = xMin + (x / mandelbrotData[y].length) * (xMax - xMin);
        const realY = yMin + (y / mandelbrotData.length) * (yMax - yMin);
        
        plotData.push({
          x: realX,
          y: realY,
          iterations,
          matrixX: x,
          matrixY: y,
          normalized: iterations / 100 // Assuming max 100 iterations
        });
      }
    }

    return Plot.plot({
      title,
      width,
      height,
      x: { 
        domain: [xMin, xMax],
        label: "Real"
      },
      y: { 
        domain: [yMin, yMax],
        label: "Imaginary"
      },
      color: {
        scheme: colorScheme,
        legend: true
      },
      marks: [
        Plot.rect(plotData, {
          x: "x",
          y: "y", 
          width: (xMax - xMin) / mandelbrotData[0].length,
          height: (yMax - yMin) / mandelbrotData.length,
          fill: "normalized",
          title: d => `Point (${d.x.toFixed(3)}, ${d.y.toFixed(3)})\nIterations: ${d.iterations}`
        })
      ]
    });
  }

  /**
   * Create sequence path selector for Mandelbrot visualization
   * @param {number[][]} mandelbrotData - Mandelbrot fractal data
   * @param {Object} options - Configuration options
   * @returns {HTMLElement} Interactive path selector
   */
  static createSequenceSelector(mandelbrotData, options = {}) {
    const {
      width = 600,
      height = 600,
      maxPaths = 4,
      pathColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"],
      xMin = -2.5,
      xMax = 1.0,
      yMin = -1.25,
      yMax = 1.25
    } = options;

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";

    // Create canvas for Mandelbrot visualization
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = "1px solid #ccc";
    canvas.style.cursor = "crosshair";
    
    const ctx = canvas.getContext("2d");
    
    // Render Mandelbrot fractal
    this.renderMandelbrotToCanvas(ctx, mandelbrotData, { 
      width, height, xMin, xMax, yMin, yMax 
    });
    
    // State for path selection
    const paths = [];
    const pathTypes = ['diagonal', 'spiral', 'border', 'column', 'row'];
    
    // Create overlay canvas for path visualization
    const overlay = document.createElement("canvas");
    overlay.width = width;
    overlay.height = height;
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.pointerEvents = "none";
    
    const overlayCtx = overlay.getContext("2d");
    
    // Path type buttons
    const controls = document.createElement("div");
    controls.style.marginTop = "10px";
    controls.style.display = "flex";
    controls.style.gap = "5px";
    controls.style.flexWrap = "wrap";
    controls.style.alignItems = "center";
    
    pathTypes.forEach(pathType => {
      const button = document.createElement("button");
      button.textContent = pathType.charAt(0).toUpperCase() + pathType.slice(1);
      button.style.padding = "5px 10px";
      button.style.fontSize = "12px";
      button.onclick = () => {
        if (paths.length >= maxPaths) return;
        
        const sequence = this.extractSequenceFromMatrix(mandelbrotData, pathType, paths.length);
        const path = {
          type: pathType,
          sequence,
          color: pathColors[paths.length % pathColors.length],
          id: paths.length
        };
        
        paths.push(path);
        this.redrawPathOverlay(overlayCtx, paths, mandelbrotData, { width, height });
        
        // Dispatch change event
        const event = new CustomEvent("pathchange", { 
          detail: { paths: [...paths] } 
        });
        container.dispatchEvent(event);
      };
      controls.appendChild(button);
    });
    
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Paths";
    clearButton.style.padding = "5px 10px";
    clearButton.style.fontSize = "12px";
    clearButton.onclick = () => {
      paths.length = 0;
      this.redrawPathOverlay(overlayCtx, paths, mandelbrotData, { width, height });
      const event = new CustomEvent("pathchange", { 
        detail: { paths: [] } 
      });
      container.dispatchEvent(event);
    };
    
    const infoDiv = document.createElement("div");
    infoDiv.style.fontSize = "12px";
    infoDiv.style.color = "#666";
    infoDiv.style.marginTop = "5px";
    infoDiv.innerHTML = `Click extraction methods above (${paths.length}/${maxPaths} paths)`;
    
    // Update info on path changes
    container.addEventListener("pathchange", (e) => {
      infoDiv.innerHTML = `Click extraction methods above (${e.detail.paths.length}/${maxPaths} paths)`;
    });
    
    controls.appendChild(clearButton);
    controls.appendChild(infoDiv);
    
    // Assemble container
    container.appendChild(canvas);
    container.appendChild(overlay);
    container.appendChild(controls);
    
    // Add initial value for Observable
    container.value = { paths: [] };
    
    return container;
  }

  /**
   * Extract sequence from Mandelbrot matrix using specified method
   * @param {number[][]} matrix - Mandelbrot data matrix
   * @param {string} method - Extraction method
   * @param {number} offset - Offset for column/row methods
   * @returns {number[]} Extracted sequence
   */
  static extractSequenceFromMatrix(matrix, method, offset = 0) {
    const height = matrix.length;
    const width = matrix[0].length;
    
    switch (method) {
      case 'diagonal': {
        const diagonal = [];
        const minDim = Math.min(height, width);
        for (let i = 0; i < minDim; i++) {
          diagonal.push(matrix[i][i]);
        }
        return diagonal;
      }

      case 'spiral':
        return this.extractSpiral(matrix);

      case 'border':
        return this.extractBorder(matrix);

      case 'column': {
        const colIndex = Math.floor((offset % 4) * width / 4);
        return matrix.map(row => row[colIndex]);
      }

      case 'row': {
        const rowIndex = Math.floor((offset % 4) * height / 4);
        return matrix[rowIndex] ? [...matrix[rowIndex]] : [];
      }

      default:
        return this.extractSequenceFromMatrix(matrix, 'diagonal');
    }
  }

  /**
   * Extract spiral sequence from matrix
   * @param {number[][]} matrix - 2D matrix
   * @returns {number[]} Spiral sequence
   */
  static extractSpiral(matrix) {
    const sequence = [];
    const height = matrix.length;
    const width = matrix[0].length;
    
    let top = 0, bottom = height - 1;
    let left = 0, right = width - 1;
    
    while (top <= bottom && left <= right) {
      // Top row
      for (let x = left; x <= right; x++) {
        sequence.push(matrix[top][x]);
      }
      top++;
      
      // Right column
      for (let y = top; y <= bottom; y++) {
        sequence.push(matrix[y][right]);
      }
      right--;
      
      // Bottom row
      if (top <= bottom) {
        for (let x = right; x >= left; x--) {
          sequence.push(matrix[bottom][x]);
        }
        bottom--;
      }
      
      // Left column
      if (left <= right) {
        for (let y = bottom; y >= top; y--) {
          sequence.push(matrix[y][left]);
        }
        left++;
      }
    }
    
    return sequence;
  }

  /**
   * Extract border sequence from matrix
   * @param {number[][]} matrix - 2D matrix
   * @returns {number[]} Border sequence
   */
  static extractBorder(matrix) {
    const sequence = [];
    const height = matrix.length;
    const width = matrix[0].length;
    
    if (height === 0 || width === 0) return sequence;
    
    // Top row
    for (let x = 0; x < width; x++) {
      sequence.push(matrix[0][x]);
    }
    
    // Right column (excluding corners)
    for (let y = 1; y < height - 1; y++) {
      sequence.push(matrix[y][width - 1]);
    }
    
    // Bottom row (reverse order, excluding corners)
    if (height > 1) {
      for (let x = width - 1; x >= 0; x--) {
        sequence.push(matrix[height - 1][x]);
      }
    }
    
    // Left column (excluding corners, reverse order)
    for (let y = height - 2; y > 0; y--) {
      sequence.push(matrix[y][0]);
    }
    
    return sequence;
  }

  /**
   * Render Mandelbrot fractal to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number[][]} mandelbrotData - Fractal data
   * @param {Object} options - Rendering options
   */
  static renderMandelbrotToCanvas(ctx, mandelbrotData, options = {}) {
    const { width, height } = options;
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    const cellWidth = width / mandelbrotData[0].length;
    const cellHeight = height / mandelbrotData.length;
    
    for (let y = 0; y < mandelbrotData.length; y++) {
      for (let x = 0; x < mandelbrotData[y].length; x++) {
        const iterations = mandelbrotData[y][x];
        const normalized = iterations / 100; // Assuming max 100 iterations
        
        const color = this.getColorComponents(normalized, 'plasma');
        
        // Fill rectangular region for this matrix cell
        const startX = Math.floor(x * cellWidth);
        const endX = Math.floor((x + 1) * cellWidth);
        const startY = Math.floor(y * cellHeight);
        const endY = Math.floor((y + 1) * cellHeight);
        
        for (let py = startY; py < endY && py < height; py++) {
          for (let px = startX; px < endX && px < width; px++) {
            const index = (py * width + px) * 4;
            data[index] = color.r;
            data[index + 1] = color.g; 
            data[index + 2] = color.b;
            data[index + 3] = 255;
          }
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Redraw path overlay showing extracted sequences
   * @param {CanvasRenderingContext2D} ctx - Overlay context
   * @param {Array} paths - Current paths
   * @param {number[][]} matrix - Mandelbrot data matrix
   * @param {Object} options - Rendering options
   */
  static redrawPathOverlay(ctx, paths, matrix, options = {}) {
    const { width, height } = options;
    
    ctx.clearRect(0, 0, width, height);
    
    const cellWidth = width / matrix[0].length;
    const cellHeight = height / matrix.length;
    
    paths.forEach(path => {
      ctx.strokeStyle = path.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      
      // Draw path based on type
      this.drawSequencePath(ctx, path, matrix, { cellWidth, cellHeight });
      
      // Add path label
      ctx.fillStyle = path.color;
      ctx.font = "14px bold sans-serif";
      ctx.fillText(
        `${path.type.charAt(0).toUpperCase() + path.type.slice(1)} (${path.sequence.length})`,
        10,
        20 + path.id * 25
      );
    });
    
    ctx.globalAlpha = 1.0;
  }

  /**
   * Draw sequence path on overlay canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} path - Path object with type and sequence
   * @param {number[][]} matrix - Original matrix
   * @param {Object} options - Drawing options
   */
  static drawSequencePath(ctx, path, matrix, options) {
    const { cellWidth, cellHeight } = options;
    const { type } = path;
    
    ctx.beginPath();
    
    switch (type) {
      case 'diagonal': {
        const minDim = Math.min(matrix.length, matrix[0].length);
        ctx.moveTo(0, 0);
        ctx.lineTo(minDim * cellWidth, minDim * cellHeight);
        break;
      }

      case 'border':
        this.drawBorderPath(ctx, matrix, cellWidth, cellHeight);
        break;

      case 'spiral':
        this.drawSpiralPath(ctx, matrix, cellWidth, cellHeight);
        break;

      case 'column': {
        const colIndex = Math.floor((path.id % 4) * matrix[0].length / 4);
        const colX = (colIndex + 0.5) * cellWidth;
        ctx.moveTo(colX, 0);
        ctx.lineTo(colX, matrix.length * cellHeight);
        break;
      }

      case 'row': {
        const rowIndex = Math.floor((path.id % 4) * matrix.length / 4);
        const rowY = (rowIndex + 0.5) * cellHeight;
        ctx.moveTo(0, rowY);
        ctx.lineTo(matrix[0].length * cellWidth, rowY);
        break;
      }
    }
    
    ctx.stroke();
  }

  /**
   * Draw border path on canvas
   */
  static drawBorderPath(ctx, matrix, cellWidth, cellHeight) {
    const width = matrix[0].length;
    const height = matrix.length;
    
    ctx.moveTo(0, cellHeight * 0.5);
    ctx.lineTo(width * cellWidth, cellHeight * 0.5);
    ctx.lineTo(width * cellWidth - cellWidth * 0.5, height * cellHeight);
    ctx.lineTo(cellWidth * 0.5, height * cellHeight);
    ctx.closePath();
  }

  /**
   * Draw spiral path on canvas
   */
  static drawSpiralPath(ctx, matrix, cellWidth, cellHeight) {
    // Simplified spiral visualization
    const centerX = matrix[0].length * cellWidth / 2;
    const centerY = matrix.length * cellHeight / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    
    let radius = maxRadius;
    let angle = 0;
    const spiralTurns = 3;
    const steps = 50;
    
    ctx.moveTo(centerX + radius, centerY);
    
    for (let i = 0; i <= steps; i++) {
      angle = (i / steps) * spiralTurns * 2 * Math.PI;
      radius = maxRadius * (1 - i / steps);
      
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.lineTo(x, y);
    }
  }

  /**
   * Get RGB color components for fractal visualization
   * @param {number} value - Normalized value (0-1)
   * @param {string} scheme - Color scheme
   * @returns {Object} RGB color object
   */
  static getColorComponents(value, scheme) {
    const normalized = Math.max(0, Math.min(1, value));
    let r, g, b;
    
    switch (scheme) {
      case 'plasma':
        r = Math.floor(255 * (0.3 + 0.7 * normalized));
        g = Math.floor(255 * (0.1 + 0.6 * (1 - normalized)));
        b = Math.floor(255 * (0.8 + 0.2 * normalized));
        break;
      case 'viridis':
        r = Math.floor(255 * normalized * 0.3);
        g = Math.floor(255 * normalized * 0.7);
        b = Math.floor(255 * (0.2 + 0.8 * normalized));
        break;
      default:
        r = Math.floor(255 * normalized);
        g = Math.floor(255 * normalized * 0.5);
        b = Math.floor(255 * (1 - normalized));
    }
    
    return { r, g, b };
  }

  /**
   * Create musical preview from Mandelbrot sequences
   * @param {Array} paths - Extracted paths with sequences
   * @param {Object} options - Musical mapping options
   * @returns {Array} Musical sequence data
   */
  static previewMusicalSequences(paths, options = {}) {
    const {
      scale = [60, 62, 64, 65, 67, 69, 71], // C major scale
      durations = [0.5, 0.75, 1, 0.25],
      maxLength = 32
    } = options;

    return paths.map((path, pathIndex) => {
      const sequence = [];
      let currentTime = 0;
      
      const truncatedSequence = path.sequence.slice(0, maxLength);
      const minVal = Math.min(...truncatedSequence);
      const maxVal = Math.max(...truncatedSequence);
      const range = maxVal - minVal || 1;
      
      truncatedSequence.forEach((value, i) => {
        // Normalize to scale range
        const normalized = (value - minVal) / range;
        const scaleIndex = Math.floor(normalized * scale.length);
        const clampedIndex = Math.max(0, Math.min(scaleIndex, scale.length - 1));
        const pitch = scale[clampedIndex];
        
        const duration = durations[i % durations.length];
        
        sequence.push({
          pitch,
          duration,
          time: currentTime,
          originalValue: value,
          pathType: path.type
        });
        
        currentTime += duration;
      });
      
      return {
        pathIndex,
        pathType: path.type,
        notes: sequence,
        totalDuration: currentTime
      };
    });
  }

  /**
   * Create musical preview plot
   * @param {Array} musicalSequences - Musical sequence data
   * @param {Object} options - Plot options
   * @returns {Object} Observable Plot
   */
  static createMusicalPreviewPlot(musicalSequences, options = {}) {
    const {
      width = 700,
      height = 300,
      title = "Mandelbrot Musical Preview"
    } = options;

    if (musicalSequences.length === 0) {
      return Plot.plot({
        title,
        width,
        height,
        marks: [
          Plot.text([{ x: width/2, y: height/2 }], {
            x: "x",
            y: "y", 
            text: "No paths selected",
            fontSize: 16,
            fill: "#666"
          })
        ]
      });
    }

    // Flatten all notes
    const allNotes = [];
    musicalSequences.forEach(seq => {
      seq.notes.forEach(note => {
        allNotes.push({
          ...note,
          pathIndex: seq.pathIndex,
          pathType: seq.pathType
        });
      });
    });

    return Plot.plot({
      title,
      width,
      height,
      x: { 
        label: "Time (beats)",
        domain: [0, Math.max(...allNotes.map(n => n.time + n.duration))]
      },
      y: { 
        label: "MIDI Pitch",
        domain: [Math.min(...allNotes.map(n => n.pitch)) - 2, 
                Math.max(...allNotes.map(n => n.pitch)) + 2]
      },
      color: {
        legend: true,
        domain: [...new Set(allNotes.map(n => n.pathType))]
      },
      marks: [
        Plot.rect(allNotes, {
          x1: "time",
          x2: d => d.time + d.duration,
          y1: d => d.pitch - 0.4,
          y2: d => d.pitch + 0.4,
          fill: "pathType",
          fillOpacity: 0.8,
          title: d => `${d.pathType}\nPitch: ${d.pitch}\nTime: ${d.time}\nOriginal: ${d.originalValue}`
        })
      ]
    });
  }
}

/**
 * Helper function for Observable - create JMON track from Mandelbrot sequence
 * @param {Array} sequence - Musical sequence
 * @param {Object} trackOptions - Track configuration
 * @returns {Object} JMON track
 */
export function createMandelbrotTrack(sequence, trackOptions = {}) {
  const {
    label = 'mandelbrot-track',
    midiChannel = 0,
    midiProgram,
    pan,
    synth = { type: 'Synth' }
  } = trackOptions;

  const track = {
    label,
    midiChannel,
    synth,
    notes: sequence
  };
  if (midiProgram !== undefined) track.midiProgram = midiProgram;
  if (pan !== undefined) track.pan = pan;
  return track;
}
