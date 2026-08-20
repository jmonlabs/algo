import { beatsToTime } from '../../../utils/jmon-utils.js';

/**
 * Map pitches to durations cyclically and accumulate their start times.
 *
 * @param {Object} options
 * @param {Array<number>} options.pitches - Pitch values to iterate through
 * @param {Array<number>} options.durations - Durations applied cyclically to the pitches
 * @param {boolean} [options.useStringTime=false] - Emit bars:beats:ticks time
 *   strings instead of numeric quarter notes
 * @returns {Array<Object>} JMON notes
 */
export function beatcycle({ pitches, durations, useStringTime = false }) {
    if (!Array.isArray(pitches) || !Array.isArray(durations) || durations.length === 0) {
        return [];
    }

    const notes = [];
    let time = 0;
    let durationIndex = 0;

    for (const pitch of pitches) {
        const duration = durations[durationIndex % durations.length];
        notes.push({
            pitch,
            duration,
            time: useStringTime ? beatsToTime(time) : time
        });
        time += duration;
        durationIndex++;
    }

    return notes;
}