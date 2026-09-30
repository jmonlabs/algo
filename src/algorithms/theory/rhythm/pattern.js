import { beatsToTime } from '../../../notes/index.js';

/**
 * The pattern ↔ notes pair, which is what `euclid` and `clave` are made of.
 *
 * A pattern is one value per step of a grid: `true`/`1` for a hit, `false`/`0`
 * for silence, or a string using any non-`.` character for a hit (`'x..x..x.'`,
 * `'X..X..X.'`, `'1..1..1.'`). A note array is a pattern with its hits already
 * spread out in time.
 *
 * `onsets` reads a pattern off some notes, `fromOnsets` lays a pattern out as
 * notes, and `draw` prints either one. Between them they cover both directions,
 * so a rhythm can be shown, edited as text, and played back without a hand-
 * written loop in between.
 *
 * @module pattern
 */

/** Characters treated as a rest in a string pattern. */
const SILENT = new Set(['.', ' ', '-', '_', '0']);

/**
 * Read a pattern into booleans, one per step.
 *
 * @param {Array<boolean|number>|string} pattern
 * @returns {Array<boolean>}
 */
export function parsePattern(pattern) {
    if (typeof pattern === 'string') {
        return [...pattern].map((c) => !SILENT.has(c));
    }
    return pattern.map(Boolean);
}

/**
 * A grid of onsets read off notes, one boolean per step.
 *
 * The inverse of `fromOnsets`. A note is a hit wherever it starts; a chord,
 * being several notes at one time, counts once. `pitch: null` (a rest) never
 * counts, so a phrase padded with rests draws the same as the phrase without.
 *
 * @param {Array<Object>} notes - JMON notes, or anything with a `time`.
 * @param {Object} [options]
 * @param {number} [options.subdivision=0.5] - What one step is worth, in
 *   quarter notes. 0.5 makes a step an eighth, 0.25 a sixteenth.
 * @param {number} [options.beats] - Length of the window, in quarter notes.
 *   Defaults to the notes' own extent, rounded up to a whole number of steps.
 * @param {number} [options.start=0] - Where the window opens, in quarter notes.
 * @param {boolean} [options.cyclic=false] - Wrap the window, so a step past the
 *   end lands back at the start. This is what makes two patterns of different
 *   lengths comparable in one grid.
 * @returns {Array<boolean>} One entry per step.
 *
 * @example
 * // One bar of eighths, a note on every eighth
 * onsets(euclid({ steps: 8, pulses: 3, subdivision: 0.5 }), { beats: 4 });
 * // [true, false, false, true, false, false, true, false]
 */
export function onsets(notes, { subdivision = 0.5, beats, start = 0, cyclic = false } = {}) {
    if (!(subdivision > 0)) throw new Error('onsets: subdivision must be a positive number of quarter notes');
    const times = notes.map((n) => (typeof n.time === 'string' ? parseFloat(n.time) : n.time ?? 0));

    let windowBeats = beats;
    if (windowBeats === undefined) {
        const last = notes.reduce((max, n, i) => Math.max(max, times[i] + (n.duration ?? 0)), start);
        windowBeats = Math.max(subdivision, last - start);
    }
    const steps = Math.max(1, Math.round(windowBeats / subdivision));
    const grid = new Array(steps).fill(false);

    for (const t of times) {
        const offset = (t - start) / subdivision;
        if (cyclic) {
            const step = ((Math.round(offset) % steps) + steps) % steps;
            grid[step] = true;
        } else if (offset >= 0 && offset < steps) {
            grid[Math.round(offset)] = true;
        }
    }
    return grid;
}

/**
 * A pattern laid out as JMON notes, one note per hit.
 *
 * What `euclid` and `clave` both are, with the pattern left to the caller: a
 * boolean array, a string such as `'x..x..x.'`, or anything `parsePattern`
 * takes. Pitches and velocities are cycled across the hits, so passing one
 * value gives a unison and an array gives a pattern of its own.
 *
 * @param {Array<boolean|number>|string} pattern
 * @param {Object} [options]
 * @param {number|Array<number>} [options.pitches=60] - Pitch, or pitches cycled across hits
 * @param {number|Array<number>} [options.velocities=0.8] - Velocity, or velocities cycled
 * @param {number} [options.duration] - Note duration; defaults to 80% of a step
 * @param {number} [options.subdivision=0.5] - What one step is worth, in quarter notes
 * @param {number} [options.time=0] - Time of the first hit, in quarter notes
 * @param {boolean} [options.useStringTime=false] - Emit `bars:beats:ticks` times
 * @param {number} [options.repeat=1] - How many cycles of the pattern to lay out
 * @returns {Array<Object>} JMON notes
 *
 * @example
 * // The tresillo, on a kick, one bar of eighths
 * fromOnsets('x..x..x.', { pitches: 36, subdivision: 0.5 });
 *
 * @example
 * // A row of an automaton decides which eighths play
 * fromOnsets(row, { pitches: chord, subdivision: 0.5, time: bar * 4 });
 */
export function fromOnsets(pattern, {
    pitches = 60,
    velocities = 0.8,
    duration,
    subdivision = 0.5,
    time = 0,
    useStringTime = false,
    repeat = 1,
} = {}) {
    if (!(subdivision > 0)) throw new Error('fromOnsets: subdivision must be a positive number of quarter notes');
    const grid = parsePattern(pattern);
    const pitchList = Array.isArray(pitches) ? pitches : [pitches];
    const velocityList = Array.isArray(velocities) ? velocities : [velocities];
    if (pitchList.length === 0) throw new Error('fromOnsets: pitches cannot be an empty array');
    if (velocityList.length === 0) throw new Error('fromOnsets: velocities cannot be an empty array');
    const noteDuration = typeof duration === 'number' && duration > 0 ? duration : subdivision * 0.8;

    const notes = [];
    let onset = 0;
    for (let r = 0; r < repeat; r++) {
        grid.forEach((active, step) => {
            if (!active) return;
            const at = time + (r * grid.length + step) * subdivision;
            notes.push({
                pitch: pitchList[onset % pitchList.length],
                duration: noteDuration,
                time: useStringTime ? beatsToTime(at) : at,
                velocity: velocityList[onset % velocityList.length],
            });
            onset++;
        });
    }
    return notes;
}

/**
 * Print a rhythm or a pattern as one character per step.
 *
 * Takes notes (which it reads as a grid with `onsets`) or a pattern, so the
 * same call shows a phrase the generators produced and a pattern you typed.
 * Reading a rhythm is quicker than reading a list of durations, and quicker
 * still than a list of note objects.
 *
 * @param {Array<Object>|Array<boolean|number>|string} thing - Notes, or a pattern
 * @param {Object} [options]
 * @param {number} [options.subdivision=0.5] - What one step is worth, in quarter notes
 * @param {number} [options.beats] - Length of the window; ignored for patterns
 * @param {number} [options.start=0] - Where the window opens, in quarter notes
 * @param {boolean} [options.cyclic=false] - Wrap the window
 * @param {string} [options.on='x'] - Character for a hit
 * @param {string} [options.off='.'] - Character for a rest
 * @param {string} [options.separator=''] - Inserted every `group` steps
 * @param {number} [options.group=0] - Bar length in steps; 0 for no separator
 * @returns {string}
 *
 * @example
 * draw(cell, { beats: 8 });            // 'x.x.x...xx.x.x.x'
 * draw(euclidPattern(8, 3));           // 'x..x..x.'
 * draw('x..x..x.', { on: 'X', off: '-' });  // 'X..X..X.'
 */
export function draw(thing, {
    subdivision = 0.5,
    beats,
    start = 0,
    cyclic = false,
    on = 'x',
    off = '.',
    separator = '',
    group = 0,
} = {}) {
    const isNotes = Array.isArray(thing) && thing.length > 0
        && typeof thing[0] === 'object' && thing[0] !== null;
    const grid = isNotes
        ? onsets(thing, { subdivision, beats, start, cyclic })
        : parsePattern(thing);
    if (!separator || !group) return grid.map((hit) => (hit ? on : off)).join('');
    return grid
        .map((hit, step) => (hit ? on : off) + (step % group === group - 1 ? separator : ''))
        .join('');
}
