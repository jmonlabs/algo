import { MusicTheoryConstants } from '../../constants/MusicTheoryConstants.js';

/**
 * Represents a musical scale for generating note sequences
 *
 * @example
 * ```js
 * import jm from "https://cdn.jsdelivr.net/gh/jmonlabs/algo@main/src/index.js";
 *
 * const scale = new jm.theory.harmony.Scale({ tonic: 'C', mode: 'major' });
 * scale.generate({ length: 8 });
 * // => [60, 62, 64, 65, 67, 69, 71, 72]
 *
 * const scale2 = new jm.theory.harmony.Scale({ tonic: 'D', mode: 'minor' });
 * const notes = scale2.generate({ start: 'D4', length: 7 });
 * // => [62, 64, 65, 67, 69, 70, 72]
 * ```
 */
export class Scale {
    /**
     * Create a Scale
     * @param {Object} options - Configuration options
     * @param {string} options.tonic - The tonic note of the scale (e.g., 'C', 'D#', 'Bb')
     * @param {string} [options.mode='major'] - The type of scale (e.g., 'major', 'minor', 'dorian')
     */
    constructor(options = {}) {
        const { tonic, mode = 'major' } = options;
        
        if (!tonic) {
            throw new Error("'tonic' is required. Provide a note name like 'C', 'D#', or 'Bb'.");
        }
        
        const convertedTonic = MusicTheoryConstants.convertFlatToSharp(tonic);
        if (!MusicTheoryConstants.chromatic_scale.includes(convertedTonic)) {
            throw new Error(`'${tonic}' is not a valid tonic note. Select one among '${MusicTheoryConstants.chromatic_scale.join(', ')}'.`);
        }
        this.tonic = convertedTonic;

        if (!Object.keys(MusicTheoryConstants.scale_intervals).includes(mode)) {
            throw new Error(`'${mode}' is not a valid scale. Select one among '${Object.keys(MusicTheoryConstants.scale_intervals).join(', ')}'.`);
        }
        this.mode = mode;
    }/**
     * Generate a scale with flexible start/end points
     * @param {Object} options - Configuration object
     * @param {number|string} [options.start] - Starting MIDI note number or note name (e.g. 'C4')
     * @param {number|string} [options.end] - Ending MIDI note number or note name
     * @param {number} [options.length] - Number of notes to generate
     * @returns {Array} Array of MIDI note numbers representing the scale
     */
    generate(options = {}) {
        const intervals = MusicTheoryConstants.scale_intervals[this.mode];
        if (!intervals) {
            console.warn(`Unknown scale mode: ${this.mode}`);
            return [];
        }

        // Convert note names to MIDI numbers if provided
        if (typeof options.start === 'string') {
            options.start = MusicTheoryConstants.noteNameToMidi(options.start);
        }
        if (typeof options.end === 'string') {
            options.end = MusicTheoryConstants.noteNameToMidi(options.end);
        }

        // Get scale pattern
        const tonicIndex = MusicTheoryConstants.chromatic_scale.indexOf(this.tonic);
        if (tonicIndex === -1) {
            console.warn(`Unknown tonic: ${this.tonic}`);
            return [];
        }

        // Default start: tonic at octave 4 (e.g., E4 = 64 for E major)
        const defaultStart = 60 + tonicIndex; // C4 + tonic offset
        const startNote = options.start ?? defaultStart;

        // Helper to get next scale note
        // The scale intervals are relative to the tonic, so we need to:
        // 1. Find the base octave from startNote
        // 2. Apply intervals relative to the tonic in that octave
        const getNextNote = (baseNote, step) => {
            const scaleIndex = step % intervals.length;
            const octaveOffset = Math.floor(step / intervals.length) * 12;
            const interval = intervals[scaleIndex];
            // Calculate the tonic at the base octave, then add interval
            const baseOctave = Math.floor(baseNote / 12) * 12;
            return baseOctave + tonicIndex + interval + octaveOffset;
        };

        // Generate notes
        const result = [];
        if (options.end !== undefined) {
            // Generate until we reach or exceed end note
            for (let i = 0; ; i++) {
                const note = getNextNote(startNote, i);
                if (note > options.end) break;
                result.push(note);
            }
        } else if (options.length) {
            // Generate specified number of notes
            for (let i = 0; i < options.length; i++) {
                result.push(getNextNote(startNote, i));
            }
        } else {
            // Default to one octave
            return intervals.map(interval => startNote + interval);
        }

        return result;
    }

    /**
     * Get the note names of the scale
     * @returns {Array} Array of note names in the scale
     */
    getNoteNames() {
        const intervals = MusicTheoryConstants.scale_intervals[this.mode];
        if (!intervals) return [];
        
        const tonicIndex = MusicTheoryConstants.chromatic_scale.indexOf(this.tonic);
        if (tonicIndex === -1) return [];
        
        return intervals.map(interval => {
            const noteIndex = (tonicIndex + interval) % 12;
            return MusicTheoryConstants.chromatic_scale[noteIndex];
        });
    }

    /**
     * Check if a given pitch is in the scale
     * @param {number} pitch - MIDI note number
     * @returns {boolean} True if the pitch class is in the scale
     */
    isInScale(pitch) {
        const pitchClass = pitch % 12;
        const scalePitches = this.generate().map(p => p % 12);
        return scalePitches.includes(pitchClass);
    }
}