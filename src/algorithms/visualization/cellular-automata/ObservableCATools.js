/**
 * Observable-specific tools for cellular automata strip identification and selection
 * These tools are designed to work with Observable's reactive environment and Plot library
 */

import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export class ObservableCATools {
  
  /**
   * Create an interactive cellular automata visualization with strip selection
   * @param {number[][]} history - CA evolution history
   * @param {Object} options - Visualization options
   * @returns {Object} Interactive plot with strip selection
   */
  static createInteractiveCAPlot(history, options = {}) {
    const {
      width = 600,
      height = 400,
      title = "Cellular Automata Evolution - Click and drag to select strips",
      showGridLines = true,
      cellSize = 4
    } = options;

    // Convert history to plottable data
    const data = [];
    for (let generation = 0; generation < history.length; generation++) {
      for (let cell = 0; cell < history[generation].length; cell++) {
        if (history[generation][cell] === 1) {
          data.push({
            generation,
            cell,
            value: 1,
            id: `gen${generation}_cell${cell}`
          });
        }
      }
    }

    return Plot.plot({
      title,
      width,
      height,
      padding: 0,
      x: { 
        domain: [0, history[0].length],
        label: "Cell Position"
      },
      y: { 
        domain: [0, history.length],
        label: "Generation",
        reverse: true // Show evolution from top to bottom
      },
      marks: [
        // Background grid
        showGridLines && Plot.gridX({ stroke: "#f0f0f0", strokeWidth: 0.5 }),
        showGridLines && Plot.gridY({ stroke: "#f0f0f0", strokeWidth: 0.5 }),
        
        // Active cells
        Plot.rect(data, {
          x: "cell",
          y: "generation",
          width: 1,
          height: 1,
          fill: "black",
          title: d => `Generation ${d.generation}, Cell ${d.cell}`
        }),
        
        // Add interactive overlay for strip selection
        Plot.rect([{ x: 0, y: 0, width: history[0].length, height: history.length }], {
          x: "x",
          y: "y", 
          width: "width",
          height: "height",
          fill: "transparent",
          stroke: "none",
          style: "cursor: crosshair"
        })
      ]
    });
  }

  /**
   * Create a strip selection overlay that works with Observable's viewof
   * @param {number[][]} history - CA evolution history
   * @param {Object} options - Configuration options
   * @returns {HTMLElement} Interactive strip selector
   */
  static createStripSelector(history, options = {}) {
    const {
      width = 600,
      height = 400,
      maxStrips = 5,
      stripColors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"]
    } = options;

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";

    // Create canvas for CA visualization
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = "1px solid #ccc";
    canvas.style.cursor = "crosshair";
    
    const ctx = canvas.getContext("2d");
    
    // Render CA history
    this.renderCAToCanvas(ctx, history, { width, height });
    
    // State for strip selection
    const strips = [];
    let isSelecting = false;
    let currentStrip = null;
    
    // Create overlay canvas for strip visualization
    const overlay = document.createElement("canvas");
    overlay.width = width;
    overlay.height = height;
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.pointerEvents = "none";
    
    const overlayCtx = overlay.getContext("2d");
    
    // Mouse event handlers
    canvas.addEventListener("mousedown", (e) => {
      if (strips.length >= maxStrips) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * history[0].length;
      
      currentStrip = {
        startX: Math.floor(x),
        endX: Math.floor(x),
        color: stripColors[strips.length % stripColors.length],
        id: strips.length
      };
      
      isSelecting = true;
      this.redrawOverlay(overlayCtx, [...strips, currentStrip], history, { width, height });
    });
    
    canvas.addEventListener("mousemove", (e) => {
      if (!isSelecting || !currentStrip) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / width) * history[0].length;
      
      currentStrip.endX = Math.floor(x);
      this.redrawOverlay(overlayCtx, [...strips, currentStrip], history, { width, height });
    });
    
    canvas.addEventListener("mouseup", (e) => {
      if (!isSelecting || !currentStrip) return;
      
      // Ensure start is less than end
      if (currentStrip.startX > currentStrip.endX) {
        [currentStrip.startX, currentStrip.endX] = [currentStrip.endX, currentStrip.startX];
      }
      
      // Only add if strip has some width
      if (currentStrip.endX > currentStrip.startX) {
        strips.push({ ...currentStrip });
        
        // Dispatch custom event for Observable reactivity
        const event = new CustomEvent("stripchange", { 
          detail: { 
            strips: strips.map(s => [s.startX, s.endX]),
            stripsWithColors: [...strips]
          } 
        });
        container.dispatchEvent(event);
      }
      
      isSelecting = false;
      currentStrip = null;
    });
    
    // Create control panel
    const controls = document.createElement("div");
    controls.style.marginTop = "10px";
    controls.style.display = "flex";
    controls.style.gap = "10px";
    controls.style.alignItems = "center";
    
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Strips";
    clearButton.onclick = () => {
      strips.length = 0;
      this.redrawOverlay(overlayCtx, strips, history, { width, height });
      const event = new CustomEvent("stripchange", { 
        detail: { 
          strips: [],
          stripsWithColors: []
        } 
      });
      container.dispatchEvent(event);
    };
    
    const infoDiv = document.createElement("div");
    infoDiv.style.fontSize = "12px";
    infoDiv.style.color = "#666";
    infoDiv.innerHTML = `Click and drag to select strips (${strips.length}/${maxStrips} selected)`;
    
    // Update info on strip changes
    container.addEventListener("stripchange", (e) => {
      infoDiv.innerHTML = `Click and drag to select strips (${e.detail.strips.length}/${maxStrips} selected)`;
    });
    
    controls.appendChild(clearButton);
    controls.appendChild(infoDiv);
    
    // Assemble container
    container.appendChild(canvas);
    container.appendChild(overlay);
    container.appendChild(controls);
    
    // Add initial value for Observable
    container.value = { strips: [], stripsWithColors: [] };
    
    return container;
  }

  /**
   * Render CA history to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number[][]} history - CA evolution history
   * @param {Object} options - Rendering options
   */
  static renderCAToCanvas(ctx, history, options = {}) {
    const { width, height } = options;
    const cellWidth = width / history[0].length;
    const cellHeight = height / history.length;
    
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = "black";
    
    for (let generation = 0; generation < history.length; generation++) {
      for (let cell = 0; cell < history[generation].length; cell++) {
        if (history[generation][cell] === 1) {
          ctx.fillRect(
            cell * cellWidth,
            generation * cellHeight,
            cellWidth,
            cellHeight
          );
        }
      }
    }
  }

  /**
   * Redraw strip overlay
   * @param {CanvasRenderingContext2D} ctx - Overlay context
   * @param {Array} strips - Current strips
   * @param {number[][]} history - CA evolution history
   * @param {Object} options - Rendering options
   */
  static redrawOverlay(ctx, strips, history, options = {}) {
    const { width, height } = options;
    
    ctx.clearRect(0, 0, width, height);
    
    const cellWidth = width / history[0].length;
    
    strips.forEach(strip => {
      ctx.fillStyle = strip.color + "40"; // Semi-transparent
      ctx.strokeStyle = strip.color;
      ctx.lineWidth = 2;
      
      const startX = strip.startX * cellWidth;
      const endX = (strip.endX + 1) * cellWidth;
      
      // Fill strip area
      ctx.fillRect(startX, 0, endX - startX, height);
      
      // Stroke strip borders
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
      
      // Add strip label
      ctx.fillStyle = strip.color;
      ctx.font = "12px sans-serif";
      ctx.fillText(
        `Strip ${strip.id + 1}: [${strip.startX}, ${strip.endX}]`,
        startX + 5,
        15 + strip.id * 20
      );
    });
  }

  /**
   * Create Observable Plot visualization with strip highlights
   * @param {number[][]} history - CA evolution history
   * @param {Array} strips - Selected strips as [start, end] pairs
   * @param {Object} options - Plot options
   * @returns {Object} Observable Plot
   */
  static createStripHighlightPlot(history, strips = [], options = {}) {
    const {
      width = 600,
      height = 400,
      title = "Cellular Automata with Selected Strips",
      stripColors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"]
    } = options;

    // Convert history to plottable data
    const cellData = [];
    for (let generation = 0; generation < history.length; generation++) {
      for (let cell = 0; cell < history[generation].length; cell++) {
        if (history[generation][cell] === 1) {
          cellData.push({
            generation,
            cell,
            value: 1
          });
        }
      }
    }

    // Create strip highlight data
    const stripData = [];
    strips.forEach(([start, end], index) => {
      stripData.push({
        startCell: start,
        endCell: end + 1,
        stripId: index,
        color: stripColors[index % stripColors.length]
      });
    });

    return Plot.plot({
      title,
      width,
      height,
      padding: 0,
      x: { 
        domain: [0, history[0].length],
        label: "Cell Position"
      },
      y: { 
        domain: [0, history.length],
        label: "Generation",
        reverse: true
      },
      marks: [
        // Strip backgrounds
        Plot.rect(stripData, {
          x1: "startCell",
          x2: "endCell", 
          y1: 0,
          y2: history.length,
          fill: "color",
          fillOpacity: 0.2,
          stroke: "color",
          strokeWidth: 2
        }),
        
        // Active cells
        Plot.rect(cellData, {
          x: "cell",
          y: "generation",
          width: 1,
          height: 1,
          fill: "black"
        }),
        
        // Strip labels
        Plot.text(stripData, {
          x: d => (d.startCell + d.endCell) / 2,
          y: 5,
          text: d => `Strip ${d.stripId + 1}`,
          fill: "color",
          fontSize: 12,
          fontWeight: "bold"
        })
      ]
    });
  }

  /**
   * Extract and preview musical sequences from selected strips
   * @param {number[][]} history - CA evolution history
   * @param {Array} strips - Selected strips as [start, end] pairs
   * @param {Object} options - Musical mapping options
   * @returns {Object} Musical preview data
   */
  static previewMusicalSequences(history, strips, options = {}) {
    const {
      scale = [60, 62, 63, 65, 67, 68, 70], // C major scale
      durations = [0.25, 0.5, 1],
      maxPreviewLength = 20
    } = options;

    return strips.map(([start, end], stripIndex) => {
      const sequence = [];
      let currentTime = 0;
      
      // Extract strip data
      for (let generation = 0; generation < Math.min(history.length, maxPreviewLength); generation++) {
        const activeCells = [];
        
        for (let cell = start; cell <= end; cell++) {
          if (history[generation][cell] === 1) {
            activeCells.push(cell - start); // Relative position within strip
          }
        }
        
        if (activeCells.length > 0) {
          activeCells.forEach(cellPos => {
            const pitch = scale[cellPos % scale.length];
            const duration = durations[generation % durations.length];
            
            sequence.push({
              pitch,
              duration,
              time: currentTime,
              generation,
              originalCell: cellPos + start
            });
          });
        }
        
        currentTime += durations[generation % durations.length];
      }
      
      return {
        stripIndex,
        stripRange: [start, end],
        notes: sequence,
        totalDuration: currentTime
      };
    });
  }

  /**
   * Create a musical preview visualization
   * @param {Array} musicalSequences - Output from previewMusicalSequences
   * @param {Object} options - Plot options
   * @returns {Object} Observable Plot showing musical preview
   */
  static createMusicalPreviewPlot(musicalSequences, options = {}) {
    const {
      width = 600,
      height = 300,
      title = "Musical Preview of Selected Strips"
    } = options;

    // Flatten all notes with strip information
    const allNotes = [];
    musicalSequences.forEach(seq => {
      seq.notes.forEach(note => {
        allNotes.push({
          ...note,
          stripIndex: seq.stripIndex,
          stripRange: `[${seq.stripRange[0]}, ${seq.stripRange[1]}]`
        });
      });
    });

    if (allNotes.length === 0) {
      return Plot.plot({
        title,
        width,
        height,
        marks: [
          Plot.text([{ x: width/2, y: height/2 }], {
            x: "x",
            y: "y",
            text: "No strips selected",
            fontSize: 16,
            fill: "#666"
          })
        ]
      });
    }

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
        domain: [...new Set(allNotes.map(n => n.stripRange))]
      },
      marks: [
        Plot.rect(allNotes, {
          x1: "time",
          x2: d => d.time + d.duration,
          y1: d => d.pitch - 0.4,
          y2: d => d.pitch + 0.4,
          fill: "stripRange",
          fillOpacity: 0.8,
          title: d => `Strip ${d.stripRange}\nPitch: ${d.pitch}\nTime: ${d.time}\nDuration: ${d.duration}\nGeneration: ${d.generation}`
        })
      ]
    });
  }

  /**
   * Generate Observable notebook cell code for CA strip selection
   * @param {string} caVariableName - Name of CA variable in Observable
   * @returns {string} Observable cell code
   */
  static generateObservableCode(caVariableName = "ca_history") {
    return `
// Interactive strip selector
viewof selectedStrips = ObservableCATools.createStripSelector(${caVariableName}, {
  width: 600,
  height: 400,
  maxStrips: 3
})

// Display selected strips
selectedStrips

// Visualize CA with strip highlights
ObservableCATools.createStripHighlightPlot(${caVariableName}, selectedStrips.strips, {
  title: \`Cellular Automata with \${selectedStrips.strips.length} Selected Strips\`
})

// Preview musical sequences
musicalPreview = ObservableCATools.previewMusicalSequences(${caVariableName}, selectedStrips.strips)

// Show musical preview plot
ObservableCATools.createMusicalPreviewPlot(musicalPreview)

// Extract actual JMON tracks
jmonTracks = selectedStrips.strips.map((strip, index) => {
  const [start, end] = strip;
  const sequence = extractCASequence(${caVariableName}, start, end);
  return createJMONTrack(sequence, {
    label: \`ca-strip-\${index + 1}\`,
    midiChannel: index
  });
})
`;
  }
}

/**
 * Helper function for Observable - extract CA sequence from strip
 * @param {number[][]} history - CA evolution history
 * @param {number} start - Strip start position
 * @param {number} end - Strip end position
 * @returns {Array} Musical sequence
 */
export function extractCASequence(history, start, end, options = {}) {
  const {
    scale = [60, 62, 63, 65, 67, 68, 70], // C major
    durations = [0.25, 0.5, 1, 2]
  } = options;
  
  const sequence = [];
  let currentTime = 0;
  
  for (let generation = 0; generation < history.length; generation++) {
    const activeCells = [];
    
    for (let cell = start; cell <= end; cell++) {
      if (history[generation][cell] === 1) {
        activeCells.push(cell - start);
      }
    }
    
    if (activeCells.length > 0) {
      activeCells.forEach(cellPos => {
        const pitch = scale[cellPos % scale.length];
        const duration = durations[generation % durations.length];
        
        sequence.push({
          pitch,
          duration,
          time: currentTime
        });
      });
    }
    
    currentTime += durations[generation % durations.length];
  }
  
  return sequence;
}

/**
 * Helper function for Observable - create JMON track from sequence
 * @param {Array} sequence - Musical sequence
 * @param {Object} trackOptions - Track configuration
 * @returns {Object} JMON track
 */
export function createJMONTrack(sequence, trackOptions = {}) {
  const {
    label = 'ca-track',
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
