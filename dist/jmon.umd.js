var jm = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/algorithms/visualization/plots/PlotRenderer.js
  async function getPlotly() {
    if (plotlyLoadAttempted) return Plotly;
    plotlyLoadAttempted = true;
    try {
      if (typeof globalThis.window !== "undefined" && globalThis.window.Plotly) {
        Plotly = globalThis.window.Plotly;
        return Plotly;
      }
      if (typeof globalThis.window === "undefined") {
        const plotlyPackage = "plotly.js";
        const plotlyModule = await import(plotlyPackage);
        Plotly = plotlyModule.default || plotlyModule;
        return Plotly;
      }
      return null;
    } catch (error) {
      console.warn("Plotly.js not available. Visualization methods will return placeholder data.");
      return null;
    }
  }
  var Plotly, plotlyLoadAttempted, PlotRenderer;
  var init_PlotRenderer = __esm({
    "src/algorithms/visualization/plots/PlotRenderer.js"() {
      Plotly = null;
      plotlyLoadAttempted = false;
      PlotRenderer = class {
        /**
         * Create a line plot
         */
        static async line(data, options = {}, elementId = "plot") {
          const plotly2 = await getPlotly();
          if (!plotly2) {
            return { data, options, type: "line", message: "Plotly.js not available" };
          }
          const {
            title,
            width = 640,
            height = 400,
            color = "steelblue",
            xTitle = "X",
            yTitle = "Y"
          } = options;
          const trace = {
            x: data.x,
            y: data.y,
            type: "scatter",
            mode: "lines",
            line: { color, width: 2 },
            name: "Line"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly2.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a scatter plot
         */
        static async scatter(data, options = {}, elementId = "plot") {
          const plotly2 = await getPlotly();
          if (!plotly2) {
            return { data, options, type: "scatter", message: "Plotly.js not available" };
          }
          const {
            title,
            width = 640,
            height = 400,
            color = "steelblue",
            xTitle = "X",
            yTitle = "Y"
          } = options;
          const trace = {
            x: data.x,
            y: data.y,
            type: "scatter",
            mode: "markers",
            marker: {
              color: data.color || color,
              size: data.size || 8
            },
            name: "Scatter"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly2.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a heatmap from 2D matrix data
         */
        static async heatmap(matrix, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            colorScale = "Viridis",
            xTitle = "X",
            yTitle = "Y"
          } = options;
          const trace = {
            z: matrix,
            type: "heatmap",
            colorscale: colorScale,
            showscale: true
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a bar chart
         */
        static async bar(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            color = "steelblue",
            xTitle = "X",
            yTitle = "Y"
          } = options;
          const trace = {
            x: data.x.map((x) => x.toString()),
            y: data.y,
            type: "bar",
            marker: { color: data.color || color },
            name: "Bar"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a polar/radar plot for polyloops
         */
        static async radar(data, options = {}, elementId = "plot") {
          const { title, width = 400, height = 400, color = "steelblue" } = options;
          const angles = [...data.x, data.x[0]];
          const values = [...data.y, data.y[0]];
          const trace = {
            r: values,
            theta: angles,
            type: "scatterpolar",
            mode: "lines+markers",
            fill: "toself",
            line: { color },
            marker: { color, size: 8 },
            name: "Radar"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            polar: {
              radialaxis: {
                visible: true,
                range: [0, Math.max(...data.y) * 1.1]
              }
            }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a time series plot
         */
        static async timeSeries(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            xTitle = "Time",
            yTitle = "Value"
          } = options;
          const trace = {
            x: data.x,
            y: data.y,
            type: "scatter",
            mode: "lines",
            line: { width: 2 },
            name: "Time Series"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a matrix visualization (for cellular automata)
         */
        static async matrix(matrix, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            xTitle = "Position",
            yTitle = "Time Step"
          } = options;
          const flippedMatrix = matrix.slice().reverse();
          const trace = {
            z: flippedMatrix,
            type: "heatmap",
            colorscale: [[0, "white"], [1, "black"]],
            showscale: false,
            hoverinfo: "none"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: {
              title: { text: xTitle },
              showticklabels: false
            },
            yaxis: {
              title: { text: yTitle },
              showticklabels: false
            }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a 3D surface plot
         */
        static async surface(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            colorScale = "Viridis",
            xTitle = "X",
            yTitle = "Y",
            zTitle = "Z"
          } = options;
          const trace = {
            x: data.x,
            y: data.y,
            z: data.z,
            type: "surface",
            colorscale: colorScale
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            scene: {
              xaxis: { title: { text: xTitle } },
              yaxis: { title: { text: yTitle } },
              zaxis: { title: { text: zTitle } }
            }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create multiple line plot
         */
        static async multiLine(datasets, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            xTitle = "X",
            yTitle = "Y"
          } = options;
          const traces = datasets.map((data, i) => ({
            x: data.x,
            y: data.y,
            type: "scatter",
            mode: "lines",
            name: `Series ${i + 1}`,
            line: { width: 2 }
          }));
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, traces, layout);
        }
        /**
         * Create histogram
         */
        static async histogram(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            color = "steelblue",
            xTitle = "Value",
            yTitle = "Frequency"
          } = options;
          const trace = {
            x: data.x,
            type: "histogram",
            marker: { color },
            name: "Histogram"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create box plot
         */
        static async boxPlot(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            yTitle = "Value"
          } = options;
          const traces = data.map((dataset, i) => ({
            y: dataset.y,
            type: "box",
            name: `Dataset ${i + 1}`
          }));
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, traces, layout);
        }
        /**
         * Create a violin plot
         */
        static async violin(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            yTitle = "Value"
          } = options;
          const traces = data.map((dataset, i) => ({
            y: dataset.y,
            type: "violin",
            name: `Dataset ${i + 1}`,
            box: { visible: true },
            meanline: { visible: true }
          }));
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, traces, layout);
        }
        /**
         * Create a contour plot
         */
        static async contour(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            colorScale = "Viridis",
            xTitle = "X",
            yTitle = "Y"
          } = options;
          const trace = {
            x: data.x,
            y: data.y,
            z: data.z,
            type: "contour",
            colorscale: colorScale,
            showscale: true
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create a 3D scatter plot
         */
        static async scatter3D(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            color = "steelblue",
            xTitle = "X",
            yTitle = "Y",
            zTitle = "Z"
          } = options;
          const trace = {
            x: data.x,
            y: data.y,
            z: data.z,
            type: "scatter3d",
            mode: "markers",
            marker: {
              color: data.color || color,
              size: 4,
              opacity: 0.8
            },
            name: "3D Scatter"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            scene: {
              xaxis: { title: { text: xTitle } },
              yaxis: { title: { text: yTitle } },
              zaxis: { title: { text: zTitle } }
            }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
        /**
         * Create animated plot with frames
         */
        static async animate(frames, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            duration = 500,
            transition = 100
          } = options;
          const initialData = frames[0]?.data || [];
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            updatemenus: [{
              type: "buttons",
              showactive: false,
              buttons: [{
                label: "Play",
                method: "animate",
                args: [null, {
                  frame: { duration, redraw: true },
                  transition: { duration: transition },
                  fromcurrent: true
                }]
              }, {
                label: "Pause",
                method: "animate",
                args: [[null], {
                  frame: { duration: 0, redraw: false },
                  mode: "immediate",
                  transition: { duration: 0 }
                }]
              }]
            }],
            ...frames[0]?.layout
          };
          const plotlyFrames = frames.map((frame, i) => ({
            name: i.toString(),
            data: frame.data,
            layout: frame.layout
          }));
          await Plotly.newPlot(elementId, initialData, layout);
          await plotly.addFrames(elementId, plotlyFrames);
        }
        /**
         * Create candlestick chart
         */
        static async candlestick(data, options = {}, elementId = "plot") {
          const {
            title,
            width = 640,
            height = 400,
            xTitle = "Time",
            yTitle = "Price"
          } = options;
          const trace = {
            x: data.x,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            type: "candlestick",
            name: "OHLC"
          };
          const layout = {
            title: title ? { text: title } : void 0,
            width,
            height,
            xaxis: { title: { text: xTitle } },
            yaxis: { title: { text: yTitle } }
          };
          await plotly.newPlot(elementId, [trace], layout);
        }
      };
    }
  });

  // src/algorithms/visualization/cellular-automata/CAVisualizer.js
  var CAVisualizer_exports = {};
  __export(CAVisualizer_exports, {
    CAVisualizer: () => CAVisualizer
  });
  var CAVisualizer;
  var init_CAVisualizer = __esm({
    "src/algorithms/visualization/cellular-automata/CAVisualizer.js"() {
      init_PlotRenderer();
      CAVisualizer = class {
        /**
         * Visualize cellular automata evolution over time
         */
        static plotEvolution(history, options = {}) {
          const {
            title = "Cellular Automata Evolution",
            width = 600,
            height = 400,
            colorScheme = "binary",
            showAxis = false
          } = options;
          const plotData = [];
          history.forEach((row, timeStep) => {
            row.forEach((cell, position) => {
              plotData.push({
                x: position,
                y: history.length - 1 - timeStep,
                // Flip Y to show time progression downward
                value: cell
              });
            });
          });
          return PlotRenderer.matrix(history, {
            title,
            width,
            height,
            showAxis
          });
        }
        /**
         * Visualize a single CA generation
         */
        static plotGeneration(generation, options = {}) {
          const {
            title = "CA Generation",
            width = 600,
            height = 100
            // colorScheme = 'binary' // supprimé car inutilisé
          } = options;
          const plotData = {
            x: generation.map((_, i) => i),
            y: generation.map(() => 0),
            color: generation.map((cell) => cell ? "black" : "white")
          };
          return PlotRenderer.scatter(plotData, {
            title,
            width,
            height,
            showAxis: false
          });
        }
        /**
         * Compare multiple CA rules side by side
         */
        static compareRules(rules, options = {}) {
          const {
            width = 300,
            height = 200,
            colorScheme = "binary"
          } = options;
          return rules.map(
            ({ ruleNumber, history }) => this.plotEvolution(history, {
              title: `Rule ${ruleNumber}`,
              width,
              height,
              colorScheme,
              showAxis: false
            })
          );
        }
        /**
         * Create an animated visualization data structure
         */
        static createAnimationData(history) {
          return history.map((generation, frame) => ({
            frame,
            data: generation.map((cell, x) => ({
              x,
              y: 0,
              value: cell
            }))
          }));
        }
        /**
         * Extract specific patterns from CA history
         */
        static extractPatterns(history) {
          const oscillators = [];
          const gliders = [];
          const stillLifes = [];
          const width = history[0]?.length || 0;
          for (let pos = 0; pos < width; pos++) {
            const column = history.map((row) => row[pos]);
            const period = this.findPeriod(column.filter((v) => v !== void 0));
            if (period > 1 && period < 10) {
              oscillators.push({ position: pos, period });
            }
          }
          if (history.length > 5) {
            const lastGen = history[history.length - 1];
            const prevGen = history[history.length - 2];
            if (lastGen && prevGen) {
              for (let pos = 0; pos < width - 3; pos++) {
                const isStable = lastGen.slice(pos, pos + 3).every(
                  (cell, i) => cell === prevGen[pos + i] && cell === 1
                );
                if (isStable) {
                  stillLifes.push({ position: pos, width: 3 });
                }
              }
            }
          }
          return { oscillators, gliders, stillLifes };
        }
        /**
         * Find the period of a repeating sequence
         */
        static findPeriod(sequence) {
          if (sequence.length < 4) return 1;
          for (let period = 1; period <= Math.floor(sequence.length / 2); period++) {
            let isRepeating = true;
            for (let i = period; i < sequence.length; i++) {
              if (sequence[i] !== sequence[i - period]) {
                isRepeating = false;
                break;
              }
            }
            if (isRepeating) return period;
          }
          return 1;
        }
        /**
         * Create a density plot showing CA activity over time
         */
        static plotDensity(history, options = {}) {
          const {
            title = "CA Density Over Time",
            width = 600,
            height = 300
          } = options;
          const densityData = history.map((generation, time) => ({
            time,
            density: generation.reduce((sum, cell) => sum + cell, 0) / generation.length
          }));
          const plotData = {
            x: densityData.map((d) => d.time),
            y: densityData.map((d) => d.density)
          };
          return PlotRenderer.line(plotData, {
            title,
            width,
            height,
            color: "steelblue",
            showAxis: true
          });
        }
        /**
         * Create a spacetime diagram with enhanced visualization
         */
        static plotSpacetime(history, options = {}) {
          const {
            title = "Spacetime Diagram",
            width = 600,
            height = 400,
            showGrid = false
          } = options;
          const plotData = [];
          history.forEach((row, timeStep) => {
            row.forEach((cell, position) => {
              plotData.push({
                x: position,
                y: history.length - 1 - timeStep,
                value: cell,
                border: showGrid
              });
            });
          });
          return PlotRenderer.matrix(history, {
            title,
            width,
            height,
            showAxis: false
          });
        }
      };
    }
  });

  // src/algorithms/visualization/loops/LoopVisualizer.js
  var LoopVisualizer_exports = {};
  __export(LoopVisualizer_exports, {
    LoopVisualizer: () => LoopVisualizer
  });
  async function getPlotly2() {
    if (plotlyLoadAttempted2) return Plotly2;
    plotlyLoadAttempted2 = true;
    try {
      if (typeof globalThis.window !== "undefined" && globalThis.window.Plotly) {
        Plotly2 = globalThis.window.Plotly;
        return Plotly2;
      }
      if (typeof globalThis.window === "undefined") {
        const plotlyPackage = "plotly.js";
        const plotlyModule = await import(plotlyPackage);
        Plotly2 = plotlyModule.default || plotlyModule;
        return Plotly2;
      }
      return null;
    } catch (error) {
      console.warn("Plotly.js not available. Visualization methods will return placeholder data.");
      return null;
    }
  }
  var Plotly2, plotlyLoadAttempted2, LoopVisualizer;
  var init_LoopVisualizer = __esm({
    "src/algorithms/visualization/loops/LoopVisualizer.js"() {
      Plotly2 = null;
      plotlyLoadAttempted2 = false;
      LoopVisualizer = class {
        /**
         * Plot loops using polar coordinate system, matching Python implementation
         * Works with JMON-compliant loop data
         */
        static async plotLoops(loops, measureLength = 4, pulse = 1 / 4, colors = null, options = {}) {
          const {
            container = "loop-plot",
            title = "Loop Visualization",
            showDurationArcs = true,
            showMarkers = true,
            showShapes = true,
            colorScheme = "colorblind"
            // 'colorblind', 'viridis', 'classic'
          } = options;
          const tracks = Object.values(loops);
          const layerColors = colors || this.generateColors(tracks.length, colorScheme);
          const traces = [];
          tracks.forEach((track, trackIndex) => {
            if (!track.notes || track.notes.length === 0) return;
            const activeNotes = track.notes.filter((note) => note.pitch !== null);
            if (activeNotes.length === 0) return;
            if (showDurationArcs || showMarkers) {
              activeNotes.forEach((note) => {
                const startTheta = note.time / measureLength * 360;
                const durationTheta = note.duration / measureLength * 360;
                if (showDurationArcs && durationTheta > 1) {
                  const arcPoints = this.generateArcPoints(startTheta, durationTheta, 50);
                  const radius = Array(50).fill(tracks.length - trackIndex - 1);
                  traces.push({
                    type: "scatterpolar",
                    r: radius,
                    theta: arcPoints,
                    mode: "lines",
                    line: {
                      color: "rgba(60, 60, 60, 0.65)",
                      width: 8
                    },
                    name: `${track.label} Duration`,
                    showlegend: false
                  });
                }
                if (showMarkers) {
                  [startTheta, (startTheta + durationTheta) % 360].forEach((theta) => {
                    traces.push({
                      type: "scatterpolar",
                      r: [tracks.length - trackIndex - 0.9, tracks.length - trackIndex - 1.1],
                      theta: [theta, theta],
                      mode: "lines",
                      line: {
                        color: "Black",
                        width: 3
                      },
                      name: `${track.label} Markers`,
                      showlegend: false
                    });
                  });
                }
              });
            }
            if (showShapes) {
              const noteAngles = activeNotes.map((note) => note.time / measureLength * 360);
              if (noteAngles.length > 1) {
                noteAngles.push(noteAngles[0]);
                traces.push({
                  type: "scatterpolar",
                  r: Array(noteAngles.length).fill(tracks.length - trackIndex - 1),
                  theta: noteAngles,
                  mode: "lines",
                  line: {
                    color: "rgba(0, 0, 0, 0.65)",
                    width: 1
                  },
                  fill: "toself",
                  fillcolor: layerColors[trackIndex % layerColors.length],
                  name: track.label,
                  showlegend: false
                });
              }
            }
          });
          const tickvals = this.generateTickValues(measureLength, pulse);
          const ticktext = this.generateTickLabels(measureLength, pulse);
          const trackNames = tracks.map((track) => track.label).reverse();
          const layout = {
            title: { text: title },
            polar: {
              radialaxis: {
                visible: true,
                range: [tracks.length, -0.1],
                tickvals: Array.from({ length: tracks.length }, (_, i) => i),
                ticktext: trackNames
              },
              angularaxis: {
                tickvals,
                ticktext,
                direction: "clockwise",
                rotation: 90
              }
            },
            template: "none",
            showlegend: false
          };
          const config = {
            responsive: true,
            displayModeBar: true
          };
          const plotly2 = await getPlotly2();
          if (!plotly2) {
            throw new Error("Plotly.js not available for visualization");
          }
          return plotly2.newPlot(container, traces, layout, config);
        }
        /**
         * Generate colors using different schemes, optimized for accessibility
         */
        static generateColors(count, scheme = "colorblind") {
          const colors = [];
          switch (scheme) {
            case "colorblind": {
              const cbPalette = [
                "rgba(230, 159, 0, 0.65)",
                // Orange
                "rgba(86, 180, 233, 0.65)",
                // Sky blue
                "rgba(0, 158, 115, 0.65)",
                // Bluish green
                "rgba(240, 228, 66, 0.65)",
                // Yellow
                "rgba(0, 114, 178, 0.65)",
                // Blue
                "rgba(213, 94, 0, 0.65)",
                // Vermillion
                "rgba(204, 121, 167, 0.65)"
                // Reddish purple
              ];
              for (let i = 0; i < count; i++) {
                colors.push(cbPalette[i % cbPalette.length]);
              }
              break;
            }
            case "viridis": {
              const viridisColors = [
                "rgba(68, 1, 84, 0.65)",
                // Purple
                "rgba(59, 82, 139, 0.65)",
                // Blue-purple
                "rgba(33, 144, 140, 0.65)",
                // Teal
                "rgba(94, 201, 98, 0.65)",
                // Green
                "rgba(253, 231, 37, 0.65)"
                // Yellow
              ];
              for (let i = 0; i < count; i++) {
                if (count <= viridisColors.length) {
                  colors.push(viridisColors[i]);
                } else {
                  const ratio = i / (count - 1);
                  const scaledIndex = ratio * (viridisColors.length - 1);
                  const lowerIndex = Math.floor(scaledIndex);
                  const upperIndex = Math.min(lowerIndex + 1, viridisColors.length - 1);
                  colors.push(viridisColors[lowerIndex]);
                }
              }
              break;
            }
            case "classic":
            default:
              for (let i = 0; i < count; i++) {
                const hue = i / count;
                const rgb = this.hsvToRgb(hue, 1, 1);
                colors.push(`rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, 0.5)`);
              }
              break;
          }
          return colors;
        }
        /**
         * Convert HSV to RGB color space
         */
        static hsvToRgb(h, s, v) {
          let r, g, b;
          const i = Math.floor(h * 6);
          const f = h * 6 - i;
          const p = v * (1 - s);
          const q = v * (1 - f * s);
          const t = v * (1 - (1 - f) * s);
          switch (i % 6) {
            case 0:
              r = v;
              g = t;
              b = p;
              break;
            case 1:
              r = q;
              g = v;
              b = p;
              break;
            case 2:
              r = p;
              g = v;
              b = t;
              break;
            case 3:
              r = p;
              g = q;
              b = v;
              break;
            case 4:
              r = t;
              g = p;
              b = v;
              break;
            case 5:
              r = v;
              g = p;
              b = q;
              break;
            default:
              r = g = b = 0;
          }
          return { r, g, b };
        }
        /**
         * Generate arc points for smooth curves
         */
        static generateArcPoints(startTheta, durationTheta, numPoints) {
          const points = [];
          const endTheta = startTheta + durationTheta;
          for (let i = 0; i < numPoints; i++) {
            const theta = startTheta + i / (numPoints - 1) * durationTheta;
            points.push(theta % 360);
          }
          return points;
        }
        /**
         * Generate tick values for angular axis
         */
        static generateTickValues(measureLength, pulse) {
          const tickvals = [];
          const numTicks = Math.floor(measureLength / pulse);
          for (let i = 0; i < numTicks; i++) {
            tickvals.push(i * 360 / numTicks);
          }
          return tickvals;
        }
        /**
         * Generate tick labels for angular axis
         */
        static generateTickLabels(measureLength, pulse) {
          const ticktext = [];
          const numTicks = Math.floor(measureLength / pulse);
          for (let i = 0; i < numTicks; i++) {
            const beat = i * pulse % measureLength;
            ticktext.push(beat.toString());
          }
          return ticktext;
        }
      };
    }
  });

  // src/algorithms/theory/harmony/PerformanceCompiler.js
  function compilePerformanceTrack(track, options = {}) {
    const { timeSignature = "4/4", tempo = 120 } = options;
    const notes = Array.isArray(track?.events) ? track.events : Array.isArray(track?.notes) ? track.notes : [];
    const modulations = [];
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (!n || typeof n !== "object") continue;
      const isRest = n.pitch === null || n.pitch === void 0;
      const onset = toNumber(n.time, 0);
      const dur = toNumber(n.duration, 0);
      const end = onset + Math.max(0, dur);
      const arts = normalizeArticulations(n);
      if (arts.length === 0) continue;
      for (const art of arts) {
        const type = typeof art === "string" ? art : art.type;
        if (!type) continue;
        switch (type) {
          // Simple articulations: duration / velocity shaping
          case "staccato": {
            modulations.push({
              type: "durationScale",
              index: i,
              factor: 0.5,
              start: onset,
              end
            });
            break;
          }
          case "tenuto": {
            modulations.push({
              type: "durationScale",
              index: i,
              factor: 1.1,
              start: onset,
              end
            });
            break;
          }
          case "accent": {
            modulations.push({
              type: "velocityBoost",
              index: i,
              amountBoost: 0.2,
              start: onset,
              end: onset + Math.min(0.1, dur)
              // short emphasis
            });
            break;
          }
          case "marcato": {
            modulations.push({
              type: "velocityBoost",
              index: i,
              amountBoost: 0.3,
              start: onset,
              end: onset + Math.min(0.15, dur)
            });
            modulations.push({
              type: "durationScale",
              index: i,
              factor: 0.9,
              start: onset,
              end
            });
            break;
          }
          // Complex articulations: curves / continuous modulations
          case "glissando":
          case "portamento": {
            if (isRest) break;
            const fromPitch = toMainPitch(n.pitch);
            const toPitch = typeof art.target === "number" ? art.target : typeof art.to === "number" ? art.to : void 0;
            if (typeof fromPitch !== "number" || typeof toPitch !== "number") break;
            modulations.push({
              type: "pitch",
              subtype: type,
              index: i,
              from: fromPitch,
              to: toPitch,
              start: onset,
              end,
              curve: art.curve || "linear"
            });
            break;
          }
          case "bend": {
            const amount = toNumber(art.amount, void 0);
            if (amount === void 0) break;
            modulations.push({
              type: "pitch",
              subtype: "bend",
              index: i,
              amount,
              start: onset,
              end,
              curve: art.curve || "linear"
            });
            break;
          }
          case "vibrato": {
            modulations.push({
              type: "pitch",
              subtype: "vibrato",
              index: i,
              rate: toNumber(art.rate, 5),
              depth: toNumber(art.depth, 50),
              start: onset,
              end
            });
            break;
          }
          case "tremolo": {
            modulations.push({
              type: "amplitude",
              subtype: "tremolo",
              index: i,
              rate: toNumber(art.rate, 8),
              depth: clamp01(art.depth ?? 0.3),
              start: onset,
              end
            });
            break;
          }
          case "crescendo":
          case "diminuendo": {
            const startV = clamp01(n.velocity ?? 0.8);
            const endV = clamp01(toNumber(art.endVelocity, type === "crescendo" ? Math.min(1, startV + 0.2) : Math.max(0, startV - 0.2)));
            modulations.push({
              type: "amplitude",
              subtype: type,
              index: i,
              startVelocity: startV,
              endVelocity: endV,
              start: onset,
              end,
              curve: art.curve || "linear"
            });
            break;
          }
          default:
            break;
        }
      }
    }
    return { notes, modulations };
  }
  function compilePerformance(composition, options = {}) {
    const tracks = normalizeTracks(composition?.tracks);
    const compiled = tracks.map((t) => compilePerformanceTrack(t, options));
    const metadata = composition?.metadata ? { ...composition.metadata } : void 0;
    return { tracks: compiled, ...metadata ? { metadata } : {} };
  }
  function normalizeArticulations(note) {
    const out = [];
    if (Array.isArray(note?.articulations)) {
      for (const a of note.articulations) {
        if (typeof a === "string") out.push({ type: a });
        else if (a && typeof a === "object" && typeof a.type === "string") out.push({ ...a });
      }
    }
    return out;
  }
  function normalizeTracks(tracks) {
    if (Array.isArray(tracks)) {
      return tracks.map((t, i) => Array.isArray(t?.notes) ? t : { name: `Track ${i + 1}`, notes: Array.isArray(t) ? t : t?.notes || [] });
    }
    if (tracks && typeof tracks === "object") {
      return Object.entries(tracks).map(([name, notes], i) => ({
        name: name || `Track ${i + 1}`,
        notes: Array.isArray(notes?.notes) ? notes.notes : Array.isArray(notes) ? notes : []
      }));
    }
    return [];
  }
  function toMainPitch(pitch) {
    if (pitch == null) return void 0;
    if (Array.isArray(pitch)) {
      const arr = pitch.filter((x) => typeof x === "number");
      if (arr.length === 0) return void 0;
      return Math.min(...arr);
    }
    if (typeof pitch === "number") return pitch;
    return void 0;
  }
  function toNumber(v, fallback) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function clamp01(v) {
    const n = toNumber(v, 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }
  var init_PerformanceCompiler = __esm({
    "src/algorithms/theory/harmony/PerformanceCompiler.js"() {
    }
  });

  // src/algorithms/audio/index.js
  function compileEvents(track, options = {}) {
    return compilePerformanceTrack(track, options);
  }
  function compileTimeline(track, options = {}) {
    return compilePerformanceTrack(track, options);
  }
  function deriveTimeline(track, options = {}) {
    return compilePerformanceTrack(track, options);
  }
  function compileComposition(composition, options = {}) {
    return compilePerformance(composition, options);
  }
  var audio_default;
  var init_audio = __esm({
    "src/algorithms/audio/index.js"() {
      init_PerformanceCompiler();
      audio_default = {
        compileEvents,
        compileTimeline,
        deriveTimeline,
        compileComposition
      };
    }
  });

  // src/utils/normalize.js
  var normalize_exports = {};
  __export(normalize_exports, {
    midiToNoteName: () => midiToNoteName,
    normalizeAudioGraph: () => normalizeAudioGraph,
    normalizeSamplerUrlsToNoteNames: () => normalizeSamplerUrlsToNoteNames
  });
  function midiToNoteName(midiLike) {
    const n = typeof midiLike === "string" ? parseInt(midiLike, 10) : midiLike;
    if (!Number.isFinite(n)) return String(midiLike);
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const note = names[(n % 12 + 12) % 12];
    const octave = Math.floor(n / 12) - 1;
    return `${note}${octave}`;
  }
  function capitalizeFirstLetter(str) {
    if (!str || typeof str !== "string") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function normalizeAudioGraph(composition) {
    if (!composition || !composition.audioGraph) return composition;
    const ag = composition.audioGraph;
    if (Array.isArray(ag)) return composition;
    if (ag.nodes && Array.isArray(ag.nodes)) {
      const connectionsMap = /* @__PURE__ */ new Map();
      if (ag.connections && Array.isArray(ag.connections)) {
        ag.connections.forEach((conn) => {
          if (conn.from && conn.to) {
            connectionsMap.set(conn.from, conn.to);
          }
        });
      }
      const flatArray = ag.nodes.map((node) => {
        const target = connectionsMap.get(node.id);
        const normalizedType = capitalizeFirstLetter(node.type);
        return {
          id: node.id,
          type: normalizedType,
          options: node.params || node.options || {},
          ...target && { target }
        };
      });
      const destinationRefs = /* @__PURE__ */ new Set();
      if (ag.connections) {
        ag.connections.forEach((conn) => {
          if (conn.to === "destination") {
            destinationRefs.add(conn.to);
          }
        });
      }
      if (destinationRefs.size > 0) {
        flatArray.push({ id: "destination", type: "Destination" });
      }
      composition.audioGraph = flatArray;
    }
    return composition;
  }
  function normalizeSamplerUrlsToNoteNames(composition) {
    if (!composition || !Array.isArray(composition.audioGraph)) return composition;
    composition.audioGraph.forEach((node) => {
      try {
        if (!node || node.type !== "Sampler") return;
        const opts = node.options || {};
        const urls = opts.urls;
        if (!urls || typeof urls !== "object") return;
        const normalized = {};
        Object.keys(urls).forEach((k) => {
          const keyStr = String(k);
          let noteKey = keyStr;
          if (/^\d+$/.test(keyStr)) {
            noteKey = midiToNoteName(parseInt(keyStr, 10));
          }
          normalized[noteKey] = urls[k];
        });
        node.options = { ...opts, urls: normalized };
      } catch (_) {
      }
    });
    return composition;
  }
  var init_normalize = __esm({
    "src/utils/normalize.js"() {
    }
  });

  // src/converters/tonejs.js
  function tonejs(composition, options = {}) {
    try {
      normalizeAudioGraph(composition);
    } catch (_) {
    }
    try {
      normalizeSamplerUrlsToNoteNames(composition);
    } catch (_) {
    }
    const converter = new Tonejs(options);
    const originalTracks = converter.convert(composition);
    const tracks = originalTracks.map((track, index) => ({
      originalTrackIndex: index,
      voiceIndex: 0,
      totalVoices: 1,
      trackInfo: { label: track.label },
      synthConfig: { type: track.type || "PolySynth" },
      partEvents: track.part || []
    }));
    const bpm = composition.tempo || composition.metadata?.tempo || composition.bpm || 120;
    const [tsNum, tsDen] = (composition.timeSignature || "4/4").split("/").map((x) => parseInt(x, 10));
    const beatsPerBar = isFinite(tsNum) ? tsNum : 4;
    let totalBeats = 0;
    tracks.forEach((track) => {
      if (track.partEvents && track.partEvents.length > 0) {
        track.partEvents.forEach((ev) => {
          const startBeats = Tonejs.parseBBTToBeats(ev.time, beatsPerBar);
          const durBeats = Tonejs.parseDurationToBeats(ev.duration, beatsPerBar);
          const endBeats = startBeats + durBeats;
          if (endBeats > totalBeats) totalBeats = endBeats;
        });
      }
    });
    const secondsPerBeat = 60 / bpm;
    const totalDuration = totalBeats * secondsPerBeat;
    console.log(`[TONEJS] Duration calc: totalBeats=${totalBeats.toFixed(2)} beats = ${totalDuration.toFixed(2)}s - loop ends exactly when last note finishes`);
    return {
      tracks,
      metadata: {
        totalDuration,
        // Use total duration - loop should end when last note finishes
        tempo: bpm
      }
    };
  }
  var Tonejs;
  var init_tonejs = __esm({
    "src/converters/tonejs.js"() {
      init_normalize();
      Tonejs = class {
        constructor(options = {}) {
          this.options = options;
        }
        // Parse bars:beats:ticks -> beats (supports fractional beats)
        static parseBBTToBeats(timeStr, beatsPerBar = 4, ppq = 480) {
          if (typeof timeStr === "number") return timeStr;
          if (typeof timeStr !== "string") return 0;
          const m = timeStr.match(/^(\d+):(\d+(?:\.\d+)?):(\d+)$/);
          if (!m) return 0;
          const bars = parseInt(m[1], 10);
          const beats = parseFloat(m[2]);
          const ticks = parseInt(m[3], 10);
          return bars * beatsPerBar + beats + ticks / ppq;
        }
        // Parse note value (e.g., 4n, 8n, 8t) or BBT to beats
        static parseDurationToBeats(dur, beatsPerBar = 4, ppq = 480) {
          if (typeof dur === "number") return dur;
          if (typeof dur !== "string") return 0;
          if (/^\d+:\d+(?:\.\d+)?:\d+$/.test(dur)) {
            return this.parseBBTToBeats(dur, beatsPerBar, ppq);
          }
          const m = dur.match(/^(\d+)(n|t)$/);
          if (m) {
            const val = parseInt(m[1], 10);
            const type = m[2];
            if (type === "n") {
              return 4 / val;
            } else if (type === "t") {
              return 4 / val * (2 / 3);
            }
          }
          return 0;
        }
        convert(composition) {
          const tracks = composition.tracks || [];
          return tracks.map((track) => ({
            label: track.label,
            type: "PolySynth",
            // Default type for the current player
            part: (track.events || track.notes || []).map((note) => ({
              time: note.time,
              pitch: note.pitch,
              duration: note.duration,
              velocity: note.velocity || 0.8,
              microtuning: note.microtuning
              // Pass through microtuning in semitones
            }))
          }));
        }
      };
    }
  });

  // src/utils/gm-instruments.js
  var gm_instruments_exports = {};
  __export(gm_instruments_exports, {
    CDN_SOURCES: () => CDN_SOURCES,
    GM_INSTRUMENTS: () => GM_INSTRUMENTS,
    createGMInstrumentNode: () => createGMInstrumentNode,
    findGMProgramByName: () => findGMProgramByName,
    generateCompleteSamplerUrls: () => generateCompleteSamplerUrls,
    generateSamplerUrls: () => generateSamplerUrls,
    getPopularInstruments: () => getPopularInstruments
  });
  function generateSamplerUrls(gmProgram, baseUrl = CDN_SOURCES[0], noteRange = [21, 108], strategy = "complete") {
    const instrument = GM_INSTRUMENTS[gmProgram];
    if (!instrument) {
      console.warn(
        `GM program ${gmProgram} not found, using Acoustic Grand Piano`
      );
      return generateSamplerUrls(0, baseUrl, noteRange);
    }
    const urls = {};
    const [minNote, maxNote] = noteRange;
    let selectedMidis = [];
    switch (strategy) {
      case "minimal":
        for (let midi2 = minNote; midi2 <= maxNote; midi2 += 12) {
          selectedMidis.push(midi2);
        }
        selectedMidis.push(60);
        break;
      case "balanced":
        for (let midi2 = minNote; midi2 <= maxNote; midi2 += 4) {
          selectedMidis.push(midi2);
        }
        [60, 64, 67].forEach((key) => {
          if (key >= minNote && key <= maxNote && !selectedMidis.includes(key)) {
            selectedMidis.push(key);
          }
        });
        break;
      case "quality":
        for (let midi2 = minNote; midi2 <= maxNote; midi2 += 3) {
          selectedMidis.push(midi2);
        }
        break;
      case "complete":
        for (let midi2 = minNote; midi2 <= maxNote; midi2++) {
          selectedMidis.push(midi2);
        }
        break;
      default:
        console.warn(`Unknown sampling strategy '${strategy}', using 'balanced'`);
        return generateSamplerUrls(gmProgram, baseUrl, noteRange, "balanced");
    }
    selectedMidis = [...new Set(selectedMidis)].sort((a, b) => a - b);
    for (const midi2 of selectedMidis) {
      const noteName = midiToNoteName2(midi2);
      urls[noteName] = generateFallbackUrl(instrument.folder, noteName, baseUrl);
    }
    console.log(
      `[GM INSTRUMENT] Generated ${Object.keys(urls).length} sample URLs for ${instrument.name} (${strategy} strategy)`
    );
    return urls;
  }
  function generateFallbackUrl(folder, noteName, preferredBaseUrl) {
    return `${preferredBaseUrl}/${folder}/${noteName}.mp3`;
  }
  function generateCompleteSamplerUrls(gmProgram, baseUrl = CDN_SOURCES[0], noteRange = [21, 108]) {
    const instrument = GM_INSTRUMENTS[gmProgram];
    if (!instrument) {
      console.warn(
        `GM program ${gmProgram} not found, using Acoustic Grand Piano`
      );
      return generateCompleteSamplerUrls(0, baseUrl, noteRange);
    }
    const urls = {};
    const [minNote, maxNote] = noteRange;
    for (let midi2 = minNote; midi2 <= maxNote; midi2++) {
      const noteName = midiToNoteName2(midi2);
      urls[noteName] = `${baseUrl}/${instrument.folder}/${noteName}.mp3`;
    }
    return urls;
  }
  function midiToNoteName2(midi2) {
    const noteNames = [
      "C",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B"
    ];
    const octave = Math.floor(midi2 / 12) - 1;
    const noteIndex = midi2 % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }
  function findGMProgramByName(instrumentName) {
    const searchName = instrumentName.toLowerCase().trim();
    for (const [program, instrument] of Object.entries(GM_INSTRUMENTS)) {
      if (instrument.name.toLowerCase() === searchName) {
        return parseInt(program, 10);
      }
    }
    for (const [program, instrument] of Object.entries(GM_INSTRUMENTS)) {
      const instName = instrument.name.toLowerCase();
      if (instName.includes(searchName) || searchName.includes(instName.split(" ")[0])) {
        return parseInt(program, 10);
      }
    }
    return null;
  }
  function createGMInstrumentNode(id, instrument, options = {}, target = "destination") {
    let gmProgram;
    if (typeof instrument === "string") {
      gmProgram = findGMProgramByName(instrument);
      if (gmProgram === null) {
        console.warn(`GM instrument "${instrument}" not found. Available instruments:`);
        const availableNames = Object.values(GM_INSTRUMENTS).map((inst) => inst.name).slice(0, 10);
        console.warn(`Examples: ${availableNames.join(", ")}...`);
        console.warn("Using Acoustic Grand Piano as fallback");
        gmProgram = 0;
      }
    } else {
      gmProgram = instrument;
    }
    const instrumentData = GM_INSTRUMENTS[gmProgram];
    if (!instrumentData) return null;
    const {
      baseUrl = CDN_SOURCES[0],
      noteRange = [21, 108],
      // Complete MIDI range for maximum quality
      envelope = { attack: 0.1, release: 1 },
      strategy = "complete"
      // Use complete sampling by default
    } = options;
    return {
      id,
      type: "Sampler",
      options: {
        urls: generateSamplerUrls(gmProgram, baseUrl, noteRange, strategy),
        baseUrl: "",
        // URLs are already complete
        envelope: {
          enabled: true,
          attack: envelope.attack,
          release: envelope.release
        }
      },
      target
    };
  }
  function getPopularInstruments() {
    return [
      // Piano & Keys
      { program: 0, name: "Acoustic Grand Piano", category: "Piano" },
      { program: 1, name: "Bright Acoustic Piano", category: "Piano" },
      { program: 4, name: "Electric Piano 1", category: "Piano" },
      { program: 6, name: "Harpsichord", category: "Piano" },
      // Strings
      { program: 40, name: "Violin", category: "Strings" },
      { program: 42, name: "Cello", category: "Strings" },
      { program: 48, name: "String Ensemble 1", category: "Strings" },
      // Brass
      { program: 56, name: "Trumpet", category: "Brass" },
      { program: 57, name: "Trombone", category: "Brass" },
      // Woodwinds
      { program: 65, name: "Alto Sax", category: "Woodwinds" },
      { program: 71, name: "Clarinet", category: "Woodwinds" },
      { program: 73, name: "Flute", category: "Woodwinds" },
      // Guitar & Bass
      { program: 24, name: "Acoustic Guitar (nylon)", category: "Guitar" },
      { program: 25, name: "Acoustic Guitar (steel)", category: "Guitar" },
      { program: 33, name: "Electric Bass (finger)", category: "Bass" },
      // Organ & Accordion
      { program: 16, name: "Drawbar Organ", category: "Organ" },
      { program: 21, name: "Accordion", category: "Organ" }
    ];
  }
  var GM_INSTRUMENTS, CDN_SOURCES;
  var init_gm_instruments = __esm({
    "src/utils/gm-instruments.js"() {
      GM_INSTRUMENTS = {
        // Piano Family
        0: { name: "Acoustic Grand Piano", folder: "acoustic_grand_piano-mp3" },
        1: { name: "Bright Acoustic Piano", folder: "bright_acoustic_piano-mp3" },
        2: { name: "Electric Grand Piano", folder: "electric_grand_piano-mp3" },
        3: { name: "Honky-tonk Piano", folder: "honkytonk_piano-mp3" },
        4: { name: "Electric Piano 1", folder: "electric_piano_1-mp3" },
        5: { name: "Electric Piano 2", folder: "electric_piano_2-mp3" },
        6: { name: "Harpsichord", folder: "harpsichord-mp3" },
        7: { name: "Clavinet", folder: "clavinet-mp3" },
        // Chromatic Percussion
        8: { name: "Celesta", folder: "celesta-mp3" },
        9: { name: "Glockenspiel", folder: "glockenspiel-mp3" },
        10: { name: "Music Box", folder: "music_box-mp3" },
        11: { name: "Vibraphone", folder: "vibraphone-mp3" },
        12: { name: "Marimba", folder: "marimba-mp3" },
        13: { name: "Xylophone", folder: "xylophone-mp3" },
        14: { name: "Tubular Bells", folder: "tubular_bells-mp3" },
        15: { name: "Dulcimer", folder: "dulcimer-mp3" },
        // Organ
        16: { name: "Drawbar Organ", folder: "drawbar_organ-mp3" },
        17: { name: "Percussive Organ", folder: "percussive_organ-mp3" },
        18: { name: "Rock Organ", folder: "rock_organ-mp3" },
        19: { name: "Church Organ", folder: "church_organ-mp3" },
        20: { name: "Reed Organ", folder: "reed_organ-mp3" },
        21: { name: "Accordion", folder: "accordion-mp3" },
        22: { name: "Harmonica", folder: "harmonica-mp3" },
        23: { name: "Tango Accordion", folder: "tango_accordion-mp3" },
        // Guitar
        24: { name: "Acoustic Guitar (nylon)", folder: "acoustic_guitar_nylon-mp3" },
        25: { name: "Acoustic Guitar (steel)", folder: "acoustic_guitar_steel-mp3" },
        26: { name: "Electric Guitar (jazz)", folder: "electric_guitar_jazz-mp3" },
        27: { name: "Electric Guitar (clean)", folder: "electric_guitar_clean-mp3" },
        28: { name: "Electric Guitar (muted)", folder: "electric_guitar_muted-mp3" },
        29: { name: "Overdriven Guitar", folder: "overdriven_guitar-mp3" },
        30: { name: "Distortion Guitar", folder: "distortion_guitar-mp3" },
        31: { name: "Guitar Harmonics", folder: "guitar_harmonics-mp3" },
        // Bass
        32: { name: "Acoustic Bass", folder: "acoustic_bass-mp3" },
        33: { name: "Electric Bass (finger)", folder: "electric_bass_finger-mp3" },
        34: { name: "Electric Bass (pick)", folder: "electric_bass_pick-mp3" },
        35: { name: "Fretless Bass", folder: "fretless_bass-mp3" },
        36: { name: "Slap Bass 1", folder: "slap_bass_1-mp3" },
        37: { name: "Slap Bass 2", folder: "slap_bass_2-mp3" },
        38: { name: "Synth Bass 1", folder: "synth_bass_1-mp3" },
        39: { name: "Synth Bass 2", folder: "synth_bass_2-mp3" },
        // Strings
        40: { name: "Violin", folder: "violin-mp3" },
        41: { name: "Viola", folder: "viola-mp3" },
        42: { name: "Cello", folder: "cello-mp3" },
        43: { name: "Contrabass", folder: "contrabass-mp3" },
        44: { name: "Tremolo Strings", folder: "tremolo_strings-mp3" },
        45: { name: "Pizzicato Strings", folder: "pizzicato_strings-mp3" },
        46: { name: "Orchestral Harp", folder: "orchestral_harp-mp3" },
        47: { name: "Timpani", folder: "timpani-mp3" },
        // Popular selections for common use
        48: { name: "String Ensemble 1", folder: "string_ensemble_1-mp3" },
        49: { name: "String Ensemble 2", folder: "string_ensemble_2-mp3" },
        56: { name: "Trumpet", folder: "trumpet-mp3" },
        57: { name: "Trombone", folder: "trombone-mp3" },
        58: { name: "Tuba", folder: "tuba-mp3" },
        64: { name: "Soprano Sax", folder: "soprano_sax-mp3" },
        65: { name: "Alto Sax", folder: "alto_sax-mp3" },
        66: { name: "Tenor Sax", folder: "tenor_sax-mp3" },
        67: { name: "Baritone Sax", folder: "baritone_sax-mp3" },
        68: { name: "Oboe", folder: "oboe-mp3" },
        69: { name: "English Horn", folder: "english_horn-mp3" },
        70: { name: "Bassoon", folder: "bassoon-mp3" },
        71: { name: "Clarinet", folder: "clarinet-mp3" },
        72: { name: "Piccolo", folder: "piccolo-mp3" },
        73: { name: "Flute", folder: "flute-mp3" },
        74: { name: "Recorder", folder: "recorder-mp3" }
      };
      CDN_SOURCES = [
        "https://raw.githubusercontent.com/jmonlabs/midi-js-soundfonts/gh-pages/FluidR3_GM",
        "https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM"
      ];
    }
  });

  // src/constants/audio-effects.js
  var audio_effects_exports = {};
  __export(audio_effects_exports, {
    ADVANCED_EFFECTS: () => ADVANCED_EFFECTS,
    ALL_AUDIO_GRAPH_TYPES: () => ALL_AUDIO_GRAPH_TYPES,
    ALL_EFFECTS: () => ALL_EFFECTS,
    DELAY_EFFECTS: () => DELAY_EFFECTS,
    DISTORTION_EFFECTS: () => DISTORTION_EFFECTS,
    DYNAMICS_EFFECTS: () => DYNAMICS_EFFECTS,
    FILTER_EFFECTS: () => FILTER_EFFECTS,
    MODULATION_EFFECTS: () => MODULATION_EFFECTS,
    REVERB_EFFECTS: () => REVERB_EFFECTS,
    SPECIAL_NODE_TYPES: () => SPECIAL_NODE_TYPES,
    SYNTHESIZER_TYPES: () => SYNTHESIZER_TYPES,
    default: () => audio_effects_default
  });
  var REVERB_EFFECTS, DELAY_EFFECTS, MODULATION_EFFECTS, DISTORTION_EFFECTS, DYNAMICS_EFFECTS, FILTER_EFFECTS, ADVANCED_EFFECTS, ALL_EFFECTS, SYNTHESIZER_TYPES, SPECIAL_NODE_TYPES, ALL_AUDIO_GRAPH_TYPES, audio_effects_default;
  var init_audio_effects = __esm({
    "src/constants/audio-effects.js"() {
      REVERB_EFFECTS = [
        "Reverb",
        "JCReverb",
        "Freeverb"
      ];
      DELAY_EFFECTS = [
        "Delay",
        "FeedbackDelay",
        "PingPongDelay"
      ];
      MODULATION_EFFECTS = [
        "Chorus",
        "Phaser",
        "Tremolo",
        "Vibrato",
        "AutoWah"
      ];
      DISTORTION_EFFECTS = [
        "Distortion",
        "Chebyshev",
        "BitCrusher"
      ];
      DYNAMICS_EFFECTS = [
        "Compressor",
        "Limiter",
        "Gate",
        "MidSideCompressor"
      ];
      FILTER_EFFECTS = [
        "Filter",
        "AutoFilter"
      ];
      ADVANCED_EFFECTS = [
        "FrequencyShifter",
        "PitchShift",
        "StereoWidener"
      ];
      ALL_EFFECTS = [
        ...REVERB_EFFECTS,
        ...DELAY_EFFECTS,
        ...MODULATION_EFFECTS,
        ...DISTORTION_EFFECTS,
        ...DYNAMICS_EFFECTS,
        ...FILTER_EFFECTS,
        ...ADVANCED_EFFECTS
      ];
      SYNTHESIZER_TYPES = [
        "Synth",
        "PolySynth",
        "MonoSynth",
        "AMSynth",
        "FMSynth",
        "DuoSynth",
        "PluckSynth",
        "NoiseSynth"
      ];
      SPECIAL_NODE_TYPES = [
        "Sampler",
        "Destination"
      ];
      ALL_AUDIO_GRAPH_TYPES = [
        ...SYNTHESIZER_TYPES,
        ...ALL_EFFECTS,
        ...SPECIAL_NODE_TYPES
      ];
      audio_effects_default = {
        REVERB_EFFECTS,
        DELAY_EFFECTS,
        MODULATION_EFFECTS,
        DISTORTION_EFFECTS,
        DYNAMICS_EFFECTS,
        FILTER_EFFECTS,
        ADVANCED_EFFECTS,
        ALL_EFFECTS,
        SYNTHESIZER_TYPES,
        SPECIAL_NODE_TYPES,
        ALL_AUDIO_GRAPH_TYPES
      };
    }
  });

  // src/browser/music-player.js
  var music_player_exports = {};
  __export(music_player_exports, {
    createPlayer: () => createPlayer
  });
  function createPlayer(composition, options = {}) {
    if (!composition) {
      throw new Error("Invalid composition");
    }
    if (Array.isArray(composition)) {
      const notes = composition.map(
        (item, i) => typeof item === "number" ? { pitch: item, duration: 1, time: i } : { time: i, duration: 1, ...item }
      );
      composition = { tracks: [{ notes }], tempo: 120 };
    }
    if (typeof composition !== "object") {
      throw new Error("Invalid composition");
    }
    const { Tone: externalTone = null, autoplay = false } = options;
    const tracks = composition.tracks || composition.sequences || [];
    if (!Array.isArray(tracks)) {
      throw new Error("Tracks must be an array");
    }
    const tempo = composition.tempo || composition.bpm || 120;
    const convertedData = tonejs(composition, {});
    const { tracks: convertedTracks, metadata } = convertedData;
    const totalDuration = metadata.totalDuration;
    const originalTracksSource = tracks;
    let isPlaying = false;
    let isBusy = false;
    let currentTime = 0;
    let animationId = null;
    let scheduledEvents = [];
    let ToneLib = null;
    let masterGain = null;
    let trackConfigs = [];
    let activeSynths = [];
    const container = document.createElement("div");
    container.style.cssText = `
    font-family: Arial, sans-serif;
    background: #464646;
    color: #fff;
    padding: 12px;
    border-radius: 8px;
    max-width: 800px;
    margin: 16px 0;
  `;
    const controlsRow = document.createElement("div");
    controlsRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;
    const buttonStyle = `
    background: #000000;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
  `;
    const playButton = document.createElement("button");
    playButton.textContent = "\u25B6 Play";
    playButton.style.cssText = buttonStyle;
    const stopButton = document.createElement("button");
    stopButton.textContent = "\u23F9 Stop";
    stopButton.style.cssText = buttonStyle;
    stopButton.disabled = true;
    const currentTimeDisplay = document.createElement("div");
    currentTimeDisplay.textContent = "0:00";
    currentTimeDisplay.style.cssText = `
    font-size: 14px;
    color: #aaa;
    min-width: 40px;
  `;
    const timeline = document.createElement("div");
    timeline.style.cssText = `
    flex: 1;
    height: 8px;
    background: #efefef;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
  `;
    const timelineProgress = document.createElement("div");
    timelineProgress.style.cssText = `
    height: 100%;
    background: #959595;
    border-radius: 4px;
    width: 0%;
    transition: width 0.1s linear;
  `;
    timeline.appendChild(timelineProgress);
    const totalTimeDisplay = document.createElement("div");
    totalTimeDisplay.textContent = "0:00";
    totalTimeDisplay.style.cssText = `
    font-size: 14px;
    color: #aaa;
    min-width: 40px;
    text-align: right;
  `;
    controlsRow.appendChild(playButton);
    controlsRow.appendChild(stopButton);
    controlsRow.appendChild(currentTimeDisplay);
    controlsRow.appendChild(timeline);
    controlsRow.appendChild(totalTimeDisplay);
    container.appendChild(controlsRow);
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    totalTimeDisplay.textContent = formatTime(totalDuration);
    function updateTimeline() {
      if (!ToneLib?.Transport) return;
      currentTime = ToneLib.Transport.seconds;
      const progress = currentTime / totalDuration * 100;
      timelineProgress.style.width = `${Math.min(progress, 100)}%`;
      currentTimeDisplay.textContent = formatTime(currentTime);
      if (isPlaying && currentTime < totalDuration) {
        animationId = requestAnimationFrame(updateTimeline);
      } else if (currentTime >= totalDuration) {
        stop();
      }
    }
    async function buildSynths() {
      ToneLib = externalTone || window.Tone;
      if (ToneLib && !ToneLib.Transport && typeof ToneLib.getTransport === "function") {
        ToneLib = {
          Transport: ToneLib.getTransport(),
          start: ToneLib.start,
          loaded: ToneLib.loaded,
          Frequency: ToneLib.Frequency,
          Gain: ToneLib.Gain,
          Limiter: ToneLib.Limiter,
          Sampler: ToneLib.Sampler,
          PolySynth: ToneLib.PolySynth,
          MonoSynth: ToneLib.MonoSynth,
          Vibrato: ToneLib.Vibrato,
          Tremolo: ToneLib.Tremolo
        };
      }
      if (!ToneLib) {
        try {
          ToneLib = await import("https://cdn.jsdelivr.net/npm/tone@14.8.49/+esm");
        } catch {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js";
            script.onload = () => {
              ToneLib = window.Tone;
              resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
      }
      if (!ToneLib) throw new Error("Failed to load Tone.js");
      window.Tone = ToneLib;
      await ToneLib.start();
      ToneLib.Transport.bpm.value = tempo;
      disposeAudio();
      const masterLimiter = new ToneLib.Limiter(-3).toDestination();
      const numTracks = tracks.length || 1;
      const gainLevel = 0.7 / Math.sqrt(numTracks);
      masterGain = new ToneLib.Gain(gainLevel).connect(masterLimiter);
      activeSynths.push(masterLimiter, masterGain);
      normalizeAudioGraph(composition);
      const graphNodes = {};
      if (composition.audioGraph && Array.isArray(composition.audioGraph)) {
        composition.audioGraph.forEach(({ id, type, options: opts = {} }) => {
          if (!id || !type) return;
          if (type === "Destination") {
            graphNodes[id] = masterGain;
            return;
          }
          try {
            if (SYNTHESIZER_TYPES.includes(type) || ALL_EFFECTS.includes(type)) {
              graphNodes[id] = new ToneLib[type](opts);
              activeSynths.push(graphNodes[id]);
            }
          } catch (e) {
            console.warn(`[AUDIOGRAPH] Failed to create ${type}:`, e);
          }
        });
        composition.audioGraph.forEach(({ id, target }) => {
          if (!id || !graphNodes[id] || graphNodes[id] === masterGain) return;
          const node = graphNodes[id];
          if (target && graphNodes[target]) {
            node.connect(graphNodes[target] === masterGain ? masterGain : graphNodes[target]);
          } else {
            node.connect(masterGain);
          }
        });
      }
      const secondsPerQN = 60 / tempo;
      trackConfigs = convertedTracks.map((trackConfig) => {
        const { originalTrackIndex, partEvents } = trackConfig;
        const originalTrack = originalTracksSource[originalTrackIndex] || {};
        let modulations = [];
        try {
          const compiled = compileEvents(originalTrack);
          modulations = compiled.modulations || [];
        } catch (e) {
          console.warn("Failed to compile articulations:", e);
        }
        let synth;
        const synthSpec = originalTrack.synth;
        const synthRef = originalTrack.synthRef;
        const graphSynthId = synthRef || (composition.audioGraph || []).find(
          (n) => SYNTHESIZER_TYPES.includes(n.type)
        )?.id;
        const graphSynth = graphSynthId && graphNodes[graphSynthId];
        let connectTarget = masterGain;
        if (composition.audioGraph && !graphSynth) {
          const targetedIds = new Set((composition.audioGraph || []).map((n) => n.target).filter(Boolean));
          const effectEntry = composition.audioGraph.find(
            (n) => ALL_EFFECTS.includes(n.type) && !targetedIds.has(n.id)
          );
          if (effectEntry && graphNodes[effectEntry.id]) {
            connectTarget = graphNodes[effectEntry.id];
          }
        }
        if (graphSynth && !synthSpec) {
          synth = graphSynth;
        } else if (typeof synthSpec === "number") {
          const urls = generateSamplerUrls(synthSpec);
          synth = new ToneLib.Sampler({ urls, baseUrl: "" });
          synth.connect(connectTarget);
        } else if (typeof synthSpec === "string") {
          try {
            synth = new ToneLib[synthSpec]();
            synth.connect(connectTarget);
          } catch {
            synth = new ToneLib.PolySynth();
            synth.connect(connectTarget);
          }
        } else if (typeof synthSpec === "object" && synthSpec !== null) {
          const synthType = synthSpec.type || "PolySynth";
          try {
            const opts = synthSpec.options || {};
            if (synthType === "Sampler") {
              synth = new ToneLib.Sampler(opts);
            } else {
              synth = new ToneLib[synthType](opts);
            }
            synth.connect(connectTarget);
          } catch (e) {
            synth = new ToneLib.PolySynth();
            synth.connect(connectTarget);
          }
        } else {
          synth = new ToneLib.PolySynth();
          synth.connect(connectTarget);
        }
        activeSynths.push(synth);
        const vibratoMods = modulations.filter((m) => m.type === "pitch" && m.subtype === "vibrato");
        const tremoloMods = modulations.filter((m) => m.type === "amplitude" && m.subtype === "tremolo");
        let vibratoEffect = null;
        let tremoloEffect = null;
        if (vibratoMods.length > 0 || tremoloMods.length > 0) {
          synth.disconnect();
          if (vibratoMods.length > 0) {
            const dv = vibratoMods[0];
            vibratoEffect = new ToneLib.Vibrato({ frequency: dv.rate || 5, depth: (dv.depth || 50) / 100 });
            vibratoEffect.wet.value = 0;
            activeSynths.push(vibratoEffect);
          }
          if (tremoloMods.length > 0) {
            const dt = tremoloMods[0];
            tremoloEffect = new ToneLib.Tremolo({ frequency: dt.rate || 8, depth: dt.depth || 0.3 }).start();
            tremoloEffect.wet.value = 0;
            activeSynths.push(tremoloEffect);
          }
          if (vibratoEffect && tremoloEffect) {
            synth.connect(vibratoEffect);
            vibratoEffect.connect(tremoloEffect);
            tremoloEffect.connect(masterGain);
          } else if (vibratoEffect) {
            synth.connect(vibratoEffect);
            vibratoEffect.connect(masterGain);
          } else if (tremoloEffect) {
            synth.connect(tremoloEffect);
            tremoloEffect.connect(masterGain);
          }
        }
        return { synth, vibratoEffect, tremoloEffect, modulations, partEvents, secondsPerQN };
      });
      await ToneLib.loaded();
    }
    function scheduleNotes() {
      clearScheduledEvents();
      trackConfigs.forEach(({ synth, vibratoEffect, tremoloEffect, modulations, partEvents, secondsPerQN }) => {
        modulations.forEach((mod) => {
          const startTime = mod.start * secondsPerQN;
          const endTime = mod.end * secondsPerQN;
          if (mod.type === "pitch" && mod.subtype === "vibrato" && vibratoEffect) {
            scheduledEvents.push(ToneLib.Transport.schedule(() => {
              vibratoEffect.frequency.value = mod.rate || 5;
              vibratoEffect.depth.value = (mod.depth || 50) / 100;
              vibratoEffect.wet.value = 1;
            }, startTime));
            scheduledEvents.push(ToneLib.Transport.schedule(() => {
              vibratoEffect.wet.value = 0;
            }, endTime));
          }
          if (mod.type === "amplitude" && mod.subtype === "tremolo" && tremoloEffect) {
            scheduledEvents.push(ToneLib.Transport.schedule(() => {
              tremoloEffect.frequency.value = mod.rate || 8;
              tremoloEffect.depth.value = mod.depth || 0.3;
              tremoloEffect.wet.value = 1;
            }, startTime));
            scheduledEvents.push(ToneLib.Transport.schedule(() => {
              tremoloEffect.wet.value = 0;
            }, endTime));
          }
        });
        const modsByNote = {};
        modulations.forEach((mod) => {
          if (!modsByNote[mod.index]) modsByNote[mod.index] = [];
          modsByNote[mod.index].push(mod);
        });
        partEvents.forEach((note, noteIndex) => {
          const time = typeof note.time === "number" ? note.time * secondsPerQN : note.time;
          const duration = typeof note.duration === "number" ? note.duration * secondsPerQN : note.duration;
          const velocity = note.velocity || 0.8;
          const mods = modsByNote[noteIndex] || [];
          const glissando = mods.find(
            (m) => m.type === "pitch" && (m.subtype === "glissando" || m.subtype === "portamento")
          );
          if (Array.isArray(note.pitch)) {
            const mt = note.microtuning || 0;
            const chordNotes = note.pitch.map(
              (p) => typeof p === "number" ? mt ? ToneLib.Frequency(p + mt, "midi").toFrequency() : ToneLib.Frequency(p, "midi").toNote() : p
            );
            scheduledEvents.push(ToneLib.Transport.schedule((t) => {
              synth.triggerAttackRelease(chordNotes, duration, t, velocity);
            }, time));
            return;
          }
          const noteName = typeof note.pitch === "number" ? ToneLib.Frequency(note.pitch, "midi").toNote() : note.pitch;
          if (glissando && glissando.to !== void 0) {
            const toNote = typeof glissando.to === "number" ? ToneLib.Frequency(glissando.to, "midi").toNote() : glissando.to;
            const startFreq = ToneLib.Frequency(noteName).toFrequency();
            const endFreq = ToneLib.Frequency(toNote).toFrequency();
            const cents = 1200 * Math.log2(endFreq / startFreq);
            const microtuningCents = (note.microtuning || 0) * 100;
            const startDetune = microtuningCents;
            const endDetune = microtuningCents + cents;
            if (synth.detune) {
              scheduledEvents.push(ToneLib.Transport.schedule((t) => {
                synth.triggerAttack(noteName, t, velocity);
                synth.detune.setValueAtTime(startDetune, t);
                synth.detune.linearRampToValueAtTime(endDetune, t + duration);
                synth.triggerRelease(t + duration);
              }, time));
            } else {
              const glissSynth = new ToneLib.MonoSynth();
              glissSynth.connect(masterGain);
              activeSynths.push(glissSynth);
              scheduledEvents.push(ToneLib.Transport.schedule((t) => {
                glissSynth.triggerAttack(noteName, t, velocity);
                glissSynth.detune.setValueAtTime(startDetune, t);
                glissSynth.detune.linearRampToValueAtTime(endDetune, t + duration);
                glissSynth.triggerRelease(t + duration);
              }, time));
            }
          } else {
            const playNote = note.microtuning ? ToneLib.Frequency(note.pitch + note.microtuning, "midi").toFrequency() : noteName;
            scheduledEvents.push(ToneLib.Transport.schedule((t) => {
              synth.triggerAttackRelease(playNote, duration, t, velocity);
            }, time));
          }
        });
      });
    }
    function clearScheduledEvents() {
      if (ToneLib) {
        ToneLib.Transport.cancel(0);
      }
      scheduledEvents = [];
    }
    function disposeAudio() {
      clearScheduledEvents();
      activeSynths.forEach((s) => {
        try {
          if (!s.disposed) s.dispose();
        } catch (e) {
        }
      });
      activeSynths = [];
      trackConfigs = [];
      masterGain = null;
    }
    async function play2() {
      if (isBusy) return;
      if (isPlaying) {
        ToneLib.Transport.pause();
        isPlaying = false;
        playButton.textContent = "\u25B6 Play";
        cancelAnimationFrame(animationId);
        return;
      }
      isBusy = true;
      playButton.textContent = "... Wait";
      playButton.disabled = true;
      try {
        if (trackConfigs.length === 0) {
          await buildSynths();
        }
        scheduleNotes();
        ToneLib.Transport.stop();
        ToneLib.Transport.start("+0.05", currentTime);
        isPlaying = true;
        playButton.textContent = "\u23F8 Pause";
        stopButton.disabled = false;
        updateTimeline();
      } catch (e) {
        console.error("[PLAYER] Play failed:", e);
        playButton.textContent = "\u25B6 Play";
      } finally {
        isBusy = false;
        playButton.disabled = false;
      }
    }
    function stop() {
      if (ToneLib) {
        ToneLib.Transport.stop();
      }
      disposeAudio();
      isPlaying = false;
      currentTime = 0;
      playButton.textContent = "\u25B6 Play";
      stopButton.disabled = true;
      timelineProgress.style.width = "0%";
      currentTimeDisplay.textContent = "0:00";
      cancelAnimationFrame(animationId);
    }
    timeline.addEventListener("click", async (e) => {
      if (isBusy) return;
      const rect = timeline.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = Math.max(0, Math.min(percent * totalDuration, totalDuration));
      timelineProgress.style.width = `${percent * 100}%`;
      currentTimeDisplay.textContent = formatTime(newTime);
      currentTime = newTime;
      if (isPlaying && ToneLib) {
        isBusy = true;
        try {
          ToneLib.Transport.pause();
          scheduleNotes();
          ToneLib.Transport.start("+0.05", newTime);
          updateTimeline();
        } finally {
          isBusy = false;
        }
      }
    });
    playButton.addEventListener("click", play2);
    stopButton.addEventListener("click", stop);
    if (autoplay) {
      play2().catch(console.error);
    }
    return container;
  }
  var init_music_player = __esm({
    "src/browser/music-player.js"() {
      init_tonejs();
      init_audio();
      init_gm_instruments();
      init_audio_effects();
      init_normalize();
    }
  });

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    audio: () => audio2,
    default: () => index_default,
    jm: () => jm
  });

  // src/utils/jmon-validator.browser.js
  var JmonValidator = class {
    constructor() {
      console.warn(
        "[JMON] Using simplified browser validator. For full validation, use Node.js environment."
      );
    }
    /**
     * Basic validation and normalization for browser use
     * @param {Object} obj - JMON object to validate
     * @returns {Object} { valid, errors, normalized }
     */
    validateAndNormalize(obj) {
      const errors = [];
      let normalized = { ...obj };
      try {
        if (!obj || typeof obj !== "object") {
          errors.push("Object must be a valid object");
          return { valid: false, errors, normalized: null };
        }
        if (!normalized.tracks && !normalized.notes) {
          if (Array.isArray(obj)) {
            normalized = { tracks: [{ notes: obj }] };
          } else {
            normalized.tracks = normalized.tracks || [];
          }
        }
        if (normalized.notes && !normalized.tracks) {
          normalized.tracks = [{ notes: normalized.notes }];
          delete normalized.notes;
        }
        if (!Array.isArray(normalized.tracks)) {
          normalized.tracks = [normalized.tracks];
        }
        normalized.tracks.forEach((track, trackIndex) => {
          if (!track.notes) {
            errors.push(`Track ${trackIndex} missing notes array`);
            return;
          }
          if (!Array.isArray(track.notes)) {
            errors.push(`Track ${trackIndex} notes must be an array`);
            return;
          }
          track.notes.forEach((note, noteIndex) => {
            if (typeof note !== "object") {
              errors.push(
                `Track ${trackIndex}, note ${noteIndex}: must be an object`
              );
              return;
            }
            if (note.pitch === void 0) {
              note.pitch = null;
            }
            if (note.duration === void 0) {
              note.duration = 1;
            }
            if (note.time === void 0) {
              note.time = 0;
            }
          });
        });
        normalized.format = normalized.format || "jmon";
        normalized.version = normalized.version || "1.0";
        normalized.timeSignature = normalized.timeSignature || "4/4";
        normalized.keySignature = normalized.keySignature || "C";
        return {
          valid: errors.length === 0,
          errors,
          normalized
        };
      } catch (error) {
        errors.push(`Validation error: ${error.message}`);
        return {
          valid: false,
          errors,
          normalized: null
        };
      }
    }
    /**
     * Simple validation without normalization
     * @param {Object} obj - JMON object to validate
     * @returns {boolean} true if valid
     */
    isValid(obj) {
      const result = this.validateAndNormalize(obj);
      return result.valid;
    }
  };

  // src/algorithms/constants/ArticulationTypes.js
  var ARTICULATION_TYPES = {
    // Simple articulations
    "staccato": {
      complex: false,
      description: "Shortens note duration to ~50%"
    },
    "accent": {
      complex: false,
      description: "Increases note velocity/emphasis"
    },
    "tenuto": {
      complex: false,
      description: "Holds note for full duration with emphasis"
    },
    "legato": {
      complex: false,
      description: "Smooth connection between notes"
    },
    "marcato": {
      complex: false,
      description: "Strong accent with slight separation"
    },
    // Complex articulations
    "glissando": {
      complex: true,
      requiredParams: ["target"],
      description: "Smooth slide from note to target pitch"
    },
    "portamento": {
      complex: true,
      requiredParams: ["target"],
      optionalParams: ["curve", "speed"],
      description: "Expressive slide between pitches"
    },
    "bend": {
      complex: true,
      requiredParams: ["amount"],
      optionalParams: ["curve", "returnToOriginal"],
      description: "Pitch bend up or down in cents"
    },
    "vibrato": {
      complex: true,
      optionalParams: ["rate", "depth", "delay"],
      description: "Periodic pitch variation"
    },
    "tremolo": {
      complex: true,
      optionalParams: ["rate", "depth"],
      description: "Rapid volume variation"
    },
    "crescendo": {
      complex: true,
      requiredParams: ["endVelocity"],
      optionalParams: ["curve"],
      description: "Gradual volume increase"
    },
    "diminuendo": {
      complex: true,
      requiredParams: ["endVelocity"],
      optionalParams: ["curve"],
      description: "Gradual volume decrease"
    }
  };

  // src/algorithms/constants/OrnamentTypes.js
  var ORNAMENT_TYPES = {
    "grace_note": {
      requiredParams: ["graceNoteType"],
      optionalParams: ["gracePitches"],
      conflicts: [],
      description: "Single note before the main note",
      defaultParams: {
        graceNoteType: "acciaccatura"
      },
      validate: (note, params) => {
        if (!["acciaccatura", "appoggiatura"].includes(params.graceNoteType)) {
          return { valid: false, error: "graceNoteType must be either acciaccatura or appoggiatura" };
        }
        if (params.gracePitches && !Array.isArray(params.gracePitches)) {
          return { valid: false, error: "gracePitches must be an array of pitches" };
        }
        return { valid: true };
      }
    },
    "trill": {
      requiredParams: [],
      optionalParams: ["by", "trillRate"],
      conflicts: ["mordent"],
      minDuration: "8n",
      description: "Rapid alternation between main note and auxiliary note",
      defaultParams: {
        by: 1,
        trillRate: 0.125
      },
      validate: (note, params) => {
        if (params.by && typeof params.by !== "number") {
          return { valid: false, error: "trill step (by) must be a number" };
        }
        if (params.trillRate && typeof params.trillRate !== "number") {
          return { valid: false, error: "trillRate must be a number" };
        }
        return { valid: true };
      }
    },
    "mordent": {
      requiredParams: [],
      optionalParams: ["by"],
      conflicts: ["trill"],
      description: "Quick alternation with note above or below",
      defaultParams: {
        by: 1
      },
      validate: (note, params) => {
        if (params.by && typeof params.by !== "number") {
          return { valid: false, error: "mordent step (by) must be a number" };
        }
        return { valid: true };
      }
    },
    "turn": {
      requiredParams: [],
      optionalParams: ["scale"],
      conflicts: [],
      description: "Melodic turn around the main note",
      validate: (note, params) => {
        if (params.scale && typeof params.scale !== "string") {
          return { valid: false, error: "scale must be a string" };
        }
        return { valid: true };
      }
    },
    "arpeggio": {
      requiredParams: ["arpeggioDegrees"],
      optionalParams: ["direction"],
      conflicts: [],
      description: "Notes played in sequence",
      defaultParams: {
        direction: "up"
      },
      validate: (note, params) => {
        if (!Array.isArray(params.arpeggioDegrees)) {
          return { valid: false, error: "arpeggioDegrees must be an array" };
        }
        if (params.direction && !["up", "down", "both"].includes(params.direction)) {
          return { valid: false, error: "direction must be up, down, or both" };
        }
        return { valid: true };
      }
    }
  };

  // src/algorithms/constants/MusicTheoryConstants.js
  var MusicTheoryConstants = class {
    static chromatic_scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    static flat_to_sharp = {
      "Bb": "A#",
      "Db": "C#",
      "Eb": "D#",
      "Gb": "F#",
      "Ab": "G#",
      "B\u266D": "A#",
      "D\u266D": "C#",
      "E\u266D": "D#",
      "G\u266D": "F#",
      "A\u266D": "G#",
      "B-": "A#",
      "D-": "C#",
      "E-": "D#",
      "G-": "F#",
      "A-": "G#"
    };
    static scale_intervals = {
      "major": [0, 2, 4, 5, 7, 9, 11],
      // Ionian
      "minor": [0, 2, 3, 5, 7, 8, 10],
      // Aeolian
      "diminished": [0, 2, 3, 5, 6, 8, 9, 11],
      "major pentatonic": [0, 2, 4, 7, 9],
      "minor pentatonic": [0, 3, 5, 7, 10],
      "chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      "lydian": [0, 2, 4, 6, 7, 9, 11],
      "mixolydian": [0, 2, 4, 5, 7, 9, 10],
      "dorian": [0, 2, 3, 5, 7, 9, 10],
      "phrygian": [0, 1, 3, 5, 7, 8, 10],
      "locrian": [0, 1, 3, 5, 6, 8, 10],
      "harmonic minor": [0, 2, 3, 5, 7, 8, 11],
      "melodic minor ascending": [0, 2, 3, 5, 7, 9, 11],
      "melodic minor descending": [0, 2, 3, 5, 7, 8, 10]
      // same as natural minor
    };
    static intervals = {
      "P1": 0,
      "m2": 1,
      "M2": 2,
      "m3": 3,
      "M3": 4,
      "P4": 5,
      "P5": 7,
      "m6": 8,
      "M6": 9,
      "m7": 10,
      "M7": 11,
      "P8": 12
    };
    /**
     * Convert flat notes to their equivalent sharp notes
     * @param {string} note - The note to convert
     * @returns {string} The converted note or original if no conversion needed
     */
    static convertFlatToSharp(note) {
      return this.flat_to_sharp[note] || note;
    }
    /**
     * Convert note name with octave to MIDI number
     * @param {string} noteName - Note name with octave (e.g. 'C4', 'F#5', 'Bb3')
     * @returns {number} MIDI note number
     */
    static noteNameToMidi(noteName) {
      const match = noteName.match(/^([A-G][#b♭-]?)(-?\d+)$/);
      if (!match) {
        throw new Error(`Invalid note name format: ${noteName}`);
      }
      const [, note, octave] = match;
      const normalizedNote = this.convertFlatToSharp(note);
      const noteIndex = this.chromatic_scale.indexOf(normalizedNote);
      if (noteIndex === -1) {
        throw new Error(`Invalid note name: ${note}`);
      }
      return noteIndex + (parseInt(octave) + 1) * 12;
    }
    /**
     * Convert MIDI number to note name
     * @param {number} midiNumber - MIDI note number
     * @param {boolean} [preferFlat=false] - Whether to prefer flat notation
     * @returns {string} Note name with octave (e.g. 'C4', 'F#5')
     */
    static midiToNoteName(midiNumber, preferFlat = false) {
      const octave = Math.floor(midiNumber / 12) - 1;
      const noteIndex = midiNumber % 12;
      const noteName = this.chromatic_scale[noteIndex];
      return `${noteName}${octave}`;
    }
    /**
     * Returns the intervals for a triad based on the given scale intervals
     * @param {Array} scale - Scale intervals
     * @returns {Array} Triad intervals [root, third, fifth]
     */
    static scaleToTriad(scale) {
      return [scale[0], scale[2], scale[4]];
    }
  };

  // src/algorithms/constants/ConstantsAPI.js
  var ConstantsAPI = class {
    /**
     * List all available constant categories
     * @returns {string[]} Array of category names
     *
     * @example
     * jm.constants.list()
     * // => ['articulations', 'ornaments', 'scales', 'intervals', ...]
     */
    static list() {
      return [
        "articulations",
        "ornaments",
        "scales",
        "intervals",
        "chromaticScale",
        "modes"
      ];
    }
    /**
     * Get all constants of a specific category
     * @param {string} category - Category name
     * @returns {Object|Array} Constants for that category
     *
     * @example
     * jm.constants.get('articulations')
     * // => { staccato: {...}, accent: {...}, ... }
     *
     * @example
     * jm.constants.get('scales')
     * // => { major: [...], minor: [...], ... }
     */
    static get(category) {
      switch (category) {
        case "articulations":
          return ARTICULATION_TYPES;
        case "ornaments":
          return ORNAMENT_TYPES;
        case "scales":
          return MusicTheoryConstants.scale_intervals;
        case "intervals":
          return MusicTheoryConstants.intervals;
        case "chromaticScale":
          return MusicTheoryConstants.chromatic_scale;
        case "modes":
          return {
            ionian: MusicTheoryConstants.scale_intervals.major,
            dorian: MusicTheoryConstants.scale_intervals.dorian,
            phrygian: MusicTheoryConstants.scale_intervals.phrygian,
            lydian: MusicTheoryConstants.scale_intervals.lydian,
            mixolydian: MusicTheoryConstants.scale_intervals.mixolydian,
            aeolian: MusicTheoryConstants.scale_intervals.minor,
            locrian: MusicTheoryConstants.scale_intervals.locrian
          };
        default:
          throw new Error(`Unknown constant category: ${category}. Available: ${this.list().join(", ")}`);
      }
    }
    /**
     * Describe a specific constant with details
     * @param {string} category - Category name
     * @param {string} name - Constant name within category
     * @returns {Object} Description object
     *
     * @example
     * jm.constants.describe('articulations', 'staccato')
     * // => { name: 'staccato', complex: false, description: '...', ... }
     */
    static describe(category, name) {
      const constants2 = this.get(category);
      if (category === "articulations" || category === "ornaments") {
        const item = constants2[name];
        if (!item) {
          throw new Error(`Unknown ${category} type: ${name}. Available: ${Object.keys(constants2).join(", ")}`);
        }
        return {
          name,
          category,
          ...item
        };
      }
      if (category === "scales" || category === "modes") {
        const intervals = constants2[name];
        if (!intervals) {
          throw new Error(`Unknown ${category} name: ${name}. Available: ${Object.keys(constants2).join(", ")}`);
        }
        return {
          name,
          category,
          intervals,
          noteCount: intervals.length
        };
      }
      if (category === "intervals") {
        const semitones = constants2[name];
        if (semitones === void 0) {
          throw new Error(`Unknown interval: ${name}. Available: ${Object.keys(constants2).join(", ")}`);
        }
        return {
          name,
          category,
          semitones
        };
      }
      if (category === "chromaticScale") {
        const index = parseInt(name);
        if (isNaN(index) || index < 0 || index >= constants2.length) {
          throw new Error(`Invalid chromatic scale index: ${name}. Must be 0-${constants2.length - 1}`);
        }
        return {
          index,
          note: constants2[index],
          category
        };
      }
      throw new Error(`Cannot describe category: ${category}`);
    }
    /**
     * Search constants by description or properties
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {string[]} [options.categories] - Limit search to specific categories
     * @returns {Array} Array of matching results
     *
     * @example
     * jm.constants.search('slide')
     * // => [{ category: 'articulations', name: 'glissando', ... }, ...]
     */
    static search(query, options = {}) {
      const { categories = ["articulations", "ornaments"] } = options;
      const results = [];
      const lowerQuery = query.toLowerCase();
      for (const category of categories) {
        try {
          const constants2 = this.get(category);
          if (category === "articulations" || category === "ornaments") {
            for (const [name, def] of Object.entries(constants2)) {
              const searchText = `${name} ${def.description || ""}`.toLowerCase();
              if (searchText.includes(lowerQuery)) {
                results.push({
                  category,
                  name,
                  ...def
                });
              }
            }
          }
        } catch (e) {
        }
      }
      return results;
    }
    /**
     * Get all articulation type names
     * @returns {string[]} Array of articulation type names
     *
     * @example
     * jm.constants.listArticulations()
     * // => ['staccato', 'accent', 'tenuto', ...]
     */
    static listArticulations() {
      return Object.keys(ARTICULATION_TYPES);
    }
    /**
     * Get all ornament type names
     * @returns {string[]} Array of ornament type names
     *
     * @example
     * jm.constants.listOrnaments()
     * // => ['grace_note', 'trill', 'mordent', ...]
     */
    static listOrnaments() {
      return Object.keys(ORNAMENT_TYPES);
    }
    /**
     * Get all scale type names
     * @returns {string[]} Array of scale type names
     *
     * @example
     * jm.constants.listScales()
     * // => ['major', 'minor', 'pentatonic', ...]
     */
    static listScales() {
      return Object.keys(MusicTheoryConstants.scale_intervals);
    }
    /**
     * Get all interval names
     * @returns {string[]} Array of interval names
     *
     * @example
     * jm.constants.listIntervals()
     * // => ['P1', 'm2', 'M2', ...]
     */
    static listIntervals() {
      return Object.keys(MusicTheoryConstants.intervals);
    }
  };

  // src/algorithms/theory/harmony/Scale.js
  var Scale = class {
    /**
     * Create a Scale
     * @param {Object} options - Configuration options
     * @param {string} options.tonic - The tonic note of the scale (e.g., 'C', 'D#', 'Bb')
     * @param {string} [options.mode='major'] - The type of scale (e.g., 'major', 'minor', 'dorian')
     */
    constructor(options = {}) {
      const { tonic, mode = "major" } = options;
      if (!tonic) {
        throw new Error("'tonic' is required. Provide a note name like 'C', 'D#', or 'Bb'.");
      }
      const convertedTonic = MusicTheoryConstants.convertFlatToSharp(tonic);
      if (!MusicTheoryConstants.chromatic_scale.includes(convertedTonic)) {
        throw new Error(`'${tonic}' is not a valid tonic note. Select one among '${MusicTheoryConstants.chromatic_scale.join(", ")}'.`);
      }
      this.tonic = convertedTonic;
      if (!Object.keys(MusicTheoryConstants.scale_intervals).includes(mode)) {
        throw new Error(`'${mode}' is not a valid scale. Select one among '${Object.keys(MusicTheoryConstants.scale_intervals).join(", ")}'.`);
      }
      this.mode = mode;
    }
    /**
    * Generate a scale with flexible start/end points
    * @param {Object} options - Configuration object
    * @param {number|string} [options.start] - Starting MIDI note number or note name (e.g. 'C4')
    * @param {number|string} [options.end] - Ending MIDI note number or note name
    * @param {number} [options.length] - Number of notes to generate
    * @returns {Array} Array of MIDI note numbers representing the scale
    */
    generate(options = {}) {
      const intervals = MusicTheoryConstants.scale_intervals[this.mode];
      if (!intervals) {
        console.warn(`Unknown scale mode: ${this.mode}`);
        return [];
      }
      if (typeof options.start === "string") {
        options.start = MusicTheoryConstants.noteNameToMidi(options.start);
      }
      if (typeof options.end === "string") {
        options.end = MusicTheoryConstants.noteNameToMidi(options.end);
      }
      const tonicIndex = MusicTheoryConstants.chromatic_scale.indexOf(this.tonic);
      if (tonicIndex === -1) {
        console.warn(`Unknown tonic: ${this.tonic}`);
        return [];
      }
      const defaultStart = 60 + tonicIndex;
      const startNote = options.start ?? defaultStart;
      const getNextNote = (baseNote, step) => {
        const scaleIndex = step % intervals.length;
        const octaveOffset = Math.floor(step / intervals.length) * 12;
        const interval = intervals[scaleIndex];
        const baseOctave = Math.floor(baseNote / 12) * 12;
        return baseOctave + tonicIndex + interval + octaveOffset;
      };
      const result = [];
      if (options.end !== void 0) {
        for (let i = 0; ; i++) {
          const note = getNextNote(startNote, i);
          if (note > options.end) break;
          result.push(note);
        }
      } else if (options.length) {
        for (let i = 0; i < options.length; i++) {
          result.push(getNextNote(startNote, i));
        }
      } else {
        return intervals.map((interval) => startNote + interval);
      }
      return result;
    }
    /**
     * Get the note names of the scale
     * @returns {Array} Array of note names in the scale
     */
    getNoteNames() {
      const intervals = MusicTheoryConstants.scale_intervals[this.mode];
      if (!intervals) return [];
      const tonicIndex = MusicTheoryConstants.chromatic_scale.indexOf(this.tonic);
      if (tonicIndex === -1) return [];
      return intervals.map((interval) => {
        const noteIndex = (tonicIndex + interval) % 12;
        return MusicTheoryConstants.chromatic_scale[noteIndex];
      });
    }
    /**
     * Check if a given pitch is in the scale
     * @param {number} pitch - MIDI note number
     * @returns {boolean} True if the pitch class is in the scale
     */
    isInScale(pitch) {
      const pitchClass = pitch % 12;
      const scalePitches = this.generate().map((p) => p % 12);
      return scalePitches.includes(pitchClass);
    }
  };

  // src/algorithms/utils.js
  var utils_exports = {};
  __export(utils_exports, {
    adjustNoteDurationsToPreventOverlaps: () => adjustNoteDurationsToPreventOverlaps,
    cdeToMidi: () => cdeToMidi,
    checkInput: () => checkInput,
    fibonacci: () => fibonacci,
    fillGapsWithRests: () => fillGapsWithRests,
    findClosestPitchAtMeasureStart: () => findClosestPitchAtMeasureStart,
    getDegreeFromPitch: () => getDegreeFromPitch,
    getOctave: () => getOctave,
    getPitchFromDegree: () => getPitchFromDegree,
    getSharp: () => getSharp,
    instrumentMapping: () => instrumentMapping,
    midiToCde: () => midiToCde,
    noOverlap: () => noOverlap,
    offsetTrack: () => offsetTrack,
    qlToSeconds: () => qlToSeconds,
    quantizeNotes: () => quantizeNotes,
    repairNotes: () => repairNotes,
    repeatPolyloops: () => repeatPolyloops,
    roundToList: () => roundToList,
    scaleList: () => scaleList,
    setOffsetsAccordingToDurations: () => setOffsetsAccordingToDurations,
    setTimeAccordingToDurations: () => setTimeAccordingToDurations,
    tracksToDict: () => tracksToDict,
    tune: () => tune
  });
  function tracksToDict(tracks) {
    if (typeof tracks === "object" && !Array.isArray(tracks)) {
      return tracks;
    }
    if (Array.isArray(tracks)) {
      if (tracks.length === 0) {
        return {};
      }
      if (tracks.every((note) => Array.isArray(note) && note.length === 3)) {
        return { "track 1": tracks };
      }
      const result = {};
      tracks.forEach((track, i) => {
        result[`track ${i + 1}`] = track;
      });
      return result;
    }
    throw new Error("Input must be a list or dict of tracks.");
  }
  function roundToList(value, scale) {
    return scale.reduce(
      (prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }
  function getOctave(midiNote) {
    return Math.floor(midiNote / 12) - 1;
  }
  function getSharp(noteString) {
    const dictFlat = {
      "D-": "C#",
      "E-": "D#",
      "G-": "F#",
      "A-": "G#",
      "B-": "A#",
      "Db": "C#",
      "Eb": "D#",
      "Gb": "F#",
      "Ab": "G#",
      "Bb": "A#"
    };
    return dictFlat[noteString] || noteString;
  }
  function getDegreeFromPitch(pitch, scaleList2, tonicPitch) {
    if (typeof pitch === "string") {
      pitch = cdeToMidi(pitch);
    }
    if (typeof tonicPitch === "string") {
      tonicPitch = cdeToMidi(tonicPitch);
    }
    const tonicIndex = scaleList2.indexOf(tonicPitch);
    if (scaleList2.includes(pitch)) {
      const pitchIndex = scaleList2.indexOf(pitch);
      return pitchIndex - tonicIndex;
    } else {
      const upperPitch = roundToList(pitch, scaleList2);
      const upperIndex = scaleList2.indexOf(upperPitch);
      const lowerIndex = upperIndex > 0 ? upperIndex - 1 : upperIndex;
      const lowerPitch = scaleList2[lowerIndex];
      const distanceToUpper = upperPitch - pitch;
      const distanceToLower = pitch - lowerPitch;
      const totalDistance = distanceToUpper + distanceToLower;
      if (totalDistance === 0) return upperIndex - tonicIndex;
      const upperWeight = 1 - distanceToUpper / totalDistance;
      const lowerWeight = 1 - distanceToLower / totalDistance;
      const upperDegree = upperIndex - tonicIndex;
      const lowerDegree = lowerIndex - tonicIndex;
      return upperDegree * upperWeight + lowerDegree * lowerWeight;
    }
  }
  function getPitchFromDegree(degree, scaleList2, tonicPitch) {
    const tonicIndex = scaleList2.indexOf(tonicPitch);
    const pitchIndex = Math.round(tonicIndex + degree);
    if (pitchIndex >= 0 && pitchIndex < scaleList2.length) {
      return scaleList2[pitchIndex];
    } else {
      const lowerIndex = Math.max(0, Math.min(pitchIndex, scaleList2.length - 1));
      const upperIndex = Math.min(scaleList2.length - 1, Math.max(pitchIndex, 0));
      const lowerPitch = scaleList2[lowerIndex];
      const upperPitch = scaleList2[upperIndex];
      const distanceToUpper = upperIndex - pitchIndex;
      const distanceToLower = pitchIndex - lowerIndex;
      const totalDistance = distanceToUpper + distanceToLower;
      if (totalDistance === 0) {
        return (upperPitch + lowerPitch) / 2;
      }
      const upperWeight = 1 - distanceToUpper / totalDistance;
      const lowerWeight = 1 - distanceToLower / totalDistance;
      return upperPitch * upperWeight + lowerPitch * lowerWeight;
    }
  }
  function setTimeAccordingToDurations(notes) {
    if (notes.length > 0 && notes[0].length === 2) {
      notes = notes.map((note) => [note[0], note[1], 0]);
    }
    const adjustedNotes = [];
    let currentTime = 0;
    for (const [pitch, duration, _] of notes) {
      adjustedNotes.push([pitch, duration, currentTime]);
      currentTime += duration;
    }
    return adjustedNotes;
  }
  var setOffsetsAccordingToDurations = setTimeAccordingToDurations;
  function fillGapsWithRests(notes, parentOffset = 0) {
    const notesSorted = [...notes].sort((a, b) => a[2] - b[2]);
    let lastOffset = 0;
    const filledNotes = [];
    for (const note of notesSorted) {
      const [pitch, duration, offset] = note;
      const currentOffset = parentOffset + offset;
      if (currentOffset > lastOffset) {
        const gapDuration = currentOffset - lastOffset;
        const restToInsert = [null, gapDuration, lastOffset - parentOffset];
        filledNotes.push(restToInsert);
      }
      filledNotes.push(note);
      lastOffset = Math.max(lastOffset, currentOffset + duration);
    }
    return filledNotes;
  }
  function adjustNoteDurationsToPreventOverlaps(notes) {
    notes.sort((a, b) => a[2] - b[2]);
    for (let i = 0; i < notes.length - 1; i++) {
      const currentNote = notes[i];
      const nextNote = notes[i + 1];
      const currentNoteEnd = currentNote[2] + currentNote[1];
      if (currentNoteEnd > nextNote[2]) {
        const newDuration = nextNote[2] - currentNote[2];
        notes[i] = [currentNote[0], newDuration, currentNote[2]];
      }
    }
    return notes;
  }
  function repairNotes(notes) {
    return adjustNoteDurationsToPreventOverlaps(fillGapsWithRests(notes));
  }
  function cdeToMidi(pitch) {
    const pitches = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const flatToSharp = {
      "Db": "C#",
      "Eb": "D#",
      "Gb": "F#",
      "Ab": "G#",
      "Bb": "A#",
      "Cb": "B"
    };
    let octave = 4;
    let noteStr = pitch;
    if (pitch.includes("b")) {
      const noteBase = pitch.slice(0, -1);
      if (flatToSharp[noteBase]) {
        noteStr = flatToSharp[noteBase] + pitch.slice(-1);
      }
    }
    let note;
    if (noteStr.length > 2 || noteStr.length === 2 && !isNaN(noteStr[1])) {
      note = noteStr.slice(0, -1);
      octave = parseInt(noteStr.slice(-1));
    } else {
      note = noteStr[0];
    }
    const midi2 = 12 * (octave + 1) + pitches.indexOf(note);
    return midi2;
  }
  function midiToCde(midi2) {
    const pitches = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midi2 / 12) - 1;
    const key = midi2 % 12;
    return pitches[key] + octave.toString();
  }
  function noOverlap(notes, adjust = "offsets") {
    const adjustedNotes = [];
    let currentOffset = 0;
    for (const [pitch, duration, _] of notes) {
      adjustedNotes.push([pitch, duration, currentOffset]);
      currentOffset += duration;
    }
    return adjustedNotes;
  }
  function checkInput(inputList) {
    if (inputList.every((item) => Array.isArray(item))) {
      return "list of tuples";
    } else if (inputList.every((item) => !Array.isArray(item))) {
      return "list";
    } else {
      return "unknown";
    }
  }
  function scaleList(numbers, toMin, toMax, minNumbers = null, maxNumbers = null) {
    const minNum = minNumbers !== null ? minNumbers : Math.min(...numbers);
    const maxNum = maxNumbers !== null ? maxNumbers : Math.max(...numbers);
    if (minNum === maxNum) {
      return new Array(numbers.length).fill((toMin + toMax) / 2);
    }
    return numbers.map(
      (num) => (num - minNum) * (toMax - toMin) / (maxNum - minNum) + toMin
    );
  }
  function offsetTrack(track, by) {
    return track.map(([pitch, duration, offset]) => [pitch, duration, offset + by]);
  }
  function quantizeNotes({ notes, measureLength, timeResolution }) {
    const quantizedNotes = [];
    for (const [pitch, duration, offset] of notes) {
      const quantizedOffset = Math.round(offset / timeResolution) * timeResolution;
      const measureEnd = (Math.floor(quantizedOffset / measureLength) + 1) * measureLength;
      let quantizedDuration = Math.round(duration / timeResolution) * timeResolution;
      quantizedDuration = Math.min(quantizedDuration, measureEnd - quantizedOffset);
      if (quantizedDuration > 0) {
        quantizedNotes.push([pitch, quantizedDuration, quantizedOffset]);
      }
    }
    return quantizedNotes;
  }
  function findClosestPitchAtMeasureStart(notes, measureLength) {
    const validNotes = notes.filter(([pitch, , offset]) => pitch !== null && offset !== null);
    const notesSorted = validNotes.sort((a, b) => a[2] - b[2]);
    const maxOffset = Math.max(...notesSorted.map(([, , offset]) => offset));
    const numMeasures = Math.floor(maxOffset / measureLength) + 1;
    const closestPitches = [];
    for (let measureNum = 0; measureNum < numMeasures; measureNum++) {
      const measureStart = measureNum * measureLength;
      let closestPitch = null;
      let closestDistance = Infinity;
      for (const [pitch, , offset] of notesSorted) {
        const distance = measureStart - offset;
        if (distance >= 0 && distance < closestDistance) {
          closestDistance = distance;
          closestPitch = pitch;
        }
        if (offset > measureStart) break;
      }
      if (closestPitch !== null) {
        closestPitches.push(closestPitch);
      }
    }
    return closestPitches;
  }
  function tune(pitch, scale) {
    return scale.reduce(
      (prev, curr) => Math.abs(curr - pitch) < Math.abs(prev - pitch) ? curr : prev
    );
  }
  function qlToSeconds(ql, bpm) {
    return 60 / bpm * ql;
  }
  function* fibonacci(a = 0, b = 1, base = 0, scale = 1) {
    while (true) {
      yield base + scale * a;
      [a, b] = [b, a + b];
    }
  }
  function repeatPolyloops(polyloopsDict, nMeasures, measureLength) {
    const repeatedDict = {};
    for (const [name, polyloop] of Object.entries(polyloopsDict)) {
      const repeatedPolyloop = [];
      for (let m = 0; m < nMeasures; m++) {
        const measureOffset = m * measureLength;
        const offsetPolyloop = offsetTrack(polyloop, measureOffset);
        repeatedPolyloop.push(...offsetPolyloop);
      }
      repeatedDict[name] = repeatedPolyloop;
    }
    return repeatedDict;
  }
  var instrumentMapping = {
    "Acoustic Grand Piano": 0,
    "Bright Acoustic Piano": 1,
    "Electric Grand Piano": 2,
    "Honky-tonk Piano": 3,
    "Electric Piano 1": 4,
    "Electric Piano 2": 5,
    "Harpsichord": 6,
    "Clavinet": 7,
    // ... (full mapping truncated for brevity, but would include all 128 instruments)
    "Gunshot": 127
  };

  // src/algorithms/theory/harmony/Progression.js
  var Progression = class extends MusicTheoryConstants {
    /**
     * Initialize a Progression object
     * @param {Object} options - Configuration options
     * @param {string} [options.tonic='C4'] - The tonic pitch or key (e.g., 'C4', 'C', 'D')
     * @param {string} [options.mode='major'] - The scale/mode ('major', 'minor', 'dorian', etc.)
     * @param {string} [options.circleOf='P5'] - Interval to form the circle (e.g., 'P5', 'P4')
     * @param {string} [options.type='chords'] - Output type: 'chords' or 'pitches'
     * @param {Array} [options.radius=[3, 3, 1]] - Range for major, minor, and diminished chords
     * @param {Array} [options.weights] - Weights for selecting chord types (defaults to radius)
     */
    constructor(options = {}) {
      super();
      const {
        tonic = "C4",
        mode = "major",
        circleOf = "P5",
        type = "chords",
        radius = [3, 3, 1],
        weights
      } = options;
      if (tonic.length <= 2) {
        this.tonicMidi = cdeToMidi(tonic + "4");
        this.tonicNote = tonic;
      } else {
        this.tonicMidi = cdeToMidi(tonic);
        this.tonicNote = tonic.replace(/[0-9]/g, "");
      }
      this.scale = mode;
      this.mode = mode;
      this.circleOf = circleOf;
      this.type = type;
      this.radius = radius;
      this.weights = weights || radius;
      if (!["chords", "pitches"].includes(this.type)) {
        throw new Error("Type must either be 'pitches' or 'chords'.");
      }
    }
    /**
     * Compute chords based on the circle of fifths, thirds, etc., within the specified radius
     * @returns {Object} Object containing major, minor, and diminished chord roots
     */
    computeCircle() {
      const nSemitones = MusicTheoryConstants.intervals[this.circleOf];
      const circleNotes = [this.tonicMidi];
      for (let i = 0; i < Math.max(...this.radius); i++) {
        const nextNote = (circleNotes[circleNotes.length - 1] + nSemitones) % 12 + Math.floor(circleNotes[circleNotes.length - 1] / 12) * 12;
        circleNotes.push(nextNote);
      }
      return {
        major: circleNotes.slice(0, this.radius[0]),
        minor: circleNotes.slice(0, this.radius[1]),
        diminished: circleNotes.slice(0, this.radius[2])
      };
    }
    /**
     * Generate a chord based on root MIDI note and chord type
     * @param {number} rootNoteMidi - The root MIDI note of the chord
     * @param {string} chordType - The type of chord ('major', 'minor', 'diminished')
     * @returns {Array} Array of MIDI notes representing the chord
     */
    generateChord(rootNoteMidi, chordType) {
      const chordIntervals = {
        "major": [0, 4, 7],
        "minor": [0, 3, 7],
        "diminished": [0, 3, 6]
      };
      const intervals = chordIntervals[chordType] || [0, 4, 7];
      const chordNotes = intervals.map((interval) => rootNoteMidi + interval);
      return chordNotes.map((note) => note > 127 ? note - 12 : note);
    }
    /**
     * Generate a musical progression
     * @param {number|Array} lengthOrNumerals - Either number of chords or array of roman numerals
     * @param {number} seed - The seed value for the random number generator
     * @returns {Array} Array of chord arrays representing the progression
     */
    generate(lengthOrNumerals = 4, seed = null) {
      if (Array.isArray(lengthOrNumerals)) {
        return this.generateFromRomanNumerals(lengthOrNumerals);
      }
      const length = lengthOrNumerals;
      if (seed !== null) {
        Math.seedrandom = seed;
      }
      const { major, minor, diminished } = this.computeCircle();
      const chordRoots = [major, minor, diminished];
      const chordTypes = ["major", "minor", "diminished"];
      const progression = [];
      for (let i = 0; i < length; i++) {
        const chordTypeIndex = this.weightedRandomChoice(this.weights);
        if (chordRoots[chordTypeIndex].length > 0) {
          const rootNoteMidi = chordRoots[chordTypeIndex][Math.floor(Math.random() * chordRoots[chordTypeIndex].length)];
          const chordType = chordTypes[chordTypeIndex];
          const actualRoot = Array.isArray(rootNoteMidi) ? rootNoteMidi[0] : rootNoteMidi;
          const chosenChord = this.generateChord(actualRoot, chordType);
          progression.push(chosenChord);
        }
      }
      return progression;
    }
    /**
     * Generate chords from roman numerals (e.g., ['I', 'IV', 'V', 'I'])
     * @param {Array} numerals - Array of roman numerals
     * @returns {Array} Array of chord arrays
     */
    generateFromRomanNumerals(numerals) {
      const progression = [];
      const scaleDegreesMap = {
        "major": [0, 2, 4, 5, 7, 9, 11],
        // I, II, III, IV, V, VI, VII
        "minor": [0, 2, 3, 5, 7, 8, 10],
        // i, ii, III, iv, v, VI, VII
        "dorian": [0, 2, 3, 5, 7, 9, 10],
        "phrygian": [0, 1, 3, 5, 7, 8, 10],
        "lydian": [0, 2, 4, 6, 7, 9, 11],
        "mixolydian": [0, 2, 4, 5, 7, 9, 10],
        "aeolian": [0, 2, 3, 5, 7, 8, 10],
        "locrian": [0, 1, 3, 5, 6, 8, 10]
      };
      const scaleDegrees = scaleDegreesMap[this.scale] || scaleDegreesMap["major"];
      const majorChordQualities = ["major", "minor", "minor", "major", "major", "minor", "diminished"];
      const minorChordQualities = ["minor", "diminished", "major", "minor", "minor", "major", "major"];
      const chordQualities = this.scale === "minor" ? minorChordQualities : majorChordQualities;
      for (const numeral of numerals) {
        const { degree, quality } = this.parseRomanNumeral(numeral);
        if (degree < 1 || degree > 7) {
          console.warn(`Invalid degree ${degree} in ${numeral}`);
          continue;
        }
        const rootOffset = scaleDegrees[degree - 1];
        const rootMidi = this.tonicMidi + rootOffset;
        const chordType = quality || chordQualities[degree - 1];
        const chord = this.generateChord(rootMidi, chordType);
        progression.push(chord);
      }
      return progression;
    }
    /**
     * Parse roman numeral to get degree and quality
     * @param {string} numeral - Roman numeral (e.g., 'I', 'iv', 'V/V')
     * @returns {Object} Object with degree and quality
     */
    parseRomanNumeral(numeral) {
      if (numeral.includes("/")) {
        const parts = numeral.split("/");
        numeral = parts[0];
      }
      const isLowerCase = numeral === numeral.toLowerCase();
      const cleanNumeral = numeral.replace(/[°+ᵒ#♭b]/g, "").toUpperCase();
      const romanToNumber = {
        "I": 1,
        "II": 2,
        "III": 3,
        "IV": 4,
        "V": 5,
        "VI": 6,
        "VII": 7
      };
      const degree = romanToNumber[cleanNumeral] || 1;
      let quality = null;
      if (numeral.includes("\xB0") || numeral.includes("\u1D52")) {
        quality = "diminished";
      } else if (numeral.includes("+")) {
        quality = "augmented";
      } else if (isLowerCase) {
        quality = "minor";
      } else {
        quality = "major";
      }
      return { degree, quality };
    }
    /**
     * Generate a circle of fifths progression
     * @param {number} length - Number of chords in the progression
     * @returns {Array} Array of chords
     */
    circleOfFifths(length = 4) {
      const progression = [];
      let currentRoot = this.tonicMidi;
      for (let i = 0; i < length; i++) {
        const chord = this.generateChord(currentRoot, "major");
        progression.push(chord);
        currentRoot = (currentRoot + 7) % 12 + Math.floor(currentRoot / 12) * 12;
      }
      return progression;
    }
    /**
     * Weighted random choice helper
     * @param {Array} weights - Array of weights
     * @returns {number} Selected index
     */
    weightedRandomChoice(weights) {
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return i;
        }
      }
      return weights.length - 1;
    }
  };

  // src/algorithms/theory/harmony/Chordify.js
  function generateScaleForRange({ tonic, mode }, minPitch, maxPitch) {
    const scaleBuilder = new Scale({ tonic, mode });
    const safeMin = Number.isFinite(minPitch) ? minPitch : 60;
    const safeMax = Number.isFinite(maxPitch) ? maxPitch : safeMin + 12;
    const startOctave = Math.max(0, Math.floor(safeMin / 12) * 12);
    const extendedMax = safeMax + 12;
    const range = Math.max(12, extendedMax - startOctave);
    const octavesNeeded = Math.ceil(range / 12);
    const notesPerOctave = 7;
    const length = Math.max(notesPerOctave, (octavesNeeded + 1) * notesPerOctave);
    return scaleBuilder.generate({ start: startOctave, length });
  }
  function findClosestScaleIndex(pitch, scaleNotes) {
    let closestIndex = 0;
    let smallestDistance = Infinity;
    for (let i = 0; i < scaleNotes.length; i++) {
      const distance = Math.abs(scaleNotes[i] - pitch);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestIndex = i;
      }
    }
    return closestIndex;
  }
  function chordify(pitch, options = {}) {
    const {
      tonic = "C",
      mode = "major",
      degrees = [0, 2, 4],
      scale = null
    } = options;
    const scaleNotes = scale || generateScaleForRange({ tonic, mode }, pitch - 24, pitch + 24);
    const baseIndex = findClosestScaleIndex(pitch, scaleNotes);
    const chord = [];
    for (const degree of degrees) {
      const targetIndex = baseIndex + degree;
      if (targetIndex >= 0 && targetIndex < scaleNotes.length) {
        chord.push(scaleNotes[targetIndex]);
      }
    }
    return chord;
  }
  function chordifyMany(pitches, options = {}) {
    const { tonic = "C", mode = "major", scale = null } = options;
    const numericPitches = (pitches || []).filter((p) => typeof p === "number");
    const minPitch = numericPitches.length ? Math.min(...numericPitches) : void 0;
    const maxPitch = numericPitches.length ? Math.max(...numericPitches) : void 0;
    const scaleNotes = scale || generateScaleForRange({ tonic, mode }, minPitch, maxPitch);
    return pitches.map((pitch) => chordify(pitch, { ...options, scale: scaleNotes }));
  }

  // src/algorithms/theory/harmony/Voice.js
  var Voice = class extends MusicTheoryConstants {
    /**
     * Constructs all the necessary attributes for the voice object
     * @param {Object} options - Configuration options
     * @param {string} [options.tonic='C'] - The tonic note of the scale (alias: 'key')
     * @param {string} [options.mode='major'] - The scale mode (e.g., 'major', 'minor', 'dorian')
     * @param {Array<number>} [options.degrees=[0, 2, 4]] - Relative degrees for chord formation (triad by default)
     * @param {number} [options.measureLength=4] - Length of a measure in beats (for root extraction)
     * @param {boolean} [options.extractRoots=true] - If true, extract one root per measure; if false, chordify every note
     * @param {number} [options.transpose=0] - Semitones to transpose the output
     * @param {string} [options.output='chords'] - Output format: 'chords' (arrays), 'track' (JMON notes), or 'bass' (single root notes)
     */
    constructor(options = {}) {
      super();
      const {
        tonic,
        key,
        mode = "major",
        degrees = [0, 2, 4],
        measureLength = 4,
        extractRoots = true,
        transpose = 0,
        output = "chords"
      } = options;
      this.tonic = key || tonic || "C";
      this.mode = mode;
      this.degrees = degrees;
      this.measureLength = measureLength;
      this.extractRoots = extractRoots;
      this.transpose = transpose;
      this.output = output;
      this.scale = new Scale({ tonic: this.tonic, mode: this.mode }).generate();
    }
    /**
     * Generate voiced output from a track
     * 
     * @param {Array<Object>} track - Array of JMON notes with { pitch, duration, time }
     * @param {Object} [options={}] - Override options for this generation
     * @returns {Array} Generated output based on the output format setting
     * 
     * @example
     * ```js
     * // Extract one chord per measure as a JMON track
     * const voice = new Voice({ tonic: 'C', mode: 'major', output: 'track' });
     * const chordTrack = voice.generate(melody);
     * 
     * // Get bass notes (roots only) transposed down an octave
     * const bass = new Voice({ tonic: 'C', mode: 'major', output: 'bass', transpose: -12 });
     * const bassTrack = bass.generate(melody);
     * ```
     */
    generate(track, options = {}) {
      if (!Array.isArray(track) || track.length === 0) {
        return [];
      }
      const {
        measureLength = this.measureLength,
        extractRoots = this.extractRoots,
        transpose = this.transpose,
        output = this.output
      } = options;
      let rootPitches;
      let rootTimes;
      if (extractRoots) {
        const tuples = track.map((note) => [note.pitch, note.duration, note.time]);
        rootPitches = findClosestPitchAtMeasureStart(tuples, measureLength);
        rootTimes = rootPitches.map((_, i) => i * measureLength);
      } else {
        rootPitches = track.map((note) => note.pitch);
        rootTimes = track.map((note) => note.time);
      }
      const transposedRoots = rootPitches.map((p) => p + transpose);
      const chords = chordifyMany(rootPitches, {
        tonic: this.tonic,
        mode: this.mode,
        scale: this.scale,
        degrees: this.degrees
      });
      const transposedChords = chords.map(
        (chord) => chord.map((pitch) => pitch + transpose)
      );
      switch (output) {
        case "track":
          return transposedChords.map((chord, i) => ({
            pitch: chord,
            duration: extractRoots ? measureLength : track[i].duration,
            time: rootTimes[i]
          }));
        case "bass":
          return transposedRoots.map((pitch, i) => ({
            pitch,
            duration: extractRoots ? measureLength : track[i].duration,
            time: rootTimes[i]
          }));
        case "chords":
        default:
          return transposedChords;
      }
    }
    /**
     * Static method to transpose a track by semitones
     * @param {Array<Object>} track - Array of JMON notes
     * @param {number} semitones - Number of semitones to transpose
     * @returns {Array<Object>} Transposed track
     * 
     * @example
     * ```js
     * // Transpose down an octave
     * const bassTrack = Voice.transpose(melodyTrack, -12);
     * ```
     */
    static transpose(track, semitones) {
      return track.map((note) => ({
        ...note,
        pitch: Array.isArray(note.pitch) ? note.pitch.map((p) => p + semitones) : note.pitch + semitones
      }));
    }
    /**
     * Voice leading - smooth transition from one chord to another
     * Reorders chord2 notes to minimize movement from chord1
     * @param {Array<number>} chord1 - First chord (array of MIDI notes)
     * @param {Array<number>} chord2 - Second chord (array of MIDI notes)
     * @returns {Array<number>} Voice-led chord2 (notes reordered for smooth transition)
     * 
     * @example
     * ```js
     * const voice = new Voice({ tonic: 'C', mode: 'major' });
     * const cMajor = [60, 64, 67];  // C E G
     * const gMajor = [67, 71, 74];  // G B D
     * const smoothG = voice.lead(cMajor, gMajor);  // Reordered for minimal movement
     * ```
     */
    lead(chord1, chord2) {
      if (!Array.isArray(chord1) || !Array.isArray(chord2)) {
        return chord2;
      }
      const led = [];
      const available = [...chord2];
      for (const note1 of chord1) {
        if (available.length === 0) break;
        let minDistance = Infinity;
        let closestIndex = 0;
        for (let i = 0; i < available.length; i++) {
          const distance = Math.abs(available[i] - note1);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        }
        led.push(available[closestIndex]);
        available.splice(closestIndex, 1);
      }
      led.push(...available);
      return led;
    }
    /**
     * Apply voice leading across a sequence of chords
     * @param {Array<Array<number>>} chords - Array of chord arrays
     * @returns {Array<Array<number>>} Voice-led chord progression
     * 
     * @example
     * ```js
     * const voice = new Voice({ tonic: 'C', mode: 'major' });
     * const progression = [[60, 64, 67], [65, 69, 72], [67, 71, 74]];
     * const smooth = voice.leadProgression(progression);
     * ```
     */
    leadProgression(chords) {
      if (!Array.isArray(chords) || chords.length < 2) {
        return chords;
      }
      const result = [chords[0]];
      for (let i = 1; i < chords.length; i++) {
        result.push(this.lead(result[i - 1], chords[i]));
      }
      return result;
    }
  };

  // src/algorithms/theory/harmony/Ornament.js
  var Ornament = class _Ornament {
    /**
     * Parse duration value to numeric (in quarter notes)
     * Supports both numeric values and Tone.js notation (e.g., '4n', '8n', '2n')
     * @param {number|string} duration - Duration value
     * @returns {number} Duration in quarter notes
     */
    static parseDuration(duration) {
      if (typeof duration === "number") {
        return duration;
      }
      if (typeof duration === "string") {
        const match = duration.match(/^(\d+)(n|t)(\.)?$/);
        if (match) {
          const value = parseInt(match[1], 10);
          const noteType = match[2];
          const isDotted = match[3] === ".";
          let quarterNotes = 4 / value;
          if (noteType === "t") {
            quarterNotes *= 2 / 3;
          }
          if (isDotted) {
            quarterNotes *= 1.5;
          }
          return quarterNotes;
        }
      }
      console.warn(`Unable to parse duration: ${duration}, defaulting to 1 quarter note`);
      return 1;
    }
    /**
     * Validate ornament parameters and compatibility
     * @param {Object} note - The note to apply the ornament to
     * @param {string} type - The type of ornament
     * @param {Object} params - Parameters for the ornament
     * @returns {Object} Validation result with success status and any messages
     */
    static validateOrnament(note, type, params = {}) {
      const result = {
        valid: false,
        warnings: [],
        errors: []
      };
      const ornamentDef = ORNAMENT_TYPES[type];
      if (!ornamentDef) {
        result.errors.push(`Unknown ornament type: ${type}`);
        return result;
      }
      if (ornamentDef.requiredParams) {
        for (const param of ornamentDef.requiredParams) {
          if (!(param in params)) {
            result.errors.push(`Missing required parameter '${param}' for ${type}`);
            return result;
          }
        }
      }
      if (ornamentDef.minDuration) {
        const noteDuration = _Ornament.parseDuration(note.duration);
        const minDuration = _Ornament.parseDuration(ornamentDef.minDuration);
        if (noteDuration < minDuration) {
          result.errors.push(
            `Note duration (${note.duration}) is too short for ${type}. Minimum duration required: ${ornamentDef.minDuration}`
          );
          return result;
        }
      }
      if (note.ornaments && ornamentDef.conflicts) {
        const existingConflicts = note.ornaments.filter((o) => ornamentDef.conflicts.includes(o.type)).map((o) => o.type);
        if (existingConflicts.length > 0) {
          result.errors.push(`${type} conflicts with existing ornaments: ${existingConflicts.join(", ")}`);
          return result;
        }
      }
      if (ornamentDef.validate) {
        const specificValidation = ornamentDef.validate(note, params);
        if (!specificValidation.valid) {
          result.errors.push(specificValidation.error);
          return result;
        }
      }
      result.valid = true;
      return result;
    }
    /**
     * Create a new ornament instance with validation
     * @param {Object} options - Ornament configuration
     */
    constructor(options) {
      const ornamentDef = ORNAMENT_TYPES[options.type];
      if (!ornamentDef) {
        throw new Error(`Unknown ornament type: ${options.type}`);
      }
      this.type = options.type;
      this.params = {
        ...ornamentDef.defaultParams,
        ...options.parameters
      };
      if (options.tonic && options.mode) {
        this.tonicIndex = MusicTheoryConstants.chromatic_scale.indexOf(options.tonic);
        this.scale = this.generateScale(options.tonic, options.mode);
      } else {
        this.scale = null;
      }
    }
    /**
     * Generate a scale for pitch-based ornaments
     */
    generateScale(tonic, mode) {
      const scalePattern = MusicTheoryConstants.scale_intervals[mode];
      const tonicIndex = MusicTheoryConstants.chromatic_scale.indexOf(tonic);
      const scaleNotes = scalePattern.map((interval) => (tonicIndex + interval) % 12);
      const completeScale = [];
      for (let octave = -1; octave < 10; octave++) {
        for (const note of scaleNotes) {
          const midiNote = 12 * octave + note;
          if (midiNote >= 0 && midiNote <= 127) {
            completeScale.push(midiNote);
          }
        }
      }
      return completeScale;
    }
    /**
     * Apply the ornament to notes
     */
    apply(notes, noteIndex = null) {
      if (!Array.isArray(notes) || notes.length === 0) {
        return notes;
      }
      if (noteIndex === null) {
        noteIndex = Math.floor(Math.random() * notes.length);
      }
      if (noteIndex < 0 || noteIndex >= notes.length) {
        return notes;
      }
      const note = notes[noteIndex];
      const validation = _Ornament.validateOrnament(note, this.type, this.params);
      if (!validation.valid) {
        console.warn(`Ornament validation failed: ${validation.errors.join(", ")}`);
        return notes;
      }
      switch (this.type) {
        case "grace_note":
          return this.addGraceNote(notes, noteIndex);
        case "trill":
          return this.addTrill(notes, noteIndex);
        case "mordent":
          return this.addMordent(notes, noteIndex);
        case "turn":
          return this.addTurn(notes, noteIndex);
        case "arpeggio":
          return this.addArpeggio(notes, noteIndex);
        default:
          return notes;
      }
    }
    /**
     * Add a grace note
     */
    addGraceNote(notes, noteIndex) {
      const mainNote = notes[noteIndex];
      const mainPitch = mainNote.pitch;
      const mainDuration = mainNote.duration;
      const mainOffset = mainNote.time;
      const ornamentPitch = this.params.gracePitches ? this.params.gracePitches[Math.floor(Math.random() * this.params.gracePitches.length)] : mainPitch + 1;
      if (this.params.graceNoteType === "acciaccatura") {
        const graceDuration = mainDuration * 0.125;
        const modifiedMain = { pitch: mainPitch, duration: mainDuration, time: mainOffset + graceDuration };
        return [
          ...notes.slice(0, noteIndex),
          { pitch: ornamentPitch, duration: graceDuration, time: mainOffset },
          modifiedMain,
          ...notes.slice(noteIndex + 1)
        ];
      } else {
        const graceDuration = mainDuration / 2;
        const modifiedMain = { pitch: mainPitch, duration: graceDuration, time: mainOffset + graceDuration };
        return [
          ...notes.slice(0, noteIndex),
          { pitch: ornamentPitch, duration: graceDuration, time: mainOffset },
          modifiedMain,
          ...notes.slice(noteIndex + 1)
        ];
      }
    }
    /**
     * Add a trill
     */
    addTrill(notes, noteIndex) {
      const mainNote = notes[noteIndex];
      const mainPitch = mainNote.pitch;
      const mainDuration = mainNote.duration;
      const mainOffset = mainNote.time;
      const trillNotes = [];
      let currentOffset = mainOffset;
      const by = this.params.by || 1;
      const trillRate = this.params.trillRate || 0.125;
      let trillPitch;
      if (this.scale && this.scale.includes(mainPitch)) {
        const pitchIndex = this.scale.indexOf(mainPitch);
        const trillIndex = (pitchIndex + Math.round(by)) % this.scale.length;
        trillPitch = this.scale[trillIndex];
      } else {
        trillPitch = mainPitch + by;
      }
      while (currentOffset < mainOffset + mainDuration) {
        const remainingTime = mainOffset + mainDuration - currentOffset;
        const noteLength = Math.min(trillRate, remainingTime / 2);
        if (remainingTime >= noteLength * 2) {
          trillNotes.push({ pitch: mainPitch, duration: noteLength, time: currentOffset });
          trillNotes.push({ pitch: trillPitch, duration: noteLength, time: currentOffset + noteLength });
          currentOffset += 2 * noteLength;
        } else {
          break;
        }
      }
      return [
        ...notes.slice(0, noteIndex),
        ...trillNotes,
        ...notes.slice(noteIndex + 1)
      ];
    }
    /**
     * Add a mordent
     */
    addMordent(notes, noteIndex) {
      const mainNote = notes[noteIndex];
      const mainPitch = mainNote.pitch;
      const mainDuration = mainNote.duration;
      const mainOffset = mainNote.time;
      const by = this.params.by || 1;
      let mordentPitch;
      if (this.scale && this.scale.includes(mainPitch)) {
        const pitchIndex = this.scale.indexOf(mainPitch);
        const mordentIndex = pitchIndex + Math.round(by);
        mordentPitch = this.scale[mordentIndex] || mainPitch + by;
      } else {
        mordentPitch = mainPitch + by;
      }
      const partDuration = mainDuration / 3;
      const mordentNotes = [
        { pitch: mainPitch, duration: partDuration, time: mainOffset },
        { pitch: mordentPitch, duration: partDuration, time: mainOffset + partDuration },
        { pitch: mainPitch, duration: partDuration, time: mainOffset + 2 * partDuration }
      ];
      return [
        ...notes.slice(0, noteIndex),
        ...mordentNotes,
        ...notes.slice(noteIndex + 1)
      ];
    }
    /**
     * Add a turn
     */
    addTurn(notes, noteIndex) {
      const mainNote = notes[noteIndex];
      const mainPitch = mainNote.pitch;
      const mainDuration = mainNote.duration;
      const mainOffset = mainNote.time;
      const partDuration = mainDuration / 4;
      let upperPitch, lowerPitch;
      if (this.scale && this.scale.includes(mainPitch)) {
        const pitchIndex = this.scale.indexOf(mainPitch);
        upperPitch = this.scale[pitchIndex + 1] || mainPitch + 2;
        lowerPitch = this.scale[pitchIndex - 1] || mainPitch - 2;
      } else {
        upperPitch = mainPitch + 2;
        lowerPitch = mainPitch - 2;
      }
      const turnNotes = [
        { pitch: mainPitch, duration: partDuration, time: mainOffset },
        { pitch: upperPitch, duration: partDuration, time: mainOffset + partDuration },
        { pitch: mainPitch, duration: partDuration, time: mainOffset + 2 * partDuration },
        { pitch: lowerPitch, duration: partDuration, time: mainOffset + 3 * partDuration }
      ];
      return [
        ...notes.slice(0, noteIndex),
        ...turnNotes,
        ...notes.slice(noteIndex + 1)
      ];
    }
    /**
     * Add an arpeggio
     */
    addArpeggio(notes, noteIndex) {
      const mainNote = notes[noteIndex];
      const mainPitch = mainNote.pitch;
      const mainDuration = mainNote.duration;
      const mainOffset = mainNote.time;
      const { arpeggioDegrees, direction = "up" } = this.params;
      if (!arpeggioDegrees || !Array.isArray(arpeggioDegrees)) {
        return notes;
      }
      const pitches = [];
      if (this.scale && this.scale.includes(mainPitch)) {
        const pitchIndex = this.scale.indexOf(mainPitch);
        pitches.push(...arpeggioDegrees.map((degree) => this.scale[pitchIndex + degree] || mainPitch + degree));
      } else {
        pitches.push(...arpeggioDegrees.map((degree) => mainPitch + degree));
      }
      if (direction === "down") pitches.reverse();
      if (direction === "both") pitches.push(...pitches.slice(0, -1).reverse());
      const partDuration = mainDuration / pitches.length;
      const arpeggioNotes = pitches.map((pitch, i) => ({
        pitch,
        duration: partDuration,
        time: mainOffset + i * partDuration
      }));
      return [
        ...notes.slice(0, noteIndex),
        ...arpeggioNotes,
        ...notes.slice(noteIndex + 1)
      ];
    }
  };

  // src/algorithms/theory/harmony/Articulation.js
  var Articulation = class {
    /**
     * Apply articulation to notes array (returns new array, immutable)
     * This API matches the Ornament pattern for consistency
     *
     * Overloaded signatures:
     * - apply(notes[], noteIndex, articulationType, params) - array API (immutable)
     * - apply(note, articulationType) - single note API (mutates in place, returns {success})
     *
     * @param {Array|Object} notes - The notes array or single note object
     * @param {number|Array|string} noteIndex - Index of note to articulate, array of indices, or articulation type
     * @param {string} articulationType - Type of articulation (when using array API)
     * @param {Object} params - Parameters for complex articulations
     * @returns {Array|Object} New notes array with articulation applied, or {success: boolean}
     */
    static apply(notes, noteIndex, articulationType, params = {}) {
      if (!Array.isArray(notes) && typeof notes === "object" && typeof noteIndex === "string") {
        return this._applySingleNote(notes, noteIndex);
      }
      if (!Array.isArray(notes) || notes.length === 0) {
        return notes;
      }
      if (Array.isArray(noteIndex)) {
        let result = notes;
        const sortedIndices = [...noteIndex].sort((a, b) => b - a);
        for (const idx of sortedIndices) {
          result = this.apply(result, idx, articulationType, params);
        }
        return result;
      }
      if (noteIndex < 0 || noteIndex >= notes.length) {
        console.warn(`Note index ${noteIndex} out of bounds`);
        return notes;
      }
      const articulationDef = ARTICULATION_TYPES[articulationType];
      if (!articulationDef) {
        console.warn(`Unknown articulation type: ${articulationType}`);
        return notes;
      }
      const note = notes[noteIndex];
      if (!note || typeof note !== "object") {
        console.warn(`Invalid note at index ${noteIndex}`);
        return notes;
      }
      const newNotes = notes.slice();
      switch (articulationType) {
        case "staccato":
          return this._applyStaccato(newNotes, noteIndex);
        case "staccatissimo":
          return this._applyStaccatissimo(newNotes, noteIndex);
        case "accent":
        case "marcato":
          return this._applyAccent(newNotes, noteIndex, articulationType);
        case "tenuto":
          return this._applyTenuto(newNotes, noteIndex);
        case "legato":
          return this._applyLegato(newNotes, noteIndex);
        case "glissando":
        case "portamento":
        case "bend":
        case "vibrato":
        case "tremolo":
        case "crescendo":
        case "diminuendo":
          return this._applyComplexArticulation(newNotes, noteIndex, articulationType, params);
        default:
          return notes;
      }
    }
    /**
     * Apply articulation to a single note (mutates in place)
     * Legacy API for backward compatibility
     * @param {Object} note - The note object to modify
     * @param {string} articulationType - Type of articulation
     * @returns {{success: boolean}} Result object
     */
    static _applySingleNote(note, articulationType) {
      if (!note || typeof note !== "object") {
        return { success: false };
      }
      const articulationDef = ARTICULATION_TYPES[articulationType];
      if (!articulationDef) {
        console.warn(`Unknown articulation type: ${articulationType}`);
        return { success: false };
      }
      switch (articulationType) {
        case "staccato":
          note.duration = note.duration * 0.5;
          break;
        case "staccatissimo":
          note.duration = note.duration * 0.25;
          break;
        case "accent":
        case "marcato": {
          const multiplier = articulationType === "marcato" ? 1.3 : 1.2;
          const velocity = note.velocity !== void 0 ? note.velocity : 0.8;
          note.velocity = Math.min(1, velocity * multiplier);
          break;
        }
        case "tenuto":
          break;
        case "legato":
          note.duration = note.duration * 1.05;
          break;
        default:
          return { success: false };
      }
      if (!Array.isArray(note.articulations)) {
        note.articulations = [];
      }
      note.articulations.push(articulationType);
      return { success: true };
    }
    /**
     * Apply staccato - shorten duration and insert rest
     */
    static _applyStaccato(notes, noteIndex) {
      const note = notes[noteIndex];
      const originalDuration = note.duration;
      const shortenedDuration = originalDuration * 0.5;
      const restDuration = originalDuration - shortenedDuration;
      const shortenedNote = {
        ...note,
        duration: shortenedDuration,
        articulations: [...Array.isArray(note.articulations) ? note.articulations : [], "staccato"]
      };
      const rest = {
        pitch: null,
        duration: restDuration,
        time: note.time + shortenedDuration
      };
      notes[noteIndex] = shortenedNote;
      notes.splice(noteIndex + 1, 0, rest);
      return notes;
    }
    /**
     * Apply staccatissimo - very short duration with rest
     */
    static _applyStaccatissimo(notes, noteIndex) {
      const note = notes[noteIndex];
      const originalDuration = note.duration;
      const shortenedDuration = originalDuration * 0.25;
      const restDuration = originalDuration - shortenedDuration;
      const shortenedNote = {
        ...note,
        duration: shortenedDuration,
        articulations: [...Array.isArray(note.articulations) ? note.articulations : [], "staccatissimo"]
      };
      const rest = {
        pitch: null,
        duration: restDuration,
        time: note.time + shortenedDuration
      };
      notes[noteIndex] = shortenedNote;
      notes.splice(noteIndex + 1, 0, rest);
      return notes;
    }
    /**
     * Apply accent or marcato - increase velocity
     */
    static _applyAccent(notes, noteIndex, type) {
      const note = notes[noteIndex];
      const multiplier = type === "marcato" ? 1.3 : 1.2;
      const velocity = note.velocity !== void 0 ? note.velocity : 0.8;
      notes[noteIndex] = {
        ...note,
        velocity: Math.min(1, velocity * multiplier),
        articulations: [...Array.isArray(note.articulations) ? note.articulations : [], type]
      };
      return notes;
    }
    /**
     * Apply tenuto - mark for full duration
     */
    static _applyTenuto(notes, noteIndex) {
      const note = notes[noteIndex];
      notes[noteIndex] = {
        ...note,
        articulations: [...Array.isArray(note.articulations) ? note.articulations : [], "tenuto"]
      };
      return notes;
    }
    /**
     * Apply legato - extend duration slightly
     */
    static _applyLegato(notes, noteIndex) {
      const note = notes[noteIndex];
      notes[noteIndex] = {
        ...note,
        duration: note.duration * 1.05,
        articulations: [...Array.isArray(note.articulations) ? note.articulations : [], "legato"]
      };
      return notes;
    }
    /**
     * Apply complex articulation with parameters
     */
    static _applyComplexArticulation(notes, noteIndex, type, params) {
      const note = notes[noteIndex];
      notes[noteIndex] = {
        ...note,
        articulations: [
          ...Array.isArray(note.articulations) ? note.articulations : [],
          { type, ...params }
        ]
      };
      return notes;
    }
    /**
     * Validate articulation consistency in a sequence
     */
    static validateSequence(sequence) {
      const issues = [];
      sequence.forEach((note, index) => {
        const arr = Array.isArray(note.articulations) ? note.articulations : [];
        for (const a of arr) {
          const type = typeof a === "string" ? a : a?.type;
          const articulationDef = ARTICULATION_TYPES[type];
          if (!type || !articulationDef) {
            issues.push({
              type: "unknown_articulation",
              noteIndex: index,
              articulation: type,
              message: `Unknown articulation type: ${type}`
            });
            continue;
          }
          if (Array.isArray(articulationDef.requiredParams)) {
            for (const param of articulationDef.requiredParams) {
              if (typeof a !== "object" || !(param in a)) {
                issues.push({
                  type: "missing_parameter",
                  noteIndex: index,
                  articulation: type,
                  message: `Missing required parameter '${param}' for ${type}`
                });
              }
            }
          }
        }
      });
      return {
        valid: issues.length === 0,
        issues
      };
    }
    /**
     * Get available articulation types with descriptions
     */
    static getAvailableTypes() {
      return Object.entries(ARTICULATION_TYPES).map(([type, def]) => ({
        type,
        complex: def.complex,
        description: def.description,
        requiredParams: def.requiredParams || [],
        optionalParams: def.optionalParams || []
      }));
    }
  };

  // src/algorithms/theory/harmony/Arpeggiate.js
  var Arpeggiate = class _Arpeggiate {
    /**
     * Creates an Arpeggiate instance
     * @param {Object} options - Configuration options
     * @param {Array<number>|string} [options.order=[0, 1, 2]] - Note ordering: array of indices or preset ('up', 'down', 'updown', 'downup', 'random')
     * @param {number} [options.delay=0.1] - Time delay between each note (in quarter notes)
     * @param {Array<number>} [options.velocityCurve] - Optional velocity values for each position in the pattern (0.0-1.0)
     * @param {number} [options.velocityBase] - Base velocity if not specified in note or curve (0.0-1.0, default: undefined - preserves original)
     * @param {boolean} [options.loop=false] - Whether to loop the order pattern for chords longer than the pattern
     * @param {string} [options.output='track'] - Output format: 'track' (JMON notes) or 'raw'
     */
    constructor(options = {}) {
      const {
        order = [0, 1, 2],
        delay = 0.1,
        velocityCurve = null,
        velocityBase = void 0,
        loop = false,
        output = "track"
      } = options;
      this.order = order;
      this.delay = delay;
      this.velocityCurve = velocityCurve;
      this.velocityBase = velocityBase;
      this.loop = loop;
      this.output = output;
    }
    /**
     * Generate arpeggiated notes from a track containing chords
     * @param {Array<Object>} track - Array of JMON notes
     * @param {Object} [options={}] - Override options
     * @returns {Array<Object>} Arpeggiated track
     *
     * @example
     * ```js
     * const track = [
     *   { pitch: [60, 64, 67], duration: 2, time: 0 }
     * ];
     * const arp = new Arpeggiate({ order: [0, 1, 2, 1], delay: 0.1 });
     * const result = arp.generate(track);
     * // => [
     * //   { pitch: 60, duration: 2, time: 0 },
     * //   { pitch: 64, duration: 2, time: 0.1 },
     * //   { pitch: 67, duration: 2, time: 0.2 },
     * //   { pitch: 64, duration: 2, time: 0.3 }
     * // ]
     * ```
     */
    generate(track, options = {}) {
      const {
        order = this.order,
        delay = this.delay,
        velocityCurve = this.velocityCurve,
        velocityBase = this.velocityBase,
        loop = this.loop
      } = options;
      const result = [];
      for (const note of track) {
        if (!Array.isArray(note.pitch) || note.pitch.length <= 1) {
          result.push({ ...note });
          continue;
        }
        const chord = note.pitch;
        const baseTime = note.time || 0;
        const duration = note.duration || 1;
        const indices = this._resolveOrder(order, chord.length, loop);
        for (let i = 0; i < indices.length; i++) {
          const chordIndex = indices[i];
          if (chordIndex < 0 || chordIndex >= chord.length) {
            continue;
          }
          const pitch = chord[chordIndex];
          const time = baseTime + i * delay;
          let noteVelocity = void 0;
          if (velocityCurve && i < velocityCurve.length) {
            noteVelocity = velocityCurve[i];
          } else if (note.velocity !== void 0) {
            noteVelocity = note.velocity;
          } else if (velocityBase !== void 0) {
            noteVelocity = velocityBase;
          }
          const newNote = {
            pitch,
            duration,
            time,
            ...note.synth && { synth: note.synth }
          };
          if (noteVelocity !== void 0) {
            newNote.velocity = noteVelocity;
          }
          result.push(newNote);
        }
      }
      result.sort((a, b) => (a.time || 0) - (b.time || 0));
      return result;
    }
    /**
     * Resolve order pattern to array of indices
     * @private
     */
    _resolveOrder(order, chordLength, loop) {
      if (Array.isArray(order)) {
        if (loop && order.length < chordLength) {
          const looped = [];
          for (let i = 0; i < chordLength; i++) {
            looped.push(order[i % order.length]);
          }
          return looped;
        }
        return order;
      }
      switch (order) {
        case "up":
          return Array.from({ length: chordLength }, (_, i) => i);
        case "down":
          return Array.from({ length: chordLength }, (_, i) => chordLength - 1 - i);
        case "updown": {
          const up = Array.from({ length: chordLength }, (_, i) => i);
          const down = Array.from({ length: chordLength - 1 }, (_, i) => chordLength - 2 - i);
          return [...up, ...down];
        }
        case "downup": {
          const down2 = Array.from({ length: chordLength }, (_, i) => chordLength - 1 - i);
          const up2 = Array.from({ length: chordLength - 1 }, (_, i) => i + 1);
          return [...down2, ...up2];
        }
        case "random": {
          const shuffled = Array.from({ length: chordLength }, (_, i) => i);
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        }
        case "random-walk": {
          const walk = [Math.floor(Math.random() * chordLength)];
          for (let i = 1; i < chordLength; i++) {
            const prev = walk[walk.length - 1];
            const step = Math.random() > 0.5 ? 1 : -1;
            const next = (prev + step + chordLength) % chordLength;
            walk.push(next);
          }
          return walk;
        }
        default:
          return Array.from({ length: chordLength }, (_, i) => i);
      }
    }
    /**
     * Static method to arpeggiate a single chord
     * @param {Array<number>} chord - Array of MIDI pitches
     * @param {Object} options - Arpeggiate options
     * @returns {Array<Object>} Array of individual notes
     *
     * @example
     * ```js
     * const notes = Arpeggiate.arpeggiateChord([60, 64, 67], {
     *   order: [0, 1, 2, 1],
     *   delay: 0.1,
     *   duration: 2,
     *   velocity: 0.7
     * });
     * ```
     */
    static arpeggiateChord(chord, options = {}) {
      const {
        order = [0, 1, 2],
        delay = 0.1,
        duration = 1,
        velocity = void 0,
        time = 0
      } = options;
      const arp = new _Arpeggiate({ order, delay, velocityBase: velocity });
      const note = { pitch: chord, duration, time };
      return arp.generate([note]);
    }
  };
  function arpeggiate(track, options = {}) {
    const arp = new Arpeggiate(options);
    return arp.generate(track);
  }

  // src/algorithms/theory/harmony/Strum.js
  var Strum = class {
    /**
     * Creates a Strum instance
     * @param {Object} options - Configuration options
     * @param {string|Array<number>} [options.direction='down'] - Strum direction: 'down', 'up', 'alternate', 'random', or pattern array where each value determines direction for successive chords (0=down, 1=up). Example: [0,0,1,0] = down, down, up, down
     * @param {number} [options.speed=0.1] - Time delay between each note in the strum (in quarter notes)
     * @param {string} [options.output='track'] - Output format: 'track' (JMON notes) or 'raw'
     * @param {number} [options.velocity] - Base velocity for strummed notes (default: undefined - preserves original)
     * @param {number} [options.velocityVariation=0] - Random variation in velocity (+/- range)
     */
    constructor(options = {}) {
      const {
        direction = "down",
        speed = 0.1,
        output = "track",
        velocity = void 0,
        velocityVariation = 0
      } = options;
      this.direction = direction;
      this.speed = speed;
      this.output = output;
      this.velocity = velocity;
      this.velocityVariation = velocityVariation;
      this.alternateState = 0;
    }
    /**
     * Generate strummed notes from a track containing chords
     * @param {Array<Object>} track - Array of JMON notes, where notes with array pitch are chords
     * @param {Object} [options={}] - Override options for this generation
     * @returns {Array<Object>} Array of JMON notes with strummed chords
     *
     * @example
     * ```js
     * const track = [
     *   { pitch: [60, 64, 67], duration: 2, time: 0 },  // C major chord
     *   { pitch: [62, 65, 69], duration: 2, time: 2 }   // D minor chord
     * ];
     * const strum = new Strum({ direction: 'down', speed: 0.08 });
     * const result = strum.generate(track);
     * ```
     */
    generate(track, options = {}) {
      const {
        direction = this.direction,
        speed = this.speed,
        velocity = this.velocity,
        velocityVariation = this.velocityVariation
      } = options;
      if (Array.isArray(direction)) {
        return this._generateWithPattern(track, direction, speed, velocity, velocityVariation);
      }
      const order = this._directionToOrder(direction, track);
      const arp = new Arpeggiate({
        order,
        delay: speed,
        velocityBase: velocity,
        output: this.output
      });
      const result = arp.generate(track);
      if (velocityVariation > 0) {
        result.forEach((note) => {
          if (note.velocity !== void 0) {
            const variation = (Math.random() * 2 - 1) * velocityVariation;
            note.velocity = Math.max(0, Math.min(1, note.velocity + variation));
          }
        });
      }
      return result;
    }
    /**
     * Generate strummed notes with a custom pattern
     * Pattern determines strum direction for each successive chord
     * @private
     */
    _generateWithPattern(track, pattern, speed, velocity, velocityVariation) {
      const result = [];
      let chordIndex = 0;
      for (const note of track) {
        if (!Array.isArray(note.pitch) || note.pitch.length <= 1) {
          result.push({ ...note });
          continue;
        }
        const chord = note.pitch;
        const baseTime = note.time || 0;
        const duration = note.duration || 1;
        const patternValue = pattern[chordIndex % pattern.length];
        const direction = patternValue === 0 ? "down" : "up";
        const order = direction === "down" ? Array.from({ length: chord.length }, (_, i) => i) : Array.from({ length: chord.length }, (_, i) => chord.length - 1 - i);
        for (let i = 0; i < order.length; i++) {
          const noteIndex = order[i];
          const pitch = chord[noteIndex];
          const time = baseTime + i * speed;
          const newNote = {
            pitch,
            duration,
            time,
            ...note.synth && { synth: note.synth }
          };
          if (note.velocity !== void 0) {
            let noteVelocity = note.velocity;
            if (velocityVariation > 0) {
              const variation = (Math.random() * 2 - 1) * velocityVariation;
              noteVelocity = Math.max(0, Math.min(1, noteVelocity + variation));
            }
            newNote.velocity = noteVelocity;
          } else if (velocity !== void 0) {
            newNote.velocity = velocity;
          }
          result.push(newNote);
        }
        chordIndex++;
      }
      result.sort((a, b) => (a.time || 0) - (b.time || 0));
      return result;
    }
    /**
     * Convert strum direction to arpeggiate order
     * @private
     */
    _directionToOrder(direction, track) {
      if (Array.isArray(direction)) {
        return (chordLength) => {
          const indices = [];
          for (let i = 0; i < chordLength; i++) {
            const patternValue = direction[i % direction.length];
            if (patternValue === 0) {
              indices.push(i);
            } else {
              indices.push(chordLength - 1 - i);
            }
          }
          return indices;
        };
      }
      switch (direction) {
        case "up":
          return "down";
        // In Arpeggiate, 'down' means high to low
        case "down":
          return "up";
        // In Arpeggiate, 'up' means low to high
        case "alternate": {
          const isDown = this.alternateState % 2 === 0;
          this.alternateState++;
          return isDown ? "up" : "down";
        }
        case "random":
          return "random";
        default:
          return "up";
      }
    }
    /**
     * Static method to strum a single chord
     * @param {Array<number>} chord - Array of MIDI pitches
     * @param {Object} options - Strum options
     * @returns {Array<Object>} Array of individual notes
     *
     * @example
     * ```js
     * const notes = Strum.strumChord([60, 64, 67], {
     *   direction: 'down',
     *   speed: 0.1,
     *   duration: 2
     * });
     * ```
     */
    static strumChord(chord, options = {}) {
      const {
        direction = "down",
        speed = 0.1,
        duration = 1,
        velocity = void 0,
        time = 0
      } = options;
      let order;
      switch (direction) {
        case "up":
          order = "down";
          break;
        case "down":
          order = "up";
          break;
        case "random":
          order = "random";
          break;
        default:
          order = "up";
      }
      return Arpeggiate.arpeggiateChord(chord, {
        order,
        delay: speed,
        duration,
        velocity,
        time
      });
    }
  };
  function strum(track, options = {}) {
    const strummer = new Strum(options);
    return strummer.generate(track);
  }

  // src/algorithms/theory/harmony/index.js
  var harmony_default = {
    Arpeggiate,
    Scale,
    Progression,
    Voice,
    Ornament,
    Articulation,
    Strum,
    arpeggiate,
    chordify,
    chordifyMany,
    strum
  };

  // src/utils/jmon-utils.js
  var jmon_utils_exports = {};
  __export(jmon_utils_exports, {
    beatsToTime: () => beatsToTime,
    chain: () => chain,
    combineSequences: () => combineSequences,
    concatenateSequences: () => concatenateSequences,
    createComposition: () => createComposition,
    createPart: () => createPart,
    createScale: () => createScale,
    getTimingInfo: () => getTimingInfo,
    jmonToTuples: () => jmonToTuples,
    normalizeNotes: () => normalizeNotes,
    offsetNotes: () => offsetNotes,
    recalculateTiming: () => recalculateTiming,
    shiftTime: () => shiftTime,
    timeToBeats: () => timeToBeats,
    tuplesToJmon: () => tuplesToJmon
  });
  function beatsToTime(beats, beatsPerBar = 4, ticksPerBeat = 480) {
    const bars = Math.floor(beats / beatsPerBar);
    const remainingBeats = beats - bars * beatsPerBar;
    const wholeBeats = Math.floor(remainingBeats);
    const fractionalBeat = remainingBeats - wholeBeats;
    const ticks = Math.round(fractionalBeat * ticksPerBeat);
    return `${bars}:${wholeBeats}:${ticks}`;
  }
  function timeToBeats(timeString, beatsPerBar = 4, ticksPerBeat = 480) {
    if (typeof timeString === "number") return timeString;
    if (typeof timeString !== "string") return 0;
    const parts = timeString.split(":").map((x) => parseFloat(x || "0"));
    const [bars = 0, beats = 0, ticks = 0] = parts;
    return bars * beatsPerBar + beats + ticks / ticksPerBeat;
  }
  function createPart(notes, name = "Untitled Part", options = {}) {
    const normalizedNotes = normalizeNotes(notes);
    return {
      name,
      notes: normalizedNotes,
      ...options
    };
  }
  function createComposition(parts, metadata = {}) {
    const normalizedParts = parts.map((part, index) => {
      if (Array.isArray(part)) {
        return createPart(part, `Track ${index + 1}`);
      } else if (part.name && part.notes) {
        return {
          ...part,
          notes: normalizeNotes(part.notes)
        };
      } else {
        return part;
      }
    });
    const composition = {
      format: "jmon",
      version: "1.0",
      bpm: metadata.bpm || 120,
      keySignature: metadata.keySignature || "C",
      timeSignature: metadata.timeSignature || "4/4",
      tracks: normalizedParts,
      ...metadata
    };
    delete composition.metadata?.bpm;
    delete composition.metadata?.keySignature;
    delete composition.metadata?.timeSignature;
    return composition;
  }
  function normalizeNotes(notes) {
    if (!Array.isArray(notes)) return [];
    return notes.map((note, index) => {
      if (Array.isArray(note)) {
        const [pitch, duration, offset = 0] = note;
        return {
          pitch,
          duration,
          time: beatsToTime(offset)
        };
      }
      if (typeof note === "object" && note !== null) {
        const { pitch, duration } = note;
        let time = "0:0:0";
        if (typeof note.time === "string") {
          time = note.time;
        } else if (typeof note.time === "number") {
          time = beatsToTime(note.time);
        } else if (typeof note.offset === "number") {
          time = beatsToTime(note.offset);
        }
        return {
          pitch,
          duration,
          time,
          // Preserve other properties
          ...Object.fromEntries(
            Object.entries(note).filter(
              ([key]) => !["time", "offset"].includes(key)
            )
          )
        };
      }
      console.warn(`Unexpected note format at index ${index}:`, note);
      return {
        pitch: 60,
        // Default to middle C
        duration: 1,
        time: "0:0:0"
      };
    });
  }
  function tuplesToJmon(tuples) {
    return tuples.map(([pitch, duration, offset = 0]) => ({
      pitch,
      duration,
      time: beatsToTime(offset)
    }));
  }
  function jmonToTuples(notes) {
    return notes.map((note) => [
      note.pitch,
      note.duration,
      timeToBeats(note.time)
    ]);
  }
  function createScale(pitches, duration = 1, startTime = 0) {
    let currentTime = startTime;
    return pitches.map((pitch) => {
      const note = {
        pitch,
        duration,
        time: beatsToTime(currentTime)
      };
      currentTime += duration;
      return note;
    });
  }
  function shiftTime(notes, timeShift) {
    return notes.map((note) => {
      const currentTime = typeof note.time === "number" ? note.time : timeToBeats(note.time);
      return {
        ...note,
        time: typeof note.time === "number" ? currentTime + timeShift : beatsToTime(currentTime + timeShift)
      };
    });
  }
  var offsetNotes = shiftTime;
  function concatenateSequences(sequences) {
    if (sequences.length === 0) return [];
    const result = [];
    let currentTime = 0;
    const useNumericTime = sequences[0]?.length > 0 && typeof sequences[0][0]?.time === "number";
    for (const sequence of sequences) {
      const shiftedSequence = shiftTime(sequence, currentTime);
      result.push(...shiftedSequence);
      const endTimes = shiftedSequence.map((note) => {
        const noteTime = typeof note.time === "number" ? note.time : timeToBeats(note.time);
        return noteTime + note.duration;
      });
      currentTime = Math.max(...endTimes, currentTime);
    }
    return result;
  }
  function chain(...tracks) {
    return concatenateSequences(tracks);
  }
  function recalculateTiming(notes, startTime = 0) {
    let currentTime = startTime;
    const useNumericTime = notes.length > 0 && typeof notes[0]?.time === "number";
    return notes.map((note) => {
      const newNote = {
        ...note,
        time: useNumericTime ? currentTime : beatsToTime(currentTime)
      };
      currentTime += note.duration;
      return newNote;
    });
  }
  function combineSequences(sequences) {
    return sequences.flat();
  }
  function getTimingInfo(notes) {
    if (notes.length === 0) return { start: 0, end: 0, duration: 0 };
    const startTimes = notes.map((note) => timeToBeats(note.time));
    const endTimes = notes.map((note) => timeToBeats(note.time) + note.duration);
    const start = Math.min(...startTimes);
    const end = Math.max(...endTimes);
    return {
      start,
      end,
      duration: end - start,
      startTime: beatsToTime(start),
      endTime: beatsToTime(end)
    };
  }

  // src/algorithms/theory/rhythm/Rhythm.js
  var Rhythm = class {
    /**
     * Constructs all the necessary attributes for the Rhythm object. Accepts the
     * legacy `(measureLength, durations)` signature or an options object.
     *
     * @param {number|Object} measureLength - Measure length or configuration object
     * @param {Array<number>} [durations] - Durations list when using legacy signature
     */
    constructor(measureLength, durations) {
      if (typeof measureLength === "object" && measureLength !== null) {
        const config = measureLength;
        this.measureLength = config.measureLength;
        this.durations = config.durations;
      } else {
        this.measureLength = measureLength;
        this.durations = durations;
      }
      if (typeof this.measureLength !== "number" || this.measureLength <= 0) {
        throw new Error("Rhythm requires a positive measureLength");
      }
      if (!Array.isArray(this.durations) || this.durations.length === 0) {
        throw new Error("Rhythm requires a non-empty durations array");
      }
    }
    /**
     * Generate a random rhythm.
     * @param {number|Object|null} seedOrOptions - Legacy seed value or options object
     * @param {number} [restProbability=0] - Legacy positional parameter
     * @param {number} [maxIter=100] - Legacy positional parameter
     * @param {Object} [options={}] - Additional options when using legacy signature
     * @param {boolean} [options.legacy=false] - Return legacy tuples instead of objects
     * @param {boolean} [options.useStringTime=false] - Output bars:beats:ticks time strings
     * @returns {Array} Array of rhythm events `{ duration, time }` (or legacy tuples)
     */
    random(seedOrOptions = null, restProbability = 0, maxIter = 100, options = {}) {
      let seed = seedOrOptions;
      let restProb = restProbability;
      let maxIterations = maxIter;
      let legacy = false;
      let useStringTime = false;
      if (typeof seedOrOptions === "object" && seedOrOptions !== null && !Array.isArray(seedOrOptions)) {
        const config = seedOrOptions;
        seed = config.seed ?? null;
        restProb = config.restProbability ?? 0;
        maxIterations = config.maxIter ?? config.maxIterations ?? 100;
        legacy = !!config.legacy;
        useStringTime = !!config.useStringTime;
      } else if (options && typeof options === "object") {
        legacy = !!options.legacy;
        useStringTime = !!options.useStringTime;
      }
      if (seed !== null && typeof Math.seedrandom === "function") {
        Math.seedrandom(seed);
      }
      const rhythm = [];
      let totalLength = 0;
      let nIter = 0;
      while (totalLength < this.measureLength && nIter < maxIterations) {
        const duration = this.durations[Math.floor(Math.random() * this.durations.length)];
        if (totalLength + duration > this.measureLength) {
          nIter++;
          continue;
        }
        if (Math.random() < restProb) {
          nIter++;
          continue;
        }
        rhythm.push([duration, totalLength]);
        totalLength += duration;
        nIter++;
      }
      if (nIter >= maxIterations) {
        console.warn("Max iterations reached. The sum of the durations may not equal the measure length.");
      }
      if (legacy) {
        return rhythm;
      }
      return rhythm.map(([duration, offset]) => ({
        duration,
        time: useStringTime ? beatsToTime(offset) : offset
      }));
    }
    /**
     * Executes the Darwinian evolution algorithm to generate the best rhythm.
     * Accepts legacy positional args or a configuration object similar to
     * {@link Rhythm#random}.
     *
     * @param {number|Object|null} seedOrOptions - Legacy seed or options object
     * @param {number} [populationSize=10]
     * @param {number} [maxGenerations=50]
     * @param {number} [mutationRate=0.1]
     * @param {Object} [options={}] - Additional options (legacy flag, string times)
     * @returns {Array} Rhythm events as `{ duration, time }` objects or legacy tuples
     */
    darwin(seedOrOptions = null, populationSize = 10, maxGenerations = 50, mutationRate = 0.1, options = {}) {
      let seed = seedOrOptions;
      let popSize = populationSize;
      let generations = maxGenerations;
      let mutRate = mutationRate;
      let legacy = false;
      let useStringTime = false;
      if (typeof seedOrOptions === "object" && seedOrOptions !== null && !Array.isArray(seedOrOptions)) {
        const config = seedOrOptions;
        seed = config.seed ?? null;
        popSize = config.populationSize ?? config.population ?? 10;
        generations = config.maxGenerations ?? config.generations ?? 50;
        mutRate = config.mutationRate ?? 0.1;
        legacy = !!config.legacy;
        useStringTime = !!config.useStringTime;
      } else if (options && typeof options === "object") {
        legacy = !!options.legacy;
        useStringTime = !!options.useStringTime;
      }
      const ga = new GeneticRhythm(
        seed,
        popSize,
        this.measureLength,
        generations,
        mutRate,
        this.durations
      );
      const tuples = ga.generate();
      if (legacy) {
        return tuples;
      }
      return tuples.map(([duration, offset]) => ({
        duration,
        time: useStringTime ? beatsToTime(offset) : offset
      }));
    }
  };
  var GeneticRhythm = class {
    constructor(seed, populationSize, measureLength, maxGenerations, mutationRate, durations) {
      if (seed !== null && typeof Math.seedrandom === "function") {
        Math.seedrandom(seed);
      }
      this.populationSize = populationSize;
      this.measureLength = measureLength;
      this.maxGenerations = maxGenerations;
      this.mutationRate = mutationRate;
      this.durations = durations;
      this.population = this.initializePopulation();
    }
    /**
     * Initialize a population of random rhythms
     */
    initializePopulation() {
      const population = [];
      for (let i = 0; i < this.populationSize; i++) {
        population.push(this.createRandomRhythm());
      }
      return population;
    }
    /**
     * Create a random rhythm ensuring it respects the measure length
     * @returns {Array} Array of [duration, offset] tuples
     */
    createRandomRhythm() {
      const rhythm = [];
      let totalLength = 0;
      while (totalLength < this.measureLength) {
        const remaining = this.measureLength - totalLength;
        const noteLength = this.durations[Math.floor(Math.random() * this.durations.length)];
        if (noteLength <= remaining) {
          rhythm.push([noteLength, totalLength]);
          totalLength += noteLength;
        } else {
          break;
        }
      }
      return rhythm;
    }
    /**
     * Evaluate the fitness of a rhythm
     * @param {Array} rhythm - The rhythm to evaluate
     * @returns {number} Fitness score (lower is better)
     */
    evaluateFitness(rhythm) {
      const totalLength = rhythm.reduce((sum, note) => sum + note[0], 0);
      return Math.abs(this.measureLength - totalLength);
    }
    /**
     * Select a parent using simple random selection with fitness bias
     * @returns {Array} Selected parent rhythm
     */
    selectParent() {
      const parent1 = this.population[Math.floor(Math.random() * this.population.length)];
      const parent2 = this.population[Math.floor(Math.random() * this.population.length)];
      return this.evaluateFitness(parent1) < this.evaluateFitness(parent2) ? parent1 : parent2;
    }
    /**
     * Perform crossover between two parents
     * @param {Array} parent1 - First parent rhythm
     * @param {Array} parent2 - Second parent rhythm
     * @returns {Array} Child rhythm
     */
    crossover(parent1, parent2) {
      if (parent1.length === 0 || parent2.length === 0) {
        return parent1.length > 0 ? [...parent1] : [...parent2];
      }
      const crossoverPoint = Math.floor(Math.random() * (parent1.length - 1)) + 1;
      const child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
      return this.ensureMeasureLength(child);
    }
    /**
     * Ensure rhythm respects measure length
     * @param {Array} rhythm - The rhythm to adjust
     * @returns {Array} Adjusted rhythm
     */
    ensureMeasureLength(rhythm) {
      const totalLength = rhythm.reduce((sum, note) => sum + note[0], 0);
      if (totalLength > this.measureLength && rhythm.length > 0) {
        rhythm.pop();
      }
      return rhythm;
    }
    /**
     * Mutate a rhythm with certain probability
     * @param {Array} rhythm - The rhythm to mutate
     * @returns {Array} Mutated rhythm
     */
    mutate(rhythm) {
      if (Math.random() < this.mutationRate && rhythm.length > 1) {
        const index = Math.floor(Math.random() * (rhythm.length - 1));
        const [duration, offset] = rhythm[index];
        const nextOffset = index === rhythm.length - 1 ? this.measureLength : rhythm[index + 1][1];
        const maxNewDuration = nextOffset - offset;
        const validDurations = this.durations.filter((d) => d <= maxNewDuration);
        if (validDurations.length > 0) {
          const newDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
          rhythm[index] = [newDuration, offset];
        }
      }
      return rhythm;
    }
    /**
     * Execute the genetic algorithm
     * @returns {Array} Best rhythm found, sorted by offset
     */
    generate() {
      for (let generation = 0; generation < this.maxGenerations; generation++) {
        const newPopulation = [];
        for (let i = 0; i < this.populationSize; i++) {
          const parent1 = this.selectParent();
          const parent2 = this.selectParent();
          let child = this.crossover(parent1, parent2);
          child = this.mutate(child);
          child.sort((a, b) => a[1] - b[1]);
          newPopulation.push(child);
        }
        this.population = newPopulation;
      }
      const bestRhythm = this.population.reduce(
        (best, current) => this.evaluateFitness(current) < this.evaluateFitness(best) ? current : best
      );
      return bestRhythm.sort((a, b) => a[1] - b[1]);
    }
  };

  // src/algorithms/theory/rhythm/isorhythm.js
  function isorhythm(pitches, durations, options = {}) {
    const cleanPitches = pitches.map((p) => Array.isArray(p) || typeof p === "object" && p.length ? p[0] : p);
    const lcm = calculateLCM(cleanPitches.length, durations.length);
    const pRepeated = [];
    const dRepeated = [];
    for (let i = 0; i < lcm; i++) {
      pRepeated.push(cleanPitches[i % cleanPitches.length]);
      dRepeated.push(durations[i % durations.length]);
    }
    const notes = pRepeated.map((pitch, i) => [pitch, dRepeated[i], 1]);
    const tuplesWithOffsets = setOffsetsAccordingToDurations(notes);
    if (options.legacy) {
      return tuplesWithOffsets;
    }
    return tuplesWithOffsets.map(([pitch, duration, offset]) => ({
      pitch,
      duration,
      time: options.useStringTime ? beatsToTime(offset) : offset
    }));
  }
  function calculateLCM(a, b) {
    const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
    return Math.abs(a * b) / gcd(a, b);
  }

  // src/algorithms/theory/rhythm/beatcycle.js
  function beatcycle(pitches, durations, options = {}) {
    if (!Array.isArray(pitches) || !Array.isArray(durations) || durations.length === 0) {
      return [];
    }
    const { legacy = false, useStringTime = false } = options;
    const tuples = [];
    let currentOffset = 0;
    let durationIndex = 0;
    for (const pitch of pitches) {
      const duration = durations[durationIndex % durations.length];
      tuples.push([pitch, duration, currentOffset]);
      currentOffset += duration;
      durationIndex++;
    }
    if (legacy) {
      return tuples;
    }
    return tuples.map(([pitch, duration, offset]) => ({
      pitch,
      duration,
      time: useStringTime ? beatsToTime(offset) : offset
    }));
  }

  // src/algorithms/theory/rhythm/index.js
  var rhythm_default = {
    Rhythm,
    isorhythm,
    beatcycle
  };

  // src/algorithms/theory/motifs/index.js
  var MotifBank = class {
    // Dummy implementation, replace with actual logic
    constructor() {
    }
  };

  // src/algorithms/generative/cellular-automata/CellularAutomata.js
  var CellularAutomata = class {
    /**
     * Static helper: Convert any CA grid to plot data in piano roll format
     * @param {number[][]} grid - Grid to convert
     * @param {number} [pitchOffset=0] - Offset to add to pitch indices
     * @returns {Array<{time: number, pitch: number}>} Array of data points for plotting
     *
     * @example
     * const grid = [[0, 1, 0], [1, 0, 1]];
     * const plotData = CellularAutomata.gridToPlotData(grid);
     * // Returns: [{time: 0, pitch: 1}, {time: 1, pitch: 0}, {time: 1, pitch: 2}]
     *
     * @example With pitch offset
     * const grid = [[0, 1, 0], [1, 0, 1]];
     * const plotData = CellularAutomata.gridToPlotData(grid, 60);
     * // Returns: [{time: 0, pitch: 61}, {time: 1, pitch: 60}, {time: 1, pitch: 62}]
     */
    static gridToPlotData(grid, pitchOffset = 0) {
      const data = [];
      grid.forEach((row, time) => {
        row.forEach((cell, cellIndex) => {
          if (cell === 1) {
            data.push({ time, pitch: pitchOffset + cellIndex });
          }
        });
      });
      return data;
    }
    /**
     * @param {CellularAutomataOptions} [options={}] - Configuration options
     */
    constructor(options = {}) {
      if (Array.isArray(options.width)) {
        this.pitchMin = options.width[0];
        this.pitchMax = options.width[1];
        this.width = this.pitchMax - this.pitchMin + 1;
      } else {
        this.pitchMin = 0;
        this.pitchMax = (options.width || 51) - 1;
        this.width = options.width || 51;
      }
      this.ruleNumber = options.ruleNumber || 30;
      this.initialState = options.initialState || this.generateRandomInitialState();
      this.state = [...this.initialState];
      this.rules = this.loadRules(this.ruleNumber);
      this.history = [];
    }
    /**
     * Generate cellular automaton evolution
     * @param {number} steps - Number of evolution steps
     * @returns {Matrix2D} Evolution history
     */
    generate(steps) {
      this.history = [];
      this.state = [...this.initialState];
      this.history.push([...this.state]);
      for (let step = 0; step < steps; step++) {
        this.updateState();
        this.history.push([...this.state]);
      }
      return this.history;
    }
    /**
     * Generate cellular automaton evolution with binary output
     * @param {number} steps - Number of evolution steps
     * @returns {Matrix2D} Binary evolution history
     */
    generate01(steps) {
      const result = this.generate(steps);
      return result.map((row) => row.map((cell) => cell > 0 ? 1 : 0));
    }
    /**
     * Load rules based on rule number
     * @param {number} ruleNumber - Rule number (0-255)
     * @returns {CellularAutomataRule} Rule mapping
     */
    loadRules(ruleNumber) {
      const binary = ruleNumber.toString(2).padStart(8, "0");
      const rules = {};
      const neighborhoods = ["111", "110", "101", "100", "011", "010", "001", "000"];
      for (let i = 0; i < 8; i++) {
        rules[neighborhoods[i]] = parseInt(binary[i], 10);
      }
      return rules;
    }
    /**
     * Update the current state based on rules
     */
    updateState() {
      const newState = new Array(this.width);
      for (let i = 0; i < this.width; i++) {
        const left = this.state[(i - 1 + this.width) % this.width];
        const center = this.state[i];
        const right = this.state[(i + 1) % this.width];
        const neighborhood = `${left}${center}${right}`;
        newState[i] = this.rules[neighborhood] || 0;
      }
      this.state = newState;
    }
    /**
     * Validate strips matrix format
     * @param {Matrix2D} strips - Matrix to validate
     * @returns {boolean} Whether the matrix is valid
     */
    validateStrips(strips) {
      if (!Array.isArray(strips) || strips.length === 0) {
        return false;
      }
      const width = strips[0]?.length;
      if (!width) return false;
      return strips.every(
        (strip) => Array.isArray(strip) && strip.length === width && strip.every((cell) => typeof cell === "number" && (cell === 0 || cell === 1))
      );
    }
    /**
     * Validate values array
     * @param {number[]} values - Values to validate
     * @returns {boolean} Whether the values are valid
     */
    validateValues(values) {
      return Array.isArray(values) && values.length === this.width && values.every((val) => typeof val === "number" && (val === 0 || val === 1));
    }
    /**
     * Set initial state
     * @param {number[]} state - New initial state
     */
    setInitialState(state) {
      if (this.validateValues(state)) {
        this.initialState = [...state];
        this.state = [...state];
      } else {
        throw new Error("Invalid initial state");
      }
    }
    /**
     * Set rule number
     * @param {number} ruleNumber - New rule number (0-255)
     */
    setRuleNumber(ruleNumber) {
      if (ruleNumber >= 0 && ruleNumber <= 255) {
        this.ruleNumber = ruleNumber;
        this.rules = this.loadRules(ruleNumber);
      } else {
        throw new Error("Rule number must be between 0 and 255");
      }
    }
    /**
     * Get evolution history
     * @returns {Matrix2D} Copy of evolution history
     */
    getHistory() {
      return this.history.map((row) => [...row]);
    }
    /**
     * Get current state
     * @returns {number[]} Copy of current state
     */
    getCurrentState() {
      return [...this.state];
    }
    /**
     * Generate random initial state with single center cell
     * @returns {number[]} Initial state array
     */
    generateRandomInitialState() {
      const state = new Array(this.width).fill(0);
      state[Math.floor(this.width / 2)] = 1;
      return state;
    }
    /**
     * Generate completely random state
     * @returns {number[]} Random state array
     */
    generateRandomState() {
      return Array.from({ length: this.width }, () => Math.random() > 0.5 ? 1 : 0);
    }
    /**
     * Get plot data
     * @returns {Object} Plot data with dimensions
     */
    plot() {
      return {
        data: this.getHistory(),
        width: this.width,
        height: this.history.length
      };
    }
    /**
     * Convert CA grid to plot data in piano roll format (time, pitch)
     * @param {number[][]} [grid] - Optional grid to convert (defaults to current history)
     * @returns {Array<{time: number, pitch: number}>} Array of data points for plotting
     *
     * @example
     * const ca = new CellularAutomata({ ruleNumber: 110, width: 20 });
     * ca.generate(30);
     * const plotData = ca.toPlotData();
     * // Use with Observable Plot:
     * Plot.cell(plotData, { x: "time", y: "pitch", fill: "black" })
     *
     * @example With pitch range
     * const ca = new CellularAutomata({ ruleNumber: 110, width: [60, 72] });
     * ca.generate(30);
     * const plotData = ca.toPlotData();
     * // Returns pitch values in range 60-72 (MIDI notes C4-C5)
     */
    toPlotData(grid = null) {
      const dataGrid = grid || this.getHistory();
      const data = [];
      dataGrid.forEach((row, time) => {
        row.forEach((cell, cellIndex) => {
          if (cell === 1) {
            const pitch = this.pitchMin + cellIndex;
            data.push({ time, pitch });
          }
        });
      });
      return data;
    }
    /**
     * Convert strip to pitch sequence using a pitch set
     * Each row in the strip becomes a chord (multiple pitches) or single note or null (rest)
     * @param {number[][]} strip - CA strip grid
     * @param {number[]} pitchSet - Array of MIDI pitch values to map to
     * @returns {Array<number|number[]|null>} Pitch sequence where each element is a pitch, array of pitches, or null
     *
     * @example
     * const strip = [[0, 1, 0], [1, 0, 1], [0, 0, 0]];
     * const pitchSet = [60, 62, 64]; // C4, D4, E4
     * const pitches = CellularAutomata.stripToPitches(strip, pitchSet);
     * // Returns: [62, [60, 64], null]
     */
    static stripToPitches(strip, pitchSet) {
      return strip.map((row) => {
        const pitches = [];
        row.forEach((cell, idx) => {
          if (cell === 1 && idx < pitchSet.length) {
            pitches.push(pitchSet[idx]);
          }
        });
        return pitches.length === 1 ? pitches[0] : pitches.length > 0 ? pitches : null;
      });
    }
    /**
     * Create Observable Plot visualization of CA evolution
     * @param {Object} [options] - Plot options
     * @returns {Object} Observable Plot spec
     */
    async plotEvolution(options) {
      const CAVisualizerModule = await Promise.resolve().then(() => (init_CAVisualizer(), CAVisualizer_exports));
      return CAVisualizerModule.CAVisualizer.plotEvolution(this.getHistory(), options);
    }
    /**
     * Create Observable Plot visualization of current generation
     * @param {Object} [options] - Plot options
     * @returns {Object} Observable Plot spec
     */
    async plotGeneration(options) {
      const CAVisualizerModule = await Promise.resolve().then(() => (init_CAVisualizer(), CAVisualizer_exports));
      return CAVisualizerModule.CAVisualizer.plotGeneration(this.getCurrentState(), options);
    }
    /**
     * Create Observable Plot density visualization
     * @param {Object} [options] - Plot options
     * @returns {Object} Observable Plot spec
     */
    async plotDensity(options) {
      const CAVisualizerModule = await Promise.resolve().then(() => (init_CAVisualizer(), CAVisualizer_exports));
      return CAVisualizerModule.CAVisualizer.plotDensity(this.getHistory(), options);
    }
  };

  // src/algorithms/generative/loops/Loop.js
  var Loop = class _Loop {
    /**
     * Initializes a Loop object.
     *
     * @param {Object} options - Configuration options
     * @param {Object|Array} options.loops - Dictionary or array of JMON tracks. Each track has notes: [{pitch, duration, time, velocity}, ...]
     * @param {number} [options.measureLength=4] - The length of a measure in beats
     * @param {boolean} [options.insertRests=true] - Whether to insert rests
     */
    constructor(options = {}) {
      const {
        loops,
        measureLength = 4,
        insertRests = true
      } = options;
      if (!loops) {
        throw new Error("loops is required");
      }
      if (typeof measureLength !== "number" || measureLength <= 0) {
        throw new Error("measureLength must be a positive number");
      }
      if (typeof insertRests !== "boolean") {
        throw new Error("insertRests must be a boolean");
      }
      this.measureLength = measureLength;
      let loopsObj = loops;
      if (Array.isArray(loops)) {
        if (loops.length === 0) {
          throw new Error("Loops array cannot be empty");
        }
        loopsObj = {};
        loops.forEach((loop, i) => {
          const label = loop?.label || `Loop ${i + 1}`;
          loopsObj[label] = loop;
        });
      }
      if (typeof loopsObj !== "object" || Object.keys(loopsObj).length === 0) {
        throw new Error("Loops must be a non-empty object or array");
      }
      this.loops = {};
      for (const [name, loopData] of Object.entries(loopsObj)) {
        if (!loopData) {
          throw new Error(`Loop data for "${name}" is null or undefined`);
        }
        const notes = Array.isArray(loopData) ? loopData : loopData.notes || [];
        if (!Array.isArray(notes)) {
          throw new Error(`Notes for loop "${name}" must be an array`);
        }
        const validatedNotes = notes.map((note, index) => {
          if (!note || typeof note !== "object") {
            throw new Error(`Note ${index} in loop "${name}" must be an object`);
          }
          if (note.pitch !== null && (typeof note.pitch !== "number" || note.pitch < 0 || note.pitch > 127)) {
            throw new Error(`Note ${index} in loop "${name}" has invalid pitch: ${note.pitch}`);
          }
          if (typeof note.time !== "number" || note.time < 0) {
            throw new Error(`Note ${index} in loop "${name}" has invalid time: ${note.time}`);
          }
          if (typeof note.duration !== "number" || note.duration <= 0) {
            throw new Error(`Note ${index} in loop "${name}" has invalid duration: ${note.duration}`);
          }
          return {
            pitch: note.pitch,
            time: note.time,
            duration: note.duration,
            velocity: typeof note.velocity === "number" ? Math.max(0, Math.min(1, note.velocity)) : 0.8
          };
        });
        this.loops[name] = {
          label: loopData.label || name,
          notes: insertRests ? this.fillGapsWithRests(validatedNotes) : validatedNotes,
          synth: loopData.synth || {
            type: "Synth",
            options: {
              oscillator: { type: "sine" },
              envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
            }
          }
        };
      }
    }
    /**
     * Fill gaps between notes with rests (JMON format)
     */
    fillGapsWithRests(notes) {
      if (notes.length === 0) return notes;
      const result = [];
      let currentTime = 0;
      const sortedNotes = [...notes].sort((a, b) => a.time - b.time);
      for (const note of sortedNotes) {
        if (note.time > currentTime) {
          result.push({
            pitch: null,
            // null indicates rest
            duration: note.time - currentTime,
            time: currentTime,
            velocity: 0
          });
        }
        result.push({
          pitch: note.pitch,
          duration: note.duration,
          time: note.time,
          velocity: note.velocity || 0.8
        });
        currentTime = note.time + note.duration;
      }
      return result;
    }
    /**
     * Create a loop from a single JMON track
     */
    static fromTrack(track, measureLength = 4) {
      const notes = track.notes || [];
      if (notes.length === 0) {
        throw new Error("Track must have notes to create loop");
      }
      return new _Loop({ loops: { [track.label || "Track"]: track }, measureLength });
    }
    /**
     * Create a loop from simple pitch/duration arrays
     * @param {Array} pitches - Array of MIDI pitches (or null for rests)
     * @param {Array} durations - Array of durations in beats
     * @param {Object} options - Optional configuration (iterations, transpose, offset, label)
     * @returns {Loop} A new Loop instance
     */
    static fromPattern(pitches, durations, options = {}) {
      if (!Array.isArray(pitches) || !Array.isArray(durations)) {
        throw new Error("pitches and durations must be arrays");
      }
      if (pitches.length === 0 || durations.length === 0) {
        throw new Error("pitches and durations arrays cannot be empty");
      }
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);
      const iterations = options.iterations || 1;
      const transpose = options.transpose || 0;
      const offset = options.offset || 0;
      const label = options.label || "Pattern";
      const notes = [];
      let currentTime = offset;
      for (let iter = 0; iter < iterations; iter++) {
        const transposition = transpose * iter;
        for (let i = 0; i < pitches.length; i++) {
          const pitch = pitches[i];
          const duration = durations[i % durations.length];
          notes.push({
            pitch: pitch === null ? null : pitch + transposition,
            duration,
            time: currentTime,
            velocity: 0.8
          });
          currentTime += duration;
        }
      }
      return new _Loop({
        loops: { [label]: { notes } },
        measureLength: options.measureLength || 4
      });
    }
    /**
     * Create loop from Euclidean rhythm (JMON format)
     * @param {number} beats - Total number of beats
     * @param {number} pulses - Number of active pulses to distribute
     * @param {Array} [pitches=[60]] - Array of MIDI pitches to cycle through
     * @param {string} [label] - Label for the loop
     * @returns {Loop} A new Loop instance
     */
    static euclidean(beats, pulses, pitches = [60], label) {
      if (typeof beats !== "number" || beats <= 0 || !Number.isInteger(beats)) {
        throw new Error("beats must be a positive integer");
      }
      if (typeof pulses !== "number" || pulses < 0 || !Number.isInteger(pulses)) {
        throw new Error("pulses must be a non-negative integer");
      }
      if (pulses > beats) {
        throw new Error("pulses cannot be greater than beats");
      }
      if (!Array.isArray(pitches) || pitches.length === 0) {
        throw new Error("pitches must be a non-empty array");
      }
      const pattern = this.generateEuclideanRhythm(beats, pulses);
      const notes = [];
      const beatDuration = 1;
      pattern.forEach((active, index) => {
        if (active) {
          const time = index * beatDuration;
          const pitch = pitches[index % pitches.length];
          notes.push({
            pitch,
            duration: beatDuration * 0.8,
            time,
            velocity: 0.8
          });
        }
      });
      const trackLabel = label || `Euclidean ${pulses}/${beats}`;
      const track = {
        label: trackLabel,
        notes,
        synth: {
          type: "Synth",
          options: {
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
          }
        }
      };
      return new _Loop({ loops: { [trackLabel]: track }, measureLength: beats });
    }
    /**
     * Generate Euclidean rhythm pattern using Bjorklund algorithm
     * This creates the most even distribution of pulses across beats
     */
    static generateEuclideanRhythm(beats, pulses) {
      if (pulses === 0) {
        return Array(beats).fill(false);
      }
      if (pulses >= beats) {
        return Array(beats).fill(true);
      }
      const pattern = [];
      let groups = [
        { pattern: [1], count: pulses },
        // Groups with pulses
        { pattern: [0], count: beats - pulses }
        // Groups without pulses
      ];
      while (groups.length > 1) {
        const [first, second] = groups;
        if (first.count <= second.count) {
          const newCount = first.count;
          const remaining = second.count - first.count;
          groups = [
            { pattern: [...second.pattern, ...first.pattern], count: newCount }
          ];
          if (remaining > 0) {
            groups.push({ pattern: second.pattern, count: remaining });
          }
        } else {
          const newCount = second.count;
          const remaining = first.count - second.count;
          groups = [
            { pattern: [...first.pattern, ...second.pattern], count: newCount }
          ];
          if (remaining > 0) {
            groups.push({ pattern: first.pattern, count: remaining });
          }
        }
      }
      const finalGroup = groups[0];
      const result = [];
      for (let i = 0; i < finalGroup.count; i++) {
        result.push(...finalGroup.pattern);
      }
      return result.map((x) => x === 1);
    }
    /**
     * Get loops as JMON tracks (already in JMON format)
     */
    toJMonSequences() {
      return Object.values(this.loops);
    }
    /**
     * Simple plotting method matching Python implementation
     */
    async plot(pulse = 1 / 4, colors = null, options = {}) {
      const { LoopVisualizer: LoopVisualizer2 } = await Promise.resolve().then(() => (init_LoopVisualizer(), LoopVisualizer_exports));
      return LoopVisualizer2.plotLoops(
        this.loops,
        this.measureLength,
        pulse,
        colors,
        options
      );
    }
  };

  // src/algorithms/analysis/MusicalIndex.js
  var MusicalIndex = class {
    /**
     * Create a musical index analyzer for a sequence
     * @param {Array} sequence - Array of musical values (pitches, durations, etc.)
     */
    constructor(sequence) {
      this.sequence = sequence.filter((val) => val !== null && val !== void 0);
      this.originalSequence = sequence;
    }
    /**
     * Calculate Gini coefficient (measure of inequality/diversity)
     * 0 = perfect equality, 1 = maximum inequality
     * @returns {number} Gini coefficient
     */
    gini() {
      if (this.sequence.length === 0) return 0;
      const sorted = [...this.sequence].sort((a, b) => a - b);
      const n = sorted.length;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += (2 * (i + 1) - n - 1) * sorted[i];
      }
      const totalSum = sorted.reduce((acc, val) => acc + val, 0);
      return totalSum === 0 ? 0 : sum / (n * totalSum);
    }
    /**
     * Calculate balance (measure of how evenly distributed values are around the mean)
     * Lower values indicate better balance around the center
     * @returns {number} Balance metric
     */
    balance() {
      if (this.sequence.length === 0) return 0;
      const mean = this.sequence.reduce((sum, val) => sum + val, 0) / this.sequence.length;
      const variance = this.sequence.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.sequence.length;
      return mean === 0 ? 0 : Math.sqrt(variance) / Math.abs(mean);
    }
    /**
     * Calculate motif strength (measure of repetitive patterns)
     * Higher values indicate stronger motif presence
     * @param {number} maxMotifLength - Maximum motif length to consider
     * @returns {number} Motif strength
     */
    motif(maxMotifLength = 4) {
      if (this.sequence.length < 2) return 0;
      const motifCounts = /* @__PURE__ */ new Map();
      let totalMotifs = 0;
      for (let length = 2; length <= Math.min(maxMotifLength, this.sequence.length); length++) {
        for (let i = 0; i <= this.sequence.length - length; i++) {
          const motif = this.sequence.slice(i, i + length).join(",");
          motifCounts.set(motif, (motifCounts.get(motif) || 0) + 1);
          totalMotifs++;
        }
      }
      let motifStrength = 0;
      for (const count of motifCounts.values()) {
        if (count > 1) {
          motifStrength += count * count;
        }
      }
      return totalMotifs === 0 ? 0 : motifStrength / totalMotifs;
    }
    /**
     * Calculate dissonance relative to a musical scale
     * 0 = all notes in scale, higher values = more dissonance
     * @param {Array} scale - Array of pitches considered consonant
     * @returns {number} Dissonance level
     */
    dissonance(scale) {
      if (!scale || scale.length === 0 || this.sequence.length === 0) return 0;
      const scaleClasses = new Set(scale.map((pitch) => pitch % 12));
      let dissonantNotes = 0;
      for (const pitch of this.sequence) {
        if (pitch !== null && pitch !== void 0) {
          const pitchClass = pitch % 12;
          if (!scaleClasses.has(pitchClass)) {
            dissonantNotes++;
          }
        }
      }
      return dissonantNotes / this.sequence.length;
    }
    /**
     * Calculate rhythmic fitness (how well durations fit within measure boundaries)
     * 1 = perfect fit, lower values = poor rhythmic alignment
     * @param {number} measureLength - Length of a measure in beats
     * @returns {number} Rhythmic fitness
     */
    rhythmic(measureLength = 4) {
      if (this.sequence.length === 0) return 0;
      let currentBeat = 0;
      let rhythmicErrors = 0;
      const totalDuration = this.sequence.reduce(
        (sum, duration) => sum + duration,
        0
      );
      for (const duration of this.sequence) {
        const nextBeat = currentBeat + duration;
        const currentMeasure = Math.floor(currentBeat / measureLength);
        const nextMeasure = Math.floor(nextBeat / measureLength);
        if (currentMeasure !== nextMeasure) {
          const remainingInMeasure = measureLength - currentBeat % measureLength;
          if (remainingInMeasure < duration && remainingInMeasure > 0) {
            rhythmicErrors += Math.min(
              remainingInMeasure,
              duration - remainingInMeasure
            );
          }
        }
        currentBeat = nextBeat;
      }
      return totalDuration === 0 ? 0 : 1 - rhythmicErrors / totalDuration;
    }
    /**
     * Calculate proportion of rests in the sequence
     * @returns {number} Proportion of rests (0-1)
     */
    restProportion() {
      if (this.originalSequence.length === 0) return 0;
      const restCount = this.originalSequence.filter((val) => val === null || val === void 0).length;
      return restCount / this.originalSequence.length;
    }
    /**
     * Calculate all metrics at once for efficiency
     * @param {Array} scale - Musical scale for dissonance calculation
     * @param {number} measureLength - Measure length for rhythmic analysis
     * @returns {Object} All calculated metrics
     */
    calculateAll(scale = null, measureLength = 4) {
      return {
        gini: this.gini(),
        balance: this.balance(),
        motif: this.motif(),
        dissonance: scale ? this.dissonance(scale) : 0,
        rhythmic: this.rhythmic(measureLength),
        rest: this.restProportion()
      };
    }
    /**
     * Calculate statistical properties of the sequence
     * @returns {Object} Statistical properties
     */
    getStats() {
      if (this.sequence.length === 0) {
        return { mean: 0, std: 0, min: 0, max: 0, range: 0 };
      }
      const mean = this.sequence.reduce((sum, val) => sum + val, 0) / this.sequence.length;
      const variance = this.sequence.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.sequence.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...this.sequence);
      const max = Math.max(...this.sequence);
      return {
        mean,
        std,
        min,
        max,
        range: max - min
      };
    }
    /**
     * Compare two sequences and return similarity score
     * @param {MusicalIndex} other - Another MusicalIndex to compare with
     * @param {Array} scale - Scale for dissonance comparison
     * @param {number} measureLength - Measure length for rhythmic comparison
     * @returns {number} Similarity score (0-1, higher is more similar)
     */
    similarity(other, scale = null, measureLength = 4) {
      const metrics1 = this.calculateAll(scale, measureLength);
      const metrics2 = other.calculateAll(scale, measureLength);
      let totalSimilarity = 0;
      let count = 0;
      for (const [key, value1] of Object.entries(metrics1)) {
        const value2 = metrics2[key];
        if (typeof value1 === "number" && typeof value2 === "number") {
          const maxVal = Math.max(Math.abs(value1), Math.abs(value2), 1);
          const similarity = 1 - Math.abs(value1 - value2) / maxVal;
          totalSimilarity += similarity;
          count++;
        }
      }
      return count === 0 ? 0 : totalSimilarity / count;
    }
  };

  // src/algorithms/generative/genetic/Darwin.js
  var Darwin = class {
    /**
     * Initialize the Darwin genetic algorithm
     * @param {Object} config - Configuration object
     */
    constructor(config = {}) {
      const {
        initialPhrases = [],
        mutationRate = 0.05,
        populationSize = 50,
        mutationProbabilities = null,
        scale = null,
        measureLength = 4,
        timeResolution = [0.125, 4],
        weights = null,
        targets = null,
        seed = null
      } = config;
      this.initialPhrases = initialPhrases;
      this.mutationRate = mutationRate;
      this.populationSize = populationSize;
      this.scale = scale;
      this.measureLength = measureLength;
      this.timeResolution = timeResolution;
      if (seed !== null) {
        this.seed = seed;
        this.randomState = this.createSeededRandom(seed);
      } else {
        this.randomState = Math;
      }
      const allDurations = [0.125, 0.25, 0.5, 1, 2, 3, 4, 8];
      this.possibleDurations = allDurations.filter(
        (d) => d >= timeResolution[0] && d <= Math.min(timeResolution[1], measureLength)
      );
      this.mutationProbabilities = mutationProbabilities || {
        pitch: () => {
          if (this.scale && this.scale.length > 0) {
            const idx = Math.floor(this.randomState.random() * this.scale.length);
            return Math.max(0, Math.min(127, this.scale[idx]));
          }
          return Math.max(0, Math.min(127, Math.floor(this.gaussianRandom(60, 5))));
        },
        duration: () => {
          const weights2 = this.possibleDurations.map((_, i) => Math.pow(2, -i));
          return this.weightedChoice(this.possibleDurations, weights2);
        },
        rest: () => {
          return this.randomState.random() < 0.02 ? null : 1;
        }
      };
      this.weights = weights || {
        gini: [1, 1, 0],
        // [pitch, duration, offset]
        balance: [1, 1, 0],
        motif: [10, 1, 0],
        dissonance: [1, 0, 0],
        rhythmic: [0, 10, 0],
        rest: [1, 0, 0]
      };
      this.targets = targets || {
        gini: [0.05, 0.5, 0],
        balance: [0.1, 0.1, 0],
        motif: [1, 1, 0],
        dissonance: [0, 0, 0],
        rhythmic: [0, 1, 0],
        rest: [0, 0, 0]
      };
      this.population = this.initializePopulation();
      this.bestIndividuals = [];
      this.bestScores = [];
      this.generationCount = 0;
    }
    /**
     * Create a seeded random number generator
     * @param {number} seed - Random seed
     * @returns {Object} Random number generator with seeded methods
     */
    createSeededRandom(seed) {
      let currentSeed = seed;
      const random = () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
      };
      return {
        random,
        choice: (array) => array[Math.floor(random() * array.length)],
        sample: (array, n) => {
          const result = [];
          const shuffled = [...array].sort(() => random() - 0.5);
          return shuffled.slice(0, n);
        }
      };
    }
    /**
     * Generate Gaussian random number using Box-Muller transform
     * @param {number} mean - Mean of distribution
     * @param {number} stdDev - Standard deviation
     * @returns {number} Gaussian random number
     */
    gaussianRandom(mean = 0, stdDev = 1) {
      if (this.gaussianSpare !== void 0) {
        const spare = this.gaussianSpare;
        this.gaussianSpare = void 0;
        return mean + stdDev * spare;
      }
      const u1 = this.randomState.random();
      const u2 = this.randomState.random();
      const mag = stdDev * Math.sqrt(-2 * Math.log(u1));
      this.gaussianSpare = mag * Math.cos(2 * Math.PI * u2);
      return mean + mag * Math.sin(2 * Math.PI * u2);
    }
    /**
     * Choose random element from array with weights
     * @param {Array} choices - Array of choices
     * @param {Array} weights - Array of weights
     * @returns {*} Weighted random choice
     */
    weightedChoice(choices, weights) {
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let random = this.randomState.random() * totalWeight;
      for (let i = 0; i < choices.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return choices[i];
        }
      }
      return choices[choices.length - 1];
    }
    /**
     * Initialize population by mutating initial phrases
     * @returns {Array} Initial population
     */
    initializePopulation() {
      const population = [];
      const phrasesPerInitial = Math.floor(this.populationSize / this.initialPhrases.length);
      for (const phrase of this.initialPhrases) {
        for (let i = 0; i < phrasesPerInitial; i++) {
          population.push(this.mutate(phrase, 0));
        }
      }
      while (population.length < this.populationSize) {
        const randomPhrase = this.initialPhrases[Math.floor(Math.random() * this.initialPhrases.length)];
        population.push(this.mutate(randomPhrase, 0));
      }
      return population;
    }
    /**
     * Calculate fitness components for a musical phrase
     * @param {Array} phrase - Musical phrase as [pitch, duration, offset] tuples
     * @returns {Object} Fitness components
     */
    calculateFitnessComponents(phrase) {
      if (phrase.length === 0) return {};
      const pitches = phrase.map((note) => note[0]);
      const durations = phrase.map((note) => note[1]);
      const offsets = phrase.map((note) => note[2]);
      const fitnessComponents = {};
      if (pitches.length > 0) {
        const pitchIndex = new MusicalIndex(pitches);
        fitnessComponents.gini_pitch = pitchIndex.gini();
        fitnessComponents.balance_pitch = pitchIndex.balance();
        fitnessComponents.motif_pitch = pitchIndex.motif();
        if (this.scale) {
          fitnessComponents.dissonance_pitch = pitchIndex.dissonance(this.scale);
        }
      }
      if (durations.length > 0) {
        const durationIndex = new MusicalIndex(durations);
        fitnessComponents.gini_duration = durationIndex.gini();
        fitnessComponents.balance_duration = durationIndex.balance();
        fitnessComponents.motif_duration = durationIndex.motif();
        fitnessComponents.rhythmic = durationIndex.rhythmic(this.measureLength);
      }
      if (offsets.length > 0) {
        const offsetIndex = new MusicalIndex(offsets);
        fitnessComponents.gini_offset = offsetIndex.gini();
        fitnessComponents.balance_offset = offsetIndex.balance();
        fitnessComponents.motif_offset = offsetIndex.motif();
      }
      const restProportion = pitches.filter((p) => p === null || p === void 0).length / pitches.length;
      fitnessComponents.rest = restProportion;
      return fitnessComponents;
    }
    /**
     * Calculate fitness score for a musical phrase
     * @param {Array} phrase - Musical phrase
     * @returns {number} Fitness score
     */
    fitness(phrase) {
      const components = this.calculateFitnessComponents(phrase);
      let fitnessScore = 0;
      for (const [metric, targets] of Object.entries(this.targets)) {
        const weights = this.weights[metric];
        for (let i = 0; i < 3; i++) {
          const componentKey = i === 0 ? `${metric}_pitch` : i === 1 ? `${metric}_duration` : `${metric}_offset`;
          const actualValue = components[componentKey] || 0;
          const targetValue = targets[i];
          const weight = weights[i];
          if (weight > 0 && targetValue !== void 0) {
            const maxVal = Math.max(Math.abs(targetValue), 1);
            const similarity = 1 - Math.abs(actualValue - targetValue) / maxVal;
            fitnessScore += Math.max(0, similarity) * weight;
          }
        }
      }
      if (this.weights.rest[0] > 0) {
        const actualRest = components.rest || 0;
        const targetRest = this.targets.rest[0];
        const similarity = 1 - Math.abs(actualRest - targetRest) / Math.max(targetRest, 1);
        fitnessScore += Math.max(0, similarity) * this.weights.rest[0];
      }
      return fitnessScore;
    }
    /**
     * Mutate a musical phrase
     * @param {Array} phrase - Original phrase
     * @param {number} rate - Mutation rate (null to use default)
     * @returns {Array} Mutated phrase
     */
    mutate(phrase, rate = null) {
      if (rate === null) rate = this.mutationRate;
      const newPhrase = [];
      let totalOffset = 0;
      for (const note of phrase) {
        let [pitch, duration, offset] = note;
        if (this.randomState.random() < rate) {
          pitch = this.mutationProbabilities.pitch();
        }
        if (this.randomState.random() < rate) {
          duration = this.mutationProbabilities.duration();
        }
        if (this.randomState.random() < rate) {
          const restResult = this.mutationProbabilities.rest();
          if (restResult === null) {
            pitch = null;
          }
        }
        const newOffset = totalOffset;
        totalOffset += duration;
        newPhrase.push([pitch, duration, newOffset]);
      }
      return newPhrase;
    }
    /**
     * Select top performers from population
     * @param {number} k - Number of individuals to select
     * @returns {Array} Selected phrases
     */
    select(k = 25) {
      const fitnessScores = this.population.map((phrase) => ({
        phrase,
        fitness: this.fitness(phrase)
      }));
      fitnessScores.sort((a, b) => b.fitness - a.fitness);
      return fitnessScores.slice(0, k).map((item) => item.phrase);
    }
    /**
     * Crossover (breed) two parent phrases
     * @param {Array} parent1 - First parent phrase
     * @param {Array} parent2 - Second parent phrase
     * @returns {Array} Child phrase
     */
    crossover(parent1, parent2) {
      if (parent1.length === 0 || parent2.length === 0) {
        return parent1.length > 0 ? [...parent1] : [...parent2];
      }
      const minLength = Math.min(parent1.length, parent2.length);
      const cut1 = Math.floor(this.randomState.random() * minLength);
      const cut2 = Math.floor(this.randomState.random() * minLength);
      const [start, end] = [Math.min(cut1, cut2), Math.max(cut1, cut2)];
      const child = [];
      for (let i = 0; i < start; i++) {
        if (i < parent1.length) {
          child.push([...parent1[i]]);
        }
      }
      for (let i = start; i < end; i++) {
        if (i < parent2.length) {
          child.push([...parent2[i]]);
        }
      }
      for (let i = end; i < Math.max(parent1.length, parent2.length); i++) {
        if (i < parent1.length) {
          child.push([...parent1[i]]);
        } else if (i < parent2.length) {
          child.push([...parent2[i]]);
        }
      }
      let totalOffset = 0;
      for (let i = 0; i < child.length; i++) {
        child[i][2] = totalOffset;
        totalOffset += child[i][1];
      }
      return child;
    }
    /**
     * Evolve the population for one generation
     * @param {number} k - Number of parents to select
     * @param {number} restRate - Rate for introducing rests (unused, kept for compatibility)
     * @returns {Object} Evolution statistics
     */
    evolve(k = 25) {
      const selectedParents = this.select(k);
      const bestFitness = this.fitness(selectedParents[0]);
      this.bestIndividuals.push([...selectedParents[0]]);
      this.bestScores.push(bestFitness);
      const newPopulation = [];
      while (newPopulation.length < this.populationSize) {
        const parent1 = selectedParents[Math.floor(Math.random() * selectedParents.length)];
        const parent2 = selectedParents[Math.floor(Math.random() * selectedParents.length)];
        const child = this.crossover([...parent1], [...parent2]);
        const mutatedChild = this.mutate(child);
        newPopulation.push(mutatedChild);
      }
      this.population = newPopulation;
      this.generationCount++;
      return {
        generation: this.generationCount,
        bestFitness,
        averageFitness: selectedParents.reduce((sum, phrase) => sum + this.fitness(phrase), 0) / selectedParents.length,
        populationSize: this.populationSize
      };
    }
    /**
     * Evolve for multiple generations
     * @param {Object} options - Configuration object
     * @param {number} options.generations - Number of generations to evolve
     * @param {number} [options.k=25] - Number of parents per generation
     * @param {Function} [options.callback=null] - Optional callback for progress updates
     * @returns {Array} Array of evolution statistics
     */
    evolveGenerations({ generations, k = 25, callback = null }) {
      const stats = [];
      for (let i = 0; i < generations; i++) {
        const generationStats = this.evolve(k);
        stats.push(generationStats);
        if (callback) {
          callback(generationStats, i, generations);
        }
      }
      return stats;
    }
    /**
     * Get the current best individual
     * @returns {Array} Best musical phrase
     */
    getBestIndividual() {
      return this.bestIndividuals.length > 0 ? [...this.bestIndividuals[this.bestIndividuals.length - 1]] : null;
    }
    /**
     * Get evolution history
     * @returns {Object} Evolution history with individuals and scores
     */
    getEvolutionHistory() {
      return {
        individuals: this.bestIndividuals.map((ind) => [...ind]),
        scores: [...this.bestScores],
        generations: this.generationCount
      };
    }
    /**
     * Reset the evolution state
     */
    reset() {
      this.population = this.initializePopulation();
      this.bestIndividuals = [];
      this.bestScores = [];
      this.generationCount = 0;
    }
    /**
     * Get population statistics
     * @returns {Object} Population statistics
     */
    getPopulationStats() {
      const fitnessValues = this.population.map((phrase) => this.fitness(phrase));
      const mean = fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length;
      const variance = fitnessValues.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / fitnessValues.length;
      return {
        populationSize: this.population.length,
        meanFitness: mean,
        standardDeviation: Math.sqrt(variance),
        minFitness: Math.min(...fitnessValues),
        maxFitness: Math.max(...fitnessValues),
        generation: this.generationCount
      };
    }
  };

  // src/algorithms/utils/jmon-timing.js
  var DEFAULT_TIMING_CONFIG = {
    timeSignature: [4, 4],
    // 4/4 time
    ticksPerQuarterNote: 480,
    // Standard MIDI resolution
    beatsPerBar: 4
    // Derived from time signature
  };
  function offsetToBarsBeatsTicks(offsetInBeats, config = DEFAULT_TIMING_CONFIG) {
    const { timeSignature, ticksPerQuarterNote } = config;
    const [numerator, denominator] = timeSignature;
    const beatsPerBar = numerator * 4 / denominator;
    const bars = Math.floor(offsetInBeats / beatsPerBar);
    const remainingBeats = offsetInBeats % beatsPerBar;
    const beats = Math.floor(remainingBeats);
    const fractionalBeat = remainingBeats - beats;
    const ticks = Math.round(fractionalBeat * ticksPerQuarterNote);
    return `${bars}:${beats}:${ticks}`;
  }
  function barsBeatsTicksToOffset(barsBeatsTicks, config = DEFAULT_TIMING_CONFIG) {
    const { timeSignature, ticksPerQuarterNote } = config;
    const [numerator, denominator] = timeSignature;
    const parts = barsBeatsTicks.split(":");
    if (parts.length !== 3) {
      throw new Error(`Invalid bars:beats:ticks format: ${barsBeatsTicks}`);
    }
    const bars = parseInt(parts[0], 10);
    const beats = parseFloat(parts[1]);
    const ticks = parseInt(parts[2], 10);
    if (isNaN(bars) || isNaN(beats) || isNaN(ticks)) {
      throw new Error(`Invalid numeric values in bars:beats:ticks: ${barsBeatsTicks}`);
    }
    const beatsPerBar = numerator * 4 / denominator;
    const totalBeats = bars * beatsPerBar + beats + ticks / ticksPerQuarterNote;
    return totalBeats;
  }
  function sequenceToJMONTiming(sequence, config = DEFAULT_TIMING_CONFIG, keepNumericDuration = true) {
    return sequence.map((note) => {
      const jmonNote = { ...note };
      if (note.offset !== void 0) {
        jmonNote.time = note.offset;
        delete jmonNote.offset;
      }
      if (typeof note.time === "string" && note.time.includes(":")) {
        jmonNote.time = barsBeatsTicksToOffset(note.time, config);
      }
      if (typeof note.duration === "number" && !keepNumericDuration) {
        const duration = note.duration;
        if (duration === 1) jmonNote.duration = "4n";
        else if (duration === 0.5) jmonNote.duration = "8n";
        else if (duration === 0.25) jmonNote.duration = "16n";
        else if (duration === 2) jmonNote.duration = "2n";
        else if (duration === 4) jmonNote.duration = "1n";
      }
      return jmonNote;
    });
  }
  function notesToTrack(notes, options = {}) {
    const {
      label = "track",
      midiChannel = 0,
      synth = { type: "Synth" },
      timingConfig = DEFAULT_TIMING_CONFIG,
      keepNumericDuration = true
      // Default to numeric for MIDI consistency
    } = options;
    const jmonNotes = sequenceToJMONTiming(notes, timingConfig, keepNumericDuration);
    return {
      label,
      midiChannel,
      synth,
      notes: jmonNotes
    };
  }

  // src/algorithms/generative/walks/RandomWalk.js
  var RandomWalk = class {
    options;
    walkers;
    history;
    constructor(options = {}) {
      this.options = {
        length: options.length || 100,
        dimensions: options.dimensions || 1,
        stepSize: options.stepSize || 1,
        bounds: options.bounds || [-100, 100],
        branchProbability: options.branchProbability || 0.05,
        mergeProbability: options.mergeProbability || 0.02,
        attractorStrength: options.attractorStrength || 0,
        attractorPosition: options.attractorPosition || Array(options.dimensions || 1).fill(0)
      };
      this.walkers = [];
      this.history = [];
    }
    /**
     * Generate random walk sequence
     */
    generate(startPosition) {
      this.initialize(startPosition);
      this.history = [];
      for (let step = 0; step < this.options.length; step++) {
        this.updateWalkers();
        this.recordState();
        this.handleBranching();
        this.handleMerging();
      }
      return this.history;
    }
    /**
     * Initialize walker(s)
     */
    initialize(startPosition) {
      const initialPosition = startPosition || Array(this.options.dimensions).fill(0);
      this.walkers = [{
        position: [...initialPosition],
        velocity: Array(this.options.dimensions).fill(0),
        branches: [],
        age: 0,
        active: true
      }];
    }
    /**
     * Update all active walkers
     */
    updateWalkers() {
      for (const walker of this.walkers) {
        if (!walker.active) continue;
        for (let dim = 0; dim < this.options.dimensions; dim++) {
          const randomStep = (Math.random() - 0.5) * 2 * this.options.stepSize;
          let attractorForce = 0;
          if (this.options.attractorStrength > 0) {
            const distance = walker.position[dim] - this.options.attractorPosition[dim];
            attractorForce = -this.options.attractorStrength * distance;
          }
          walker.velocity[dim] = walker.velocity[dim] * 0.9 + randomStep + attractorForce;
          walker.position[dim] += walker.velocity[dim];
          if (walker.position[dim] < this.options.bounds[0]) {
            walker.position[dim] = this.options.bounds[0];
            walker.velocity[dim] *= -0.5;
          } else if (walker.position[dim] > this.options.bounds[1]) {
            walker.position[dim] = this.options.bounds[1];
            walker.velocity[dim] *= -0.5;
          }
        }
        walker.age++;
      }
    }
    /**
     * Record current state of all walkers
     */
    recordState() {
      const activeWalkers = this.walkers.filter((w) => w.active);
      if (activeWalkers.length > 0) {
        const avgPosition = Array(this.options.dimensions).fill(0);
        for (const walker of activeWalkers) {
          for (let dim = 0; dim < this.options.dimensions; dim++) {
            avgPosition[dim] += walker.position[dim];
          }
        }
        for (let dim = 0; dim < this.options.dimensions; dim++) {
          avgPosition[dim] /= activeWalkers.length;
        }
        this.history.push([...avgPosition]);
      }
    }
    /**
     * Handle branching (walker splitting)
     */
    handleBranching() {
      const newBranches = [];
      for (const walker of this.walkers) {
        if (!walker.active) continue;
        if (Math.random() < this.options.branchProbability) {
          const branch = {
            position: [...walker.position],
            velocity: walker.velocity.map((v) => v + (Math.random() - 0.5) * this.options.stepSize),
            branches: [],
            age: 0,
            active: true
          };
          newBranches.push(branch);
          walker.branches.push(branch);
        }
      }
      this.walkers.push(...newBranches);
    }
    /**
     * Handle merging (walker combining)
     */
    handleMerging() {
      if (this.walkers.length <= 1) return;
      const activeWalkers = this.walkers.filter((w) => w.active);
      const mergeThreshold = this.options.stepSize * 2;
      for (let i = 0; i < activeWalkers.length; i++) {
        for (let j = i + 1; j < activeWalkers.length; j++) {
          if (Math.random() < this.options.mergeProbability) {
            const distance = this.calculateDistance(activeWalkers[i].position, activeWalkers[j].position);
            if (distance < mergeThreshold) {
              for (let dim = 0; dim < this.options.dimensions; dim++) {
                activeWalkers[i].position[dim] = (activeWalkers[i].position[dim] + activeWalkers[j].position[dim]) / 2;
                activeWalkers[i].velocity[dim] = (activeWalkers[i].velocity[dim] + activeWalkers[j].velocity[dim]) / 2;
              }
              activeWalkers[j].active = false;
            }
          }
        }
      }
      this.walkers = this.walkers.filter((w) => w.active);
    }
    /**
     * Calculate Euclidean distance between two positions
     */
    calculateDistance(pos1, pos2) {
      let sum = 0;
      for (let i = 0; i < pos1.length; i++) {
        sum += Math.pow(pos1[i] - pos2[i], 2);
      }
      return Math.sqrt(sum);
    }
    /**
     * Get 1D projection of multi-dimensional walk
     */
    getProjection(dimension = 0) {
      return this.history.map((state) => state[dimension] || 0);
    }
    /**
     * Map walk to musical scale
     */
    mapToScale(dimension = 0, scale = [0, 2, 4, 5, 7, 9, 11], octaveRange = 3) {
      const projection = this.getProjection(dimension);
      if (projection.length === 0) return [];
      const minVal = Math.min(...projection);
      const maxVal = Math.max(...projection);
      const range = maxVal - minVal || 1;
      return projection.map((value) => {
        const normalized = (value - minVal) / range;
        const scaleIndex = Math.floor(normalized * scale.length * octaveRange);
        const octave = Math.floor(scaleIndex / scale.length);
        const noteIndex = scaleIndex % scale.length;
        return 60 + octave * 12 + scale[noteIndex];
      });
    }
    /**
     * Map walk to rhythmic durations
     */
    mapToRhythm(dimension = 0, durations = [0.25, 0.5, 1, 2]) {
      const projection = this.getProjection(dimension);
      if (projection.length === 0) return [];
      const minVal = Math.min(...projection);
      const maxVal = Math.max(...projection);
      const range = maxVal - minVal || 1;
      return projection.map((value) => {
        const normalized = (value - minVal) / range;
        const durationIndex = Math.floor(normalized * durations.length);
        const clampedIndex = Math.max(0, Math.min(durationIndex, durations.length - 1));
        return durations[clampedIndex];
      });
    }
    /**
     * Map walk to velocities
     */
    mapToVelocity(dimension = 0, minVel = 0.3, maxVel = 1) {
      const projection = this.getProjection(dimension);
      if (projection.length === 0) return [];
      const minVal = Math.min(...projection);
      const maxVal = Math.max(...projection);
      const range = maxVal - minVal || 1;
      return projection.map((value) => {
        const normalized = (value - minVal) / range;
        return minVel + normalized * (maxVel - minVel);
      });
    }
    /**
     * Generate correlated walk (walk that follows another walk with some correlation)
     */
    generateCorrelated(targetWalk, correlation = 0.5, dimension = 0) {
      if (targetWalk.length === 0) return [];
      const correlatedWalk = [];
      let position = 0;
      for (let i = 0; i < targetWalk.length; i++) {
        const randomStep = (Math.random() - 0.5) * 2 * this.options.stepSize;
        const correlatedStep = correlation * (targetWalk[i] - position);
        position += randomStep + correlatedStep;
        position = Math.max(this.options.bounds[0], Math.min(this.options.bounds[1], position));
        correlatedWalk.push(position);
      }
      return correlatedWalk;
    }
    /**
     * Analyze walk properties
     */
    analyze() {
      if (this.history.length < 2) {
        return {
          meanDisplacement: 0,
          meanSquaredDisplacement: 0,
          totalDistance: 0,
          fractalDimension: 0
        };
      }
      const projection = this.getProjection(0);
      const startPos = projection[0];
      const endPos = projection[projection.length - 1];
      const meanDisplacement = Math.abs(endPos - startPos);
      const squaredDisplacements = projection.map((pos) => Math.pow(pos - startPos, 2));
      const meanSquaredDisplacement = squaredDisplacements.reduce((sum, sq) => sum + sq, 0) / squaredDisplacements.length;
      let totalDistance = 0;
      for (let i = 1; i < projection.length; i++) {
        totalDistance += Math.abs(projection[i] - projection[i - 1]);
      }
      const fractalDimension = totalDistance > 0 ? Math.log(totalDistance) / Math.log(projection.length) : 0;
      return {
        meanDisplacement,
        meanSquaredDisplacement,
        totalDistance,
        fractalDimension
      };
    }
    /**
     * Get current walker states
     */
    getWalkerStates() {
      return this.walkers.map((walker) => ({ ...walker }));
    }
    /**
     * Reset the walk generator
     */
    reset() {
      this.walkers = [];
      this.history = [];
    }
    /**
     * Convert walk to JMON notes
     * @param {Array} durations - Duration sequence
     * @param {Object} options - Conversion options
     * @returns {Array} JMON note objects
     */
    toJmonNotes(durations = [1], options = {}) {
      const {
        useStringTime = false,
        timingConfig = DEFAULT_TIMING_CONFIG,
        dimension = 0,
        mapToScale = null,
        scaleRange = [60, 72]
      } = options;
      const projection = this.getProjection(dimension);
      const notes = [];
      let currentTime = 0;
      for (let i = 0; i < projection.length; i++) {
        const duration = durations[i % durations.length];
        let pitch = projection[i];
        if (mapToScale) {
          const minVal = Math.min(...projection);
          const maxVal = Math.max(...projection);
          const range = maxVal - minVal || 1;
          const normalized = (pitch - minVal) / range;
          const scaleIndex = Math.floor(normalized * mapToScale.length);
          const clampedIndex = Math.max(0, Math.min(scaleIndex, mapToScale.length - 1));
          pitch = mapToScale[clampedIndex];
        } else {
          const scaledWalk = this.mapToScale([projection], mapToScale || [60, 62, 64, 65, 67, 69, 71]);
          pitch = scaledWalk[0][i];
        }
        notes.push({
          pitch,
          duration,
          time: useStringTime ? offsetToBarsBeatsTicks(currentTime, timingConfig) : currentTime
        });
        currentTime += duration;
      }
      return notes;
    }
    /**
     * Generate JMON track directly from walk
     * @param {Array} startPosition - Starting position
     * @param {Array} durations - Duration sequence
     * @param {Object} options - Generation and conversion options
     * @param {Object} trackOptions - Track options
     * @returns {Object} JMON track
     */
    generateTrack(startPosition, durations = [1], options = {}, trackOptions = {}) {
      this.generate(startPosition);
      const notes = this.toJmonNotes(durations, options);
      return notesToTrack(notes, {
        label: "random-walk",
        midiChannel: 0,
        synth: { type: "Synth" },
        ...trackOptions
      });
    }
  };

  // src/algorithms/generative/walks/Chain.js
  var Chain = class {
    walkRange;
    walkStart;
    walkProbability;
    roundTo;
    branchingProbability;
    mergingProbability;
    timingConfig;
    constructor(options = {}) {
      this.walkRange = options.walkRange || null;
      this.walkStart = options.walkStart !== void 0 ? options.walkStart : this.walkRange ? Math.floor((this.walkRange[1] - this.walkRange[0]) / 2) + this.walkRange[0] : 0;
      this.walkProbability = options.walkProbability || [-1, 0, 1];
      this.roundTo = options.roundTo !== void 0 ? options.roundTo : null;
      this.branchingProbability = options.branchingProbability || 0;
      this.mergingProbability = options.mergingProbability || 0;
      this.timingConfig = options.timingConfig || DEFAULT_TIMING_CONFIG;
    }
    /**
     * Generate random walk sequence(s) with branching and merging
     * @param {number} length - Length of the walk
     * @param {number} seed - Random seed for reproducibility
     * @returns {Array<Array>} Array of walk sequences (branches)
     */
    generate(length, seed) {
      let randomFunc = Math.random;
      if (seed !== void 0) {
        randomFunc = this.createSeededRandom(seed);
      }
      const walks = [this.initializeWalk(length)];
      let currentPositions = [this.walkStart];
      for (let step = 1; step < length; step++) {
        const newPositions = [...currentPositions];
        const newWalks = [];
        for (let walkIndex = 0; walkIndex < currentPositions.length; walkIndex++) {
          const walk = walks[walkIndex];
          const currentPosition = currentPositions[walkIndex];
          if (currentPosition === null) {
            if (walk) walk[step] = null;
            continue;
          }
          const stepSize = this.generateStep(randomFunc);
          let nextPosition = currentPosition + stepSize;
          if (isNaN(nextPosition)) {
            nextPosition = currentPosition;
          }
          if (this.walkRange !== null) {
            if (nextPosition < this.walkRange[0]) {
              nextPosition = this.walkRange[0];
            } else if (nextPosition > this.walkRange[1]) {
              nextPosition = this.walkRange[1];
            }
          }
          if (isNaN(nextPosition)) {
            nextPosition = this.walkStart;
          }
          if (walk) {
            walk[step] = nextPosition;
          }
          newPositions[walkIndex] = nextPosition;
          if (randomFunc() < this.branchingProbability) {
            const newWalk = this.createBranch(walks[walkIndex], step);
            const branchStepSize = this.generateStep(randomFunc);
            let branchPosition = currentPosition + branchStepSize;
            if (isNaN(branchPosition)) {
              branchPosition = currentPosition;
            }
            if (this.walkRange !== null) {
              if (branchPosition < this.walkRange[0]) {
                branchPosition = this.walkRange[0];
              } else if (branchPosition > this.walkRange[1]) {
                branchPosition = this.walkRange[1];
              }
            }
            if (isNaN(branchPosition)) {
              branchPosition = this.walkStart;
            }
            newWalk[step] = branchPosition;
            newWalks.push(newWalk);
            newPositions.push(branchPosition);
          }
        }
        walks.push(...newWalks);
        currentPositions = newPositions;
        currentPositions = this.handleMerging(walks, currentPositions, step, randomFunc);
      }
      return walks;
    }
    /**
     * Generate a single step according to the probability distribution
     */
    generateStep(randomFunc = Math.random) {
      if (Array.isArray(this.walkProbability)) {
        return this.walkProbability[Math.floor(randomFunc() * this.walkProbability.length)];
      }
      if (typeof this.walkProbability === "object" && this.walkProbability.mean !== void 0 && this.walkProbability.std !== void 0) {
        let step = this.generateNormal(this.walkProbability.mean, this.walkProbability.std, randomFunc);
        if (this.roundTo !== null) {
          step = parseFloat(step.toFixed(this.roundTo));
        }
        return step;
      }
      return [-1, 0, 1][Math.floor(randomFunc() * 3)];
    }
    /**
     * Generate a sample from normal distribution
     */
    generateNormal(mean, std, randomFunc = Math.random) {
      let u1;
      do {
        u1 = randomFunc();
      } while (u1 === 0);
      const u2 = randomFunc();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const result = mean + std * z;
      if (isNaN(result)) {
        return mean;
      }
      return result;
    }
    /**
     * Initialize a new walk with null values
     */
    initializeWalk(length) {
      const walk = new Array(length);
      walk[0] = this.walkStart;
      for (let i = 1; i < length; i++) {
        walk[i] = null;
      }
      return walk;
    }
    /**
     * Create a branch from an existing walk
     */
    createBranch(parentWalk, branchStep) {
      const branch = new Array(parentWalk.length);
      for (let i = 0; i < branchStep; i++) {
        branch[i] = null;
      }
      for (let i = branchStep; i < branch.length; i++) {
        branch[i] = null;
      }
      return branch;
    }
    /**
     * Handle merging of walks that collide
     */
    handleMerging(walks, positions, step, randomFunc = Math.random) {
      const newPositions = [...positions];
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] === null) continue;
        for (let j = i + 1; j < positions.length; j++) {
          if (positions[j] === null) continue;
          const tolerance = this.roundTo !== null ? this.roundTo : 1e-3;
          if (Math.abs(positions[i] - positions[j]) <= tolerance && randomFunc() < this.mergingProbability) {
            newPositions[j] = null;
            if (walks[j]) {
              for (let k = step; k < walks[j].length; k++) {
                walks[j][k] = null;
              }
            }
          }
        }
      }
      return newPositions;
    }
    /**
     * Convert walk sequences to JMON notes
     * @param {Array<Array>} walks - Walk sequences
     * @param {Array} durations - Duration sequence to map to
     * @param {Object} options - Conversion options
     * @returns {Array} JMON note objects
     */
    toJmonNotes(walks, durations = [1], options = {}) {
      const useStringTime = options.useStringTime || false;
      const notes = [];
      let currentTime = 0;
      let durationIndex = 0;
      const maxLength = Math.max(...walks.map((w) => w.length));
      for (let step = 0; step < maxLength; step++) {
        const activePitches = walks.map((walk) => walk[step]).filter((pitch) => pitch !== null);
        if (activePitches.length > 0) {
          const duration = durations[durationIndex % durations.length];
          const pitch = activePitches.length === 1 ? activePitches[0] : activePitches;
          notes.push({
            pitch,
            duration,
            time: useStringTime ? offsetToBarsBeatsTicks(currentTime, this.timingConfig) : currentTime
          });
          currentTime += duration;
          durationIndex++;
        }
      }
      return notes;
    }
    /**
     * Generate a JMON track directly from walk
     * @param {number} length - Walk length
     * @param {Array} durations - Duration sequence
     * @param {Object} trackOptions - Track options
     * @returns {Object} JMON track
     */
    generateTrack(length, durations = [1], trackOptions = {}) {
      const walks = this.generate(length, trackOptions.seed);
      const notes = this.toJmonNotes(walks, durations, trackOptions);
      return notesToTrack(notes, {
        label: "random-walk",
        midiChannel: 0,
        synth: { type: "Synth" },
        ...trackOptions
      });
    }
    /**
     * Map walk values to a musical scale
     * @param {Array<Array>} walks - Walk sequences  
     * @param {Array} scale - Scale to map to
     * @returns {Array<Array>} Walks mapped to scale
     */
    mapToScale(walks, scale = [60, 62, 64, 65, 67, 69, 71]) {
      return walks.map((walk) => {
        return walk.map((value) => {
          if (value === null) return null;
          const minVal = this.walkRange[0];
          const maxVal = this.walkRange[1];
          const range = maxVal - minVal;
          const normalized = (value - minVal) / range;
          const scaleIndex = Math.floor(normalized * scale.length);
          const clampedIndex = Math.max(0, Math.min(scaleIndex, scale.length - 1));
          return scale[clampedIndex];
        });
      });
    }
    /**
     * Create a seeded random number generator
     */
    createSeededRandom(seed) {
      let currentSeed = Math.abs(seed) || 1;
      return function() {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        const result = currentSeed / 233280;
        return Math.max(1e-7, Math.min(0.9999999, result));
      };
    }
  };

  // src/algorithms/generative/walks/PhasorWalk.js
  var Phasor = class {
    distance;
    frequency;
    phase;
    subPhasors;
    center;
    constructor(distance = 1, frequency = 1, phase = 0, subPhasors = []) {
      this.distance = distance;
      this.frequency = frequency;
      this.phase = phase;
      this.subPhasors = subPhasors || [];
      this.center = { x: 0, y: 0 };
    }
    /**
     * Add a sub-phasor to this phasor (like epicycles)
     */
    addSubPhasor(phasor) {
      this.subPhasors.push(phasor);
    }
    /**
     * Calculate position at given time
     */
    getPosition(time) {
      const angle = this.frequency * time + this.phase;
      const x = this.center.x + this.distance * Math.cos(angle);
      const y = this.center.y + this.distance * Math.sin(angle);
      return { x, y, angle, distance: this.distance };
    }
    /**
     * Calculate distance from origin
     */
    getDistanceFromOrigin(time) {
      const position = this.getPosition(time);
      return Math.sqrt(position.x * position.x + position.y * position.y);
    }
    /**
     * Calculate angle from origin in degrees
     */
    getAngleFromOrigin(time) {
      const position = this.getPosition(time);
      let angle = Math.atan2(position.y, position.x) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      return angle;
    }
    /**
     * Simulate this phasor and all its sub-phasors
     */
    simulate(timeArray, centerPosition = { x: 0, y: 0 }) {
      this.center = centerPosition;
      const results = [];
      for (const time of timeArray) {
        const position = this.getPosition(time);
        const distance = this.getDistanceFromOrigin(time);
        const angle = this.getAngleFromOrigin(time);
        results.push({
          time,
          position,
          distance,
          angle,
          phasor: this
        });
        for (const subPhasor of this.subPhasors) {
          subPhasor.center = position;
          const subResults = subPhasor.simulate([time], position);
          results.push(...subResults);
        }
      }
      return results;
    }
  };
  var PhasorSystem = class _PhasorSystem {
    phasors;
    timingConfig;
    constructor(timingConfig = DEFAULT_TIMING_CONFIG) {
      this.phasors = [];
      this.timingConfig = timingConfig;
    }
    /**
     * Add a phasor to the system
     */
    addPhasor(phasor) {
      this.phasors.push(phasor);
    }
    /**
     * Alias for addPhasor (for compatibility)
     */
    addPlanet(phasor) {
      return this.addPhasor(phasor);
    }
    /**
     * Simulate all phasors and sub-phasors in the system
     */
    simulate(timeArray) {
      const allResults = [];
      for (const phasor of this.phasors) {
        const phasorResults = phasor.simulate(timeArray);
        allResults.push(phasorResults);
      }
      return allResults;
    }
    /**
     * Get a flattened list of all phasors (primary + sub-phasors)
     */
    getAllPhasors() {
      const phasors = [];
      for (const phasor of this.phasors) {
        phasors.push(phasor);
        this.collectSubPhasors(phasor, phasors);
      }
      return phasors;
    }
    /**
     * Recursively collect all sub-phasors
     */
    collectSubPhasors(phasor, collection) {
      for (const subPhasor of phasor.subPhasors) {
        collection.push(subPhasor);
        this.collectSubPhasors(subPhasor, collection);
      }
    }
    /**
     * Map phasor motion to musical parameters
     */
    mapToMusic(timeArray, mappingOptions = {}) {
      const results = this.simulate(timeArray);
      const musicalTracks = [];
      for (let phasorIndex = 0; phasorIndex < results.length; phasorIndex++) {
        const phasorResults = results[phasorIndex];
        const track = this.createMusicalTrack(phasorResults, phasorIndex, mappingOptions);
        musicalTracks.push(track);
      }
      return musicalTracks;
    }
    /**
     * Create a musical track from phasor motion
     */
    createMusicalTrack(phasorResults, phasorIndex, options = {}) {
      const {
        pitchRange = [40, 80],
        durationRange = [0.25, 2],
        useDistance = true,
        useAngle = false,
        quantizeToScale = null,
        timingConfig = this.timingConfig,
        useStringTime = false
      } = options;
      const notes = [];
      for (const result of phasorResults) {
        let pitch, duration;
        if (useDistance) {
          const normalizedDistance = Math.max(0, Math.min(1, result.distance / 10));
          pitch = pitchRange[0] + normalizedDistance * (pitchRange[1] - pitchRange[0]);
        } else {
          pitch = pitchRange[0] + result.angle / 360 * (pitchRange[1] - pitchRange[0]);
        }
        if (useAngle) {
          duration = durationRange[0] + result.angle / 360 * (durationRange[1] - durationRange[0]);
        } else {
          const normalizedDistance = Math.max(0, Math.min(1, result.distance / 10));
          duration = durationRange[1] - normalizedDistance * (durationRange[1] - durationRange[0]);
        }
        if (quantizeToScale) {
          const scaleIndex = Math.floor((pitch - pitchRange[0]) / (pitchRange[1] - pitchRange[0]) * quantizeToScale.length);
          const clampedIndex = Math.max(0, Math.min(scaleIndex, quantizeToScale.length - 1));
          pitch = quantizeToScale[clampedIndex];
        } else {
          pitch = Math.round(pitch);
        }
        notes.push({
          pitch,
          duration,
          time: useStringTime ? offsetToBarsBeatsTicks(result.time, timingConfig) : result.time,
          phasorData: {
            distance: result.distance,
            angle: result.angle,
            position: result.position
          }
        });
      }
      return notes;
    }
    /**
     * Generate JMON tracks directly from phasor motion
     */
    generateTracks(timeArray, mappingOptions = {}, trackOptions = {}) {
      const musicalTracks = this.mapToMusic(timeArray, mappingOptions);
      const jmonTracks = [];
      musicalTracks.forEach((notes, index) => {
        const track = notesToTrack(notes, {
          label: `phasor-${index + 1}`,
          midiChannel: index % 16,
          synth: { type: "Synth" },
          ...trackOptions
        });
        jmonTracks.push(track);
      });
      return jmonTracks;
    }
    /**
     * Create complex harmonic patterns with sub-phasors (epicycles)
     */
    static createComplexSystem() {
      const system = new _PhasorSystem();
      const subPhasor1 = new Phasor(0.2, 5, 0);
      const subPhasor2 = new Phasor(0.3, 3, Math.PI / 2);
      const subSubPhasor = new Phasor(0.1, 8, Math.PI);
      subPhasor1.addSubPhasor(subSubPhasor);
      const phasor1 = new Phasor(2, 1, 0, [subPhasor1, subPhasor2]);
      const phasor2 = new Phasor(3.5, 0.6, Math.PI / 3);
      system.addPhasor(phasor1);
      system.addPhasor(phasor2);
      return system;
    }
    /**
     * Generate time array with linear spacing
     */
    static generateTimeArray(start = 0, end = 10, steps = 100) {
      const timeArray = [];
      const stepSize = (end - start) / (steps - 1);
      for (let i = 0; i < steps; i++) {
        timeArray.push(start + i * stepSize);
      }
      return timeArray;
    }
  };

  // src/algorithms/generative/fractals/ComplexPlaneFractal.js
  var ComplexPlaneFractal = class {
    constructor(options = {}) {
      this.width = options.width || 100;
      this.height = options.height || 100;
      this.maxIterations = options.maxIterations || 100;
      if (options.center && options.size) {
        this._center = { x: options.center.x, y: options.center.y };
        this._size = { w: options.size.w, h: options.size.h };
      } else if (options.xMin !== void 0 || options.xMax !== void 0 || options.yMin !== void 0 || options.yMax !== void 0) {
        console.warn("[jmon/algo] xMin/xMax/yMin/yMax are deprecated. Use center and size instead.");
        const xMin = options.xMin ?? -2.5;
        const xMax = options.xMax ?? 1.5;
        const yMin = options.yMin ?? -2;
        const yMax = options.yMax ?? 2;
        this._center = { x: (xMin + xMax) / 2, y: (yMin + yMax) / 2 };
        this._size = { w: xMax - xMin, h: yMax - yMin };
      } else {
        this._center = { x: -0.5, y: 0 };
        this._size = { w: 4, h: 4 };
      }
      this.xMin = this._center.x - this._size.w / 2;
      this.xMax = this._center.x + this._size.w / 2;
      this.yMin = this._center.y - this._size.h / 2;
      this.yMax = this._center.y + this._size.h / 2;
    }
    /** @returns {string} Fractal type identifier */
    get type() {
      throw new Error("Subclasses must implement the type getter");
    }
    /** @returns {{x: number, y: number}} Center of the viewing window */
    get center() {
      return { ...this._center };
    }
    /** @returns {{w: number, h: number}} Size of the viewing window */
    get size() {
      return { ...this._size };
    }
    /** @returns {{xMin: number, xMax: number, yMin: number, yMax: number}} Bounds (computed from center and size) */
    get bounds() {
      return { xMin: this.xMin, xMax: this.xMax, yMin: this.yMin, yMax: this.yMax };
    }
    /**
     * Calculate iterations for a point in the complex plane.
     * Subclasses must implement this.
     * @param {ComplexPoint} point - Point in the complex plane
     * @returns {number} Number of iterations before escape
     */
    iterate(point) {
      throw new Error("Subclasses must implement iterate()");
    }
    /**
     * Generate fractal data as a 2D grid of iteration counts.
     * @returns {number[][]} 2D array of iteration counts
     */
    generate() {
      const data = [];
      for (let y = 0; y < this.height; y++) {
        const row = [];
        for (let x = 0; x < this.width; x++) {
          const real = this.xMin + x / this.width * (this.xMax - this.xMin);
          const imaginary = this.yMin + y / this.height * (this.yMax - this.yMin);
          row.push(this.iterate({ real, imaginary }));
        }
        data.push(row);
      }
      return data;
    }
    /**
     * Extract sequence from fractal data using various methods
     * @param {'diagonal'|'border'|'spiral'|'column'|'row'} [method='diagonal']
     * @param {number} [index=0] - Index for column/row extraction
     * @returns {number[]} Extracted sequence
     */
    extractSequence(method = "diagonal", index = 0) {
      const data = this.generate();
      switch (method) {
        case "diagonal":
          return this.extractDiagonal(data);
        case "border":
          return this.extractBorder(data);
        case "spiral":
          return this.extractSpiral(data);
        case "column":
          return this.extractColumn(data, index);
        case "row":
          return this.extractRow(data, index);
        default:
          return this.extractDiagonal(data);
      }
    }
    extractDiagonal(data) {
      const sequence = [];
      const minDimension = Math.min(data.length, data[0]?.length || 0);
      for (let i = 0; i < minDimension; i++) {
        sequence.push(data[i][i]);
      }
      return sequence;
    }
    extractBorder(data) {
      const sequence = [];
      const height = data.length;
      const width = data[0]?.length || 0;
      if (height === 0 || width === 0) return sequence;
      for (let x = 0; x < width; x++) sequence.push(data[0][x]);
      for (let y = 1; y < height; y++) sequence.push(data[y][width - 1]);
      if (height > 1) {
        for (let x = width - 2; x >= 0; x--) sequence.push(data[height - 1][x]);
      }
      if (width > 1) {
        for (let y = height - 2; y > 0; y--) sequence.push(data[y][0]);
      }
      return sequence;
    }
    extractSpiral(data) {
      const sequence = [];
      const height = data.length;
      const width = data[0]?.length || 0;
      if (height === 0 || width === 0) return sequence;
      let top = 0, bottom = height - 1;
      let left = 0, right = width - 1;
      while (top <= bottom && left <= right) {
        for (let x = left; x <= right; x++) sequence.push(data[top][x]);
        top++;
        for (let y = top; y <= bottom; y++) sequence.push(data[y][right]);
        right--;
        if (top <= bottom) {
          for (let x = right; x >= left; x--) sequence.push(data[bottom][x]);
          bottom--;
        }
        if (left <= right) {
          for (let y = bottom; y >= top; y--) sequence.push(data[y][left]);
          left++;
        }
      }
      return sequence;
    }
    extractColumn(data, columnIndex) {
      const sequence = [];
      const width = data[0]?.length || 0;
      const clampedIndex = Math.max(0, Math.min(columnIndex, width - 1));
      for (const row of data) {
        if (row[clampedIndex] !== void 0) sequence.push(row[clampedIndex]);
      }
      return sequence;
    }
    extractRow(data, rowIndex) {
      const clampedIndex = Math.max(0, Math.min(rowIndex, data.length - 1));
      return data[clampedIndex] ? [...data[clampedIndex]] : [];
    }
    /**
     * Map fractal values to musical scale pitches
     * @param {Object} options
     * @param {number[]} options.sequence - Fractal sequence to map
     * @param {number[]} options.pitches - MIDI pitch values to map to
     * @returns {number[]} MIDI note sequence
     */
    mapToScale({ sequence, pitches }) {
      if (sequence.length === 0) return [];
      if (!pitches || pitches.length === 0) {
        throw new Error("pitches array is required and must not be empty");
      }
      const minVal = Math.min(...sequence);
      const maxVal = Math.max(...sequence);
      const range = maxVal - minVal || 1;
      return sequence.map((value) => {
        const normalized = (value - minVal) / range;
        const index = Math.floor(normalized * (pitches.length - 1));
        return pitches[index];
      });
    }
    /**
     * Generate rhythmic pattern from fractal data
     * @param {Object} options
     * @param {number[]} options.sequence - Fractal sequence
     * @param {number[]} [options.subdivisions=[1, 2, 4, 8, 16]]
     * @returns {number[]} Rhythmic durations
     */
    mapToRhythm({ sequence, subdivisions = [1, 2, 4, 8, 16] }) {
      if (sequence.length === 0) return [];
      const minVal = Math.min(...sequence);
      const maxVal = Math.max(...sequence);
      const range = maxVal - minVal || 1;
      return sequence.map((value) => {
        const normalized = (value - minVal) / range;
        const subdivisionIndex = Math.floor(normalized * subdivisions.length);
        const clampedIndex = Math.max(0, Math.min(subdivisionIndex, subdivisions.length - 1));
        return 1 / subdivisions[clampedIndex];
      });
    }
    /**
     * Treat the 2D iteration grid as a piano roll.
     * x-axis = time, y-axis = pitch. Boundary pixels (iteration counts
     * between thresholdMin and thresholdMax fractions of maxIterations)
     * become active notes. Velocity is derived from the local iteration
     * gradient magnitude. Consecutive same-pitch notes are merged into
     * single longer notes.
     *
     * @param {Object} options
     * @param {number[][]} options.grid - 2D iteration-count array (from generate())
     * @param {number[]} options.pitches - MIDI pitch values, one per grid row (length must equal grid height)
     * @param {number} [options.thresholdMin=0.1] - Lower boundary fraction of maxIterations
     * @param {number} [options.thresholdMax=0.95] - Upper boundary fraction of maxIterations
     * @param {number} [options.duration=1] - Duration of each time step in quarter notes
     * @param {number} [options.maxDuration=Infinity] - Maximum merged note duration in quarter notes
     * @returns {{ pitch: number, time: number, duration: number, velocity: number }[]} JMON note array
     */
    gridToNotes({ grid, pitches, thresholdMin = 0.1, thresholdMax = 0.95, duration = 1, maxDuration = Infinity }) {
      const height = grid.length;
      const width = grid[0]?.length || 0;
      if (height === 0 || width === 0 || !pitches || pitches.length === 0) return [];
      const lo = thresholdMin * this.maxIterations;
      const hi = thresholdMax * this.maxIterations;
      const gradient = [];
      for (let y = 0; y < height; y++) {
        gradient[y] = [];
        for (let x = 0; x < width; x++) {
          const dx = (grid[y][Math.min(x + 1, width - 1)] - grid[y][Math.max(x - 1, 0)]) / 2;
          const dy = ((grid[Math.min(y + 1, height - 1)] || grid[y])[x] - grid[Math.max(y - 1, 0)][x]) / 2;
          gradient[y][x] = Math.sqrt(dx * dx + dy * dy);
        }
      }
      let maxGrad = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (gradient[y][x] > maxGrad) maxGrad = gradient[y][x];
        }
      }
      if (maxGrad === 0) maxGrad = 1;
      const raw = [];
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const v = grid[y][x];
          if (v >= lo && v <= hi) {
            const pitchIndex = height - 1 - y;
            const pitch = pitches[Math.min(pitchIndex, pitches.length - 1)];
            const vel = 0.2 + 0.8 * (gradient[y][x] / maxGrad);
            raw.push({ pitch, time: x * duration, duration, velocity: vel });
          }
        }
      }
      if (raw.length === 0) return [];
      raw.sort((a, b) => a.pitch - b.pitch || a.time - b.time);
      const merged = [raw[0]];
      for (let i = 1; i < raw.length; i++) {
        const prev = merged[merged.length - 1];
        const curr = raw[i];
        if (curr.pitch === prev.pitch && Math.abs(curr.time - (prev.time + prev.duration)) < 1e-3 && prev.duration < maxDuration) {
          const totalDur = prev.duration + curr.duration;
          prev.velocity = (prev.velocity * prev.duration + curr.velocity * curr.duration) / totalDur;
          prev.duration = totalDur;
        } else {
          merged.push({ ...curr });
        }
      }
      merged.sort((a, b) => a.time - b.time || a.pitch - b.pitch);
      return merged;
    }
  };

  // src/algorithms/generative/fractals/Mandelbrot.js
  var Mandelbrot = class extends ComplexPlaneFractal {
    get type() {
      return "mandelbrot";
    }
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
  };

  // src/algorithms/generative/fractals/Julia.js
  var Julia = class extends ComplexPlaneFractal {
    /**
     * @param {Object} options
     * @param {{real: number, imaginary: number}} options.c - The fixed c parameter
     */
    constructor(options = {}) {
      if (!options.c) {
        throw new Error("Julia set requires a c parameter: { real, imaginary }");
      }
      const defaults = { center: { x: 0, y: 0 }, size: { w: 4, h: 4 } };
      super({ ...defaults, ...options });
      this.c = { real: options.c.real, imaginary: options.c.imaginary };
    }
    get type() {
      return "julia";
    }
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
  };

  // src/algorithms/generative/fractals/BurningShip.js
  var BurningShip = class extends ComplexPlaneFractal {
    constructor(options = {}) {
      const defaults = { center: { x: -0.5, y: -0.5 }, size: { w: 4, h: 3 } };
      super({ ...defaults, ...options });
    }
    get type() {
      return "burningship";
    }
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
  };

  // src/algorithms/generative/fractals/Fractal.js
  var TYPES = {
    mandelbrot: Mandelbrot,
    julia: Julia,
    burningship: BurningShip
  };
  function Fractal(type, options = {}) {
    const FractalClass = TYPES[type];
    if (!FractalClass) {
      throw new Error(
        `Unknown fractal type: "${type}". Supported: ${Object.keys(TYPES).join(", ")}`
      );
    }
    return new FractalClass(options);
  }
  Fractal.types = () => Object.keys(TYPES);

  // src/algorithms/generative/fractals/LogisticMap.js
  var LogisticMap = class {
    /**
     * @param {LogisticMapOptions} [options={}] - Configuration options
     */
    constructor(options = {}) {
      this.r = options.r || 3.8;
      this.x0 = options.x0 || 0.5;
      this.iterations = options.iterations || 1e3;
      this.skipTransient = options.skipTransient || 100;
    }
    /**
     * Generate logistic map sequence
     * @returns {number[]} Generated sequence
     */
    generate() {
      const sequence = [];
      let x = this.x0;
      for (let i = 0; i < this.iterations + this.skipTransient; i++) {
        x = this.r * x * (1 - x);
        if (i >= this.skipTransient) {
          sequence.push(x);
        }
      }
      return sequence;
    }
    /**
     * Generate bifurcation data for different r values
     * @param {number} [rMin=2.5] - Minimum r value
     * @param {number} [rMax=4.0] - Maximum r value
     * @param {number} [rSteps=1000] - Number of r steps
     * @returns {Object} Bifurcation data with r and x arrays
     */
    bifurcationDiagram(rMin = 2.5, rMax = 4, rSteps = 1e3) {
      const rValues = [];
      const xValues = [];
      const rStep = (rMax - rMin) / rSteps;
      for (let i = 0; i < rSteps; i++) {
        const r = rMin + i * rStep;
        const originalR = this.r;
        this.r = r;
        const sequence = this.generate();
        this.r = originalR;
        const settledValues = sequence.slice(-50);
        for (const x of settledValues) {
          rValues.push(r);
          xValues.push(x);
        }
      }
      return { r: rValues, x: xValues };
    }
    /**
     * Map chaotic values to musical scale
     * @param {number[]} sequence - Chaotic sequence
     * @param {number[]} [scale=[0, 2, 4, 5, 7, 9, 11]] - Musical scale intervals
     * @param {number} [octaveRange=3] - Number of octaves to span
     * @returns {number[]} MIDI note sequence
     */
    mapToScale(sequence, scale = [0, 2, 4, 5, 7, 9, 11], octaveRange = 3) {
      if (sequence.length === 0) return [];
      return sequence.map((value) => {
        const scaleIndex = Math.floor(value * scale.length * octaveRange);
        const octave = Math.floor(scaleIndex / scale.length);
        const noteIndex = scaleIndex % scale.length;
        return 60 + octave * 12 + scale[noteIndex];
      });
    }
    /**
     * Map to rhythmic durations
     * @param {number[]} sequence - Chaotic sequence
     * @param {number[]} [durations=[0.25, 0.5, 1, 2]] - Duration values
     * @returns {number[]} Rhythm sequence
     */
    mapToRhythm(sequence, durations = [0.25, 0.5, 1, 2]) {
      if (sequence.length === 0) return [];
      return sequence.map((value) => {
        const durationIndex = Math.floor(value * durations.length);
        const clampedIndex = Math.max(0, Math.min(durationIndex, durations.length - 1));
        return durations[clampedIndex];
      });
    }
    /**
     * Map to velocities
     * @param {number[]} sequence - Chaotic sequence
     * @param {number} [minVel=0.3] - Minimum velocity
     * @param {number} [maxVel=1.0] - Maximum velocity
     * @returns {number[]} Velocity sequence
     */
    mapToVelocity(sequence, minVel = 0.3, maxVel = 1) {
      if (sequence.length === 0) return [];
      const range = maxVel - minVel;
      return sequence.map((value) => minVel + value * range);
    }
    /**
     * Detect periodic cycles in the sequence
     * @param {number[]} sequence - Sequence to analyze
     * @param {number} [tolerance=0.01] - Tolerance for cycle detection
     * @returns {number[]} Detected cycle periods
     */
    detectCycles(sequence, tolerance = 0.01) {
      const cycles = [];
      for (let period = 1; period <= Math.floor(sequence.length / 2); period++) {
        let isPeriodic = true;
        for (let i = period; i < Math.min(sequence.length, period * 3); i++) {
          if (Math.abs(sequence[i] - sequence[i - period]) > tolerance) {
            isPeriodic = false;
            break;
          }
        }
        if (isPeriodic) {
          cycles.push(period);
        }
      }
      return cycles;
    }
    /**
     * Calculate Lyapunov exponent (measure of chaos)
     * @param {number} [iterations=10000] - Number of iterations for calculation
     * @returns {number} Lyapunov exponent
     */
    lyapunovExponent(iterations = 1e4) {
      let x = this.x0;
      let sum = 0;
      for (let i = 0; i < iterations; i++) {
        const derivative = this.r * (1 - 2 * x);
        sum += Math.log(Math.abs(derivative));
        x = this.r * x * (1 - x);
      }
      return sum / iterations;
    }
    /**
     * Generate multiple correlated sequences
     * @param {number} [numSequences=2] - Number of sequences to generate
     * @param {number} [coupling=0.1] - Coupling strength between sequences
     * @returns {number[][]} Array of coupled sequences
     */
    generateCoupled(numSequences = 2, coupling = 0.1) {
      const sequences = Array(numSequences).fill(null).map(() => []);
      const states = Array(numSequences).fill(this.x0);
      for (let i = 0; i < this.iterations + this.skipTransient; i++) {
        const newStates = [...states];
        for (let j = 0; j < numSequences; j++) {
          let coupledTerm = 0;
          for (let k = 0; k < numSequences; k++) {
            if (k !== j) {
              coupledTerm += coupling * (states[k] - states[j]);
            }
          }
          newStates[j] = this.r * states[j] * (1 - states[j]) + coupledTerm;
          newStates[j] = Math.max(0, Math.min(1, newStates[j]));
        }
        states.splice(0, numSequences, ...newStates);
        if (i >= this.skipTransient) {
          for (let j = 0; j < numSequences; j++) {
            sequences[j].push(states[j]);
          }
        }
      }
      return sequences;
    }
    /**
     * Apply different chaotic regimes
     * @param {'periodic'|'chaotic'|'edge'|'custom'} regime - Regime type
     * @param {number} [customR] - Custom r value for 'custom' regime
     */
    setRegime(regime, customR) {
      switch (regime) {
        case "periodic":
          this.r = 3.2;
          break;
        case "chaotic":
          this.r = 3.9;
          break;
        case "edge":
          this.r = 3.57;
          break;
        case "custom":
          if (customR !== void 0) {
            this.r = Math.max(0, Math.min(4, customR));
          }
          break;
      }
    }
    /**
     * Get current parameters
     * @returns {LogisticMapOptions} Current configuration
     */
    getParameters() {
      return {
        r: this.r,
        x0: this.x0,
        iterations: this.iterations,
        skipTransient: this.skipTransient
      };
    }
  };

  // src/algorithms/generative/minimalism/MinimalismProcess.js
  var MinimalismProcess = class {
    operation;
    direction;
    repetition;
    timingConfig;
    sequence = [];
    constructor(options) {
      const { operation, direction, repetition, timingConfig = DEFAULT_TIMING_CONFIG } = options;
      if (!["additive", "subtractive"].includes(operation)) {
        throw new Error("Invalid operation. Choose 'additive' or 'subtractive'.");
      }
      if (!["forward", "backward", "inward", "outward"].includes(direction)) {
        throw new Error("Invalid direction. Choose 'forward', 'backward', 'inward' or 'outward'.");
      }
      if (repetition < 0 || !Number.isInteger(repetition)) {
        throw new Error("Invalid repetition value. Must be an integer greater than or equal to 0.");
      }
      this.operation = operation;
      this.direction = direction;
      this.repetition = repetition;
      this.timingConfig = timingConfig;
    }
    /**
     * Generate processed sequence based on operation and direction
     * Accepts either:
     * - JMON note objects: { pitch, duration, time }
     * - Legacy objects: { pitch, duration, offset }
     * - Legacy tuples: [pitch, duration, offset]
     * Returns: JMON note objects with numeric time (quarter notes)
     */
    generate(sequence) {
      this.sequence = this.normalizeInput(sequence);
      let processed;
      if (this.operation === "additive" && this.direction === "forward") {
        processed = this.additiveForward();
      } else if (this.operation === "additive" && this.direction === "backward") {
        processed = this.additiveBackward();
      } else if (this.operation === "additive" && this.direction === "inward") {
        processed = this.additiveInward();
      } else if (this.operation === "additive" && this.direction === "outward") {
        processed = this.additiveOutward();
      } else if (this.operation === "subtractive" && this.direction === "forward") {
        processed = this.subtractiveForward();
      } else if (this.operation === "subtractive" && this.direction === "backward") {
        processed = this.subtractiveBackward();
      } else if (this.operation === "subtractive" && this.direction === "inward") {
        processed = this.subtractiveInward();
      } else if (this.operation === "subtractive" && this.direction === "outward") {
        processed = this.subtractiveOutward();
      } else {
        throw new Error("Invalid operation/direction combination");
      }
      const withOffsets = this.adjustOffsets(processed);
      return this.toJmonNotes(withOffsets, false);
    }
    additiveForward() {
      const processed = [];
      for (let i = 0; i < this.sequence.length; i++) {
        const segment = this.sequence.slice(0, i + 1);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
      return processed;
    }
    additiveBackward() {
      const processed = [];
      for (let i = this.sequence.length; i > 0; i--) {
        const segment = this.sequence.slice(i - 1);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
      return processed;
    }
    additiveInward() {
      const processed = [];
      const n = this.sequence.length;
      for (let i = 0; i < Math.ceil(n / 2); i++) {
        let segment;
        if (i < n - i - 1) {
          const leftPart = this.sequence.slice(0, i + 1);
          const rightPart = this.sequence.slice(n - i - 1);
          segment = [...leftPart, ...rightPart];
        } else {
          segment = [...this.sequence];
        }
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
      return processed;
    }
    additiveOutward() {
      const processed = [];
      const n = this.sequence.length;
      if (n % 2 === 0) {
        const midLeft = Math.floor(n / 2) - 1;
        const midRight = Math.floor(n / 2);
        for (let i = 0; i < n / 2; i++) {
          const segment = this.sequence.slice(midLeft - i, midRight + i + 1);
          for (let rep = 0; rep <= this.repetition; rep++) {
            processed.push(...segment);
          }
        }
      } else {
        const mid = Math.floor(n / 2);
        for (let i = 0; i <= mid; i++) {
          const segment = this.sequence.slice(mid - i, mid + i + 1);
          for (let rep = 0; rep <= this.repetition; rep++) {
            processed.push(...segment);
          }
        }
      }
      return processed;
    }
    subtractiveForward() {
      const processed = [];
      for (let i = 0; i < this.sequence.length; i++) {
        const segment = this.sequence.slice(i);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
      return processed;
    }
    subtractiveBackward() {
      const processed = [];
      for (let i = this.sequence.length; i > 0; i--) {
        const segment = this.sequence.slice(0, i);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
      return processed;
    }
    subtractiveInward() {
      const processed = [];
      const n = this.sequence.length;
      const steps = Math.floor(n / 2);
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...this.sequence);
      }
      for (let i = 1; i <= steps; i++) {
        const segment = this.sequence.slice(i, n - i);
        if (segment.length > 0) {
          for (let rep = 0; rep <= this.repetition; rep++) {
            processed.push(...segment);
          }
        }
      }
      return processed;
    }
    subtractiveOutward() {
      const processed = [];
      let segment = [...this.sequence];
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
      while (segment.length > 2) {
        segment = segment.slice(1, -1);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
      return processed;
    }
    // Normalize heterogenous inputs into objects with pitch, duration, offset (beats)
    normalizeInput(sequence) {
      if (!Array.isArray(sequence)) return [];
      if (Array.isArray(sequence[0])) {
        return sequence.map(([pitch, duration, offset = 0]) => ({ pitch, duration, offset }));
      }
      return sequence.map((n) => {
        const pitch = n.pitch;
        const duration = n.duration;
        let offset = 0;
        if (typeof n.offset === "number") offset = n.offset;
        else if (typeof n.time === "number") offset = n.time;
        else if (typeof n.time === "string") offset = this.timeToBeats(n.time);
        return { ...n, pitch, duration, offset };
      });
    }
    // Convert beats to bars:beats:ticks using centralized utility
    beatsToTime(beats) {
      return offsetToBarsBeatsTicks(beats, this.timingConfig);
    }
    // Convert bars:beats:ticks to beats using centralized utility
    timeToBeats(timeStr) {
      if (typeof timeStr !== "string") return Number(timeStr) || 0;
      return barsBeatsTicksToOffset(timeStr, this.timingConfig);
    }
    // After process, recalc offsets sequentially in beats
    adjustOffsets(processed) {
      let currentOffset = 0;
      return processed.map((note) => {
        const newNote = {
          ...note,
          offset: currentOffset
        };
        currentOffset += note.duration;
        return newNote;
      });
    }
    // Produce JMON notes: { pitch, duration, time }
    // Always use numeric time in quarter notes (like pitch: 60, time: 4.5)
    toJmonNotes(notesWithOffsets, useStringTime = false) {
      return notesWithOffsets.map(({ pitch, duration, offset, ...rest }) => {
        const { time: oldTime, ...cleanRest } = rest;
        return {
          pitch,
          duration,
          time: useStringTime ? this.beatsToTime(offset) : offset,
          ...cleanRest
        };
      });
    }
    /**
     * Generate and convert to JMON track format
     * @param {Array} sequence - Input sequence
     * @param {Object} trackOptions - Track configuration options
     * @param {boolean} trackOptions.useStringTime - Use bars:beats:ticks strings for display (default: numeric)
     * @returns {Object} JMON track object
     */
    generateTrack(sequence, trackOptions = {}) {
      const processedNotes = this.generate(sequence);
      return notesToTrack(processedNotes, {
        timingConfig: this.timingConfig,
        useStringTime: false,
        ...trackOptions
      });
    }
  };
  var Tintinnabuli = class {
    tChord;
    extendedChord;
    direction;
    rank;
    isAlternate;
    currentDirection;
    timingConfig;
    extendOctaves;
    /**
     * Create a Tintinnabuli generator
     * @param {Object} options - Configuration options
     * @param {number[]} options.tChord - The t-chord pitches (e.g., [60, 64, 67] for C major triad)
     * @param {string} [options.direction='down'] - Direction to find t-voice: 'up', 'down', 'any', or 'alternate'
     * @param {number} [options.rank=0] - Which chord tone to select (0 = closest, 1 = second closest, etc.)
     * @param {boolean} [options.extendOctaves=true] - If true, chord is extended across all octaves (pitch classes matter).
     *                                                  If false, uses exact pitches provided.
     * @param {Object} [options.timingConfig] - Timing configuration
     */
    constructor(options = {}) {
      const {
        tChord,
        direction = "down",
        rank = 0,
        extendOctaves = true,
        timingConfig = DEFAULT_TIMING_CONFIG
      } = options;
      if (!tChord || !Array.isArray(tChord) || tChord.length === 0) {
        throw new Error("tChord is required and must be a non-empty array of pitches.");
      }
      if (!["up", "down", "any", "alternate"].includes(direction)) {
        throw new Error("Invalid direction. Choose 'up', 'down', 'any' or 'alternate'.");
      }
      this.tChord = tChord;
      this.extendOctaves = extendOctaves;
      this.extendedChord = extendOctaves ? this.extendChordAcrossOctaves(tChord) : [...tChord].sort((a, b) => a - b);
      this.isAlternate = direction === "alternate";
      this.currentDirection = this.isAlternate ? "up" : direction;
      this.direction = direction;
      this.timingConfig = timingConfig;
      if (!Number.isInteger(rank) || rank < 0) {
        throw new Error("Rank must be a non-negative integer.");
      }
      this.rank = rank;
    }
    /**
     * Extend chord pitches across the full MIDI range (0-127)
     * This ensures there are always enough notes above/below any melody pitch
     */
    extendChordAcrossOctaves(tChord) {
      const pitchClasses = [...new Set(tChord.map((p) => p % 12))].sort((a, b) => a - b);
      const extended = [];
      for (let octave = 0; octave <= 10; octave++) {
        for (const pc of pitchClasses) {
          const pitch = octave * 12 + pc;
          if (pitch >= 0 && pitch <= 127) {
            extended.push(pitch);
          }
        }
      }
      return extended.sort((a, b) => a - b);
    }
    /**
     * Generate t-voice from m-voice sequence
     * Accepts: JMON notes, legacy objects, or tuples
     * Returns: JMON notes with numeric time (quarter notes)
     * @param {Array} sequence - Input sequence
     * @param {boolean} useStringTime - Whether to use bars:beats:ticks strings for display (default: false)
     */
    generate(sequence, useStringTime = false) {
      const normalizedSequence = this.normalizeInput(sequence);
      const tVoice = [];
      if (this.isAlternate) {
        this.currentDirection = "up";
      }
      for (const note of normalizedSequence) {
        if (note.pitch === void 0) {
          const { offset: offset2, time: oldTime2, ...rest2 } = note;
          tVoice.push({
            ...rest2,
            pitch: void 0,
            time: useStringTime ? this.beatsToTime(offset2) : offset2
          });
          continue;
        }
        const mPitch = note.pitch;
        let tVoicePitch;
        if (this.currentDirection === "up") {
          const pitchesAbove = this.extendedChord.filter((p) => p > mPitch);
          if (pitchesAbove.length > this.rank) {
            tVoicePitch = pitchesAbove[this.rank];
          } else if (pitchesAbove.length > 0) {
            tVoicePitch = pitchesAbove[pitchesAbove.length - 1];
          } else {
            tVoicePitch = this.extendedChord[this.extendedChord.length - 1];
          }
        } else if (this.currentDirection === "down") {
          const pitchesBelow = this.extendedChord.filter((p) => p < mPitch).reverse();
          if (pitchesBelow.length > this.rank) {
            tVoicePitch = pitchesBelow[this.rank];
          } else if (pitchesBelow.length > 0) {
            tVoicePitch = pitchesBelow[pitchesBelow.length - 1];
          } else {
            tVoicePitch = this.extendedChord[0];
          }
        } else {
          const sortedByDistance = [...this.extendedChord].map((p) => ({ pitch: p, distance: Math.abs(p - mPitch) })).filter(({ distance }) => distance > 0).sort((a, b) => a.distance - b.distance);
          if (sortedByDistance.length > this.rank) {
            tVoicePitch = sortedByDistance[this.rank].pitch;
          } else if (sortedByDistance.length > 0) {
            tVoicePitch = sortedByDistance[sortedByDistance.length - 1].pitch;
          } else {
            tVoicePitch = mPitch;
          }
        }
        if (this.isAlternate) {
          this.currentDirection = this.currentDirection === "up" ? "down" : "up";
        }
        const { offset, time: oldTime, ...rest } = note;
        tVoice.push({
          ...rest,
          pitch: tVoicePitch,
          time: useStringTime ? this.beatsToTime(offset) : offset
        });
      }
      return tVoice;
    }
    // Normalize input like MinimalismProcess
    normalizeInput(sequence) {
      if (!Array.isArray(sequence)) return [];
      if (Array.isArray(sequence[0])) {
        return sequence.map(([pitch, duration, offset = 0]) => ({ pitch, duration, offset }));
      }
      return sequence.map((n) => {
        const pitch = n.pitch;
        const duration = n.duration;
        let offset = 0;
        if (typeof n.offset === "number") offset = n.offset;
        else if (typeof n.time === "number") offset = n.time;
        else if (typeof n.time === "string") offset = this.timeToBeats(n.time);
        return { ...n, pitch, duration, offset };
      });
    }
    // Convert beats to bars:beats:ticks using centralized utility
    beatsToTime(beats) {
      return offsetToBarsBeatsTicks(beats, this.timingConfig);
    }
    // Convert bars:beats:ticks to beats using centralized utility
    timeToBeats(timeStr) {
      if (typeof timeStr !== "string") return Number(timeStr) || 0;
      return barsBeatsTicksToOffset(timeStr, this.timingConfig);
    }
  };

  // src/algorithms/processors/Corruptor.js
  var PerlinNoise = class {
    constructor(seed = Math.random()) {
      this.seed = seed;
      this.permutation = this.generatePermutation();
    }
    generatePermutation() {
      const p = [];
      for (let i = 0; i < 256; i++) {
        p[i] = i;
      }
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
      return [...p, ...p];
    }
    random() {
      const x = Math.sin(this.seed++) * 1e4;
      return x - Math.floor(x);
    }
    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    lerp(t, a, b) {
      return a + t * (b - a);
    }
    grad(hash, x) {
      const h = hash & 15;
      const grad = 1 + (h & 7);
      return (h & 8 ? -grad : grad) * x;
    }
    noise(x) {
      const X = Math.floor(x) & 255;
      x -= Math.floor(x);
      const u = this.fade(x);
      const a = this.permutation[X];
      const b = this.permutation[X + 1];
      return this.lerp(u, this.grad(a, x), this.grad(b, x - 1));
    }
  };
  var BrownianBridge = class {
    constructor(start = 0, end = 0, steps = 100, volatility = 1) {
      this.start = start;
      this.end = end;
      this.steps = steps;
      this.volatility = volatility;
    }
    generate() {
      const path = [this.start];
      let current = this.start;
      for (let i = 1; i < this.steps; i++) {
        const timeRemaining = this.steps - i;
        const drift = (this.end - current) / timeRemaining;
        const diffusion = this.volatility * this.gaussianRandom();
        current += drift + diffusion;
        path.push(current);
      }
      path.push(this.end);
      return path;
    }
    gaussianRandom(mean = 0, stdev = 1) {
      const u = 1 - Math.random();
      const v = Math.random();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return z * stdev + mean;
    }
  };
  var Corruptor = class {
    constructor(options = {}) {
      this.options = {
        entropy: options.entropy || 0.5,
        // 0.0 to 1.0
        seed: options.seed || Math.random(),
        // Temporal Instability
        temporalJitter: options.temporalJitter !== void 0 ? options.temporalJitter : true,
        jitterMethod: options.jitterMethod || "perlin",
        // 'perlin' or 'brownian'
        // Harmonic Erosion
        microtonalDrift: options.microtonalDrift !== void 0 ? options.microtonalDrift : true,
        driftAmount: options.driftAmount || 1,
        // Multiplier for microtonal drift
        // Structural Decay
        noteAttrition: options.noteAttrition !== void 0 ? options.noteAttrition : true,
        velocitySag: options.velocitySag !== void 0 ? options.velocitySag : true,
        // Spectral Corruption
        spectralCorruption: options.spectralCorruption !== void 0 ? options.spectralCorruption : false,
        // Semantic Ghosting
        ghostTrack: options.ghostTrack !== void 0 ? options.ghostTrack : false,
        ghostOctaveShift: options.ghostOctaveShift || -2,
        ghostDurationMultiplier: options.ghostDurationMultiplier || 4,
        ghostVelocityMultiplier: options.ghostVelocityMultiplier || 0.3,
        ghostDelay: options.ghostDelay !== void 0 ? options.ghostDelay : 1,
        // beats of delay before ghost enters
        ghostDrift: options.ghostDrift !== void 0 ? options.ghostDrift : 0.3
        // temporal smearing amount
      };
      this.perlin = new PerlinNoise(this.options.seed);
      this.randomSeed = this.options.seed;
    }
    /**
     * Seeded random number generator
     */
    seededRandom() {
      const x = Math.sin(this.randomSeed++) * 1e4;
      return x - Math.floor(x);
    }
    /**
     * Gaussian random with seed
     */
    gaussianRandom(mean = 0, stdev = 1) {
      const u = 1 - this.seededRandom();
      const v = this.seededRandom();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return z * stdev + mean;
    }
    /**
     * Main corruption function
     * @param {Object} jmonObject - The JMON object to corrupt
     * @param {Number} entropy - Entropy level (0.0 to 1.0), overrides constructor value if provided
     * @returns {Object} Corrupted JMON object
     */
    corrupt(jmonObject, entropy = null) {
      const entropyLevel = entropy !== null ? entropy : this.options.entropy;
      const corrupted = JSON.parse(JSON.stringify(jmonObject));
      if (corrupted.tracks && Array.isArray(corrupted.tracks)) {
        corrupted.tracks = corrupted.tracks.map((track) => this.corruptTrack(track, entropyLevel));
        if (this.options.ghostTrack && corrupted.tracks.length > 0) {
          const ghostTracks = this.generateGhostTracks(corrupted.tracks, entropyLevel);
          corrupted.tracks.push(...ghostTracks);
        }
      }
      if (this.options.spectralCorruption && corrupted.audioGraph) {
        corrupted.audioGraph = this.corruptAudioGraph(corrupted.audioGraph, entropyLevel);
      }
      return corrupted;
    }
    /**
     * Corrupt a single track
     * @param {Object} track - JMON track object
     * @param {Number} entropy - Entropy level
     * @returns {Object} Corrupted track
     */
    corruptTrack(track, entropy) {
      const corruptedTrack = { ...track };
      if (!corruptedTrack.notes || !Array.isArray(corruptedTrack.notes)) {
        return corruptedTrack;
      }
      let jitterSequence = null;
      if (this.options.temporalJitter) {
        jitterSequence = this.generateJitterSequence(corruptedTrack.notes.length, entropy);
      }
      corruptedTrack.notes = corruptedTrack.notes.map((note, index) => this.corruptNote(note, index, entropy, jitterSequence)).filter((note) => note !== null);
      if (this.options.velocitySag && corruptedTrack.notes.length > 0) {
        corruptedTrack.notes = this.applyVelocitySag(corruptedTrack.notes, entropy);
      }
      return corruptedTrack;
    }
    /**
     * Generate jitter sequence for temporal instability
     * @param {Number} length - Number of notes
     * @param {Number} entropy - Entropy level
     * @returns {Array} Jitter values
     */
    generateJitterSequence(length, entropy) {
      if (this.options.jitterMethod === "brownian") {
        const bridge = new BrownianBridge(0, 0, length, entropy * 0.5);
        return bridge.generate();
      } else {
        const jitter = [];
        for (let i = 0; i < length; i++) {
          const noiseValue = this.perlin.noise(i * 0.1);
          jitter.push(noiseValue * entropy);
        }
        return jitter;
      }
    }
    /**
     * Corrupt a single note
     * @param {Object} note - JMON note object
     * @param {Number} index - Note index in sequence
     * @param {Number} entropy - Entropy level
     * @param {Array} jitterSequence - Pre-generated jitter values
     * @returns {Object|null} Corrupted note or null if dropped
     */
    corruptNote(note, index, entropy, jitterSequence) {
      if (this.options.noteAttrition && entropy > 0.7) {
        const dropProbability = (entropy - 0.7) * 0.5;
        if (this.seededRandom() < dropProbability) {
          return null;
        }
      }
      const corruptedNote = { ...note };
      if (this.options.temporalJitter && jitterSequence) {
        const jitter = jitterSequence[index] || 0;
        const maxJitter = 0.25;
        const deltaT = jitter * maxJitter * entropy;
        if (typeof corruptedNote.time === "number") {
          corruptedNote.time = Math.max(0, corruptedNote.time + deltaT);
        }
        if (typeof corruptedNote.duration === "number") {
          const durationJitter = this.gaussianRandom(0, 0.1 * entropy);
          corruptedNote.duration = Math.max(0.1, corruptedNote.duration * (1 + durationJitter));
        }
      }
      if (this.options.microtonalDrift) {
        const sigma = entropy * 0.5 * this.options.driftAmount;
        const microtuning = this.gaussianRandom(0, sigma);
        if (!corruptedNote.microtuning) {
          corruptedNote.microtuning = microtuning;
        } else {
          corruptedNote.microtuning += microtuning;
        }
      }
      return corruptedNote;
    }
    /**
     * Apply velocity sag over time (energy loss)
     * @param {Array} notes - Array of JMON notes
     * @param {Number} entropy - Entropy level
     * @returns {Array} Notes with velocity sag applied
     */
    applyVelocitySag(notes, entropy) {
      if (notes.length === 0) return notes;
      return notes.map((note, index) => {
        const sagAmount = entropy * 0.4;
        const progress = index / notes.length;
        const sagFactor = 1 - sagAmount * progress;
        const velocity = note.velocity !== void 0 ? note.velocity : 0.8;
        const saggedVelocity = Math.max(0.1, velocity * sagFactor);
        return {
          ...note,
          velocity: saggedVelocity
        };
      });
    }
    /**
     * Generate ghost tracks (semantic ghosting)
     *
     * Ghost tracks are delayed, blurred shadow layers — not parallel voicing.
     * They enter after the melody, use fewer anchor points, drift in time,
     * and sustain long notes that follow the melody's contour from a distance.
     *
     * @param {Array} tracks - Original JMON tracks
     * @param {Number} entropy - Entropy level
     * @returns {Array} Ghost tracks
     */
    generateGhostTracks(tracks, entropy) {
      const ghostTracks = [];
      const mult = this.options.ghostDurationMultiplier;
      const delay = this.options.ghostDelay;
      const drift = this.options.ghostDrift;
      for (const track of tracks) {
        if (!track.notes || track.notes.length === 0) continue;
        const pitches = track.notes.map((n) => typeof n.pitch === "number" ? n.pitch : 60);
        const uniquePitches = new Set(pitches);
        if (uniquePitches.size <= 3) continue;
        const trackEnd = Math.max(...track.notes.map((n) => (n.time || 0) + (n.duration || 0)));
        const ghostNotes = [];
        let nextAvailable = -Infinity;
        for (let i = 0; i < track.notes.length; i++) {
          const note = track.notes[i];
          const noteTime = note.time || 0;
          const driftOffset = this.perlin.noise(i * 0.15) * drift * entropy;
          const ghostTime = noteTime + delay + driftOffset;
          if (ghostTime < nextAvailable) continue;
          if (ghostTime >= trackEnd) continue;
          const originalPitch = typeof note.pitch === "number" ? note.pitch : 60;
          const ghostPitch = originalPitch + this.options.ghostOctaveShift * 12;
          const ghostDur = Math.min(note.duration * mult, trackEnd - ghostTime);
          if (ghostDur <= 0) continue;
          ghostNotes.push({
            pitch: ghostPitch,
            duration: ghostDur,
            time: ghostTime,
            velocity: (note.velocity || 0.8) * this.options.ghostVelocityMultiplier
          });
          nextAvailable = ghostTime + ghostDur;
        }
        if (ghostNotes.length === 0) continue;
        ghostTracks.push({
          label: `${track.label || "Track"} (Ghost)`,
          notes: ghostNotes,
          midiChannel: track.midiChannel || 0,
          synth: "Synth"
          // sustaining oscillator, not the melody's percussive synth
        });
      }
      return ghostTracks;
    }
    /**
     * Corrupt audio graph (spectral corruption)
     * @param {Object} audioGraph - JMON audioGraph object
     * @param {Number} entropy - Entropy level
     * @returns {Object} Corrupted audioGraph
     */
    corruptAudioGraph(audioGraph, entropy) {
      const corrupted = JSON.parse(JSON.stringify(audioGraph));
      if (corrupted.nodes) {
        corrupted.nodes = corrupted.nodes.map((node) => {
          if (node.type === "Distortion" || node.type === "BitCrusher") {
            if (!node.automation) {
              node.automation = {};
            }
            if (node.type === "Distortion") {
              node.automation.wet = this.generateAutomationCurve(entropy, 0, entropy);
            }
            if (node.type === "BitCrusher") {
              const minBits = Math.max(1, Math.floor(16 - entropy * 12));
              node.automation.bits = this.generateAutomationCurve(entropy, 16, minBits);
            }
          }
          return node;
        });
      }
      return corrupted;
    }
    /**
     * Generate automation curve
     * @param {Number} entropy - Entropy level
     * @param {Number} startValue - Starting value
     * @param {Number} endValue - Ending value
     * @returns {Array} Automation anchor points
     */
    generateAutomationCurve(entropy, startValue, endValue) {
      const points = [];
      const numPoints = Math.floor(4 + entropy * 8);
      for (let i = 0; i <= numPoints; i++) {
        const time = i / numPoints;
        const progress = Math.pow(time, 1 + entropy);
        const value = startValue + (endValue - startValue) * progress;
        points.push({
          time: time.toFixed(3),
          value
        });
      }
      return points;
    }
    /**
     * Apply all corruption functions to a JMON object
     * Alias for corrupt()
     */
    process(jmonObject, entropy = null) {
      return this.corrupt(jmonObject, entropy);
    }
    /**
     * Set entropy level
     * @param {Number} entropy - New entropy level (0.0 to 1.0)
     */
    setEntropy(entropy) {
      this.options.entropy = Math.max(0, Math.min(1, entropy));
    }
    /**
     * Get current entropy level
     * @returns {Number} Current entropy level
     */
    getEntropy() {
      return this.options.entropy;
    }
    /**
     * Reset random seed
     * @param {Number} seed - New seed value
     */
    setSeed(seed) {
      this.options.seed = seed;
      this.randomSeed = seed;
      this.perlin = new PerlinNoise(seed);
    }
  };
  function corruptJmon(jmonObject, entropy = 0.5, options = {}) {
    const corruptor = new Corruptor({ ...options, entropy });
    return corruptor.corrupt(jmonObject);
  }

  // src/algorithms/analysis/index.js
  var analysis_exports = {};
  __export(analysis_exports, {
    MusicalAnalysis: () => MusicalAnalysis,
    MusicalIndex: () => MusicalIndex
  });

  // src/algorithms/analysis/MusicalAnalysis.js
  var MusicalAnalysis = class {
    /**
     * Calculate Gini coefficient for inequality measurement
     * @param {number[]} values - Values to analyze
     * @param {number[]} [weights] - Optional weights
     * @returns {number} Gini coefficient (0-1)
     */
    static gini(values, weights) {
      if (values.length === 0) return 0;
      const n = values.length;
      const w = weights || Array(n).fill(1);
      const pairs = values.map((v, i) => ({ value: v, weight: w[i] })).sort((a, b) => a.value - b.value);
      const sortedValues = pairs.map((p) => p.value);
      const sortedWeights = pairs.map((p) => p.weight);
      const totalWeight = sortedWeights.reduce((sum, w2) => sum + w2, 0);
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n; i++) {
        const cumWeight = sortedWeights.slice(0, i + 1).reduce(
          (sum, w2) => sum + w2,
          0
        );
        numerator += sortedWeights[i] * (2 * cumWeight - sortedWeights[i] - totalWeight) * sortedValues[i];
        denominator += sortedWeights[i] * sortedValues[i] * totalWeight;
      }
      return denominator === 0 ? 0 : numerator / denominator;
    }
    /**
     * Calculate center of mass (balance point) of a sequence
     * @param {number[]} values - Values to analyze
     * @param {number[]} [weights] - Optional weights
     * @returns {number} Balance point
     */
    static balance(values, weights) {
      if (values.length === 0) return 0;
      const w = weights || Array(values.length).fill(1);
      const weightedSum = values.reduce((sum, val, i) => sum + val * w[i], 0);
      const totalWeight = w.reduce((sum, weight) => sum + weight, 0);
      return totalWeight === 0 ? 0 : weightedSum / totalWeight;
    }
    /**
     * Calculate autocorrelation for pattern detection
     * @param {number[]} values - Values to analyze
     * @param {number} [maxLag] - Maximum lag to calculate
     * @returns {number[]} Autocorrelation array
     */
    static autocorrelation(values, maxLag) {
      const n = values.length;
      const lag = maxLag || Math.floor(n / 2);
      const result = [];
      const mean = values.reduce((sum, val) => sum + val, 0) / n;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      for (let k = 0; k <= lag; k++) {
        let covariance = 0;
        for (let i = 0; i < n - k; i++) {
          covariance += (values[i] - mean) * (values[i + k] - mean);
        }
        covariance /= n - k;
        result.push(variance === 0 ? 0 : covariance / variance);
      }
      return result;
    }
    /**
     * Detect and score musical motifs
     * @param {number[]} values - Values to analyze
     * @param {number} [patternLength=3] - Length of patterns to detect
     * @returns {number} Motif score
     */
    static motif(values, patternLength = 3) {
      if (values.length < patternLength * 2) return 0;
      const patterns = /* @__PURE__ */ new Map();
      for (let i = 0; i <= values.length - patternLength; i++) {
        const pattern = values.slice(i, i + patternLength).join(",");
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
      const maxOccurrences = Math.max(...patterns.values());
      const totalPatterns = patterns.size;
      return totalPatterns === 0 ? 0 : maxOccurrences / totalPatterns;
    }
    /**
     * Calculate dissonance/scale conformity
     * @param {number[]} pitches - MIDI pitch values
     * @param {number[]} [scale=[0, 2, 4, 5, 7, 9, 11]] - Scale to check against
     * @returns {number} Dissonance score (0-1)
     */
    static dissonance(pitches, scale = [0, 2, 4, 5, 7, 9, 11]) {
      if (pitches.length === 0) return 0;
      let conformingNotes = 0;
      for (const pitch of pitches) {
        const pitchClass = (pitch % 12 + 12) % 12;
        if (scale.includes(pitchClass)) {
          conformingNotes++;
        }
      }
      return 1 - conformingNotes / pitches.length;
    }
    /**
     * Calculate rhythmic fit to a grid
     * @param {number[]} onsets - Onset times
     * @param {number} [gridDivision=16] - Grid division
     * @returns {number} Rhythmic alignment score
     */
    static rhythmic(onsets, gridDivision = 16) {
      if (onsets.length === 0) return 0;
      let gridAlignedCount = 0;
      const tolerance = 0.1;
      for (const onset of onsets) {
        const gridPosition = onset * gridDivision;
        const nearestGrid = Math.round(gridPosition);
        const deviation = Math.abs(gridPosition - nearestGrid);
        if (deviation <= tolerance) {
          gridAlignedCount++;
        }
      }
      return gridAlignedCount / onsets.length;
    }
    /**
     * Calculate Fibonacci/golden ratio index
     * @param {number[]} values - Values to analyze
     * @returns {number} Fibonacci index
     */
    static fibonacciIndex(values) {
      if (values.length < 2) return 0;
      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      let fibonacciScore = 0;
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] !== 0) {
          const ratio = values[i] / values[i - 1];
          const deviation = Math.abs(ratio - goldenRatio);
          fibonacciScore += 1 / (1 + deviation);
        }
      }
      return fibonacciScore / (values.length - 1);
    }
    /**
     * Calculate syncopation (off-beat emphasis)
     * @param {number[]} onsets - Onset times
     * @param {number} [beatDivision=4] - Beat division
     * @returns {number} Syncopation score
     */
    static syncopation(onsets, beatDivision = 4) {
      if (onsets.length === 0) return 0;
      let syncopatedCount = 0;
      for (const onset of onsets) {
        const beatPosition = onset * beatDivision % 1;
        const isOffBeat = beatPosition > 0.2 && beatPosition < 0.8 && Math.abs(beatPosition - 0.5) > 0.2;
        if (isOffBeat) {
          syncopatedCount++;
        }
      }
      return syncopatedCount / onsets.length;
    }
    /**
     * Calculate contour entropy (melodic direction randomness)
     * @param {number[]} pitches - Pitch values
     * @returns {number} Contour entropy
     */
    static contourEntropy(pitches) {
      if (pitches.length < 2) return 0;
      const directions = [];
      for (let i = 1; i < pitches.length; i++) {
        const diff = pitches[i] - pitches[i - 1];
        if (diff > 0) directions.push(1);
        else if (diff < 0) directions.push(-1);
        else directions.push(0);
      }
      const counts = { up: 0, down: 0, same: 0 };
      for (const dir of directions) {
        if (dir > 0) counts.up++;
        else if (dir < 0) counts.down++;
        else counts.same++;
      }
      const total = directions.length;
      const probabilities = [
        counts.up / total,
        counts.down / total,
        counts.same / total
      ].filter((p) => p > 0);
      return -probabilities.reduce((entropy, p) => entropy + p * Math.log2(p), 0);
    }
    /**
     * Calculate interval variance (pitch stability)
     * @param {number[]} pitches - Pitch values
     * @returns {number} Interval variance
     */
    static intervalVariance(pitches) {
      if (pitches.length < 2) return 0;
      const intervals = [];
      for (let i = 1; i < pitches.length; i++) {
        intervals.push(Math.abs(pitches[i] - pitches[i - 1]));
      }
      const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const variance = intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - mean, 2),
        0
      ) / intervals.length;
      return variance;
    }
    /**
     * Calculate note density (notes per unit time)
     * @param {JMonNote[]} notes - Array of notes
     * @param {number} [timeWindow=1] - Time window for density calculation
     * @returns {number} Note density
     */
    static density(notes, timeWindow = 1) {
      if (notes.length === 0) return 0;
      const numericTimes = notes.map((note) => {
        if (typeof note.time === "string") {
          return parseFloat(note.time) || 0;
        }
        return note.time || 0;
      });
      const minTime = Math.min(...numericTimes);
      const maxTime = Math.max(...numericTimes);
      const totalTime = maxTime - minTime || 1;
      return notes.length / (totalTime / timeWindow);
    }
    /**
     * Calculate gap variance (timing consistency)
     * @param {number[]} onsets - Onset times
     * @returns {number} Gap variance
     */
    static gapVariance(onsets) {
      if (onsets.length < 2) return 0;
      const gaps = [];
      for (let i = 1; i < onsets.length; i++) {
        gaps.push(onsets[i] - onsets[i - 1]);
      }
      const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
      const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length;
      return variance;
    }
    /**
     * Comprehensive analysis of a musical sequence
     * @param {JMonNote[]} notes - Array of notes to analyze
     * @param {AnalysisOptions} [options={}] - Analysis options
     * @returns {AnalysisResult} Analysis results
     */
    static analyze(notes, options = {}) {
      const { scale = [0, 2, 4, 5, 7, 9, 11] } = options;
      const pitches = notes.map((note) => {
        if (typeof note.note === "number") return note.note;
        if (typeof note.note === "string") {
          return 60;
        }
        return Array.isArray(note.note) ? note.note[0] : 60;
      });
      const onsets = notes.map((note) => {
        if (typeof note.time === "number") return note.time;
        return parseFloat(note.time) || 0;
      });
      return {
        gini: this.gini(pitches),
        balance: this.balance(pitches),
        motif: this.motif(pitches),
        dissonance: this.dissonance(pitches, scale),
        rhythmic: this.rhythmic(onsets),
        fibonacciIndex: this.fibonacciIndex(pitches),
        syncopation: this.syncopation(onsets),
        contourEntropy: this.contourEntropy(pitches),
        intervalVariance: this.intervalVariance(pitches),
        density: this.density(notes),
        gapVariance: this.gapVariance(onsets)
      };
    }
  };

  // src/algorithms/index.js
  init_CAVisualizer();

  // src/algorithms/visualization/fractals/FractalVisualizer.js
  init_PlotRenderer();
  var FractalVisualizer = class {
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
    static plotLogisticMap(rMin = 2.8, rMax = 4, rSteps = 1e3, iterations = 1e3, skipTransient = 500, options = {}) {
      const {
        title = "Logistic Map Bifurcation",
        width = 800,
        height = 600,
        colorScheme = "viridis"
      } = options;
      const plotData = [];
      for (let i = 0; i < rSteps; i++) {
        const r = rMin + i / rSteps * (rMax - rMin);
        let x = 0.5;
        for (let j = 0; j < skipTransient; j++) {
          x = r * x * (1 - x);
        }
        const attractors = /* @__PURE__ */ new Set();
        for (let j = 0; j < iterations; j++) {
          x = r * x * (1 - x);
          attractors.add(Math.round(x * 1e4) / 1e4);
        }
        attractors.forEach((value) => {
          plotData.push({
            x: r,
            y: value,
            color: this.getColorForValue(value, colorScheme)
          });
        });
      }
      const data = {
        x: plotData.map((d) => d.x),
        y: plotData.map((d) => d.y),
        color: plotData.map((d) => d.color)
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
        colorScheme = "plasma",
        canvas = null,
        resolution = fractal.width
      } = options;
      if (canvas) {
        return this.renderFractalCanvas(canvas, fractal, resolution, colorScheme);
      }
      const data = fractal.generate();
      const matrix = data.map(
        (row) => row.map((val) => val / fractal.maxIterations)
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
    static renderFractalCanvas(canvas, fractal, resolution, colorScheme = "plasma") {
      const ctx = canvas.getContext("2d");
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
    static plotMandelbrot(xMin = -2.5, xMax = 1, yMin = -1.25, yMax = 1.25, resolution = 400, maxIterations = 100, options = {}) {
      const {
        title = "Mandelbrot Set",
        width = 600,
        height = 600,
        colorScheme = "plasma",
        canvas = null
      } = options;
      if (canvas) {
        return this.renderMandelbrotCanvas(
          canvas,
          xMin,
          xMax,
          yMin,
          yMax,
          resolution,
          maxIterations,
          colorScheme
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
    static renderMandelbrotCanvas(canvas, xMin, xMax, yMin, yMax, resolution, maxIterations, colorScheme) {
      const ctx = canvas.getContext("2d");
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
          data[index] = color.r;
          data[index + 1] = color.g;
          data[index + 2] = color.b;
          data[index + 3] = 255;
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
        title = "Cellular Automata Evolution",
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
      const ctx = canvas.getContext("2d");
      const cellSize = options.cellSize || 4;
      canvas.width = history[0].length * cellSize;
      canvas.height = history.length * cellSize;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
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
        case "viridis":
          return `hsl(${240 + normalized * 120}, 60%, ${30 + normalized * 40}%)`;
        case "plasma":
          return `hsl(${300 - normalized * 60}, 80%, ${20 + normalized * 60}%)`;
        case "turbo":
          return `hsl(${normalized * 360}, 70%, 50%)`;
        case "heat":
          return `hsl(${(1 - normalized) * 60}, 100%, 50%)`;
        case "rainbow":
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
      if (colorStr.startsWith("hsl")) {
        const matches = colorStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (matches) {
          const h = parseInt(matches[1]) / 360;
          const s = parseInt(matches[2]) / 100;
          const l = parseInt(matches[3]) / 100;
          return this.hslToRgb(h, s, l);
        }
      }
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
        r = g = b = l;
      } else {
        const hue2rgb = (p2, q2, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
          if (t < 1 / 2) return q2;
          if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
          return p2;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
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
      return strips.map((strip) => {
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
      if (typeof window !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
      } else {
        console.warn("Canvas rendering not available in Node.js environment");
        return null;
      }
    }
  };

  // src/algorithms/index.js
  init_LoopVisualizer();
  init_PlotRenderer();
  init_audio();
  var theory = {
    harmony: harmony_default,
    rhythm: rhythm_default,
    motifs: {
      MotifBank
    }
  };
  var constants = {
    theory: MusicTheoryConstants,
    articulations: ARTICULATION_TYPES,
    ornaments: ORNAMENT_TYPES,
    // Convenience methods from ConstantsAPI
    list: ConstantsAPI.list.bind(ConstantsAPI),
    get: ConstantsAPI.get.bind(ConstantsAPI),
    describe: ConstantsAPI.describe.bind(ConstantsAPI),
    search: ConstantsAPI.search.bind(ConstantsAPI),
    listArticulations: ConstantsAPI.listArticulations.bind(ConstantsAPI),
    listOrnaments: ConstantsAPI.listOrnaments.bind(ConstantsAPI),
    listScales: ConstantsAPI.listScales.bind(ConstantsAPI),
    listIntervals: ConstantsAPI.listIntervals.bind(ConstantsAPI)
  };
  var generative = {
    automata: {
      Cellular: CellularAutomata
    },
    loops: { Loop },
    genetic: {
      Darwin
    },
    walks: {
      Random: RandomWalk,
      Chain,
      Phasor: {
        Vector: Phasor,
        System: PhasorSystem
      }
    },
    fractals: {
      Mandelbrot,
      Julia,
      BurningShip,
      Fractal,
      LogisticMap
    },
    minimalism: {
      Process: MinimalismProcess,
      Tintinnabuli
    }
    // Note: GaussianProcessRegressor removed to avoid @tangent.to/ds dependency
    // Import it separately if needed: import { GaussianProcessRegressor } from './generative/gaussian-processes/index.js';
  };
  var processors = {
    Corruptor,
    corruptJmon
  };
  var analysis = {
    ...analysis_exports
  };
  var visualization = {
    CAVisualizer,
    FractalVisualizer,
    LoopVisualizer,
    PlotRenderer
  };
  var utils = {
    ...utils_exports
  };
  var audio = audio_default;
  var algorithms_default = {
    theory,
    constants,
    generative,
    processors,
    analysis,
    visualization,
    audio,
    utils
  };

  // src/converters/midi.js
  init_audio();
  function writeVarLen(value) {
    const bytes = [];
    bytes.push(value & 127);
    value >>= 7;
    while (value > 0) {
      bytes.push(value & 127 | 128);
      value >>= 7;
    }
    return bytes.reverse();
  }
  function writeUint16(value) {
    return [value >> 8 & 255, value & 255];
  }
  function writeUint32(value) {
    return [value >> 24 & 255, value >> 16 & 255, value >> 8 & 255, value & 255];
  }
  function writeString(str) {
    return Array.from(str, (c) => c.charCodeAt(0));
  }
  function encodeTrack(events) {
    const data = [];
    let lastTick = 0;
    events.sort((a, b) => a.tick - b.tick || a.sortOrder - b.sortOrder);
    for (const evt of events) {
      const delta = evt.tick - lastTick;
      data.push(...writeVarLen(delta));
      data.push(...evt.bytes);
      lastTick = evt.tick;
    }
    data.push(0, 255, 47, 0);
    return data;
  }
  function buildMidiFile(composition) {
    const bpm = composition.tempo || composition.bpm || 120;
    const ticksPerBeat = 480;
    const rawTracks = composition.tracks || [];
    const tracksArray = Array.isArray(rawTracks) ? rawTracks : rawTracks && typeof rawTracks === "object" ? Object.values(rawTracks) : [];
    const trackChunks = [];
    const tempoEvents = [];
    const microsecondsPerBeat = Math.round(6e7 / bpm);
    tempoEvents.push({
      tick: 0,
      sortOrder: -1,
      bytes: [
        255,
        81,
        3,
        microsecondsPerBeat >> 16 & 255,
        microsecondsPerBeat >> 8 & 255,
        microsecondsPerBeat & 255
      ]
    });
    const title = composition.title || composition.metadata?.title || "";
    if (title) {
      const titleBytes = writeString(title);
      tempoEvents.push({
        tick: 0,
        sortOrder: -2,
        bytes: [255, 3, ...writeVarLen(titleBytes.length), ...titleBytes]
      });
    }
    trackChunks.push(encodeTrack(tempoEvents));
    for (const track of tracksArray) {
      const notesSrc = Array.isArray(track.events) ? track.events : Array.isArray(track.notes) ? track.notes : Array.isArray(track) ? track : [];
      const safeNotes = Array.isArray(notesSrc) ? notesSrc : [];
      const events = [];
      const label = track.label || track.name || "";
      if (label) {
        const labelBytes = writeString(label);
        events.push({
          tick: 0,
          sortOrder: -2,
          bytes: [255, 3, ...writeVarLen(labelBytes.length), ...labelBytes]
        });
      }
      let currentTime = 0;
      const notesWithTime = safeNotes.map((note) => {
        const t = note.time !== void 0 ? note.time : currentTime;
        currentTime = t + (note.duration || 1);
        return { ...note, time: t };
      });
      for (const note of notesWithTime) {
        const pitch = typeof note.pitch === "number" ? note.pitch : 60;
        if (pitch === null || pitch === void 0) continue;
        const velocity = Math.round((note.velocity || 0.8) * 127);
        const startTick = Math.round((note.time || 0) * ticksPerBeat);
        const endTick = Math.round(((note.time || 0) + (note.duration || 1)) * ticksPerBeat);
        const channel = 0;
        events.push({
          tick: startTick,
          sortOrder: 1,
          bytes: [144 | channel, pitch, velocity]
        });
        events.push({
          tick: endTick,
          sortOrder: 0,
          // note-off sorts before note-on at same tick
          bytes: [128 | channel, pitch, 0]
        });
      }
      trackChunks.push(encodeTrack(events));
    }
    const numTracks = trackChunks.length;
    const fileBytes = [];
    fileBytes.push(...writeString("MThd"));
    fileBytes.push(...writeUint32(6));
    fileBytes.push(...writeUint16(1));
    fileBytes.push(...writeUint16(numTracks));
    fileBytes.push(...writeUint16(ticksPerBeat));
    for (const trackData of trackChunks) {
      fileBytes.push(...writeString("MTrk"));
      fileBytes.push(...writeUint32(trackData.length));
      fileBytes.push(...trackData);
    }
    return new Uint8Array(fileBytes);
  }
  function midi(composition, options = {}) {
    const { filename = "composition.mid" } = options;
    const bytes = buildMidiFile(composition);
    const blob = new Blob([bytes], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.textContent = `Download ${filename}`;
    return a;
  }

  // src/converters/midi-to-jmon.js
  var MidiToJmon = class _MidiToJmon {
    constructor(options = {}) {
      this.options = {
        Tone: null,
        trackNaming: "auto",
        // 'auto', 'numbered', 'channel', 'instrument'
        mergeDrums: true,
        quantize: null,
        // e.g., 0.25 for 16th note quantization
        includeModulations: true,
        includeTempo: true,
        includeKeySignature: true,
        ...options
      };
    }
    /**
     * Static conversion method
     * @param {ArrayBuffer|Uint8Array} midiData - MIDI file data
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} JMON composition
     */
    static async convert(midiData, options = {}) {
      const converter = new _MidiToJmon(options);
      return await converter.convertToJmon(midiData);
    }
    /**
     * Main conversion method
     * @param {ArrayBuffer|Uint8Array} midiData - MIDI file data
     * @returns {Promise<Object>} JMON composition
     */
    convertToJmon(midiData) {
      const Tone = this.initializeTone();
      let parsed;
      try {
        parsed = new Tone.Midi(midiData);
      } catch (error) {
        throw new Error(`Failed to parse MIDI file: ${error.message}`);
      }
      const composition = this.buildJmonComposition(parsed, Tone);
      const validator = new JmonValidator();
      const { valid, normalized, errors } = validator.validateAndNormalize(
        composition
      );
      if (!valid) {
        console.warn("Generated JMON failed validation:", errors);
      }
      return valid ? normalized : composition;
    }
    /**
     * Initialize Tone.js instance
     * @returns {Object} Tone.js instance
     */
    initializeTone() {
      const Tone = this.options.Tone;
      if (!Tone) {
        throw new Error("Tone.js instance required. Please provide Tone via options: { Tone: Tone }");
      }
      return Tone;
    }
    /**
     * Build JMON composition from parsed MIDI
     * @param {Object} parsed - Parsed MIDI from Tone.js
     * @param {Object} Tone - Tone.js instance
     * @returns {Object} JMON composition
     */
    buildJmonComposition(parsed, Tone) {
      const composition = {
        format: "jmon",
        version: "1.0",
        tempo: this.extractTempo(parsed),
        tracks: this.convertTracks(parsed.tracks, Tone, parsed)
      };
      const timeSignature = this.extractTimeSignature(parsed);
      if (timeSignature) {
        composition.timeSignature = timeSignature;
      }
      const keySignature = this.extractKeySignature(parsed);
      if (keySignature) {
        composition.keySignature = keySignature;
      }
      const metadata = this.extractMetadata(parsed);
      if (Object.keys(metadata).length > 0) {
        composition.metadata = metadata;
      }
      if (this.options.includeTempo && this.hasTempoChanges(parsed)) {
        composition.tempoMap = this.extractTempoMap(parsed);
      }
      if (this.hasTimeSignatureChanges(parsed)) {
        composition.timeSignatureMap = this.extractTimeSignatureMap(parsed);
      }
      return composition;
    }
    /**
     * Convert MIDI tracks to JMON tracks
     * @param {Array} tracks - MIDI tracks from Tone.js
     * @param {Object} Tone - Tone.js instance
     * @param {Object} parsed - Full parsed MIDI data
     * @returns {Array} JMON tracks
     */
    convertTracks(tracks, Tone, parsed) {
      const jmonTracks = [];
      let trackIndex = 0;
      for (const track of tracks) {
        if (!track.notes || track.notes.length === 0) {
          continue;
        }
        const trackName = this.generateTrackName(track, trackIndex, parsed);
        const isDrumTrack = this.isDrumTrack(track);
        const notes = track.notes.map(
          (note) => this.convertNote(note, Tone, track)
        );
        const processedNotes = this.options.quantize ? this.quantizeNotes(notes, this.options.quantize) : notes;
        const jmonTrack = {
          label: trackName,
          notes: processedNotes
        };
        if (track.channel !== void 0) {
          jmonTrack.midiChannel = track.channel;
        }
        if (track.instrument) {
          jmonTrack.synth = {
            type: isDrumTrack ? "Sampler" : "PolySynth",
            options: this.getInstrumentOptions(track.instrument, isDrumTrack)
          };
        }
        if (this.options.includeModulations && track.controlChanges) {
          const modulations = this.extractModulations(track.controlChanges);
          if (modulations.length > 0) {
            this.applyModulationsToTrack(jmonTrack, modulations);
          }
        }
        jmonTracks.push(jmonTrack);
        trackIndex++;
      }
      return jmonTracks;
    }
    /**
     * Convert MIDI note to JMON note
     * @param {Object} note - MIDI note from Tone.js
     * @param {Object} Tone - Tone.js instance
     * @param {Object} track - Parent track for context
     * @returns {Object} JMON note
     */
    convertNote(note, Tone, track) {
      const jmonNote = {
        pitch: note.midi,
        // Use MIDI number as primary format
        time: note.time,
        // Tone.js already converts to seconds, we'll convert to quarters
        duration: this.convertDurationToNoteValue(note.duration),
        velocity: note.velocity
      };
      const bpm = note.tempo || 120;
      jmonNote.time = this.convertSecondsToQuarterNotes(note.time, bpm);
      if (this.options.includeModulations && note.controlChanges) {
        const noteModulations = this.convertNoteModulations(note.controlChanges);
        if (noteModulations.length > 0) {
          jmonNote.modulations = noteModulations;
        }
      }
      return jmonNote;
    }
    /**
     * Generate track name based on naming strategy
     * @param {Object} track - MIDI track
     * @param {number} index - Track index
     * @param {Object} parsed - Full parsed MIDI
     * @returns {string} Track name
     */
    generateTrackName(track, index, parsed) {
      switch (this.options.trackNaming) {
        case "numbered":
          return `Track ${index + 1}`;
        case "channel":
          return `Channel ${(track.channel || 0) + 1}`;
        case "instrument":
          if (track.instrument) {
            return track.instrument.name || `Instrument ${track.instrument.number}`;
          }
          return `Track ${index + 1}`;
        case "auto":
        default:
          if (track.name && track.name.trim()) {
            return track.name.trim();
          }
          if (this.isDrumTrack(track)) {
            return "Drums";
          }
          if (track.instrument && track.instrument.name) {
            return track.instrument.name;
          }
          if (track.channel !== void 0) {
            return track.channel === 9 ? "Drums" : `Channel ${track.channel + 1}`;
          }
          return `Track ${index + 1}`;
      }
    }
    /**
     * Check if track is a drum track (channel 10/9 in MIDI)
     * @param {Object} track - MIDI track
     * @returns {boolean} True if drum track
     */
    isDrumTrack(track) {
      return track.channel === 9;
    }
    /**
     * Get instrument options for synth configuration
     * @param {Object} instrument - MIDI instrument info
     * @param {boolean} isDrum - Whether this is a drum track
     * @returns {Object} Synth options
     */
    getInstrumentOptions(instrument, isDrum) {
      if (isDrum) {
        return {
          envelope: {
            enabled: true,
            attack: 0.02,
            decay: 0.1,
            sustain: 0.8,
            release: 0.3
          }
        };
      }
      return {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.7,
          release: 1
        }
      };
    }
    /**
     * Extract tempo from MIDI
     * @param {Object} parsed - Parsed MIDI
     * @returns {number} BPM
     */
    extractTempo(parsed) {
      if (parsed.header && parsed.header.tempos && parsed.header.tempos.length > 0) {
        return Math.round(parsed.header.tempos[0].bpm);
      }
      for (const track of parsed.tracks) {
        if (track.tempoEvents && track.tempoEvents.length > 0) {
          return Math.round(track.tempoEvents[0].bpm);
        }
      }
      return 120;
    }
    /**
     * Extract time signature from MIDI
     * @param {Object} parsed - Parsed MIDI
     * @returns {string|null} Time signature like "4/4"
     */
    extractTimeSignature(parsed) {
      if (parsed.header && parsed.header.timeSignatures && parsed.header.timeSignatures.length > 0) {
        const ts = parsed.header.timeSignatures[0];
        return `${ts.numerator}/${ts.denominator}`;
      }
      for (const track of parsed.tracks) {
        if (track.timeSignatureEvents && track.timeSignatureEvents.length > 0) {
          const ts = track.timeSignatureEvents[0];
          return `${ts.numerator}/${ts.denominator}`;
        }
      }
      return null;
    }
    /**
     * Extract key signature from MIDI
     * @param {Object} parsed - Parsed MIDI
     * @returns {string|null} Key signature like "C", "G", "Dm"
     */
    extractKeySignature(parsed) {
      if (!this.options.includeKeySignature) {
        return null;
      }
      let keySignature = null;
      let earliestTime = Infinity;
      if (parsed.header && parsed.header.keySignatures && parsed.header.keySignatures.length > 0) {
        const ks = parsed.header.keySignatures[0];
        keySignature = this.midiKeySignatureToString(ks.key, ks.scale);
      }
      for (const track of parsed.tracks) {
        if (track.meta) {
          for (const meta of track.meta) {
            if (meta.type === "keySignature" && meta.time < earliestTime) {
              earliestTime = meta.time;
              keySignature = this.midiKeySignatureToString(meta.key, meta.scale);
            }
          }
        }
        if (track.keySignatures && track.keySignatures.length > 0) {
          const ks = track.keySignatures[0];
          if (ks.ticks < earliestTime) {
            earliestTime = ks.ticks;
            keySignature = this.midiKeySignatureToString(ks.key, ks.scale);
          }
        }
      }
      return keySignature;
    }
    /**
     * Convert MIDI key signature to string representation
     * @param {number} key - Number of sharps (positive) or flats (negative)
     * @param {string|number} scale - 'major'/'minor' or 0/1 (0=major, 1=minor)
     * @returns {string} Key signature like "C", "G", "Dm"
     */
    midiKeySignatureToString(key, scale) {
      const isMinor = scale === "minor" || scale === 1 || scale === true;
      const majorKeys = [
        "C",
        "G",
        "D",
        "A",
        "E",
        "B",
        "F#",
        "C#",
        // Sharps
        "C",
        "F",
        "Bb",
        "Eb",
        "Ab",
        "Db",
        "Gb",
        "Cb"
      ];
      const minorKeys = [
        "A",
        "E",
        "B",
        "F#",
        "C#",
        "G#",
        "D#",
        "A#",
        // Sharps
        "A",
        "D",
        "G",
        "C",
        "F",
        "Bb",
        "Eb",
        "Ab"
      ];
      let keyName;
      if (key >= 0) {
        const index = Math.min(key, 7);
        keyName = isMinor ? minorKeys[index] : majorKeys[index];
      } else {
        const index = Math.min(Math.abs(key), 7);
        keyName = isMinor ? minorKeys[8 + index] : majorKeys[8 + index];
      }
      return isMinor ? `${keyName}m` : keyName;
    }
    /**
     * Extract metadata from MIDI
     * @param {Object} parsed - Parsed MIDI
     * @returns {Object} Metadata object
     */
    extractMetadata(parsed) {
      const metadata = {};
      for (const track of parsed.tracks) {
        if (track.meta) {
          for (const meta of track.meta) {
            switch (meta.type) {
              case "trackName":
              case "text":
                if (!metadata.title && meta.text && meta.text.trim()) {
                  metadata.title = meta.text.trim();
                }
                break;
              case "copyright":
                if (meta.text && meta.text.trim()) {
                  metadata.copyright = meta.text.trim();
                }
                break;
              case "composer":
                if (meta.text && meta.text.trim()) {
                  metadata.composer = meta.text.trim();
                }
                break;
            }
          }
        }
      }
      return metadata;
    }
    /**
     * Check if MIDI has tempo changes
     * @param {Object} parsed - Parsed MIDI
     * @returns {boolean} True if has tempo changes
     */
    hasTempoChanges(parsed) {
      if (parsed.header && parsed.header.tempos && parsed.header.tempos.length > 1) {
        return true;
      }
      for (const track of parsed.tracks) {
        if (track.tempoEvents && track.tempoEvents.length > 1) {
          return true;
        }
      }
      return false;
    }
    /**
     * Extract tempo map for tempo changes
     * @param {Object} parsed - Parsed MIDI
     * @returns {Array} Tempo map events
     */
    extractTempoMap(parsed) {
      const tempoMap = [];
      const allTempoEvents = [];
      if (parsed.header && parsed.header.tempos) {
        allTempoEvents.push(...parsed.header.tempos.map((t) => ({
          time: t.time,
          tempo: Math.round(t.bpm)
        })));
      }
      for (const track of parsed.tracks) {
        if (track.tempoEvents) {
          allTempoEvents.push(...track.tempoEvents.map((t) => ({
            time: t.time,
            tempo: Math.round(t.bpm)
          })));
        }
      }
      allTempoEvents.sort((a, b) => a.time - b.time);
      for (const event of allTempoEvents) {
        tempoMap.push({
          time: this.convertSecondsToQuarterNotes(event.time, event.tempo),
          tempo: event.tempo
        });
      }
      return tempoMap;
    }
    /**
     * Check if MIDI has time signature changes
     * @param {Object} parsed - Parsed MIDI
     * @returns {boolean} True if has time signature changes
     */
    hasTimeSignatureChanges(parsed) {
      if (parsed.header && parsed.header.timeSignatures && parsed.header.timeSignatures.length > 1) {
        return true;
      }
      for (const track of parsed.tracks) {
        if (track.timeSignatureEvents && track.timeSignatureEvents.length > 1) {
          return true;
        }
      }
      return false;
    }
    /**
     * Extract time signature map for time signature changes
     * @param {Object} parsed - Parsed MIDI
     * @returns {Array} Time signature map events
     */
    extractTimeSignatureMap(parsed) {
      const timeSignatureMap = [];
      const allTSEvents = [];
      if (parsed.header && parsed.header.timeSignatures) {
        allTSEvents.push(...parsed.header.timeSignatures);
      }
      for (const track of parsed.tracks) {
        if (track.timeSignatureEvents) {
          allTSEvents.push(...track.timeSignatureEvents);
        }
      }
      allTSEvents.sort((a, b) => a.time - b.time);
      for (const event of allTSEvents) {
        timeSignatureMap.push({
          time: this.convertSecondsToQuarterNotes(event.time, 120),
          // Use default tempo for conversion
          timeSignature: `${event.numerator}/${event.denominator}`
        });
      }
      return timeSignatureMap;
    }
    /**
     * Convert seconds to quarter notes
     * @param {number} seconds - Time in seconds
     * @param {number} bpm - Beats per minute
     * @returns {number} Time in quarter notes
     */
    convertSecondsToQuarterNotes(seconds, bpm) {
      const quarterNoteLength = 60 / bpm;
      return seconds / quarterNoteLength;
    }
    /**
     * Convert duration to note value string
     * @param {number} duration - Duration in seconds
     * @returns {string} Note value like "4n", "8n"
     */
    convertDurationToNoteValue(duration) {
      const quarterNote = 0.5;
      const ratio = duration / quarterNote;
      if (ratio >= 3.5) return "1n";
      if (ratio >= 1.75) return "2n";
      if (ratio >= 0.875) return "4n";
      if (ratio >= 0.4375) return "8n";
      if (ratio >= 0.21875) return "16n";
      if (ratio >= 0.109375) return "32n";
      return "16n";
    }
    /**
     * Extract modulations from MIDI control changes
     * @param {Object} controlChanges - MIDI CC events
     * @returns {Array} Modulation events
     */
    extractModulations(controlChanges) {
      const modulations = [];
      for (const [cc, events] of Object.entries(controlChanges)) {
        const ccNumber = parseInt(cc);
        for (const event of events) {
          const modulation = {
            type: "cc",
            controller: ccNumber,
            value: event.value,
            time: this.convertSecondsToQuarterNotes(event.time, 120)
          };
          modulations.push(modulation);
        }
      }
      return modulations;
    }
    /**
     * Convert note-level modulations
     * @param {Object} controlChanges - Note-level CC events
     * @returns {Array} Note modulation events
     */
    convertNoteModulations(controlChanges) {
      return this.extractModulations(controlChanges);
    }
    /**
     * Apply modulations to track
     * @param {Object} track - JMON track
     * @param {Array} modulations - Modulation events
     */
    applyModulationsToTrack(track, modulations) {
      if (modulations.length > 0) {
        track.automation = [{
          id: "midi_cc",
          target: "midi.cc1",
          // Default to modulation wheel
          anchorPoints: modulations.map((mod) => ({
            time: mod.time,
            value: mod.value
          }))
        }];
      }
    }
    /**
     * Quantize notes to grid
     * @param {Array} notes - Notes to quantize
     * @param {number} grid - Grid size in quarter notes
     * @returns {Array} Quantized notes
     */
    quantizeNotes(notes, grid) {
      return notes.map((note) => ({
        ...note,
        time: Math.round(note.time / grid) * grid
      }));
    }
  };
  async function midiToJmon(midiData, options = {}) {
    const isArrayBuffer = typeof ArrayBuffer !== "undefined" && midiData instanceof ArrayBuffer;
    const isUint8Array = typeof Uint8Array !== "undefined" && midiData instanceof Uint8Array;
    if (!isArrayBuffer && !isUint8Array) {
      throw new TypeError("midiToJmon: 'midiData' must be an ArrayBuffer or Uint8Array");
    }
    return await MidiToJmon.convert(midiData, options);
  }

  // src/converters/index.js
  init_tonejs();

  // src/converters/wav.js
  init_audio();
  init_gm_instruments();
  function wav(composition, options = {}) {
    return {
      sampleRate: options.sampleRate || 44100,
      duration: options.duration || 10,
      channels: options.channels || 1,
      tempo: composition.tempo || composition.bpm || 120,
      notes: composition.tracks?.flatMap((t) => t.notes) || []
    };
  }
  async function downloadWav(composition, Tone, filename = "composition.wav", duration) {
    const { normalizeAudioGraph: normalizeAudioGraph2 } = await Promise.resolve().then(() => (init_normalize(), normalize_exports));
    normalizeAudioGraph2(composition);
    const maxTime = composition.tracks?.reduce((max, track) => {
      const events = track.events || track.notes || [];
      const trackMax = events.reduce((tMax, note) => {
        const endTime = (note.time || 0) + (note.duration || 0);
        return Math.max(tMax, endTime);
      }, 0);
      return Math.max(max, trackMax);
    }, 0) || 4;
    const tempo = composition.tempo || 120;
    const secondsPerQuarterNote = 60 / tempo;
    const calculatedDuration = maxTime * secondsPerQuarterNote + 1;
    const finalDuration = duration || calculatedDuration;
    const buffer = await Tone.Offline(async ({ transport }) => {
      transport.bpm.value = tempo;
      const graphInstruments = await buildAudioGraphInstruments(composition, Tone);
      const compiledModulations = [];
      const tracks = composition.tracks || [];
      tracks.forEach((track, index) => {
        try {
          const compiled = compileEvents(track);
          compiledModulations[index] = compiled.modulations || [];
        } catch (e) {
          console.warn(`[WAV] Failed to compile modulations for track ${index}:`, e);
          compiledModulations[index] = [];
        }
      });
      const trackSynths = [];
      const samplers = [];
      tracks.forEach((track, trackIndex) => {
        const synthRef = track.synthRef;
        const trackModulations = compiledModulations[trackIndex] || [];
        let synth = null;
        const gmProgram = typeof track.synth === "number" ? track.synth : track.instrument;
        if (synthRef && graphInstruments && graphInstruments[synthRef]) {
          synth = graphInstruments[synthRef];
        } else if (gmProgram !== void 0) {
          const urls = generateSamplerUrls(gmProgram);
          synth = new Tone.Sampler({
            urls,
            baseUrl: ""
          }).toDestination();
          samplers.push(synth);
          console.log(`[WAV] Creating Sampler for GM instrument ${gmProgram}`);
        } else {
          const synthType = track.synth || "PolySynth";
          try {
            synth = new Tone[synthType]().toDestination();
          } catch (e) {
            synth = new Tone.PolySynth().toDestination();
          }
        }
        const vibratoMods = trackModulations.filter(
          (m) => m.type === "pitch" && m.subtype === "vibrato"
        );
        const tremoloMods = trackModulations.filter(
          (m) => m.type === "amplitude" && m.subtype === "tremolo"
        );
        let vibratoEffect = null;
        let tremoloEffect = null;
        if (vibratoMods.length > 0 || tremoloMods.length > 0) {
          if (!synthRef || !graphInstruments?.[synthRef]) {
            synth.disconnect();
          }
          if (vibratoMods.length > 0) {
            const defaultVibrato = vibratoMods[0];
            vibratoEffect = new Tone.Vibrato({
              frequency: defaultVibrato.rate || 5,
              depth: (defaultVibrato.depth || 50) / 100
            });
            vibratoEffect.wet.value = 0;
          }
          if (tremoloMods.length > 0) {
            const defaultTremolo = tremoloMods[0];
            tremoloEffect = new Tone.Tremolo({
              frequency: defaultTremolo.rate || 8,
              depth: defaultTremolo.depth || 0.3
            }).start();
            tremoloEffect.wet.value = 0;
          }
          if (vibratoEffect && tremoloEffect) {
            synth.connect(vibratoEffect);
            vibratoEffect.connect(tremoloEffect);
            tremoloEffect.toDestination();
          } else if (vibratoEffect) {
            synth.connect(vibratoEffect);
            vibratoEffect.toDestination();
          } else if (tremoloEffect) {
            synth.connect(tremoloEffect);
            tremoloEffect.toDestination();
          }
        }
        trackSynths.push({ synth, vibratoEffect, tremoloEffect });
      });
      console.log(`[WAV] Waiting for ${samplers.length} sampler(s) to load...`);
      await Promise.all(samplers.map((s) => s.loaded));
      await Tone.loaded();
      console.log("[WAV] Samples loaded, scheduling notes");
      tracks.forEach((track, trackIndex) => {
        const notes = track.events || track.notes || [];
        const trackModulations = compiledModulations[trackIndex] || [];
        const { synth, vibratoEffect, tremoloEffect } = trackSynths[trackIndex];
        trackModulations.forEach((mod) => {
          const startTime = mod.start * secondsPerQuarterNote;
          const endTime = mod.end * secondsPerQuarterNote;
          if (mod.type === "pitch" && mod.subtype === "vibrato" && vibratoEffect) {
            transport.schedule(() => {
              vibratoEffect.frequency.value = mod.rate || 5;
              vibratoEffect.depth.value = (mod.depth || 50) / 100;
              vibratoEffect.wet.value = 1;
            }, startTime);
            transport.schedule(() => {
              vibratoEffect.wet.value = 0;
            }, endTime);
          }
          if (mod.type === "amplitude" && mod.subtype === "tremolo" && tremoloEffect) {
            transport.schedule(() => {
              tremoloEffect.frequency.value = mod.rate || 8;
              tremoloEffect.depth.value = mod.depth || 0.3;
              tremoloEffect.wet.value = 1;
            }, startTime);
            transport.schedule(() => {
              tremoloEffect.wet.value = 0;
            }, endTime);
          }
        });
        const modsByNote = {};
        trackModulations.forEach((mod) => {
          if (!modsByNote[mod.index]) modsByNote[mod.index] = [];
          modsByNote[mod.index].push(mod);
        });
        notes.forEach((note, noteIndex) => {
          const time = (note.time || 0) * secondsPerQuarterNote;
          const noteDuration = (note.duration || 1) * secondsPerQuarterNote;
          const noteMods = modsByNote[noteIndex] || [];
          const glissando = noteMods.find(
            (m) => m.type === "pitch" && (m.subtype === "glissando" || m.subtype === "portamento")
          );
          const mt = note.microtuning || 0;
          if (Array.isArray(note.pitch)) {
            const chordNotes = note.pitch.map(
              (p) => typeof p === "number" ? mt ? Tone.Frequency(p + mt, "midi").toFrequency() : Tone.Frequency(p, "midi").toNote() : p
            );
            synth.triggerAttackRelease(chordNotes, noteDuration, time, note.velocity || 0.8);
          } else {
            const noteName = typeof note.pitch === "number" ? Tone.Frequency(note.pitch, "midi").toNote() : note.pitch;
            if (glissando && glissando.to !== void 0) {
              const toNote = typeof glissando.to === "number" ? Tone.Frequency(glissando.to, "midi").toNote() : glissando.to;
              const startFreq = Tone.Frequency(noteName).toFrequency();
              const endFreq = Tone.Frequency(toNote).toFrequency();
              const cents = 1200 * Math.log2(endFreq / startFreq);
              const microtuningCents = mt * 100;
              if (synth.detune) {
                synth.triggerAttack(noteName, time, note.velocity || 0.8);
                synth.detune.setValueAtTime(microtuningCents, time);
                synth.detune.linearRampToValueAtTime(microtuningCents + cents, time + noteDuration);
                synth.triggerRelease(time + noteDuration);
              } else {
                const glissSynth = new Tone.MonoSynth().toDestination();
                glissSynth.triggerAttack(noteName, time, note.velocity || 0.8);
                glissSynth.detune.setValueAtTime(microtuningCents, time);
                glissSynth.detune.linearRampToValueAtTime(microtuningCents + cents, time + noteDuration);
                glissSynth.triggerRelease(time + noteDuration);
              }
            } else {
              const playNote = mt ? Tone.Frequency(note.pitch + mt, "midi").toFrequency() : noteName;
              synth.triggerAttackRelease(playNote, noteDuration, time, note.velocity || 0.8);
            }
          }
        });
      });
      transport.start(0);
    }, finalDuration);
    const wavBlob = await audioBufferToWav(buffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.textContent = `Download ${filename}`;
    return a;
  }
  async function buildAudioGraphInstruments(composition, Tone) {
    if (!composition.audioGraph || !Array.isArray(composition.audioGraph)) {
      return null;
    }
    const map = {};
    const { SYNTHESIZER_TYPES: SYNTHESIZER_TYPES2, ALL_EFFECTS: ALL_EFFECTS2 } = await Promise.resolve().then(() => (init_audio_effects(), audio_effects_exports));
    try {
      composition.audioGraph.forEach((node) => {
        const { id, type, options = {} } = node;
        if (!id || !type) return;
        let instrument = null;
        if (SYNTHESIZER_TYPES2.includes(type)) {
          try {
            instrument = new Tone[type](options);
          } catch (e) {
            console.warn(`Failed to create ${type}, using PolySynth:`, e);
            instrument = new Tone.PolySynth();
          }
        } else if (ALL_EFFECTS2.includes(type)) {
          try {
            instrument = new Tone[type](options);
          } catch (e) {
            console.warn(`Failed to create ${type} effect:`, e);
            instrument = null;
          }
        } else if (type === "Destination") {
          map[id] = Tone.Destination;
        }
        if (instrument) {
          map[id] = instrument;
        }
      });
      composition.audioGraph.forEach((node) => {
        const { id, target } = node;
        if (!id || !map[id] || map[id] === Tone.Destination) return;
        const currentNode = map[id];
        if (target && map[target]) {
          if (map[target] === Tone.Destination) {
            currentNode.toDestination();
          } else {
            currentNode.connect(map[target]);
          }
        } else {
          currentNode.toDestination();
        }
      });
      return map;
    } catch (e) {
      console.error("Failed building audioGraph instruments:", e);
      return null;
    }
  }
  function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    const writeString2 = (offset2, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset2 + i, string.charCodeAt(i));
      }
    };
    writeString2(0, "RIFF");
    view.setUint32(4, 36 + length, true);
    writeString2(8, "WAVE");
    writeString2(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString2(36, "data");
    view.setUint32(40, length, true);
    const channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
        offset += 2;
      }
    }
    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  // src/converters/supercollider.js
  var Supercollider = class {
    static convert(composition) {
      const title = composition.metadata?.name || "Untitled";
      let sc = `// SuperCollider script generated from JMON
// Title: ${title}
`;
      const notes = composition.tracks?.[0]?.notes || [];
      notes.forEach((note) => {
        sc += `Synth("default", ["freq", ${note.pitch}, "dur", ${note.duration}]);
`;
      });
      return sc;
    }
  };
  function supercollider(composition) {
    return Supercollider.convert(composition);
  }

  // src/converters/verovio.js
  function musicxml(composition) {
    const title = composition.title || composition.metadata?.title || "Untitled";
    const tempo = composition.tempo || 120;
    const timeSignature = composition.timeSignature || "4/4";
    const keySignature = composition.keySignature || "C";
    const tracks = composition.tracks || [];
    const [beatsPerMeasure, beatValue] = timeSignature.split("/").map(Number);
    const measureDuration = beatsPerMeasure * (4 / beatValue);
    const { fifths, mode } = parseKeySignature(keySignature);
    const validTracks = tracks.filter((t) => t?.notes?.length);
    if (validTracks.length === 0) {
      return createEmptyMusicXML(title, tempo, beatsPerMeasure, beatValue, fifths, mode);
    }
    const tracksWithTime = validTracks.map((track) => {
      let currentTime = 0;
      const notesWithTime = track.notes.map((note) => {
        const noteWithTime = { ...note, time: note.time !== void 0 ? note.time : currentTime };
        currentTime += note.duration || 1;
        return noteWithTime;
      });
      return { ...track, notes: notesWithTime };
    });
    const gridSize = 0.25;
    const quantizedTracks = tracksWithTime.map((track) => ({
      ...track,
      notes: track.notes.map((note) => ({
        ...note,
        time: Math.round((note.time || 0) / gridSize) * gridSize,
        duration: Math.max(gridSize, Math.round((note.duration || 1) / gridSize) * gridSize)
      }))
    }));
    const totalDuration = quantizedTracks.reduce((maxDur, track) => {
      const trackEnd = track.notes.reduce((max, note) => {
        return Math.max(max, (note.time || 0) + (note.duration || 1));
      }, 0);
      return Math.max(maxDur, trackEnd);
    }, 0);
    const trackMeasures = quantizedTracks.map((track) => {
      return splitIntoMeasures(track.notes, measureDuration, totalDuration);
    });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n';
    xml += '<score-partwise version="3.1">\n';
    xml += "  <work>\n";
    xml += `    <work-title>${escapeXML(title)}</work-title>
`;
    xml += "  </work>\n";
    xml += "  <part-list>\n";
    validTracks.forEach((track, index) => {
      const partId = `P${index + 1}`;
      const partName = track.label || `Track ${index + 1}`;
      xml += `    <score-part id="${partId}">
`;
      xml += `      <part-name>${escapeXML(partName)}</part-name>
`;
      xml += "    </score-part>\n";
    });
    xml += "  </part-list>\n";
    validTracks.forEach((track, trackIndex) => {
      const partId = `P${trackIndex + 1}`;
      const clef = track.clef || "treble";
      const measures = trackMeasures[trackIndex];
      xml += `  <part id="${partId}">
`;
      measures.forEach((measure, measureIndex) => {
        const measureNumber = measureIndex + 1;
        xml += `    <measure number="${measureNumber}">
`;
        if (measureIndex === 0) {
          xml += "      <attributes>\n";
          xml += "        <divisions>4</divisions>\n";
          xml += `        <key>
`;
          xml += `          <fifths>${fifths}</fifths>
`;
          xml += `          <mode>${mode}</mode>
`;
          xml += `        </key>
`;
          xml += `        <time>
`;
          xml += `          <beats>${beatsPerMeasure}</beats>
`;
          xml += `          <beat-type>${beatValue}</beat-type>
`;
          xml += `        </time>
`;
          xml += `        <clef>
`;
          xml += `          <sign>${getClefSign(clef)}</sign>
`;
          xml += `          <line>${getClefLine(clef)}</line>
`;
          xml += `        </clef>
`;
          xml += "      </attributes>\n";
          xml += '      <direction placement="above">\n';
          xml += "        <direction-type>\n";
          xml += "          <metronome>\n";
          xml += "            <beat-unit>quarter</beat-unit>\n";
          xml += `            <per-minute>${tempo}</per-minute>
`;
          xml += "          </metronome>\n";
          xml += "        </direction-type>\n";
          xml += '        <sound tempo="${tempo}"/>\n';
          xml += "      </direction>\n";
        }
        measure.forEach((note, noteIdx) => {
          if (note.isRest) {
            xml += "      <note>\n";
            xml += "        <rest/>\n";
            xml += `        <duration>${Math.round(note.duration * 4)}</duration>
`;
            xml += `        <type>${getDurationType(note.duration)}</type>
`;
            xml += "      </note>\n";
          } else if (Array.isArray(note.pitch)) {
            const isChordContinuation = noteIdx > 0 && !measure[noteIdx - 1].isRest && timeEqual(note.time, measure[noteIdx - 1].time);
            note.pitch.forEach((p, i) => {
              xml += "      <note>\n";
              if (i > 0 || isChordContinuation) {
                xml += "        <chord/>\n";
              }
              const { step, alter, octave } = midiToPitch(p);
              xml += "        <pitch>\n";
              xml += `          <step>${step}</step>
`;
              if (alter !== 0) {
                xml += `          <alter>${alter}</alter>
`;
              }
              xml += `          <octave>${octave}</octave>
`;
              xml += "        </pitch>\n";
              xml += `        <duration>${Math.round(note.duration * 4)}</duration>
`;
              xml += `        <type>${getDurationType(note.duration)}</type>
`;
              xml += "      </note>\n";
            });
          } else {
            const isChordContinuation = noteIdx > 0 && !measure[noteIdx - 1].isRest && timeEqual(note.time, measure[noteIdx - 1].time);
            xml += "      <note>\n";
            if (isChordContinuation) {
              xml += "        <chord/>\n";
            }
            const { step, alter, octave } = midiToPitch(note.pitch);
            xml += "        <pitch>\n";
            xml += `          <step>${step}</step>
`;
            if (alter !== 0) {
              xml += `          <alter>${alter}</alter>
`;
            }
            xml += `          <octave>${octave}</octave>
`;
            xml += "        </pitch>\n";
            xml += `        <duration>${Math.round(note.duration * 4)}</duration>
`;
            xml += `        <type>${getDurationType(note.duration)}</type>
`;
            xml += "      </note>\n";
          }
        });
        xml += "    </measure>\n";
      });
      xml += "  </part>\n";
    });
    xml += "</score-partwise>\n";
    return xml;
  }
  function downloadMusicXML(composition, filename = "composition.musicxml") {
    const xml = musicxml(composition);
    const blob = new Blob([xml], { type: "application/vnd.recordare.musicxml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function normalizeTime(value) {
    return Math.round(value * 1e4) / 1e4;
  }
  function timeEqual(a, b, tolerance = 1e-4) {
    return Math.abs(a - b) < tolerance;
  }
  function splitIntoMeasures(notes, measureDuration, totalDuration) {
    const measures = [];
    let currentMeasure = [];
    const sortedNotes = [...notes].sort((a, b) => (a.time || 0) - (b.time || 0));
    const normalizedNotes = sortedNotes.map((note) => ({
      ...note,
      time: normalizeTime(note.time || 0),
      duration: normalizeTime(note.duration || 1)
    }));
    let noteIndex = 0;
    const numMeasures = Math.ceil(normalizeTime(totalDuration) / measureDuration);
    for (let measureNum = 0; measureNum < numMeasures; measureNum++) {
      const measureStart = normalizeTime(measureNum * measureDuration);
      const measureEnd = normalizeTime(measureStart + measureDuration);
      currentMeasure = [];
      let measureTime = measureStart;
      while (noteIndex < normalizedNotes.length && normalizedNotes[noteIndex].time < measureEnd) {
        const note = normalizedNotes[noteIndex];
        if (note.time > measureTime && !timeEqual(note.time, measureTime)) {
          const restDuration = normalizeTime(note.time - measureTime);
          if (restDuration > 1e-4) {
            currentMeasure.push({ isRest: true, duration: restDuration });
          }
          measureTime = note.time;
        }
        const noteEnd = normalizeTime(note.time + note.duration);
        if (noteEnd <= measureEnd || timeEqual(noteEnd, measureEnd)) {
          currentMeasure.push({ ...note, duration: note.duration });
          measureTime = noteEnd;
          noteIndex++;
        } else {
          const durationInMeasure = normalizeTime(measureEnd - measureTime);
          if (durationInMeasure > 1e-4) {
            currentMeasure.push({ ...note, duration: durationInMeasure });
          }
          normalizedNotes[noteIndex] = {
            ...note,
            time: measureEnd,
            duration: normalizeTime(note.duration - durationInMeasure)
          };
          measureTime = measureEnd;
          break;
        }
      }
      if (measureTime < measureEnd && !timeEqual(measureTime, measureEnd)) {
        const restDuration = normalizeTime(measureEnd - measureTime);
        if (restDuration > 1e-4) {
          currentMeasure.push({ isRest: true, duration: restDuration });
        }
      }
      if (currentMeasure.length > 0) {
        measures.push(currentMeasure);
      }
    }
    return measures;
  }
  function midiToPitch(midi2) {
    if (typeof midi2 !== "number") return { step: "C", alter: 0, octave: 4 };
    const pitchClass = midi2 % 12;
    const octave = Math.floor(midi2 / 12) - 1;
    const pitchMap = {
      0: { step: "C", alter: 0 },
      1: { step: "C", alter: 1 },
      2: { step: "D", alter: 0 },
      3: { step: "E", alter: -1 },
      4: { step: "E", alter: 0 },
      5: { step: "F", alter: 0 },
      6: { step: "F", alter: 1 },
      7: { step: "G", alter: 0 },
      8: { step: "G", alter: 1 },
      9: { step: "A", alter: 0 },
      10: { step: "B", alter: -1 },
      11: { step: "B", alter: 0 }
    };
    return { ...pitchMap[pitchClass], octave };
  }
  function getDurationType(duration) {
    if (duration >= 4) return "whole";
    if (duration >= 2) return "half";
    if (duration >= 1) return "quarter";
    if (duration >= 0.5) return "eighth";
    if (duration >= 0.25) return "16th";
    return "32nd";
  }
  function parseKeySignature(keySignature) {
    const key = keySignature.replace(/[-_]?(major|minor|m)$/i, "").trim().toUpperCase();
    const isMinor = /[-_]?(minor|m)$/i.test(keySignature);
    const fifthsMap = {
      "C": 0,
      "G": 1,
      "D": 2,
      "A": 3,
      "E": 4,
      "B": 5,
      "F#": 6,
      "C#": 7,
      "F": -1,
      "BB": -2,
      "EB": -3,
      "AB": -4,
      "DB": -5,
      "GB": -6,
      "CB": -7
    };
    return {
      fifths: fifthsMap[key] || 0,
      mode: isMinor ? "minor" : "major"
    };
  }
  function getClefSign(clef) {
    const clefMap = {
      "treble": "G",
      "bass": "F",
      "alto": "C",
      "tenor": "C",
      "percussion": "percussion"
    };
    return clefMap[clef] || "G";
  }
  function getClefLine(clef) {
    const lineMap = {
      "treble": 2,
      "bass": 4,
      "alto": 3,
      "tenor": 4,
      "percussion": 3
    };
    return lineMap[clef] || 2;
  }
  function escapeXML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function createEmptyMusicXML(title, tempo, beatsPerMeasure, beatValue, fifths, mode) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n';
    xml += '<score-partwise version="3.1">\n';
    xml += "  <work>\n";
    xml += `    <work-title>${escapeXML(title)}</work-title>
`;
    xml += "  </work>\n";
    xml += "  <part-list>\n";
    xml += '    <score-part id="P1">\n';
    xml += "      <part-name>Music</part-name>\n";
    xml += "    </score-part>\n";
    xml += "  </part-list>\n";
    xml += '  <part id="P1">\n';
    xml += '    <measure number="1">\n';
    xml += "      <attributes>\n";
    xml += "        <divisions>4</divisions>\n";
    xml += "        <key>\n";
    xml += `          <fifths>${fifths}</fifths>
`;
    xml += `          <mode>${mode}</mode>
`;
    xml += "        </key>\n";
    xml += "        <time>\n";
    xml += `          <beats>${beatsPerMeasure}</beats>
`;
    xml += `          <beat-type>${beatValue}</beat-type>
`;
    xml += "        </time>\n";
    xml += "        <clef>\n";
    xml += "          <sign>G</sign>\n";
    xml += "          <line>2</line>\n";
    xml += "        </clef>\n";
    xml += "      </attributes>\n";
    xml += "      <note>\n";
    xml += "        <rest/>\n";
    xml += "        <duration>16</duration>\n";
    xml += "        <type>whole</type>\n";
    xml += "      </note>\n";
    xml += "    </measure>\n";
    xml += "  </part>\n";
    xml += "</score-partwise>\n";
    return xml;
  }

  // src/browser/score-renderer.js
  async function score(composition, options = {}) {
    const {
      verovio: createVerovioModule,
      VerovioToolkit,
      toolkit,
      width,
      scale = 40
    } = options;
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.overflow = "visible";
    const notationDiv = document.createElement("div");
    notationDiv.id = `rendered-score-${Date.now()}`;
    container.appendChild(notationDiv);
    try {
      if (!toolkit && !createVerovioModule) {
        notationDiv.innerHTML = '<p style="color:#ff6b6b">Verovio library not loaded. Import with: import verovio from "npm:verovio@4.3.1/wasm" and import { VerovioToolkit } from "npm:verovio@4.3.1/esm"</p>';
        return container;
      }
      notationDiv.innerHTML = '<p style="color:#888">Initializing Verovio...</p>';
      let vrvToolkit;
      if (toolkit) {
        vrvToolkit = toolkit;
      } else {
        const resolve = (val) => typeof val === "function" ? val : val?.default ?? val?.VerovioToolkit ?? val;
        const factory = resolve(createVerovioModule);
        const Toolkit = resolve(VerovioToolkit);
        const VerovioModule = await factory();
        vrvToolkit = new Toolkit(VerovioModule);
      }
      const musicXML = musicxml(composition);
      const renderOptions = {
        scale,
        adjustPageHeight: true,
        breaks: "auto",
        pageWidth: width || 2100,
        pageHeight: 2970,
        spacingStaff: 12,
        spacingSystem: 12
      };
      vrvToolkit.setOptions(renderOptions);
      vrvToolkit.loadData(musicXML);
      const svg = vrvToolkit.renderToSVG(1);
      notationDiv.innerHTML = svg;
    } catch (error) {
      console.error("[SCORE] Render error:", error);
      notationDiv.innerHTML = `<p style="color:#ff6b6b">Error: ${error.message}</p>`;
    }
    return container;
  }

  // src/index.js
  var createPlayer2;
  async function __loadPlayer() {
    if (!createPlayer2) {
      const playerModule = await Promise.resolve().then(() => (init_music_player(), music_player_exports));
      createPlayer2 = playerModule.createPlayer;
    }
    return createPlayer2;
  }
  var GM_INSTRUMENTS2;
  var createGMInstrumentNode2;
  var findGMProgramByName2;
  var generateSamplerUrls2;
  var getPopularInstruments2;
  async function __loadGmInstruments() {
    if (!GM_INSTRUMENTS2 && !createGMInstrumentNode2) {
      const gm = await Promise.resolve().then(() => (init_gm_instruments(), gm_instruments_exports));
      GM_INSTRUMENTS2 = gm.GM_INSTRUMENTS;
      createGMInstrumentNode2 = gm.createGMInstrumentNode;
      findGMProgramByName2 = gm.findGMProgramByName;
      generateSamplerUrls2 = gm.generateSamplerUrls;
      getPopularInstruments2 = gm.getPopularInstruments;
    }
    return {
      GM_INSTRUMENTS: GM_INSTRUMENTS2,
      createGMInstrumentNode: createGMInstrumentNode2,
      findGMProgramByName: findGMProgramByName2,
      generateSamplerUrls: generateSamplerUrls2,
      getPopularInstruments: getPopularInstruments2
    };
  }
  function validateJmon(obj) {
    const validator = new JmonValidator();
    return validator.validateAndNormalize(obj);
  }
  async function render(jmonObj, options = {}) {
    if (!jmonObj || typeof jmonObj !== "object") {
      throw new Error("render() requires a valid JMON object");
    }
    const player = await __loadPlayer();
    return player(jmonObj, options);
  }
  function play(jmonObj, options = {}) {
    const { Tone: externalTone, autoplay = false, ...otherOptions } = options;
    const playOptions = { Tone: externalTone, autoplay, ...otherOptions };
    const toneAvailable = externalTone || typeof globalThis !== "undefined" && globalThis.Tone || (typeof globalThis.Tone !== "undefined" ? globalThis.Tone : null);
    const needsAsync = !toneAvailable || autoplay || playOptions.preloadTone;
    if (!needsAsync && toneAvailable) {
      if (!createPlayer2) {
        return (async () => {
          const playerModule = await Promise.resolve().then(() => (init_music_player(), music_player_exports));
          createPlayer2 = playerModule.createPlayer;
          return createPlayer2(jmonObj, playOptions);
        })();
      }
      return createPlayer2(jmonObj, playOptions);
    }
    return (async () => {
      const player = await __loadPlayer();
      return player(jmonObj, playOptions);
    })();
  }
  function score2(jmonObj, options = {}) {
    if (typeof document === "undefined") {
      throw new Error("Score rendering requires a DOM environment.");
    }
    return score(jmonObj, options);
  }
  var jm = {
    // Core
    render,
    play,
    score: score2,
    validate: validateJmon,
    // Converters
    converters: {
      midi,
      midiToJmon,
      tonejs,
      wav,
      downloadWav,
      musicxml,
      downloadMusicXML,
      supercollider
    },
    // Namespaces from algorithms
    theory: algorithms_default.theory,
    generative: algorithms_default.generative,
    processors: algorithms_default.processors,
    analysis: algorithms_default.analysis,
    constants: algorithms_default.constants,
    audio: algorithms_default.audio,
    visualization: algorithms_default.visualization,
    // Utils
    utils: {
      ...algorithms_default.utils,
      ...jmon_utils_exports,
      JmonValidator
    },
    // Instruments (optional; may be undefined in non-browser builds)
    instruments: {
      // Lazy loader to initialize GM instrument helpers on demand
      // Usage: await jm.instruments.load()
      load: __loadGmInstruments,
      // These remain undefined until load() is called in environments where
      // gm-instruments are not preloaded.
      GM_INSTRUMENTS: GM_INSTRUMENTS2,
      generateSamplerUrls: generateSamplerUrls2,
      createGMInstrumentNode: createGMInstrumentNode2,
      findGMProgramByName: findGMProgramByName2,
      getPopularInstruments: getPopularInstruments2
    },
    VERSION: "1.0.0"
  };
  var audio2 = algorithms_default.audio;
  var index_default = jm;
  return __toCommonJS(index_exports);
})();
