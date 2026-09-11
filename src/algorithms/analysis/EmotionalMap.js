import { degree, solfege, stability, chordDistance, triadOf, scalePitchClasses } from '../theory/harmony/Solfege.js';
import { salience as weigh } from './salience.js';
import { normalizeChords } from './chords.js';

/**
 * Bodzsar's Emotional Map of Melody, as measurements.
 *
 * Each melody note gets two coordinates: how stable its solfège degree is in
 * the key (0 = DO … 6 = FA, 7 = chromatic), and how far it sits from the
 * chord sounding under it (0 = chord tone, 1 = a semitone off, …). The book
 * draws four quadrants on those axes; here the axes are continuous and the
 * quadrant is a label derived from them, so the boundary is a parameter.
 *
 * The book plots only the notes that carry the melody. `salience` picks
 * them: 'anchors' (the default) is its list — the note at each chord change,
 * long notes, repeated notes, first and last notes of a motif.
 */

const numericTime = (t) => (typeof t === 'number' ? t : parseFloat(t) || 0);
const isRest = (n) => n.pitch === null || n.pitch === undefined;
const topPitch = (n) => (Array.isArray(n.pitch) ? Math.max(...n.pitch) : n.pitch);

/**
 * The chord a note belongs to. Normally the last chord that started at or
 * before the note. But a note that starts up to `anticipation` beats before
 * a chord change belongs to the chord it anticipates — Bodzsar's rule that
 * the melody note "of" a chord change is often played early. Pass
 * `anticipation: 0` for the plain sounding-chord reading.
 * @param {Array<{time:number, pitches:Array<number>}>} chords - Sorted by time
 * @param {number} time
 * @param {number} [anticipation=0.5] - Window before a change, in quarter notes
 * @returns {Array<number>|null}
 */
export function chordAt(chords, time, anticipation = 0.5) {
    let current = null;
    let next = null;
    for (const c of chords) {
        if (numericTime(c.time) <= time + 1e-9) current = c;
        else { next = c; break; }
    }
    if (next && anticipation > 0 && numericTime(next.time) - time <= anticipation + 1e-9) return next.pitches;
    return current ? current.pitches : null;
}

/**
 * Quadrant label from coordinates. Stable side is `stability <= stableMax`
 * (DO SO MI by default: the tonic triad); chord tone is `chordDistance === 0`.
 *   1 stable chord tone · 2 stable non-chord tone
 *   3 unstable chord tone · 4 unstable non-chord tone
 */
export function quadrantOf(stab, dist, { stableMax = 2 } = {}) {
    const stable = stab <= stableMax;
    const ct = dist === 0;
    if (stable && ct) return 1;
    if (stable) return 2;
    if (ct) return 3;
    return 4;
}

/**
 * Place every sounding note on the map.
 *
 * @param {Array<Object>} melody - JMON notes
 * @param {Object} options
 * @param {{tonic:string|number, mode?:string}} options.key
 * @param {Array<Object>} [options.chords=[]] - Chord timeline: JMON chord notes (`pitch: [..]`) or `{ time, pitches }`; without it chordDistance is 0 everywhere
 * @param {boolean} [options.triads=true] - Count only root, third, fifth as chord tones, as the book does
 * @param {number} [options.stableMax=2]
 * @param {number} [options.anticipation=0.5] - A note starting this close before a chord change is read against that chord
 * @returns {Array<Object>} One point per sounding note: `{ index, time, pitch, degree, solfege, stability, chordDistance, chordTone, quadrant }`
 */
export function mapNotes(melody, { key, chords = [], triads = true, stableMax = 2, anticipation = 0.5 } = {}) {
    if (!key) throw new Error('EmotionalMap: key is required');
    const sorted = normalizeChords(chords);
    const points = [];
    melody.forEach((n, index) => {
        if (isRest(n)) return;
        const pitch = topPitch(n);
        const time = numericTime(n.time);
        const chord = chordAt(sorted, time, anticipation);
        const dist = chord ? chordDistance(pitch, triads ? triadOf(chord) : chord) : 0;
        const stab = stability(pitch, key);
        points.push({
            index,
            time,
            pitch,
            degree: degree(pitch, key),
            solfege: solfege(pitch, key),
            stability: stab,
            chordDistance: dist,
            chordTone: dist === 0,
            quadrant: quadrantOf(stab, dist, { stableMax }),
        });
    });
    return points;
}

/**
 * How the melody behaves at each chord change — the book's four moves.
 *   'ctStay'      lands on a chord tone and stays (or the motif ends)
 *   'nctStay'     lands on a non-chord tone and stays
 *   'nctResolve'  non-chord tone, then immediately a chord tone
 *   'ctTwist'     chord tone, then immediately a non-chord tone
 * "Immediately" means the next sounding note starts within `gap` quarter notes.
 *
 * @param {Array<Object>} points - From `mapNotes`
 * @param {Array<Object>} melody - The same notes, for the chord-change salience
 * @param {Object} options
 * @param {Array} options.chords
 * @param {number} [options.gap=1]
 * @returns {Array<{ index:number, time:number, behaviour:string }>}
 */
export function chordChangeBehaviours(points, melody, { chords = [], gap = 1 } = {}) {
    const w = weigh(melody, { mode: 'chordChanges', chords: normalizeChords(chords) });
    const byIndex = new Map(points.map((p) => [p.index, p]));
    const sounding = points.slice().sort((a, b) => a.time - b.time);
    const out = [];
    for (const p of sounding) {
        if (w[p.index] < 0.5) continue;
        const k = sounding.indexOf(p);
        const next = sounding[k + 1];
        const immediate = next && next.time - (p.time + (melody[p.index].duration || 0)) < gap - 1e-9
            && next.time - p.time <= gap + 1e-9;
        let behaviour;
        if (p.chordTone) behaviour = immediate && !next.chordTone ? 'ctTwist' : 'ctStay';
        else behaviour = immediate && next.chordTone ? 'nctResolve' : 'nctStay';
        out.push({ index: p.index, time: p.time, behaviour });
    }
    return out;
}

function entropy(shares) {
    const e = -shares.filter((s) => s > 0).reduce((acc, s) => acc + s * Math.log2(s), 0);
    return e || 0; // never -0
}

/**
 * The whole picture for a section.
 *
 * @param {Array<Object>} melody
 * @param {Object} options
 * @param {{tonic:string|number, mode?:string}} options.key
 * @param {Array} [options.chords=[]]
 * @param {string|Function} [options.salience='anchors'] - Which notes are plotted; 'all' plots every note
 * @param {number} [options.threshold=0.25] - Salience cutoff
 * @param {boolean} [options.triads=true]
 * @param {number} [options.stableMax=2]
 * @param {number} [options.anticipation=0.5] - See `mapNotes`
 * @returns {Object} `{ points, centroid, spread, quadrants, entropy, chordToneRate, behaviours, first, last, sweetness }`
 */
export function emotionalMap(melody, options = {}) {
    const { key, chords = [], salience: mode = 'anchors', threshold = 0.25, triads = true, stableMax = 2, anticipation = 0.5 } = options;
    const all = mapNotes(melody, { key, chords, triads, stableMax, anticipation });
    let points = all;
    if (mode !== 'all') {
        const w = weigh(melody, { mode, ...options, chords: normalizeChords(chords) });
        points = all.filter((p) => w[p.index] >= threshold - 1e-9);
        if (points.length === 0) points = all;
    }

    const n = points.length;
    const empty = { points, centroid: { stability: 0, chordDistance: 0 }, spread: { stability: 0, chordDistance: 0 },
        quadrants: [0, 0, 0, 0], entropy: 0, chordToneRate: 0, behaviours: { ctStay: 0, nctStay: 0, nctResolve: 0, ctTwist: 0 },
        first: null, last: null, sweetness: 0 };
    if (n === 0) return empty;

    const mean = (f) => points.reduce((s, p) => s + f(p), 0) / n;
    const cx = mean((p) => p.stability);
    const cy = mean((p) => p.chordDistance);
    const sx = Math.sqrt(mean((p) => (p.stability - cx) ** 2));
    const sy = Math.sqrt(mean((p) => (p.chordDistance - cy) ** 2));
    const quadrants = [0, 0, 0, 0];
    for (const p of points) quadrants[p.quadrant - 1] += 1 / n;

    const beh = chordChangeBehaviours(all, melody, { chords: normalizeChords(chords) });
    const behaviours = { ctStay: 0, nctStay: 0, nctResolve: 0, ctTwist: 0 };
    for (const b of beh) behaviours[b.behaviour] += 1 / Math.max(1, beh.length);

    const byTime = all.slice().sort((a, b) => a.time - b.time);
    // Sweetness: 1 when every plotted note is a stable chord tone (the "90s
    // syndrome"), 0 when none is. It is quadrant 1's share, named for what
    // the book calls it.
    return {
        points,
        centroid: { stability: cx, chordDistance: cy },
        spread: { stability: sx, chordDistance: sy },
        quadrants,
        entropy: entropy(quadrants),
        chordToneRate: points.filter((p) => p.chordTone).length / n,
        behaviours,
        first: byTime[0],
        last: byTime[byTime.length - 1],
        sweetness: quadrants[0],
    };
}

/**
 * Pillar notes: one pitch per chord to land on at the change, chosen among
 * non-chord tones by default so the melody cannot outline the harmony.
 * Prefers the most stable candidates (MI, RE first in practice) unless
 * `prefer` says otherwise; `alternate: true` swaps to a chord tone every
 * other chord, as the book suggests.
 *
 * @param {Array<Object>} chords - JMON chord notes or `{ time, pitches }`
 * @param {Object} options
 * @param {{tonic:string|number, mode?:string}} options.key
 * @param {number} [options.low=60] - Register floor, MIDI
 * @param {number} [options.high=72] - Register ceiling, MIDI
 * @param {boolean} [options.alternate=false]
 * @param {string} [options.prefer='stable'] - 'stable' picks the most stable candidate, 'tense' the least, 'near' the one closest to the previous pillar
 * @param {boolean} [options.triads=true]
 * @returns {Array<{ time:number, pitch:number, solfege:string, chordTone:boolean }>}
 */
export function pillars(chords, { key, low = 60, high = 72, alternate = false, prefer = 'stable', triads = true } = {}) {
    if (!key) throw new Error('pillars: key is required');
    chords = normalizeChords(chords);
    const pcs = scalePitchClasses(key);
    const range = [];
    for (let p = low; p <= high; p++) if (pcs.includes(((p % 12) + 12) % 12)) range.push(p);
    const out = [];
    let prev = null;
    chords.forEach((c, i) => {
        const chord = triads ? triadOf(c.pitches) : c.pitches;
        const wantChordTone = alternate && i % 2 === 1;
        let cands = range.filter((p) => (chordDistance(p, chord) === 0) === wantChordTone);
        if (cands.length === 0) cands = range;
        let pick;
        if (prefer === 'near' && prev !== null) {
            pick = cands.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a));
        } else {
            const ranked = cands.slice().sort((a, b) => stability(a, key) - stability(b, key));
            pick = prefer === 'tense' ? ranked[ranked.length - 1] : ranked[0];
            if (prev !== null) {
                // among equally stable pitches (octaves), stay close
                const best = stability(pick, key);
                const ties = ranked.filter((p) => stability(p, key) === best);
                pick = ties.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a));
            }
        }
        prev = pick;
        out.push({ time: numericTime(c.time), pitch: pick, solfege: solfege(pick, key), chordTone: chordDistance(pick, chord) === 0 });
    });
    return out;
}

export default { chordAt, quadrantOf, mapNotes, chordChangeBehaviours, emotionalMap, pillars };
