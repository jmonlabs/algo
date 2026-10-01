/**
 * An elementary cellular automaton: a row of cells, 0 or 1, and a rule
 * (0 to 255, Wolfram's numbering) that writes the next row from each cell
 * and its two neighbours. The row wraps around.
 *
 * @example
 * // Rule 30 from one live cell, 16 rows
 * const rows = new CellularAutomata({ ruleNumber: 30, width: 16 }).generate(15);
 *
 * // One pitch per column: a row with one live cell is a note, several a chord
 * CellularAutomata.pitches(rows, [60, 62, 64, 65, 67, 69, 71, 72]);
 */
export class CellularAutomata {
  /**
   * @param {Object} [options]
   * @param {number} [options.ruleNumber=30] - Wolfram rule, 0 to 255
   * @param {number|Array<number>} [options.width=51] - How many cells, or `[low, high]` pitches, one cell each
   * @param {Array<number>} [options.initialState] - The first row, 0s and 1s; one live cell in the middle by default
   */
  constructor({ ruleNumber = 30, width = 51, initialState } = {}) {
    if (Array.isArray(width)) {
      this.pitchMin = width[0];
      this.width = width[1] - width[0] + 1;
    } else {
      this.pitchMin = 0;
      this.width = width;
    }
    if (!Number.isInteger(this.width) || this.width < 1) {
      throw new Error(`CellularAutomata: width must be a positive integer or [low, high], got ${JSON.stringify(width)}`);
    }
    if (!Number.isInteger(ruleNumber) || ruleNumber < 0 || ruleNumber > 255) {
      throw new Error(`CellularAutomata: ruleNumber must be 0 to 255, got ${ruleNumber}`);
    }
    this.ruleNumber = ruleNumber;
    this.rules = CellularAutomata._rules(ruleNumber);

    if (initialState === undefined) {
      this.initialState = new Array(this.width).fill(0);
      this.initialState[Math.floor(this.width / 2)] = 1;
    } else {
      const ok = Array.isArray(initialState) && initialState.length === this.width
        && initialState.every((c) => c === 0 || c === 1);
      if (!ok) throw new Error(`CellularAutomata: initialState must be ${this.width} cells of 0 or 1`);
      this.initialState = [...initialState];
    }
    this.history = [];
  }

  /**
   * The rows, the first one included.
   * @param {number} steps - How many rows to write after the first
   * @returns {Array<Array<number>>} `steps + 1` rows of 0s and 1s
   */
  generate(steps) {
    if (!Number.isInteger(steps) || steps < 0) {
      throw new Error(`CellularAutomata.generate: steps must be a whole number, got ${steps}`);
    }
    let state = [...this.initialState];
    this.history = [[...state]];
    for (let step = 0; step < steps; step++) {
      state = this._next(state);
      this.history.push([...state]);
    }
    return this.history.map((row) => [...row]);
  }

  /**
   * The live cells of the last `generate`, one `{ time, pitch }` per cell,
   * for a plot: `time` is the row, `pitch` the column (plus the low pitch
   * when `width` was a range).
   * @returns {Array<{time: number, pitch: number}>}
   */
  toPlotData() {
    const data = [];
    this.history.forEach((row, time) => {
      row.forEach((cell, column) => {
        if (cell === 1) data.push({ time, pitch: this.pitchMin + column });
      });
    });
    return data;
  }

  /**
   * Rows read as pitches: each column is a pitch of `pitchSet`; a row with
   * one live cell gives that pitch, several a chord (an array), none `null`.
   * @param {Array<Array<number>>} rows - From `generate`
   * @param {Array<number>} pitchSet - One pitch per column
   * @returns {Array<number|Array<number>|null>}
   */
  static pitches(rows, pitchSet) {
    return rows.map((row) => {
      const pitches = [];
      row.forEach((cell, column) => {
        if (cell === 1 && column < pitchSet.length) pitches.push(pitchSet[column]);
      });
      if (pitches.length === 0) return null;
      return pitches.length === 1 ? pitches[0] : pitches;
    });
  }

  /** @private The rule as a table from neighbourhood ('110') to 0 or 1. */
  static _rules(ruleNumber) {
    const binary = ruleNumber.toString(2).padStart(8, '0');
    const neighborhoods = ['111', '110', '101', '100', '011', '010', '001', '000'];
    const rules = {};
    for (let i = 0; i < 8; i++) rules[neighborhoods[i]] = parseInt(binary[i], 10);
    return rules;
  }

  /** @private The next row. */
  _next(state) {
    const next = new Array(this.width);
    for (let i = 0; i < this.width; i++) {
      const left = state[(i - 1 + this.width) % this.width];
      const right = state[(i + 1) % this.width];
      next[i] = this.rules[`${left}${state[i]}${right}`];
    }
    return next;
  }
}
