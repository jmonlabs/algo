import { beatsToTime } from '../../../utils/jmon-utils.js';

/**
 * Clave patterns as onset grids, one boolean per eighth-note place. Two-bar
 * patterns are written in 2-3 orientation (the "2" side first); `orientation:
 * '3-2'` rotates by half the period. The tresillo is one bar; the afro clave
 * is two bars of 6/8, six places each.
 *
 * These are copy-paste patterns. The system behind them is a `Profile`
 * (`theory.profile.presets.rhythmCode`), which is where the weights live.
 */
export const CLAVES = Object.freeze({
    son:      { pulsesPerBar: 8, grid: [0,0,1,0,1,0,0,0, 1,0,0,1,0,0,1,0] },
    rumba:    { pulsesPerBar: 8, grid: [0,0,1,0,1,0,0,0, 1,0,0,1,0,0,0,1] },
    bossa:    { pulsesPerBar: 8, grid: [0,0,1,0,0,1,0,0, 1,0,0,1,0,0,1,0] },
    tresillo: { pulsesPerBar: 8, grid: [1,0,0,1,0,0,1,0] },
    afro:     { pulsesPerBar: 6, grid: [1,0,1,0,1,1, 0,1,0,1,0,1] },
});

/**
 * Onset grid of a clave.
 * @param {string} name - One of `CLAVES`
 * @param {string} [orientation='2-3'] - '2-3' or '3-2'; ignored for one-bar patterns
 * @returns {Array<boolean>}
 */
export function clavePattern(name, orientation = '2-3') {
    const def = CLAVES[name];
    if (!def) throw new Error(`clave: unknown pattern "${name}" (${Object.keys(CLAVES).join(', ')})`);
    let grid = def.grid.map(Boolean);
    if (orientation === '3-2' && grid.length === def.pulsesPerBar * 2) {
        const half = def.pulsesPerBar;
        grid = [...grid.slice(half), ...grid.slice(0, half)];
    } else if (orientation !== '2-3' && orientation !== '3-2') {
        throw new Error(`clave: unknown orientation "${orientation}"`);
    }
    return grid;
}

/**
 * A clave as JMON notes. Mirrors `euclid()`: `subdivision` is what one grid
 * place is worth in quarter notes (0.5, an eighth, by default).
 *
 * @param {Object} options
 * @param {string} [options.name='son']
 * @param {string} [options.orientation='2-3']
 * @param {number} [options.subdivision=0.5]
 * @param {number|Array<number>} [options.pitches=60]
 * @param {number|Array<number>} [options.velocities=0.8]
 * @param {number} [options.duration] - Defaults to 80% of a place
 * @param {number} [options.repeat=1] - How many cycles to lay out
 * @param {boolean} [options.useStringTime=false]
 * @returns {Array<Object>}
 *
 * @example
 * clave({ name: 'son', orientation: '3-2', pitches: 75 });
 */
export function clave({
    name = 'son',
    orientation = '2-3',
    subdivision = 0.5,
    pitches = 60,
    velocities = 0.8,
    duration,
    repeat = 1,
    useStringTime = false,
} = {}) {
    if (typeof subdivision !== 'number' || subdivision <= 0) {
        throw new Error('clave: subdivision must be a positive number of quarter notes');
    }
    const pattern = clavePattern(name, orientation);
    const pitchList = Array.isArray(pitches) ? pitches : [pitches];
    const velocityList = Array.isArray(velocities) ? velocities : [velocities];
    const noteDuration = typeof duration === 'number' && duration > 0 ? duration : subdivision * 0.8;

    const notes = [];
    let onset = 0;
    for (let r = 0; r < repeat; r++) {
        pattern.forEach((active, step) => {
            if (!active) return;
            const time = (r * pattern.length + step) * subdivision;
            notes.push({
                pitch: pitchList[onset % pitchList.length],
                duration: noteDuration,
                time: useStringTime ? beatsToTime(time) : time,
                velocity: velocityList[onset % velocityList.length],
            });
            onset++;
        });
    }
    return notes;
}

/**
 * Beat strength per grid place over one period — the metric hierarchy
 * anticipation and upbeat/downbeat balance are measured against.
 *
 *   0  off the beat (an upbeat)
 *   1  on a beat
 *   2  on the half-bar, when the bar splits evenly
 *   3  on the downbeat of a bar
 *
 * For 4/4 at an eighth-note pulse over two bars that is
 * `[3,0,1,0,2,0,1,0, 3,0,1,0,2,0,1,0]`. Any meter works: 3/4 has no level 2,
 * 7/8 at an eighth pulse with `beatsPerBar: 7, pulsesPerBeat: 1` puts a beat
 * on every place, so pass `strengths` yourself when the grouping matters.
 *
 * @param {Object} options
 * @param {number} [options.beatsPerBar=4]
 * @param {number} [options.pulsesPerBeat=2] - 2 for an eighth pulse under quarter beats
 * @param {number} [options.bars=2]
 * @returns {Array<number>}
 */
export function metricStrengths({ beatsPerBar = 4, pulsesPerBeat = 2, bars = 2 } = {}) {
    const perBar = beatsPerBar * pulsesPerBeat;
    const out = [];
    for (let b = 0; b < bars; b++) {
        for (let i = 0; i < perBar; i++) {
            if (i === 0) out.push(3);
            else if (i % pulsesPerBeat !== 0) out.push(0);
            else if (beatsPerBar % 2 === 0 && i === perBar / 2) out.push(2);
            else out.push(1);
        }
    }
    return out;
}
