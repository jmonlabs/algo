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

import { CellularAutomata } from "../algorithms/generative/cellular-automata/index.js";
import { Darwin, operators, metrics, metric, phraseToNotes } from "../algorithms/generative/genetic/index.js";
import { RandomWalk, Chain, Phasor, PhasorSystem } from "../algorithms/generative/walks/index.js";
import { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap } from "../algorithms/generative/fractals/index.js";
import { MinimalismProcess, Tintinnabuli } from "../algorithms/generative/minimalism/MinimalismProcess.js";
import { phaseShift } from "../algorithms/generative/minimalism/phaseShift.js";
import { drummer as drum, presets as drummerPresets } from "../algorithms/generative/drummer/index.js";

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

export const minimalism = { Tintinnabuli, unfold, phase };
export const automata = { CellularAutomata };
export const walks = { RandomWalk, Chain, Phasor, PhasorSystem };
export const fractals = { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap };
export const genetic = { Darwin, operators, metrics, metric, phraseToNotes };
export const drummer = Object.assign(drum, { presets: drummerPresets });
