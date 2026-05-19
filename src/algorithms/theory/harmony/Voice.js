import { MusicTheoryConstants } from '../../constants/MusicTheoryConstants.js';
import { Scale } from './Scale.js';
import { chordify, chordifyMany } from './Chordify.js';
import { findClosestPitchAtMeasureStart } from '../../utils.js';

/**
 * A class for voicing operations on musical tracks.
 * Wraps chordify utilities with options for rhythm extraction and transposition.
 * 
 * @example
 * ```js
 * // Create a voice generator for E major triads
 * const voice = new Voice({ 
 *   tonic: 'E', 
 *   mode: 'major', 
 *   degrees: [0, 2, 4],
 *   measureLength: 4  // extract roots at each 4-beat measure
 * });
 * 
 * // Generate chords from a track (extracts roots at measure starts)
 * const chordTrack = voice.generate(melodyTrack);
 * 
 * // Or generate chords from every note
 * const voice2 = new Voice({ tonic: 'C', mode: 'major', extractRoots: false });
 * const fullChords = voice2.generate(track);
 * ```
 */
export class Voice extends MusicTheoryConstants {
    /**
     * Constructs all the necessary attributes for the voice object
     * @param {Object} options - Configuration options
     * @param {string} [options.tonic='C'] - The tonic note of the scale
     * @param {string|Object} [options.key] - Either a tonic string (alias of `tonic`)
     *   or a `Key` context (from `jm.key(...)`) that provides both `tonic` and `mode`.
     * @param {string} [options.mode='major'] - The scale mode (e.g., 'major', 'minor', 'dorian')
     * @param {Array<number>} [options.degrees=[0, 2, 4]] - Relative degrees for chord formation (triad by default)
     * @param {number} [options.measureLength=4] - Length of a measure in beats (for root extraction)
     * @param {boolean} [options.extractRoots=true] - If true, extract one root per measure; if false, chordify every note
     * @param {number} [options.transpose=0] - Semitones to transpose the output
     * @param {string} [options.output='chords'] - Output format: 'chords' (arrays), 'track' (JMON notes), or 'bass' (single root notes)
     */
    constructor(options = {}) {
        super();

        const {
            tonic,
            key,
            mode,
            degrees = [0, 2, 4],
            measureLength = 4,
            extractRoots = true,
            transpose = 0,
            output = 'chords'
        } = options;

        // `key` can be a string alias for tonic, or a Key context carrying
        // both tonic and mode. Explicit `tonic`/`mode` always win.
        const keyIsContext = key && typeof key === 'object';
        this.tonic = tonic || (keyIsContext ? key.tonic : key) || 'C';
        this.mode = mode || (keyIsContext ? key.mode : undefined) || 'major';
        this.degrees = degrees;
        this.measureLength = measureLength;
        this.extractRoots = extractRoots;
        this.transpose = transpose;
        this.output = output;
        
        // Pre-generate the scale for efficiency
        this.scale = new Scale({ tonic: this.tonic, mode: this.mode }).generate();
    }

    /**
     * Generate voiced output from a track
     * 
     * @param {Array<Object>} track - Array of JMON notes with { pitch, duration, time }
     * @param {Object} [options={}] - Override options for this generation
     * @returns {Array} Generated output based on the output format setting
     * 
     * @example
     * ```js
     * // Extract one chord per measure as a JMON track
     * const voice = new Voice({ tonic: 'C', mode: 'major', output: 'track' });
     * const chordTrack = voice.generate(melody);
     * 
     * // Get bass notes (roots only) transposed down an octave
     * const bass = new Voice({ tonic: 'C', mode: 'major', output: 'bass', transpose: -12 });
     * const bassTrack = bass.generate(melody);
     * ```
     */
    generate(track, options = {}) {
        if (!Array.isArray(track) || track.length === 0) {
            return [];
        }

        // Merge instance options with call-time options
        const {
            measureLength = this.measureLength,
            extractRoots = this.extractRoots,
            transpose = this.transpose,
            output = this.output
        } = options;

        let rootPitches;
        let rootTimes;

        if (extractRoots) {
            // Extract root pitches at measure starts
            // Convert track to tuple format for findClosestPitchAtMeasureStart
            const tuples = track.map(note => [note.pitch, note.duration, note.time]);
            rootPitches = findClosestPitchAtMeasureStart(tuples, measureLength);
            
            // Generate times for each measure
            rootTimes = rootPitches.map((_, i) => i * measureLength);
        } else {
            // Use every note's pitch
            rootPitches = track.map(note => note.pitch);
            rootTimes = track.map(note => note.time);
        }

        // Apply transposition to roots
        const transposedRoots = rootPitches.map(p => p + transpose);

        // Generate chords using chordifyMany (using original roots, not transposed)
        // We'll apply transpose to the final output
        const chords = chordifyMany(rootPitches, {
            tonic: this.tonic,
            mode: this.mode,
            scale: this.scale,
            degrees: this.degrees
        });

        // Apply transpose to chords
        const transposedChords = chords.map(chord => 
            chord.map(pitch => pitch + transpose)
        );

        // Format output based on output option
        switch (output) {
            case 'track':
                // Return as JMON track with chord arrays as pitch
                return transposedChords.map((chord, i) => ({
                    pitch: chord,
                    duration: extractRoots ? measureLength : track[i].duration,
                    time: rootTimes[i]
                }));

            case 'bass':
                // Return single-note bass track (first note of each chord = root)
                return transposedRoots.map((pitch, i) => ({
                    pitch,
                    duration: extractRoots ? measureLength : track[i].duration,
                    time: rootTimes[i]
                }));

            case 'chords':
            default:
                // Return just the chord arrays (with transpose applied)
                return transposedChords;
        }
    }

    /**
     * Static method to transpose a track by semitones
     * @param {Array<Object>} track - Array of JMON notes
     * @param {number} semitones - Number of semitones to transpose
     * @returns {Array<Object>} Transposed track
     * 
     * @example
     * ```js
     * // Transpose down an octave
     * const bassTrack = Voice.transpose(melodyTrack, -12);
     * ```
     */
    static transpose(track, semitones) {
        return track.map(note => ({
            ...note,
            pitch: Array.isArray(note.pitch) 
                ? note.pitch.map(p => p + semitones)
                : note.pitch + semitones
        }));
    }

    /**
     * Voice leading - smooth transition from one chord to another
     * Reorders chord2 notes to minimize movement from chord1
     * @param {Array<number>} chord1 - First chord (array of MIDI notes)
     * @param {Array<number>} chord2 - Second chord (array of MIDI notes)
     * @returns {Array<number>} Voice-led chord2 (notes reordered for smooth transition)
     * 
     * @example
     * ```js
     * const voice = new Voice({ tonic: 'C', mode: 'major' });
     * const cMajor = [60, 64, 67];  // C E G
     * const gMajor = [67, 71, 74];  // G B D
     * const smoothG = voice.lead(cMajor, gMajor);  // Reordered for minimal movement
     * ```
     */
    lead(chord1, chord2) {
        if (!Array.isArray(chord1) || !Array.isArray(chord2)) {
            return chord2;
        }

        // Simple voice leading: minimize total movement by greedy matching
        const led = [];
        const available = [...chord2];

        for (const note1 of chord1) {
            if (available.length === 0) break;

            // Find the closest note in available chord2 notes
            let minDistance = Infinity;
            let closestIndex = 0;

            for (let i = 0; i < available.length; i++) {
                const distance = Math.abs(available[i] - note1);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = i;
                }
            }

            led.push(available[closestIndex]);
            available.splice(closestIndex, 1);
        }

        // Add any remaining notes from chord2
        led.push(...available);

        return led;
    }

    /**
     * Apply voice leading across a sequence of chords
     * @param {Array<Array<number>>} chords - Array of chord arrays
     * @returns {Array<Array<number>>} Voice-led chord progression
     * 
     * @example
     * ```js
     * const voice = new Voice({ tonic: 'C', mode: 'major' });
     * const progression = [[60, 64, 67], [65, 69, 72], [67, 71, 74]];
     * const smooth = voice.leadProgression(progression);
     * ```
     */
    leadProgression(chords) {
        if (!Array.isArray(chords) || chords.length < 2) {
            return chords;
        }

        const result = [chords[0]];
        for (let i = 1; i < chords.length; i++) {
            result.push(this.lead(result[i - 1], chords[i]));
        }
        return result;
    }
}
