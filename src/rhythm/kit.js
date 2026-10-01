import { DEFAULT_DRUM_MAP } from '../algorithms/generative/drummer/drum-map.js';

const SILENT = new Set(['.', ' ', '-', '_', '0']);

/**
 * A drum kit written as lines of text, one per drum: `x` is a hit, `X` an
 * accented one, `.` a rest. The lines are read together, step by step, and
 * played `repeat` times.
 *
 * A drum is named (`kick`, `snare`, `hihat`, `openhat`, `ride`, `crash`,
 * `tomLow`, `tomMid`, `tomHigh`, `clap`, `rim`) or given as its MIDI pitch.
 *
 * @param {Object<string, string>} lines - A pattern per drum
 * @param {Object} [options]
 * @param {number} [options.subdivision=0.5] - What one step is worth, in quarter notes
 * @param {number} [options.repeat=1] - How many times the lines are played
 * @param {number} [options.velocity=0.8] - Of a hit; an accent gets `accent`
 * @param {number} [options.accent=1] - Velocity of an `X`
 * @param {number} [options.duration] - Of a hit; 80% of a step by default
 * @param {number} [options.time=0] - Where the first step falls, in quarter notes
 * @param {Object<string, number>} [options.map] - Your own drum names
 * @returns {Array<Object>} JMON notes
 *
 * @example
 * kit({
 *   kick:  "x.......x.x.....",
 *   snare: "....X.......X...",
 *   hihat: "x.x.x.x.x.x.x.x.",
 * }, { subdivision: 0.5, repeat: 4 });
 */
export function kit(lines, {
    subdivision = 0.5,
    repeat = 1,
    velocity = 0.8,
    accent = 1,
    duration,
    time = 0,
    map = DEFAULT_DRUM_MAP,
} = {}) {
    if (!(subdivision > 0)) throw new Error('kit: subdivision must be a positive number of quarter notes');
    const hitDuration = typeof duration === 'number' && duration > 0 ? duration : subdivision * 0.8;
    const notes = [];
    for (const [drum, line] of Object.entries(lines)) {
        const pitch = map[drum] ?? Number(drum);
        if (!Number.isFinite(pitch)) {
            throw new Error(`kit: unknown drum "${drum}" (${Object.keys(map).join(', ')}, or a MIDI pitch)`);
        }
        const steps = [...line];
        for (let r = 0; r < repeat; r++) {
            steps.forEach((c, step) => {
                if (SILENT.has(c)) return;
                notes.push({
                    pitch,
                    duration: hitDuration,
                    time: time + (r * steps.length + step) * subdivision,
                    velocity: c === 'X' ? accent : velocity,
                });
            });
        }
    }
    return notes.sort((a, b) => a.time - b.time || a.pitch - b.pitch);
}
