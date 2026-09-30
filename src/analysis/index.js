/**
 * jmon/analysis — measurements.
 *
 * One flat layer of functions; each takes notes or values first and returns
 * a number, a series or a report. Nothing here changes the notes. The books'
 * tables behind the Rhythm Code and the Emotional Map are data, in
 * jmon/rhythm's presets, and every score is a measurement against them.
 *
 * @license GPL-3.0-or-later
 */

import { MusicalAnalysis as M } from "../algorithms/analysis/MusicalAnalysis.js";
import * as code from "../algorithms/analysis/RhythmCode.js";
import * as saliences from "../algorithms/analysis/salience.js";

/* --- values: pitches, durations, any series ------------------------------ */

/**
 * Inequality of the values, 0 (all equal) to 1.
 * @param {Array<number>} values
 * @param {Object} [options]
 * @param {Array<number>} [options.weights] - One per value
 * @returns {number}
 */
export function gini(values, { weights } = {}) { return M.gini(values, weights); }

/**
 * The centre of mass of the values.
 * @param {Array<number>} values
 * @param {Object} [options]
 * @param {Array<number>} [options.weights] - One per value
 * @returns {number}
 */
export function balance(values, { weights } = {}) { return M.balance(values, weights); }

/** Coefficient of variation around the mean. */
export function spread(values) { return M.spread(values); }

/**
 * How much a series repeats a pattern of `length` values, 0 to 1.
 * @param {Array<number>} values
 * @param {number} [length=3]
 */
export function motif(values, length = 3) { return M.motif(values, length); }

/**
 * How much a series repeats itself over patterns of length 2 to `maxLength`.
 * @param {Array<number>} values
 * @param {number} [maxLength=4]
 */
export function motifStrength(values, maxLength = 4) { return M.motifStrength(values, maxLength); }

/**
 * How well durations tile measures of `measureLength` beats, 0 to 1.
 * @param {Array<number>} durations
 * @param {number} [measureLength=4]
 */
export function measureFit(durations, measureLength = 4) { return M.measureFit(durations, measureLength); }

/** Share of rests (null entries) in a series. */
export function restProportion(values) { return M.restProportion(values); }

/**
 * Autocorrelation of a series, one value per lag.
 * @param {Array<number>} values
 * @param {number} [maxLag]
 * @returns {Array<number>}
 */
export function autocorrelation(values, maxLag) { return M.autocorrelation(values, maxLag); }

/**
 * Share of pitches whose pitch class is outside the scale, 0 to 1.
 * @param {Array<number>} pitches
 * @param {Object} [options]
 * @param {Array<number>} [options.scale=[0,2,4,5,7,9,11]] - Pitch classes, or a key context
 */
export function dissonance(pitches, { scale = [0, 2, 4, 5, 7, 9, 11] } = {}) {
  const classes = typeof scale.pitchClasses === "function" ? scale.pitchClasses() : scale;
  return M.dissonance(pitches, classes.map((p) => ((p % 12) + 12) % 12));
}

/** Where a series sits between arithmetic and golden growth, 0 to 1. */
export function fibonacciIndex(values) { return M.fibonacciIndex(values); }

/** Entropy of a melody's ups and downs: 0 for a monotonic line. */
export function contourEntropy(pitches) { return M.contourEntropy(pitches); }

/** Variance of the intervals between successive pitches. */
export function intervalVariance(pitches) { return M.intervalVariance(pitches); }

/* --- onsets: times in beats ---------------------------------------------- */

/**
 * Share of onsets on the grid.
 * @param {Array<number>} onsets - Times in beats
 * @param {number} [gridDivision=16]
 */
export function rhythmic(onsets, gridDivision = 16) { return M.rhythmic(onsets, gridDivision); }

/**
 * Share of onsets off the beat.
 * @param {Array<number>} onsets - Times in beats
 * @param {number} [beatDivision=4]
 */
export function syncopation(onsets, beatDivision = 4) { return M.syncopation(onsets, beatDivision); }

/** Variance of the gaps between successive onsets. */
export function gapVariance(onsets) { return M.gapVariance(onsets); }

/* --- notes --------------------------------------------------------------- */

/**
 * Notes per window of `window` beats, over the whole.
 * @param {Array} notes - JMON notes
 * @param {number} [window=1]
 */
export function density(notes, window = 1) { return M.density(notes, window); }

/** Density per window, as a series. */
export function densityCurve(notes, window = 1) { return M.densityCurve(notes, window); }

/** Mean velocity per window, as a series. */
export function velocityEnvelope(notes, window = 1) { return M.velocityEnvelope(notes, window); }

/** Onsets folded into `bins` places of the beat, as a histogram. */
export function rhythmicSignature(notes, bins = 16) { return M.rhythmicSignature(notes, bins); }

/**
 * Every measure at once: gini, balance, motif, dissonance, rhythmic,
 * fibonacciIndex, syncopation, contourEntropy, intervalVariance, density,
 * gapVariance.
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {Array<number>} [options.scale] - Pitch classes for `dissonance`, or a key context
 * @returns {Object}
 */
export function analyze(notes, { scale } = {}) {
  const classes = scale && typeof scale.pitchClasses === "function" ? scale.pitchClasses() : scale;
  return M.analyze(notes, classes ? { scale: classes } : {});
}

/* --- which notes carry the melody (salience) ----------------------------- */

/**
 * A weight per note, 0 to 1, under a named mode or your own function:
 * 'stops', 'accents', 'contourPeaks', 'chordChanges', 'long', 'repeated',
 * 'motifEdges', 'anchors'.
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {string|Function} [options.mode='stops']
 * @returns {Array<number>}
 */
export const salience = saliences.salience;

/** The notes whose salience reaches `threshold`. */
export const salient = saliences.salient;

export const stops = saliences.stops;
export const accents = saliences.accents;
export const contourPeaks = saliences.contourPeaks;
export const chordChanges = saliences.chordChanges;
export const long = saliences.long;
export const repeated = saliences.repeated;
export const motifEdges = saliences.motifEdges;
export const anchors = saliences.anchors;

/* --- Bodzsar's Rhythm Code ----------------------------------------------- */

/**
 * The places of a track on the pulse grid: sorted integer positions of the
 * onsets, or of the salient notes only.
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.pulse=0.5] - Grid unit in beats
 * @param {string|Function} [options.salience='onsets'] - Which notes count
 * @returns {Array<number>}
 */
export const positions = code.onsetGrid;

/** Among positions, those that anticipate a stronger place. */
export const anticipations = code.anticipations;
/** How many positions fall on each metric strength. */
export const metricHistogram = code.metricHistogram;
/** Share of positions off the beat. */
export const upbeatRatio = code.upbeatRatio;
/** Share of positions that are stops. */
export const stopRate = code.stopRate;
/** Share of positions that anticipate. */
export const anticipationRate = code.anticipationRate;
/** How well positions fit a profile, in the best orientation. */
export const profileFit = code.profileFit;
/** '2-3' or '3-2', whichever a track fits better. */
export const detectOrientation = code.detectOrientation;
/** A profile folded out of tracks. */
export const profileFromTracks = code.profileFromTracks;

/**
 * The Rhythm Code report of a track: positions, stops, stopRate,
 * upbeatRatio, metricHistogram, anticipations, anticipationRate and the fit
 * to a profile.
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.pulse=0.5]
 * @param {Profile} [options.profile]
 * @param {'2-3'|'3-2'|'auto'} [options.orientation='auto']
 * @returns {Object}
 */
export const rhythmCode = code.analyzeRhythm;

/* --- Bodzsar's Emotional Map of Melody ----------------------------------- */

export { emotionalMap, mapNotes, pillars } from "../algorithms/analysis/EmotionalMap.js";
import { chordAt as chordAtTime } from "../algorithms/analysis/EmotionalMap.js";

/**
 * The chord a moment belongs to: the last chord started at or before it, or
 * the one it anticipates by less than `anticipation` beats.
 * @param {Array<{time:number, pitches:Array<number>}>} chords - Sorted by time
 * @param {Object} options
 * @param {number} options.time - In beats
 * @param {number} [options.anticipation=0.5]
 * @returns {Array<number>|null}
 */
export function chordAt(chords, { time, anticipation = 0.5 } = {}) {
  return chordAtTime(chords, time, anticipation);
}
