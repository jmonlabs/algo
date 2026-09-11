import { Profile } from '../theory/profile/Profile.js';
import { timeToBeats } from '../../utils/jmon-utils.js';
import { presets as profilePresets } from '../theory/profile/presets.js';
import { metricStrengths } from '../theory/rhythm/clave.js';
import { onsetPositions } from '../analysis/salience.js';

/**
 * Move onsets to better places on a profile.
 *
 * Bodzsar's four-step groove procedure is one operation applied four times
 * with different targets: move an onset earlier by n pulses if the place it
 * lands on is free. `anticipate` is that operation. `groove` is the general
 * form — hill-climbing on a profile: every stop on a low-weight place slides
 * to the nearest earlier free place with a higher weight. The book's four
 * steps are shipped as `STEPS.rhythmCode` for anyone who wants exactly that
 * sequence.
 *
 * Moving an onset earlier by d lengthens the note by d and shortens whatever
 * was sounding into that space, so the result never overlaps and durations
 * still tile the way they did. Rests (null pitch) are left alone.
 */

const numericTime = (t) => (typeof t === 'number' ? t : timeToBeats(t));
const isRest = (n) => n.pitch === null || n.pitch === undefined;

function clone(notes) {
    return notes.map((n) => ({ ...n, time: numericTime(n.time) }));
}

/** Shorten any note that would still be sounding at `time` so it ends there. */
function trimBefore(notes, time, except) {
    for (const n of notes) {
        if (n === except || isRest(n)) continue;
        if (n.time < time - 1e-9 && n.time + n.duration > time + 1e-9) {
            n.duration = time - n.time;
        }
    }
}

/**
 * Move the onsets that satisfy `from` earlier by `by` pulses, when the target
 * place is free.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {Object} options
 * @param {Function} options.from - `(place, note, ctx) => boolean`; `place` is the position within the period, `ctx` is `{ position, weight, strength, profile }`
 * @param {number} [options.by=1] - Pulses to move earlier
 * @param {number} [options.pulse=0.5]
 * @param {Profile} [options.profile] - Profile the period is taken from; default the Rhythm Code in `orientation`
 * @param {string} [options.orientation='2-3']
 * @param {Array<number>} [options.strengths]
 * @param {boolean} [options.onlyStops=false] - Only move notes that are stops
 * @returns {Array<Object>} New notes, sorted by time
 */
export function anticipate(notes, {
    from,
    by = 1,
    pulse = 0.5,
    profile,
    orientation = '2-3',
    strengths = metricStrengths(),
    onlyStops = false,
} = {}) {
    if (typeof from !== 'function') throw new Error('anticipate: `from` predicate is required');
    const prof = profile instanceof Profile ? profile : profilePresets.rhythmCode(orientation);
    const period = prof.period;
    const out = clone(notes).sort((a, b) => a.time - b.time);
    const occupied = new Set(onsetPositions(out, pulse));

    for (const n of out) {
        if (isRest(n)) continue;
        const position = Math.round(n.time / pulse);
        if (onlyStops && occupied.has(position + 1)) continue;
        const place = ((position % period) + period) % period;
        const ctx = { position, weight: prof.at(position), strength: strengths[place % strengths.length], profile: prof };
        if (!from(place, n, ctx)) continue;
        const target = position - by;
        if (target < 0) continue;
        let free = true;
        for (let p = target; p < position; p++) if (occupied.has(p)) { free = false; break; }
        if (!free) continue;
        const newTime = target * pulse;
        const delta = n.time - newTime;
        trimBefore(out, newTime, n);
        n.time = newTime;
        n.duration += delta;
        occupied.delete(position);
        occupied.add(target);
    }
    return out.sort((a, b) => a.time - b.time);
}

/**
 * Hill-climb every stop toward a better place. For each stop at a place with
 * weight w, look up to `reach` pulses earlier for a free place with weight
 * greater than w (or at least `minWeight`) and move there. One pass, in time
 * order, so a move never undoes a previous one.
 *
 * @param {Array<Object>} notes
 * @param {Object} [options]
 * @param {number} [options.pulse=0.5]
 * @param {Profile|Array<number>} [options.profile] - Default the Rhythm Code
 * @param {string} [options.orientation='2-3']
 * @param {number} [options.reach=2] - Furthest move, in pulses
 * @param {number} [options.minWeight] - Move only stops below this weight; default: any stop not already on a maximum
 * @param {boolean} [options.onlyStops=true]
 * @returns {Array<Object>}
 */
export function groove(notes, {
    pulse = 0.5,
    profile,
    orientation = '2-3',
    reach = 2,
    minWeight,
    onlyStops = true,
} = {}) {
    const prof = profile instanceof Profile
        ? profile
        : Array.isArray(profile) ? new Profile({ weights: profile }) : profilePresets.rhythmCode(orientation);
    const threshold = minWeight ?? prof.max;
    const out = clone(notes).sort((a, b) => a.time - b.time);
    const occupied = new Set(onsetPositions(out, pulse));

    for (const n of out) {
        if (isRest(n)) continue;
        const position = Math.round(n.time / pulse);
        if (onlyStops && occupied.has(position + 1)) continue;
        const w = prof.at(position);
        if (w >= threshold) continue;
        let best = null;
        for (let d = 1; d <= reach; d++) {
            const target = position - d;
            if (target < 0 || occupied.has(target)) break; // blocked: cannot pass another onset
            const tw = prof.at(target);
            if (tw > w && (best === null || tw > best.weight)) best = { target, weight: tw };
        }
        if (!best) continue;
        const newTime = best.target * pulse;
        const delta = n.time - newTime;
        trimBefore(out, newTime, n);
        n.time = newTime;
        n.duration += delta;
        occupied.delete(position);
        occupied.add(best.target);
    }
    return out.sort((a, b) => a.time - b.time);
}

/**
 * The book's four steps, for the Rhythm Code. Each is an `anticipate` call.
 * Places are eighth-note positions in the two-bar cycle, 2-3 orientation:
 * bar A is 0..7 (the "2" side), bar B is 8..15 (the "3" side). Under '3-2'
 * the same steps are rotated by 8.
 */
export const STEPS = {
    rhythmCode: [
        // 1. beat 1 of the "2" side, a quarter note earlier
        { by: 2, places: [0] },
        // 2. beat 1 of the "3" side, an eighth earlier
        { by: 1, places: [8] },
        // 3. stops on an X, an eighth earlier
        { by: 1, places: [3, 10], onlyStops: true },
        // 4. beat 3 of the "3" side, an eighth earlier
        { by: 1, places: [12] },
    ],
};

/**
 * Run a sequence of steps. Each step is `{ by, places, onlyStops }` or a
 * function `(notes) => notes`.
 *
 * @param {Array<Object>} notes
 * @param {Object} [options]
 * @param {Array} [options.steps=STEPS.rhythmCode]
 * @param {string} [options.orientation='2-3']
 * @param {number} [options.pulse=0.5]
 * @param {Profile} [options.profile]
 * @returns {Array<Object>}
 */
export function applySteps(notes, { steps = STEPS.rhythmCode, orientation = '2-3', pulse = 0.5, profile } = {}) {
    const prof = profile instanceof Profile ? profile : profilePresets.rhythmCode(orientation);
    const shift = !profile && orientation === '3-2' ? prof.period / 2 : 0;
    let out = notes;
    for (const step of steps) {
        if (typeof step === 'function') { out = step(out); continue; }
        const places = new Set(step.places.map((p) => (p + shift) % prof.period));
        out = anticipate(out, {
            from: (place) => places.has(place),
            by: step.by,
            onlyStops: step.onlyStops ?? false,
            pulse,
            profile: prof,
        });
    }
    return out;
}

export default { anticipate, groove, applySteps, STEPS };
