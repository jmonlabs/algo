import { timeToBeats } from '../../utils/jmon-utils.js';

/**
 * A chord timeline, as the analyses and Darwin's `context.chords` read it.
 *
 * Two shapes are accepted, and both come out as `[{ time, pitches }]` sorted
 * by time with numeric times:
 *
 *   - JMON chord notes, `{ time, duration, pitch: [60, 64, 67] }` — the same
 *     notes a track plays, as `jm.utils.chordTrack(progression)` builds them.
 *     A note with a single pitch counts as a one-note chord.
 *   - the bare form `{ time, pitches: [60, 64, 67] }`.
 *
 * @param {Array<Object>} chords
 * @returns {Array<{ time: number, pitches: Array<number> }>}
 */
export function normalizeChords(chords) {
    if (!Array.isArray(chords)) return [];
    const out = [];
    for (const c of chords) {
        if (!c) continue;
        const pitches = Array.isArray(c.pitches) ? c.pitches
            : Array.isArray(c.pitch) ? c.pitch
            : typeof c.pitch === 'number' ? [c.pitch]
            : null;
        if (!pitches || pitches.length === 0) continue;
        const time = typeof c.time === 'number' ? c.time : timeToBeats(c.time);
        out.push({ time, pitches });
    }
    return out.sort((a, b) => a.time - b.time);
}
