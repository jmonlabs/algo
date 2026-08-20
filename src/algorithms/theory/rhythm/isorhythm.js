import { beatsToTime } from '../../../utils/jmon-utils.js';

/**
 * Merges durations and pitches until both ends coincide, then sets each note's
 * time from the durations that precede it.
 *
 * @param {Object} options
 * @param {Array<number>} options.pitches - Pitch values
 * @param {Array<number>} options.durations - Durations, cycled against the pitches
 * @param {boolean} [options.useStringTime=false] - Emit bars:beats:ticks time
 *   strings instead of numeric quarter notes
 * @returns {Array<Object>} JMON notes
 */
export function isorhythm({ pitches, durations, useStringTime = false }) {
    const cleanPitches = pitches.map(p => (Array.isArray(p) ? p[0] : p));

    // Calculate LCM using helper function
    const lcm = calculateLCM(cleanPitches.length, durations.length);

    // Repeat patterns to match LCM length
    const pRepeated = [];
    const dRepeated = [];

    for (let i = 0; i < lcm; i++) {
        pRepeated.push(cleanPitches[i % cleanPitches.length]);
        dRepeated.push(durations[i % durations.length]);
    }

    // Lay the notes out end to end, each starting where the previous one ended.
    let time = 0;
    return pRepeated.map((pitch, i) => {
        const duration = dRepeated[i];
        const note = {
            pitch,
            duration,
            time: useStringTime ? beatsToTime(time) : time
        };
        time += duration;
        return note;
    });
}

/**
 * Calculate Least Common Multiple of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} LCM of a and b
 */
function calculateLCM(a, b) {
    const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
    return Math.abs(a * b) / gcd(a, b);
}