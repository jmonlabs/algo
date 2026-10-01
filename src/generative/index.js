/**
 * jmon/generative — the material.
 *
 * Processes that produce notes from a rule rather than from a key or a
 * rhythm: minimalist unfolding and phasing, tintinnabuli, random walks and
 * Markov chains, phasors, fractals, cellular automata, a genetic algorithm,
 * and a drummer.
 *
 * @license GPL-3.0-or-later
 */

import { CellularAutomata } from "./cellular-automata/index.js";
import { Darwin, operators, metrics, metric, phraseToNotes } from "./genetic/index.js";
import { RandomWalk, Chain, Phasor, PhasorSystem } from "./walks/index.js";
import { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap } from "./fractals/index.js";
import { MinimalismProcess, Tintinnabuli } from "./minimalism/MinimalismProcess.js";
import { phaseShift } from "./minimalism/phaseShift.js";
import { drummer as drum, presets as drummerPresets } from "./drummer/index.js";

/**
 * A phrase unfolded the minimalist way: played again and again, gaining a
 * note each time (additive) or losing one (subtractive), from the front
 * (forward), the back (backward), the ends toward the middle (inward) or the
 * middle toward the ends (outward).
 *
 * @param {Array} notes - JMON notes, the phrase
 * @param {Object} options
 * @param {'additive'|'subtractive'} options.operation
 * @param {'forward'|'backward'|'inward'|'outward'} options.direction
 * @param {number} [options.repetition=0] - How many extra times each stage is played
 * @returns {Array} JMON notes, one stage after the other
 *
 * @example
 * unfold(phrase, { operation: "subtractive", direction: "forward" });
 */
export function unfold(notes, { operation, direction, repetition = 0 } = {}) {
  return new MinimalismProcess({ operation, direction, repetition }).generate(notes);
}

/**
 * Two voices on one pattern, the second drifting a little further behind at
 * each cycle (Reich's phasing).
 *
 * @param {Array} notes - JMON notes, one cycle
 * @param {Object} options
 * @param {number} options.cycles - How many cycles
 * @param {number} [options.shift=0.125] - How far the second voice drifts per cycle, in beats
 * @returns {Array} JMON notes, both voices
 */
export function phase(notes, options) {
  return phaseShift(notes, options);
}

/**
 * A series projected onto a list: each value, by where it sits between the
 * lowest and the highest of the series, picks the target at that place.
 * What a walk, a fractal path or a logistic map need to become pitches,
 * durations or anything chosen from a list. `null` stays `null`.
 *
 * @param {Array<number|null>} values
 * @param {Array} targets - What to choose from, in order, e.g. the pitches of a scale
 * @returns {Array}
 *
 * @example
 * project(new LogisticMap({ iterations: 16 }).generate(), jm.key("D", "minor").scale({ length: 15 }));
 * project(walk, [0.25, 0.5, 1, 2]);   // durations
 */
export function project(values, targets) {
  if (!Array.isArray(targets) || targets.length === 0) throw new Error("project: targets must be a non-empty list");
  const numbers = values.filter((v) => v !== null && v !== undefined);
  if (numbers.length === 0) return values.map(() => null);
  const low = Math.min(...numbers);
  const range = Math.max(...numbers) - low || 1;
  return values.map((v) => {
    if (v === null || v === undefined) return null;
    const i = Math.floor(((v - low) / range) * targets.length);
    return targets[Math.max(0, Math.min(i, targets.length - 1))];
  });
}

/**
 * A series rescaled to an interval: its lowest value becomes `min`, its
 * highest `max`, the rest in proportion. For velocities, mostly.
 *
 * @param {Array<number>} values
 * @param {Object} [options]
 * @param {number} [options.min=0]
 * @param {number} [options.max=1]
 * @returns {Array<number>}
 */
export function rescale(values, { min = 0, max = 1 } = {}) {
  if (values.length === 0) return [];
  const low = Math.min(...values);
  const range = Math.max(...values) - low || 1;
  return values.map((v) => min + ((v - low) / range) * (max - min));
}

export const minimalism = { Tintinnabuli, unfold, phase };
export const automata = { CellularAutomata };
export const walks = { RandomWalk, Chain, Phasor, PhasorSystem };
export const fractals = { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap };
export const genetic = { Darwin, operators, metrics, metric, phraseToNotes };
export const drummer = Object.assign(drum, { presets: drummerPresets });
