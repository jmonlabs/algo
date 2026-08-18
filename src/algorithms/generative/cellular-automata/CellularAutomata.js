/**
 * @typedef {Object} CellularAutomataOptions
 * @property {number|number[]} [width=51] - Width of the cellular automaton, or [min, max] range for pitch indices
 * @property {number} [ruleNumber=30] - Rule number (0-255)
 * @property {number[]} [initialState] - Initial state array
 */

/**
 * @typedef {Object<string, number>} CellularAutomataRule
 */

/**
 * @typedef {number[][]} Matrix2D
 */

/**
 * Elementary cellular automaton implementation for musical pattern generation
 *
 * @example
 * ```js
 * import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
 *
 * // Create a Rule 110 automaton
 * const ca = new jm.generative.automata.Cellular({
 *   ruleNumber: 110,
 *   width: 64
 * })
 *
 * // Generate 40 steps
 * const history = ca.generate(40)
 *
 * // Visualize with Observable Plot
 * Plot.plot({
 *   marks: [
 *     Plot.raster(history, {
 *       fill: d => d,
 *       interpolate: 'nearest'
 *     })
 *   ]
 * })
 * ```
 */
export class CellularAutomata {
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
    // Parse width: can be a number or [min, max] range
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
    return result.map(row => row.map(cell => cell > 0 ? 1 : 0));
  }

  /**
   * Load rules based on rule number
   * @param {number} ruleNumber - Rule number (0-255)
   * @returns {CellularAutomataRule} Rule mapping
   */
  loadRules(ruleNumber) {
    const binary = ruleNumber.toString(2).padStart(8, '0');
    const rules = {};
    
    // Map binary neighborhoods to rule outputs
    const neighborhoods = ['111', '110', '101', '100', '011', '010', '001', '000'];
    
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
    
    return strips.every(strip => 
      Array.isArray(strip) && 
      strip.length === width &&
      strip.every(cell => typeof cell === 'number' && (cell === 0 || cell === 1))
    );
  }

  /**
   * Validate values array
   * @param {number[]} values - Values to validate
   * @returns {boolean} Whether the values are valid
   */
  validateValues(values) {
    return Array.isArray(values) && 
           values.length === this.width &&
           values.every(val => typeof val === 'number' && (val === 0 || val === 1));
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
      throw new Error('Invalid initial state');
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
      throw new Error('Rule number must be between 0 and 255');
    }
  }

  /**
   * Get evolution history
   * @returns {Matrix2D} Copy of evolution history
   */
  getHistory() {
    return this.history.map(row => [...row]);
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
    // Single cell in center
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
      height: this.history.length,
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
          // Map cell index to actual pitch value
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
    return strip.map(row => {
      const pitches = [];
      row.forEach((cell, idx) => {
        if (cell === 1 && idx < pitchSet.length) {
          pitches.push(pitchSet[idx]);
        }
      });
      return pitches.length === 1 ? pitches[0] : (pitches.length > 0 ? pitches : null);
    });
  }

}