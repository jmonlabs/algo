import { scalePitchClasses, stability, chordDistance, triadOf } from '../../theory/harmony/Solfege.js';

/**
 * Position-aware mutations for `Darwin`.
 *
 * The genome is `[pitch, duration, offset]` tuples laid end to end, so a
 * rhythm move is a transfer of duration between neighbours: shortening note
 * i-1 by one pulse and lengthening note i moves i's onset one pulse earlier.
 * That is Bodzsar's anticipation. The blind mutations in `Darwin.mutate`
 * find these moves too, eventually; these find them on purpose.
 *
 * Every operator is `(phrase, rng, ctx) => phrase`, where `rng()` returns a
 * number in [0, 1) and `ctx` is the Darwin `context` ({ pulse, key, chords,
 * scale, ... }). They return a new array and never mutate the input.
 */

const isRest = (n) => n[0] === null || n[0] === undefined;

/** Recompute offsets as the running sum of durations. */
export function relayout(phrase) {
    let t = 0;
    return phrase.map(([p, d]) => {
        const n = [p, d, t];
        t += d;
        return n;
    });
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const copy = (phrase) => phrase.map((n) => [...n]);

/** Move one onset a pulse earlier by taking the time from the note before it. */
export function anticipateOnset(phrase, rng, ctx = {}) {
    const pulse = ctx.pulse ?? 0.5;
    const cands = [];
    for (let i = 1; i < phrase.length; i++) {
        if (!isRest(phrase[i]) && phrase[i - 1][1] > pulse + 1e-9) cands.push(i);
    }
    if (cands.length === 0) return phrase;
    const i = pick(rng, cands);
    const out = copy(phrase);
    out[i - 1][1] -= pulse;
    out[i][1] += pulse;
    return relayout(out);
}

/** Move one onset a pulse later by giving time to the note before it. */
export function delayOnset(phrase, rng, ctx = {}) {
    const pulse = ctx.pulse ?? 0.5;
    const cands = [];
    for (let i = 1; i < phrase.length; i++) {
        if (!isRest(phrase[i]) && phrase[i][1] > pulse + 1e-9) cands.push(i);
    }
    if (cands.length === 0) return phrase;
    const i = pick(rng, cands);
    const out = copy(phrase);
    out[i - 1][1] += pulse;
    out[i][1] -= pulse;
    return relayout(out);
}

/** Cut a rest out of the end of a note, making its onset a stop. */
export function restify(phrase, rng, ctx = {}) {
    const pulse = ctx.pulse ?? 0.5;
    const cands = [];
    phrase.forEach((n, i) => { if (!isRest(n) && n[1] >= 2 * pulse - 1e-9) cands.push(i); });
    if (cands.length === 0) return phrase;
    const i = pick(rng, cands);
    const out = copy(phrase);
    const [p, d] = out[i];
    out.splice(i, 1, [p, d - pulse], [null, pulse]);
    return relayout(out);
}

/** Absorb a rest into the note before it. The inverse of `restify`. */
export function mergeRest(phrase, rng) {
    const cands = [];
    for (let i = 1; i < phrase.length; i++) if (isRest(phrase[i]) && !isRest(phrase[i - 1])) cands.push(i);
    if (cands.length === 0) return phrase;
    const i = pick(rng, cands);
    const out = copy(phrase);
    out[i - 1][1] += out[i][1];
    out.splice(i, 1);
    return relayout(out);
}

/** Swap the durations of two neighbours: a long-short becomes short-long. */
export function swapDurations(phrase, rng) {
    if (phrase.length < 2) return phrase;
    const i = Math.floor(rng() * (phrase.length - 1));
    if (phrase[i][1] === phrase[i + 1][1]) return phrase;
    const out = copy(phrase);
    [out[i][1], out[i + 1][1]] = [out[i + 1][1], out[i][1]];
    return relayout(out);
}

/* --- melody ------------------------------------------------------------- */

function chordAt(chords, time) {
    let cur = null;
    for (const c of chords) { if (c.time <= time + 1e-9) cur = c; else break; }
    return cur ? cur.pitches : null;
}

/** Indices of notes that carry a chord change: on it, or up to a pulse before it. */
function chordChangeIndices(phrase, ctx) {
    const chords = ctx.chords ?? [];
    const pulse = ctx.pulse ?? 0.5;
    const out = new Set();
    for (const c of chords) {
        let best = -1;
        let bestD = Infinity;
        phrase.forEach((n, i) => {
            if (isRest(n)) return;
            const d = c.time - n[2];
            if (d >= -1e-9 && d <= pulse + 1e-9 && d < bestD) { best = i; bestD = d; }
        });
        if (best === -1) {
            const i = phrase.findIndex((n) => !isRest(n) && n[2] >= c.time - 1e-9);
            if (i !== -1) best = i;
        }
        if (best !== -1) out.add(best);
    }
    return [...out];
}

function keyPitchClasses(ctx) {
    if (ctx.key) return scalePitchClasses(ctx.key);
    if (Array.isArray(ctx.scale)) return [...new Set(ctx.scale.map((p) => ((p % 12) + 12) % 12))];
    return [0, 2, 4, 5, 7, 9, 11];
}

/** Nearest pitch to `pitch` whose pitch class passes `test`, within an octave. */
function nearest(pitch, test) {
    for (let d = 0; d <= 12; d++) {
        if (test(pitch + d)) return pitch + d;
        if (d > 0 && test(pitch - d)) return pitch - d;
    }
    return pitch;
}

/** Put a chord tone on a chord change (or on any note when there are no chords). */
export function toChordTone(phrase, rng, ctx = {}) {
    const chords = ctx.chords ?? [];
    if (chords.length === 0) return phrase;
    let cands = chordChangeIndices(phrase, ctx).filter((i) => {
        const chord = chordAt(chords, phrase[i][2]);
        return chord && chordDistance(phrase[i][0], triadOf(chord)) !== 0;
    });
    if (cands.length === 0) return phrase;
    const i = pick(rng, cands);
    const chord = triadOf(chordAt(chords, phrase[i][2]));
    const out = copy(phrase);
    out[i][0] = nearest(out[i][0], (p) => chordDistance(p, chord) === 0);
    return out;
}

/** Put a diatonic non-chord tone on a chord change: the book's pillar move. */
export function toNonChordTone(phrase, rng, ctx = {}) {
    const chords = ctx.chords ?? [];
    if (chords.length === 0) return phrase;
    const pcs = keyPitchClasses(ctx);
    const cands = chordChangeIndices(phrase, ctx).filter((i) => {
        const chord = chordAt(chords, phrase[i][2]);
        return chord && chordDistance(phrase[i][0], triadOf(chord)) === 0;
    });
    if (cands.length === 0) return phrase;
    const i = pick(rng, cands);
    const chord = triadOf(chordAt(chords, phrase[i][2]));
    const out = copy(phrase);
    out[i][0] = nearest(out[i][0], (p) => pcs.includes(((p % 12) + 12) % 12) && chordDistance(p, chord) !== 0);
    return out;
}

/**
 * Nudge one note to a neighbouring scale degree that is more stable (half
 * the time) or less stable (the other half). Needs `ctx.key`.
 */
export function stepStability(phrase, rng, ctx = {}) {
    if (!ctx.key) return phrase;
    const idx = phrase.map((n, i) => i).filter((i) => !isRest(phrase[i]));
    if (idx.length === 0) return phrase;
    const i = pick(rng, idx);
    const pcs = keyPitchClasses(ctx);
    const current = stability(phrase[i][0], ctx.key);
    const wantMoreStable = rng() < 0.5;
    const cands = [];
    for (let d = -7; d <= 7; d++) {
        if (d === 0) continue;
        const p = phrase[i][0] + d;
        if (!pcs.includes(((p % 12) + 12) % 12)) continue;
        const s = stability(p, ctx.key);
        if (wantMoreStable ? s < current : s > current) cands.push({ p, dist: Math.abs(d) });
    }
    if (cands.length === 0) return phrase;
    cands.sort((a, b) => a.dist - b.dist);
    const out = copy(phrase);
    out[i][0] = cands[0].p;
    return out;
}

export const rhythmOperators = [anticipateOnset, delayOnset, restify, mergeRest, swapDurations];
export const melodyOperators = [toChordTone, toNonChordTone, stepStability];

export default {
    relayout, anticipateOnset, delayOnset, restify, mergeRest, swapDurations,
    toChordTone, toNonChordTone, stepStability, rhythmOperators, melodyOperators,
};
