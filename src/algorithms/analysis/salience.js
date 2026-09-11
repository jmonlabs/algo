/**
 * Which notes matter.
 *
 * Both books say the same thing about analysis: don't look at every note.
 * The Rhythm Code looks at *stops* (an onset with nothing on the next pulse),
 * or at accents and top notes when there are no rests. The Emotional Map
 * looks at the note on each chord change, at long notes, at repeated notes,
 * and at the first and last note of a motif. This module is that filter,
 * shared by both sides.
 *
 * Every function takes JMON notes and returns a weight per note in [0, 1].
 * `salient(notes, opts)` filters by a threshold.
 */

import { normalizeChords } from './chords.js';

const numericTime = (t) => (typeof t === 'number' ? t : parseFloat(t) || 0);
const isRest = (n) => n.pitch === null || n.pitch === undefined;
const topPitch = (n) => (Array.isArray(n.pitch) ? Math.max(...n.pitch) : n.pitch);

/**
 * Onset positions in integer pulses, rests excluded, sorted, deduplicated.
 * @param {Array<Object>} notes
 * @param {number} [pulse=0.5] - Grid unit in quarter notes (0.5 = eighth)
 * @returns {Array<number>}
 */
export function onsetPositions(notes, pulse = 0.5) {
    const set = new Set();
    for (const n of notes) {
        if (isRest(n)) continue;
        set.add(Math.round(numericTime(n.time) / pulse));
    }
    return [...set].sort((a, b) => a - b);
}

/** Every sounding note weighs 1. */
export function onsets(notes) {
    return notes.map((n) => (isRest(n) ? 0 : 1));
}

/**
 * A note is a stop when no other note starts on the next pulse. Duration is
 * irrelevant: an eighth followed by an eighth rest is a stop, and so is the
 * start of a long note.
 */
export function stops(notes, { pulse = 0.5 } = {}) {
    const positions = new Set(onsetPositions(notes, pulse));
    return notes.map((n) => {
        if (isRest(n)) return 0;
        const p = Math.round(numericTime(n.time) / pulse);
        return positions.has(p + 1) ? 0 : 1;
    });
}

/**
 * Notes louder than the local mean velocity. When a line has no rests the
 * accented notes carry the rhythm; the book's drum example relies on this.
 */
export function accents(notes, { window = 8 } = {}) {
    const vel = notes.map((n) => (typeof n.velocity === 'number' ? n.velocity : 0.8));
    return notes.map((n, i) => {
        if (isRest(n)) return 0;
        const lo = Math.max(0, i - window);
        const hi = Math.min(notes.length, i + window + 1);
        let sum = 0;
        let count = 0;
        for (let j = lo; j < hi; j++) {
            if (!isRest(notes[j])) { sum += vel[j]; count++; }
        }
        const mean = count ? sum / count : 0;
        return vel[i] > mean + 1e-9 ? 1 : 0;
    });
}

/**
 * Local maxima of the pitch contour — the octave "top notes" a Latin piano
 * tumbao or a ragtime right hand rides on.
 */
export function contourPeaks(notes) {
    const sounding = notes.map((n, i) => (isRest(n) ? null : { i, p: topPitch(n) })).filter(Boolean);
    const out = new Array(notes.length).fill(0);
    for (let k = 0; k < sounding.length; k++) {
        const prev = k > 0 ? sounding[k - 1].p : -Infinity;
        const next = k < sounding.length - 1 ? sounding[k + 1].p : -Infinity;
        const { i, p } = sounding[k];
        if (p >= prev && p >= next && (p > prev || p > next)) out[i] = 1;
    }
    return out;
}

/**
 * Notes that start on, or anticipate, a chord change. `chords` is a chord
 * timeline, JMON chord notes or `[{ time, pitches }]`; a note within
 * `tolerance` before the change (or
 * exactly on it) is the one "belonging" to that chord.
 */
export function chordChanges(notes, { chords = [], tolerance = 0.5 } = {}) {
    const out = new Array(notes.length).fill(0);
    chords = normalizeChords(chords);
    if (chords.length === 0) return out;
    const times = notes.map((n) => numericTime(n.time));
    for (const chord of chords) {
        const ct = numericTime(chord.time);
        let best = -1;
        let bestDist = Infinity;
        for (let i = 0; i < notes.length; i++) {
            if (isRest(notes[i])) continue;
            const d = ct - times[i];
            // exactly on the change, or an anticipation just before it
            if (d >= -1e-9 && d <= tolerance && d < bestDist) { best = i; bestDist = d; }
        }
        // no anticipation: the first note after the change carries it
        if (best === -1) {
            for (let i = 0; i < notes.length; i++) {
                if (isRest(notes[i])) continue;
                if (times[i] >= ct - 1e-9 && times[i] < ct + tolerance + 1e-9) { best = i; break; }
            }
        }
        if (best !== -1) out[best] = 1;
    }
    return out;
}

/** Notes at least `min` quarter notes long. */
export function long(notes, { min = 1 } = {}) {
    return notes.map((n) => (!isRest(n) && n.duration >= min ? 1 : 0));
}

/** Notes whose pitch repeats the previous sounding pitch. */
export function repeated(notes) {
    let prev = null;
    return notes.map((n) => {
        if (isRest(n)) return 0;
        const p = topPitch(n);
        const r = prev !== null && p === prev ? 1 : 0;
        prev = p;
        return r;
    });
}

/**
 * First and last note of each motif, where a motif ends at a gap of at least
 * `gap` quarter notes before the next onset.
 */
export function motifEdges(notes, { gap = 1 } = {}) {
    const out = new Array(notes.length).fill(0);
    const idx = notes.map((n, i) => i).filter((i) => !isRest(notes[i]))
        .sort((a, b) => numericTime(notes[a].time) - numericTime(notes[b].time));
    if (idx.length === 0) return out;
    out[idx[0]] = 1;
    for (let k = 1; k < idx.length; k++) {
        const prevEnd = numericTime(notes[idx[k - 1]].time) + (notes[idx[k - 1]].duration || 0);
        if (numericTime(notes[idx[k]].time) - prevEnd >= gap - 1e-9) {
            out[idx[k - 1]] = 1;
            out[idx[k]] = 1;
        }
    }
    out[idx[idx.length - 1]] = 1;
    return out;
}

/**
 * The book's anchor notes: union of chord-change notes, long notes, repeated
 * notes and motif edges. Weights add, so a long note on a chord change scores
 * higher than either alone; the result is scaled to [0, 1].
 */
export function anchors(notes, options = {}) {
    const parts = [
        chordChanges(notes, options),
        long(notes, options),
        repeated(notes),
        motifEdges(notes, options),
    ];
    const max = parts.length;
    return notes.map((_, i) => parts.reduce((s, w) => s + w[i], 0) / max);
}

export const MODES = { onsets, stops, accents, contourPeaks, chordChanges, long, repeated, motifEdges, anchors };

/**
 * Weight per note under a named mode, or under your own function.
 * @param {Array<Object>} notes
 * @param {Object} [options]
 * @param {string|Function} [options.mode='stops']
 * @returns {Array<number>}
 */
export function salience(notes, { mode = 'stops', ...rest } = {}) {
    const fn = typeof mode === 'function' ? mode : MODES[mode];
    if (!fn) throw new Error(`salience: unknown mode "${mode}" (${Object.keys(MODES).join(', ')})`);
    return fn(notes, rest);
}

/**
 * The notes whose salience reaches `threshold`.
 * @param {Array<Object>} notes
 * @param {Object} [options]
 * @param {string|Function} [options.mode='stops']
 * @param {number} [options.threshold=0.5]
 * @returns {Array<Object>}
 */
export function salient(notes, { threshold = 0.5, ...opts } = {}) {
    const w = salience(notes, opts);
    return notes.filter((_, i) => w[i] >= threshold - 1e-9);
}
