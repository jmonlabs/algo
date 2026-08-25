import { beatsToTime } from '../../../utils/jmon-utils.js';

/**
 * Distribute `pulses` onsets as evenly as possible over `steps` slots —
 * Bjorklund's algorithm, which Toussaint showed produces the rhythms found
 * across world music: E(3,8) is the tresillo, E(5,8) the cinquillo, E(2,5)
 * the khafif-e-ramal.
 *
 * @param {number} steps - Slots in the cycle
 * @param {number} pulses - Onsets to distribute
 * @param {number} [rotation=0] - Rotate the pattern left by this many steps.
 *   Rotation is half the musical point: E(3,8) rotated gives every one of the
 *   family's canonical faces.
 * @returns {Array<boolean>} One entry per step: true where an onset lands
 *
 * @example
 * euclidPattern(8, 3);    // [T,F,F,T,F,F,T,F] — tresillo
 * euclidPattern(8, 3, 3); // rotated
 */
export function euclidPattern(steps, pulses, rotation = 0) {
    if (!Number.isInteger(steps) || steps <= 0) {
        throw new Error('euclid: steps must be a positive integer');
    }
    if (!Number.isInteger(pulses) || pulses < 0) {
        throw new Error('euclid: pulses must be a non-negative integer');
    }
    if (pulses > steps) {
        throw new Error('euclid: pulses cannot exceed steps');
    }

    // Bjorklund's construction, in its closed form: step `i` carries an onset
    // when `(i * pulses) mod steps` falls below `pulses`. This is the same
    // maximally even distribution the recursive folding produces, and it
    // always starts on an onset — the rotation musicians expect, since a
    // rhythm that skips its own downbeat is a different rhythm.
    let pattern = new Array(steps);
    for (let i = 0; i < steps; i++) {
        pattern[i] = ((i * pulses) % steps) < pulses;
    }

    if (rotation) {
        const shift = ((rotation % steps) + steps) % steps;
        pattern = [...pattern.slice(shift), ...pattern.slice(0, shift)];
    }
    return pattern;
}

/**
 * A Euclidean rhythm, as JMON notes.
 *
 * Onsets are spread as evenly as possible over the cycle — the pattern
 * behind the tresillo, the son clave, and most West African bell patterns.
 *
 * `subdivision` is what a step is worth, in quarter notes: the default 0.25
 * makes a step a sixteenth, so the canonical `{ steps: 16, pulses: 5 }` fits
 * one 4/4 bar, which is where the ear expects it.
 *
 * @param {Object} options
 * @param {number} options.steps - Slots in the cycle
 * @param {number} options.pulses - Onsets to distribute
 * @param {number} [options.rotation=0] - Rotate the pattern left by this many steps
 * @param {number} [options.subdivision=0.25] - What one step is worth, in quarter notes
 * @param {number|Array<number>} [options.pitches=60] - Pitch, or pitches cycled across the onsets
 * @param {number|Array<number>} [options.velocities=0.8] - Velocity, or velocities cycled across the onsets
 * @param {number} [options.duration] - Note duration in quarter notes; defaults to 80% of a step
 * @param {boolean} [options.useStringTime=false] - Emit bars:beats:ticks time strings
 * @returns {Array<Object>} JMON notes, one per onset
 *
 * @example
 * // Five onsets over one bar of sixteenths
 * euclid({ steps: 16, pulses: 5 });
 *
 * @example
 * // Tresillo on a kick, one bar of eighths
 * euclid({ steps: 8, pulses: 3, subdivision: 0.5, pitches: 36 });
 *
 * @example
 * // Rotate to land the son clave's second half first
 * euclid({ steps: 8, pulses: 3, rotation: 3 });
 */
export function euclid({
    steps,
    pulses,
    rotation = 0,
    subdivision = 0.25,
    pitches = 60,
    velocities = 0.8,
    duration,
    useStringTime = false,
} = {}) {
    if (typeof subdivision !== 'number' || subdivision <= 0) {
        throw new Error('euclid: subdivision must be a positive number of quarter notes');
    }

    const pattern = euclidPattern(steps, pulses, rotation);
    const pitchList = Array.isArray(pitches) ? pitches : [pitches];
    const velocityList = Array.isArray(velocities) ? velocities : [velocities];
    if (pitchList.length === 0) throw new Error('euclid: pitches cannot be an empty array');
    if (velocityList.length === 0) throw new Error('euclid: velocities cannot be an empty array');

    const noteDuration = typeof duration === 'number' && duration > 0
        ? duration
        : subdivision * 0.8;

    const notes = [];
    let onset = 0;
    pattern.forEach((active, step) => {
        if (!active) return;
        const time = step * subdivision;
        notes.push({
            pitch: pitchList[onset % pitchList.length],
            duration: noteDuration,
            time: useStringTime ? beatsToTime(time) : time,
            velocity: velocityList[onset % velocityList.length],
        });
        onset++;
    });
    return notes;
}
