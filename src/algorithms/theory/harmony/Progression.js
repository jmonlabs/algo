import { MusicTheoryConstants } from '../../constants/MusicTheoryConstants.js';
import { cdeToMidi } from '../../utils.js';

/**
 * Progressions in a key: the chords roman numerals name, and chords drawn
 * from the circle of fifths (or of any other interval) around the tonic.
 * What the voices do from one chord to the next is jm.voices.
 * 
 * @example
 * ```js
 * // The chords roman numerals name
 * new Progression({ tonic: 'C', mode: 'major' }).numerals(['I', 'IV', 'V', 'I'])
 *
 * // Four chords drawn from the circle of fifths around the tonic
 * new Progression({ tonic: 'A', mode: 'minor' }).draw(4, { seed: 1 })
 * ```
 */
export class Progression extends MusicTheoryConstants {
    /**
     * Initialize a Progression object
     * @param {Object} options - Configuration options
     * @param {string} [options.tonic='C4'] - The tonic pitch or key (e.g., 'C4', 'C', 'D')
     * @param {string} [options.mode='major'] - The scale/mode ('major', 'minor', 'dorian', etc.)
     * @param {string} [options.circleOf='P5'] - Interval to form the circle (e.g., 'P5', 'P4')
     * @param {Array} [options.radius=[3, 3, 1]] - Range for major, minor, and diminished chords
     * @param {Array} [options.weights] - Weights for selecting chord types (defaults to radius)
     */
    /**
     * A key, and the circle its progressions are drawn from.
     *
     * The constructor configures; the method executes: `draw` takes only
     * what varies per run, how many chords and which seed.
     *
     * @param {Object} [options]
     * @param {string} [options.tonic='C4'] - Tonic, with or without an octave
     * @param {string} [options.mode='major']
     *
     * @param {string} [options.circleOf='P5'] - Which interval `radius` walks
     *   the circle by: 'P5' fifths, 'P4' fourths, 'M3' thirds.
     * @param {Array<number>} [options.radius=[3,3,1]] - How many circle roots
     *   each quality may use: `[major, minor, diminished]`.
     * @param {Array<number>|Object} [options.weights] - How likely each quality
     *   is to be drawn by `draw`. Defaults to `radius`.
     *
     * @example
     * // The circle, drawing ordinary tonal progressions
     * new Progression({ tonic: 'D', mode: 'minor' }).draw(4, { seed: 1 });
     */
    constructor(options = {}) {
        super();

        const {
            tonic = 'C4',
            mode = 'major',
            // the circle
            circleOf = 'P5',
            radius = [3, 3, 1],
            weights,
        } = options;

        // Parse tonic — accepts a bare note name ('C', 'F#') or an
        // octave-qualified one ('C4', 'Bb3'). cdeToMidi mishandles bare
        // accidentals, so the bare form gets a default octave appended.
        //
        // The test is for a trailing octave number, not string length: the
        // default tonic 'C4' is two characters long, so a length test sent it
        // down the bare branch and asked cdeToMidi for 'C44' — a semitone flat.
        const hasOctave = /-?\d+$/.test(tonic);
        this.tonicMidi = cdeToMidi(hasOctave ? tonic : `${tonic}4`);
        this.tonicNote = tonic.replace(/-?\d+$/, '');

        this.scale = mode;
        this.mode = mode;

        this.circleOf = circleOf;
        this.radius = radius;
        this.weights = weights ?? radius;   // TODO: a count of roots doubling as a probability
    }

    /**
     * The pitch classes of this progression's own key, tonic first.
     *
     * One place that answers "what notes belong to this key", so callers that
     * want to test or constrain against it do not each rebuild it from
     * `tonicMidi` and `mode`.
     *
     * @returns {Array<number>} Pitch classes 0-11, in scale order.
     *
     * @example
     * new Progression({ tonic: 'D', mode: 'minor' }).pitchClasses();
     * // [2, 4, 5, 7, 9, 10, 0] — D E F G A Bb C
     */
    pitchClasses() {
        const { scaleIntervals } = MusicTheoryConstants;
        const intervals = scaleIntervals[this.mode];
        if (!intervals) {
            throw new Error(`Progression: unknown mode "${this.mode}"`);
        }
        return intervals.map(i => ((this.tonicMidi + i) % 12 + 12) % 12);
    }

    /**
     * Compute chords based on the circle of fifths, thirds, etc., within the specified radius
     * @returns {Object} Object containing major, minor, and diminished chord roots
     */
    computeCircle() {
        const nSemitones = MusicTheoryConstants.intervals[this.circleOf];
        const circleNotes = [this.tonicMidi];
        
        for (let i = 0; i < Math.max(...this.radius); i++) {
            const nextNote = (circleNotes[circleNotes.length - 1] + nSemitones) % 12 + 
                           Math.floor(circleNotes[circleNotes.length - 1] / 12) * 12;
            circleNotes.push(nextNote);
        }

        return {
            major: circleNotes.slice(0, this.radius[0]),
            minor: circleNotes.slice(0, this.radius[1]),
            diminished: circleNotes.slice(0, this.radius[2])
        };
    }

    /**
     * Generate a chord based on root MIDI note and chord type
     * @param {number} rootNoteMidi - The root MIDI note of the chord
     * @param {string} chordType - The type of chord ('major', 'minor', 'diminished')
     * @returns {Array} Array of MIDI notes representing the chord
     */
    generateChord(rootNoteMidi, chordType) {
        const chordIntervals = {
            'major': [0, 4, 7],
            'minor': [0, 3, 7],
            'diminished': [0, 3, 6],
            'augmented': [0, 4, 8],
        };

        const intervals = chordIntervals[chordType] || [0, 4, 7];
        const chordNotes = intervals.map(interval => rootNoteMidi + interval);
        
        // Ensure notes don't exceed MIDI range
        return chordNotes.map(note => note > 127 ? note - 12 : note);
    }

    /**
     * Chords drawn at random from the circle (see `circleOf` and `radius`).
     * @param {number} [length=4] - How many chords
     * @param {Object} [options]
     * @param {number|null} [options.seed=null] - Seed of the draw; the same seed gives the same progression
     * @returns {Array<Array<number>>} One chord per draw, as MIDI pitches
     */
    draw(length = 4, { seed = null } = {}) {
        if (!Number.isInteger(length) || length < 0) {
            throw new Error(`Progression.draw: length is how many chords, got ${length}`);
        }

        // A seeded RNG when `seed` is given (deterministic), else Math.random.
        const rng = seed !== null ? Progression._mulberry32(seed) : Math.random;

        const pickWeighted = (weights) => {
            const total = weights.reduce((s, w) => s + w, 0);
            let r = rng() * total;
            for (let i = 0; i < weights.length; i++) {
                r -= weights[i];
                if (r <= 0) return i;
            }
            return weights.length - 1;
        };

        const { major, minor, diminished } = this.computeCircle();
        const chordRoots = [major, minor, diminished];
        const chordTypes = ['major', 'minor', 'diminished'];
        const progression = [];

        for (let i = 0; i < length; i++) {
            const chordTypeIndex = pickWeighted(this.weights);

            if (chordRoots[chordTypeIndex].length > 0) {
                const rootNoteMidi = chordRoots[chordTypeIndex][
                    Math.floor(rng() * chordRoots[chordTypeIndex].length)
                ];
                const chordType = chordTypes[chordTypeIndex];

                const actualRoot = Array.isArray(rootNoteMidi) ? rootNoteMidi[0] : rootNoteMidi;
                const chosenChord = this.generateChord(actualRoot, chordType);
                progression.push(chosenChord);
            }
        }

        return progression;
    }

    /**
     * The chords roman numerals name, in this key: upper case for major
     * (`'I'`, `'VI'`), lower case for minor (`'i'`, `'iv'`), `'°'` for
     * diminished (`'vii°'`).
     * @param {Array<string>} numerals - e.g. `['i', 'VI', 'III', 'VII']`
     * @returns {Array<Array<number>>} One chord per numeral, as MIDI pitches
     */
    numerals(numerals) {
        const progression = [];

        // Define scale degrees (in semitones from tonic)
        const scaleDegreesMap = {
            'major': [0, 2, 4, 5, 7, 9, 11],      // I, II, III, IV, V, VI, VII
            'minor': [0, 2, 3, 5, 7, 8, 10],      // i, ii, III, iv, v, VI, VII
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'phrygian': [0, 1, 3, 5, 7, 8, 10],
            'lydian': [0, 2, 4, 6, 7, 9, 11],
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'aeolian': [0, 2, 3, 5, 7, 8, 10],
            'locrian': [0, 1, 3, 5, 6, 8, 10]
        };

        const scaleDegrees = scaleDegreesMap[this.scale] || scaleDegreesMap['major'];

        // Define chord qualities for each degree in major scale
        const majorChordQualities = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
        const minorChordQualities = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];

        const chordQualities = this.scale === 'minor' ? minorChordQualities : majorChordQualities;

        for (const numeral of numerals) {
            const { degree, quality } = this.parseRomanNumeral(numeral);

            // Get root note (scale degree, 1-indexed to 0-indexed)
            const rootOffset = scaleDegrees[degree - 1];
            const rootMidi = this.tonicMidi + rootOffset;

            // Determine chord quality
            const chordType = quality || chordQualities[degree - 1];

            const chord = this.generateChord(rootMidi, chordType);
            progression.push(chord);
        }

        return progression;
    }

    /**
     * Parse roman numeral to get degree and quality
     * @param {string} numeral - Roman numeral (e.g., 'I', 'iv', 'V/V')
     * @returns {Object} Object with degree and quality
     */
    parseRomanNumeral(numeral) {
        // Handle secondary dominants (e.g., 'V/V')
        if (numeral.includes('/')) {
            const parts = numeral.split('/');
            // For now, just use the first part
            numeral = parts[0];
        }

        // Check if lowercase (minor) or uppercase (major)
        const isLowerCase = numeral === numeral.toLowerCase();

        // Remove quality indicators
        const cleanNumeral = numeral.replace(/[°+ᵒ#♭b]/g, '').toUpperCase();

        // Convert roman to number
        const romanToNumber = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4,
            'V': 5, 'VI': 6, 'VII': 7
        };

        const degree = romanToNumber[cleanNumeral];
        if (!degree) {
            throw new Error(`Progression.numerals: "${numeral}" is not a roman numeral I to VII`);
        }

        // Determine quality from indicators
        let quality = null;
        if (numeral.includes('°') || numeral.includes('ᵒ')) {
            quality = 'diminished';
        } else if (numeral.includes('+')) {
            quality = 'augmented';
        } else if (isLowerCase) {
            quality = 'minor';
        } else {
            quality = 'major';
        }

        return { degree, quality };
    }

    /** A small seeded generator: the same seed gives the same progression. @private */
    static _mulberry32(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Weighted random choice helper
     * @param {Array} weights - Array of weights
     * @returns {number} Selected index
     */
    weightedRandomChoice(weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        return weights.length - 1; // Fallback
    }
}
