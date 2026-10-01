import { Scale } from './Scale.js';

function generateScaleForRange({ tonic, mode }, minPitch, maxPitch) {
    const scaleBuilder = new Scale({ tonic, mode });
    const safeMin = Number.isFinite(minPitch) ? minPitch : 60;
    const safeMax = Number.isFinite(maxPitch) ? maxPitch : safeMin + 12;
    const startOctave = Math.max(0, Math.floor(safeMin / 12) * 12);
    const extendedMax = safeMax + 12; // leave headroom for chord extensions
    const range = Math.max(12, extendedMax - startOctave);
    const octavesNeeded = Math.ceil(range / 12);
    const notesPerOctave = 7;
    const length = Math.max(notesPerOctave, (octavesNeeded + 1) * notesPerOctave);
    return scaleBuilder.generate({ start: startOctave, length });
}

/**
 * How many notes the scale array spans per octave. A well-formed scale array
 * is ascending and repeats at the octave, so this is the first index whose
 * pitch sits 12 semitones above the first note. Falls back to the array
 * length for anything that does not repeat (a chromatic fragment, a custom
 * non-octave scale).
 */
function notesPerOctave(scaleNotes) {
    for (let i = 1; i < scaleNotes.length; i++) {
        if (scaleNotes[i] === scaleNotes[0] + 12) return i;
    }
    return scaleNotes.length;
}

/**
 * Read a scale degree by index, continuing past either end of the array by
 * transposing whole octaves. Without this, a chord rooted near the top of a
 * short scale array would come back with fewer notes than it has degrees —
 * silently, which is the worst way for a chord to be wrong.
 */
function pitchAtScaleIndex(scaleNotes, index, period) {
    if (index >= 0 && index < scaleNotes.length) return scaleNotes[index];

    const octaveShift = Math.floor(index / period);
    const wrapped = ((index % period) + period) % period;
    return scaleNotes[wrapped] + octaveShift * 12;
}

function findClosestScaleIndex(pitch, scaleNotes) {
    let closestIndex = 0;
    let smallestDistance = Infinity;
    for (let i = 0; i < scaleNotes.length; i++) {
        const distance = Math.abs(scaleNotes[i] - pitch);
        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = i;
        }
    }
    return closestIndex;
}

/**
 * Build a chord from a pitch based on a scale and degree pattern
 * @param {number} pitch - The MIDI pitch to build a chord from
 * @param {Object} options - Chord building options
 * @param {string} options.tonic - The tonic note (e.g., 'C', 'D')
 * @param {string} options.mode - The scale mode (e.g., 'major', 'minor', 'dorian')
 * @param {Array<number>} options.degrees - Relative degrees for chord formation (default: [0, 2, 4] for triads)
 * @param {Array<number>} options.scale - Pre-generated scale to use (optional, overrides tonic/mode)
 * @returns {Array<number>} Array of MIDI notes representing the chord
 *
 * @example
 * // Build a C major triad
 * chordify(60, { tonic: 'C', mode: 'major' })
 * // => [60, 64, 67]
 *
 * @example
 * // Build a seventh chord
 * chordify(60, { tonic: 'C', mode: 'major', degrees: [0, 2, 4, 6] })
 * // => [60, 64, 67, 71]
 */
export function chordify(pitch, options = {}) {
    const {
        tonic = 'C',
        mode = 'major',
        degrees = [0, 2, 4],
        scale = null
    } = options;

    // Generate a scale that spans the chord's register if not provided
    const scaleNotes = scale || generateScaleForRange({ tonic, mode }, pitch - 24, pitch + 24);

    if (!scaleNotes || scaleNotes.length === 0) return [];

    // Locate the closest scale degree index to anchor the chord
    const baseIndex = findClosestScaleIndex(pitch, scaleNotes);
    const period = notesPerOctave(scaleNotes);

    // One pitch per requested degree, always — degrees that run off the end of
    // the scale array continue into the next octave rather than being dropped.
    return degrees.map(degree => pitchAtScaleIndex(scaleNotes, baseIndex + degree, period));
}

/**
 * Build chords for multiple pitches
 * @param {Array<number>} pitches - Array of MIDI pitches
 * @param {Object} options - Chord building options (same as chordify)
 * @returns {Array<Array<number>>} Array of chord arrays
 *
 * @example
 * const chords = chordifyMany([60, 62, 64], { tonic: 'C', mode: 'major' });
 * // => [[60, 64, 67], [62, 65, 69], [64, 67, 71]]
 */
export function chordifyMany(pitches, options = {}) {
    const { tonic = 'C', mode = 'major', scale = null } = options;
    const numericPitches = (pitches || []).filter(p => typeof p === 'number');
    const minPitch = numericPitches.length ? Math.min(...numericPitches) : undefined;
    const maxPitch = numericPitches.length ? Math.max(...numericPitches) : undefined;
    const scaleNotes = scale || generateScaleForRange({ tonic, mode }, minPitch, maxPitch);

    return pitches.map(pitch => chordify(pitch, { ...options, scale: scaleNotes }));
}
