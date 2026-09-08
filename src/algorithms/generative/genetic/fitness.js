import { onsetGrid, stops, profileFit, upbeatRatio, anticipationRate, stopRate } from '../../analysis/RhythmCode.js';
import { emotionalMap } from '../../analysis/EmotionalMap.js';
import { presets as profilePresets } from '../../theory/profile/presets.js';
import { doPitchClass } from '../../theory/harmony/Solfege.js';

/**
 * Fitness terms for `Darwin`, wrapping the Rhythm Code and Emotional Map
 * analyses. Each is `(phrase, ctx) => number` in [0, 1], where `phrase` is
 * the GA genome and `ctx` is the Darwin `context`:
 *
 *   pulse        grid unit in quarter notes (default 0.5)
 *   profile      a `Profile` for the rhythm terms (default: the Rhythm Code)
 *   orientation  '2-3' | '3-2' | 'auto'
 *   key          { tonic, mode } for the melody terms
 *   chords       [{ time, pitches }] for the melody terms
 *   salience     which notes the map plots (default 'anchors')
 *
 * Use with `metric(name, { target, weight })`, e.g.
 *
 *   new Darwin({ ..., context: { key, chords },
 *     metrics: [metric('claveFit', { target: 0.7, weight: 5 }),
 *               metric('sweetness', { target: 0.4, weight: 3 })] })
 *
 * Targets are deliberately not 1.0: both books ask for balance, not maxima.
 */

/** GA genome → JMON notes (rests dropped). */
export function phraseToNotes(phrase) {
    return phrase
        .filter((n) => n[0] !== null && n[0] !== undefined)
        .map(([pitch, duration, time]) => ({ pitch, duration, time }));
}

const rhythmOf = (phrase, ctx) => {
    const notes = phraseToNotes(phrase);
    const pulse = ctx.pulse ?? 0.5;
    const onsets = onsetGrid(notes, { pulse });
    return { notes, pulse, onsets, stops: stops(onsets) };
};

const mapOf = (phrase, ctx) => {
    if (!ctx.key) return null;
    return emotionalMap(phraseToNotes(phrase), {
        key: ctx.key,
        chords: ctx.chords ?? [],
        salience: ctx.salience ?? 'anchors',
    });
};

export const metrics = {
    /** Mean Rhythm Code weight at the stops, in the best orientation. */
    claveFit(phrase, ctx = {}) {
        const r = rhythmOf(phrase, ctx);
        return profileFit(r.stops, { profile: ctx.profile, orientation: ctx.orientation ?? 'auto' }).fit;
    },
    /** Share of stops on a zero-weight place. Target near 0. */
    rareRate(phrase, ctx = {}) {
        const r = rhythmOf(phrase, ctx);
        return profileFit(r.stops, { profile: ctx.profile, orientation: ctx.orientation ?? 'auto' }).rareRate;
    },
    /** Share of onsets off the beat. */
    upbeatRatio(phrase, ctx = {}) {
        const r = rhythmOf(phrase, ctx);
        return upbeatRatio(r.onsets, ctx.strengths ? { strengths: ctx.strengths } : {});
    },
    /** Share of onsets that anticipate a stronger place. */
    anticipationRate(phrase, ctx = {}) {
        const r = rhythmOf(phrase, ctx);
        return anticipationRate(r.onsets, ctx.strengths ? { strengths: ctx.strengths } : {});
    },
    /** Share of onsets that are stops. */
    stopRate(phrase, ctx = {}) {
        return stopRate(rhythmOf(phrase, ctx).onsets);
    },

    /** Share of plotted notes that are stable chord tones — the "90s syndrome" when near 1. */
    sweetness(phrase, ctx = {}) {
        const m = mapOf(phrase, ctx);
        return m ? m.sweetness : 0;
    },
    /** Entropy over the four quadrants, scaled to [0, 1]. 1 is an even spread. */
    quadrantBalance(phrase, ctx = {}) {
        const m = mapOf(phrase, ctx);
        return m ? m.entropy / 2 : 0;
    },
    /** Share of plotted notes that are chord tones. */
    chordToneRate(phrase, ctx = {}) {
        const m = mapOf(phrase, ctx);
        return m ? m.chordToneRate : 0;
    },
    /** Stability of the last note, 0 (DO) … 1 (chromatic). Target 0 for a chorus, ~0.57 (RE) for a verse. */
    lastStability(phrase, ctx = {}) {
        const m = mapOf(phrase, ctx);
        return m && m.last ? m.last.stability / 7 : 0;
    },
    /** 1 if the first note is a chord tone, else 0. */
    firstChordTone(phrase, ctx = {}) {
        const m = mapOf(phrase, ctx);
        return m && m.first && m.first.chordTone ? 1 : 0;
    },
    /** Share of chord changes resolved immediately (non-chord tone then chord tone). */
    resolveRate(phrase, ctx = {}) {
        const m = mapOf(phrase, ctx);
        return m ? m.behaviours.nctResolve : 0;
    },
    /** Mean Tonality Code weight of the pitches: pentatonic 1, diatonic 0.5, chromatic 0. */
    tonalityFit(phrase, ctx = {}) {
        if (!ctx.key) return 0;
        const prof = profilePresets.tonalityCode(doPitchClass(ctx.key));
        const pcs = phraseToNotes(phrase).map((n) => ((n.pitch % 12) + 12) % 12);
        return prof.fit(pcs);
    },
};

/**
 * A metric entry for `Darwin`'s `metrics` option.
 * @param {string|Function} nameOrFn - A key of `metrics`, or your own `(phrase, ctx) => number`
 * @param {Object} [options]
 * @param {number} [options.target=1]
 * @param {number} [options.weight=1]
 * @param {string} [options.name]
 * @returns {{ name: string, fn: Function, target: number, weight: number }}
 */
export function metric(nameOrFn, { target = 1, weight = 1, name } = {}) {
    const fn = typeof nameOrFn === 'function' ? nameOrFn : metrics[nameOrFn];
    if (typeof fn !== 'function') {
        throw new Error(`metric: unknown metric "${nameOrFn}" (${Object.keys(metrics).join(', ')})`);
    }
    return { name: name ?? (typeof nameOrFn === 'string' ? nameOrFn : fn.name || 'custom'), fn, target, weight };
}

export default { phraseToNotes, metrics, metric };
