import { Profile } from '../theory/profile/Profile.js';
import { presets as profilePresets } from '../theory/profile/presets.js';
import { metricStrengths } from '../theory/rhythm/clave.js';
import { onsetPositions, salience } from './salience.js';

/**
 * Rhythm as a binary onset grid — Bodzsar's reading of it, generalised.
 *
 * Durations are ignored throughout: a note is where it starts. Positions are
 * integer pulses (`time / pulse`), and everything folds into a `period` so a
 * two-bar clave cycle, a 12-pulse bell and a 7/8 bar are all the same code.
 *
 * Nothing here is a rule. Every function returns a measurement; the caller
 * decides what a good value is.
 */

const numericTime = (t) => (typeof t === 'number' ? t : parseFloat(t) || 0);

/**
 * Salient positions of a track on the grid.
 * @param {Array<Object>} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.pulse=0.5] - Grid unit in quarter notes
 * @param {string|Function} [options.salience='onsets'] - Which notes count: 'onsets', 'stops', 'accents', 'contourPeaks', or a function
 * @returns {Array<number>} Sorted, deduplicated integer positions
 */
export function onsetGrid(notes, { pulse = 0.5, salience: mode = 'onsets', ...rest } = {}) {
    if (mode === 'onsets') return onsetPositions(notes, pulse);
    const w = salience(notes, { mode, pulse, ...rest });
    const chosen = notes.filter((_, i) => w[i] >= 0.5);
    return onsetPositions(chosen, pulse);
}

/**
 * Stops among a set of positions: a position with no position right after it.
 * @param {Array<number>} positions
 * @returns {Array<number>}
 */
export function stops(positions) {
    const set = new Set(positions);
    return positions.filter((p) => !set.has(p + 1));
}

/**
 * Anticipations. An onset at a weak place anticipates the next stronger
 * place when nothing sounds between the two, inclusive of the strong place
 * itself. `order` is the distance in pulses: 1 is the eighth-note
 * anticipation, 2 the quarter-note anticipation the book singles out on
 * beat 4. The "only on beat 4" restriction is not coded; it falls out of the
 * strengths, because beat 4 is the last place before the bar's strongest one.
 *
 * An anticipation is only known once we hear what follows, so an onset whose
 * target lies past the last position is not counted — unless `cyclic` is
 * set, in which case the positions are read as a loop of `period` pulses.
 *
 * @param {Array<number>} positions
 * @param {Object} [options]
 * @param {Array<number>} [options.strengths] - Beat strength per place over one period; default 4/4, eighth pulse, two bars
 * @param {number} [options.maxOrder=2]
 * @param {boolean} [options.cyclic=false] - Treat the positions as a repeating loop of one period
 * @returns {Array<{ position: number, target: number, order: number }>}
 */
export function anticipations(positions, { strengths = metricStrengths(), maxOrder = 2, cyclic = false } = {}) {
    if (positions.length === 0) return [];
    const period = strengths.length;
    const fold = (x) => ((x % period) + period) % period;
    const set = new Set(cyclic ? positions.map(fold) : positions);
    const has = (x) => set.has(cyclic ? fold(x) : x);
    const last = Math.max(...positions);
    const strengthAt = (p) => strengths[fold(p)];
    const out = [];
    for (const p of positions) {
        const s = strengthAt(p);
        for (let k = 1; k <= maxOrder; k++) {
            const q = p + k;
            if (strengthAt(q) <= s) {
                if (has(q)) break; // something sounds before a stronger place
                continue;
            }
            // q is the next stronger place; the span (p, q] must be empty and audible
            if (!cyclic && q > last) break;
            let clear = true;
            for (let j = p + 1; j <= q; j++) if (has(j)) { clear = false; break; }
            if (clear) out.push({ position: p, target: q, order: k });
            break;
        }
    }
    return out;
}

/**
 * Share of positions at each strength level. Index 0 is the upbeat share.
 * @param {Array<number>} positions
 * @param {Object} [options]
 * @param {Array<number>} [options.strengths]
 * @returns {Array<number>} Sums to 1 (all zeros if empty)
 */
export function metricHistogram(positions, { strengths = metricStrengths() } = {}) {
    const levels = Math.max(...strengths) + 1;
    const hist = new Array(levels).fill(0);
    if (positions.length === 0) return hist;
    const period = strengths.length;
    for (const p of positions) hist[strengths[((p % period) + period) % period]]++;
    return hist.map((c) => c / positions.length);
}

/**
 * Fraction of positions off the beat.
 * @param {Array<number>} positions
 * @param {Object} [options]
 * @returns {number} 0..1
 */
export function upbeatRatio(positions, options = {}) {
    return metricHistogram(positions, options)[0];
}

/**
 * Fraction of positions that are stops.
 * @param {Array<number>} positions
 * @returns {number}
 */
export function stopRate(positions) {
    return positions.length === 0 ? 0 : stops(positions).length / positions.length;
}

/**
 * Fraction of positions that anticipate.
 * @param {Array<number>} positions
 * @param {Object} [options] - Passed to `anticipations`
 * @returns {number}
 */
export function anticipationRate(positions, options = {}) {
    return positions.length === 0 ? 0 : anticipations(positions, options).length / positions.length;
}

function resolveProfile(profile, orientation) {
    if (profile instanceof Profile) return profile;
    if (Array.isArray(profile)) return new Profile({ weights: profile });
    return profilePresets.rhythmCode(orientation === 'auto' ? '2-3' : orientation);
}

/**
 * How well a set of positions sits on a profile. With the default Rhythm
 * Code this is the book's test: the fraction of stops on the frequent
 * places and how many land on an X.
 *
 * @param {Array<number>} positions - Usually `stops(onsetGrid(notes))`
 * @param {Object} [options]
 * @param {Profile|Array<number>} [options.profile] - Default: the Rhythm Code
 * @param {string} [options.orientation='auto'] - '2-3', '3-2' or 'auto' to pick the better one
 * @param {Array<number>} [options.rotations] - Rotations tried under 'auto'; default `[0, period/2]`
 * @returns {{ fit: number, rareRate: number, strongRate: number, rotation: number, profile: Profile }}
 */
export function profileFit(positions, { profile, orientation = 'auto', rotations } = {}) {
    const base = resolveProfile(profile, orientation);
    let chosen = { rotation: 0, profile: base };
    if (orientation === 'auto' || (profile && rotations)) {
        const candidates = rotations ?? [0, Math.floor(base.period / 2)];
        const best = base.bestRotation(positions, { candidates });
        chosen = { rotation: best.rotation, profile: best.profile };
    }
    const p = chosen.profile;
    const max = p.max;
    const strong = positions.length === 0
        ? 0
        : positions.filter((x) => p.at(x) === max).length / positions.length;
    return {
        fit: p.fit(positions),
        rareRate: p.rareRate(positions),
        strongRate: strong,
        rotation: chosen.rotation,
        profile: p,
    };
}

/**
 * Which orientation of a two-bar profile a track follows, judged by its
 * stops. Returns `'2-3'` or `'3-2'` for the Rhythm Code, or the rotation
 * index for a custom profile.
 * @param {Array<Object>} notes
 * @param {Object} [options]
 * @param {number} [options.pulse=0.5]
 * @param {Profile|Array<number>} [options.profile]
 * @param {string|Function} [options.salience='stops']
 * @returns {{ orientation: string|number, rotation: number, fit: number, margin: number }}
 */
export function detectOrientation(notes, { pulse = 0.5, profile, salience: mode = 'stops' } = {}) {
    const positions = onsetGrid(notes, { pulse, salience: mode });
    const base = resolveProfile(profile, '2-3');
    const half = Math.floor(base.period / 2);
    const a = base.fit(positions);
    const b = base.rotate(half).fit(positions);
    const rotation = b > a ? half : 0;
    const label = profile ? rotation : (rotation === 0 ? '2-3' : '3-2');
    return { orientation: label, rotation, fit: Math.max(a, b), margin: Math.abs(a - b) };
}

/**
 * Everything at once for a track. The stop-based numbers are what the book
 * looks at; the onset-based ones are there for comparison.
 *
 * @param {Array<Object>} notes
 * @param {Object} [options]
 * @param {number} [options.pulse=0.5]
 * @param {Profile|Array<number>} [options.profile]
 * @param {string} [options.orientation='auto']
 * @param {Array<number>} [options.strengths]
 * @returns {Object}
 */
export function analyzeRhythm(notes, { pulse = 0.5, profile, orientation = 'auto', strengths = metricStrengths() } = {}) {
    const onsets = onsetGrid(notes, { pulse });
    const st = stops(onsets);
    const fit = profileFit(st, { profile, orientation });
    return {
        onsets,
        stops: st,
        stopRate: stopRate(onsets),
        upbeatRatio: upbeatRatio(onsets, { strengths }),
        metricHistogram: metricHistogram(onsets, { strengths }),
        anticipations: anticipations(onsets, { strengths }),
        anticipationRate: anticipationRate(onsets, { strengths }),
        fit: fit.fit,
        rareRate: fit.rareRate,
        strongRate: fit.strongRate,
        orientation: profile ? fit.rotation : (fit.rotation === 0 ? '2-3' : '3-2'),
    };
}

/**
 * A profile learned from tracks: where their stops (or other salient
 * events) fall around the cycle. Feed it your own MIDI, quantise it to
 * three levels, and you have a Rhythm Code for your own music.
 *
 * @param {Array<Array<Object>>} tracks - Arrays of JMON notes
 * @param {Object} [options]
 * @param {number} [options.period=16] - Cycle length in pulses
 * @param {number} [options.pulse=0.5]
 * @param {string|Function} [options.salience='stops']
 * @param {number} [options.levels] - Quantise to this many levels (e.g. 3 for 0/1/2); omit to keep counts
 * @returns {Profile}
 */
export function profileFromTracks(tracks, { period = 16, pulse = 0.5, salience: mode = 'stops', levels } = {}) {
    const positions = [];
    for (const notes of tracks) {
        const grid = onsetGrid(notes, { pulse, salience: mode });
        positions.push(...grid);
    }
    const p = Profile.fromPositions(positions, { period, name: 'corpus' });
    return levels ? p.quantize(levels) : p;
}

export default {
    onsetGrid, stops, anticipations, metricHistogram, upbeatRatio, stopRate,
    anticipationRate, profileFit, detectOrientation, analyzeRhythm, profileFromTracks,
};
