import { MusicTheoryConstants } from '../../constants/MusicTheoryConstants.js';
import { cdeToMidi } from '../../utils.js';

/**
 * A class representing a musical progression generator based on the circle of fifths (or any other interval)
 * 
 * @example
 * ```js
 * // Generate a chord progression from roman numerals
 * const prog = new Progression({ tonic: 'C', mode: 'major' })
 * prog.generate(['I', 'IV', 'V', 'I'])
 * 
 * // Generate a random progression
 * const prog2 = new Progression({ tonic: 'A', mode: 'minor' })
 * prog2.generate(4)
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
     * A key, and the character of the three ways it can produce progressions.
     *
     * The constructor configures; the method executes. That is the split the
     * rest of the package keeps — `Chain` takes `walkRange` here and `length`
     * at `.line()`, `Darwin` takes `populationSize` here and `generations` at
     * `.evolveGenerations()` — and `Progression` was the one class that broke
     * it, by taking `vocabulary` and `maxVoiceLeading` at the call while
     * `generate` read `this.radius` from here. So everything that decides *what
     * kind* of progression comes out lives here, and the methods take only what
     * varies per run: how many chords, and which seed.
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
     *   is to be drawn by `generate`. Defaults to `radius`.
     *
     * @param {Array<string>} [options.vocabulary=['P','L','R']] - Moves
     *   `nrtWalk` may make. See `nrtWalk`.
     * @param {Object<string, number>} [options.opWeights] - How likely each move
     *   is, keyed by operator letter. Moves absent from the map weigh 1.
     * @param {boolean|Array<number>} [options.inKey=false] - Keep `nrtWalk`
     *   inside a set of pitch classes. See `nrtWalk`.
     *
     * @param {number} [options.maxVoiceLeading=4] - Cap on `smooth`'s voice
     *   movement, in semitones summed over the three voices.
     * @param {Array<string>} [options.qualities=['major','minor']] - Triad
     *   qualities `smooth` may draw.
     * @param {number} [options.bassRange=null] - Keep `smooth`'s lowest voice
     *   within this many semitones of the starting bass.
     * @param {{center:number, range:number}} [options.octaveBounds=null] -
     *   Keep `smooth`'s chords around a register, since voice leading alone
     *   lets a long walk drift by octaves. `nrtWalk` reads the same option.
     *
     * @example
     * // The circle, drawing ordinary tonal progressions
     * new Progression({ tonic: 'D', mode: 'minor' }).generate(4, { seed: 1 });
     *
     * @example
     * // A walk that keeps its voice leading and stays in the key
     * new Progression({
     *   tonic: 'D', mode: 'minor',
     *   vocabulary: ['P', 'L', 'R', 'N', 'S', 'RPR', 'PRP'],
     *   inKey: true,
     * }).nrtWalk(4, { seed: 1 });
     */
    constructor(options = {}) {
        super();

        const {
            tonic = 'C4',
            mode = 'major',
            // generate — the circle
            circleOf = 'P5',
            radius = [3, 3, 1],
            weights,
            // nrtWalk — the moves
            vocabulary = ['P', 'L', 'R'],
            opWeights = null,
            inKey = false,
            // smooth — the least movement
            maxVoiceLeading = 4,
            qualities = ['major', 'minor'],
            bassRange = null,
            octaveBounds = null,
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

        this.vocabulary = vocabulary;
        this.opWeights = opWeights;
        this.inKey = inKey;

        this.maxVoiceLeading = maxVoiceLeading;
        this.qualities = qualities;
        this.bassRange = bassRange;
        this.octaveBounds = octaveBounds;
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
            'diminished': [0, 3, 6]
        };

        const intervals = chordIntervals[chordType] || [0, 4, 7];
        const chordNotes = intervals.map(interval => rootNoteMidi + interval);
        
        // Ensure notes don't exceed MIDI range
        return chordNotes.map(note => note > 127 ? note - 12 : note);
    }

    /**
     * A progression: chords drawn at random from the circle (see `circleOf`
     * and `radius`), or the chords the roman numerals name.
     * @param {number|Array} lengthOrNumerals - Either number of chords or array of roman numerals
     * @param {Object} [options]
     * @param {number|null} [options.seed=null] - Seed of the draw; the same seed gives the same progression
     * @returns {Array} Array of chord arrays representing the progression
     */
    generate(lengthOrNumerals = 4, { seed = null } = {}) {
        // Check if first argument is an array of roman numerals
        if (Array.isArray(lengthOrNumerals)) {
            return this.generateFromRomanNumerals(lengthOrNumerals);
        }

        const length = lengthOrNumerals;

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
     * Generate chords from roman numerals (e.g., ['I', 'IV', 'V', 'I'])
     * @param {Array} numerals - Array of roman numerals
     * @returns {Array} Array of chord arrays
     */
    generateFromRomanNumerals(numerals) {
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

            if (degree < 1 || degree > 7) {
                console.warn(`Invalid degree ${degree} in ${numeral}`);
                continue;
            }

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

        const degree = romanToNumber[cleanNumeral] || 1;

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

    /**
     * Generate a chromatic-mediant progression with parsimonious voice leading
     * (Neo-Riemannian style, à la Theodore Shapiro's *Severance* theme:
     * Cm → F# → F → G#m). Successive triads are chosen to minimize total
     * voice-leading distance from the previous chord, then weighted-randomly
     * selected with a seeded RNG.
     *
     * Diatonic mode (constructor's `mode`) is *not* respected here — `smooth`
     * draws from all 12 roots × the qualities you allow. The constructor's
     * `tonic` is just the starting root.
     *
     * @param {number} length - Number of chords
     * @param {Object} [options] - Per run only. The character of the walk —
     *   `maxVoiceLeading`, `qualities`, `bassRange` — is constructor config.
     * @param {number} [options.seed=0] - Seed of the draw; the same seed gives the same walk
     * @param {string} [options.startQuality] - Override start triad quality
     *   (defaults to 'minor' if constructor `mode` is a minor-family mode,
     *   else 'major').
     * @param {{center:number, range:number}} [options.octaveBounds] - Keep the
     *   centroid of each chord within ±range/2 of `center`. Without it a long
     *   walk can drift up or down by octaves, since every chord is only
     *   voice-led from the one before. Defaults to the constructor's
     *   `octaveBounds`; with neither, use `bassRange` to hold the register.
     * @returns {Array<Array<number>>} Array of triads, each a 3-element MIDI
     *   array in voice-leading order. Voice i of chord k corresponds to voice
     *   i of chord k+1 under the parsimonious assignment — sort each chord
     *   ascending if you want a "low-to-high" layout instead.
     *
     * @example
     * // Severance-flavoured walk; identical output for identical seed.
     * new Progression({ tonic: 'C', mode: 'minor', bassRange: 3 }).smooth(4, { seed: 42 });
     *
     * @example
     * // A walk that stays around A3 instead of wandering octaves
     * new Progression({
     *   tonic: 'C', mode: 'minor',
     *   octaveBounds: { center: 57, range: 12 },
     * }).smooth(16, { seed: 1 });
     */
    smooth(length, options = {}) {
        const QUALITY_INTERVALS = {
            major: [0, 4, 7],
            minor: [0, 3, 7],
            diminished: [0, 3, 6],
            augmented: [0, 4, 8],
        };
        const MINOR_FAMILY = new Set(['minor', 'phrygian', 'aeolian', 'locrian', 'dorian']);

        Progression._refuseMovedOptions("smooth", options);
        const {
            seed: usedSeed = 0,
            startQuality = MINOR_FAMILY.has(this.mode) ? 'minor' : 'major',
            octaveBounds = this.octaveBounds,
        } = options;
        const { maxVoiceLeading, qualities, bassRange } = this;

        if (!QUALITY_INTERVALS[startQuality]) {
            throw new Error(`Unknown startQuality: ${startQuality}`);
        }

        // The start chord is moved into the register before anything else, so
        // `bassRange` is measured from where the walk actually begins. Without
        // that order the two options can contradict each other: a tonic given
        // without an octave lands at `tonicMidi` (A4 = 69 for 'A'), while
        // `octaveBounds: { center: 57 }` asks for A3, and every candidate would
        // be rejected for having a bass an octave too high — leaving a
        // one-chord "walk" and no error.
        const rawStart = QUALITY_INTERVALS[startQuality].map(i => this.tonicMidi + i);
        const startTriad = octaveBounds
            ? Progression._constrainOctave(rawStart, octaveBounds)
            : rawStart;
        const startBass = Math.min(...startTriad);
        const rng = Progression._mulberry32(usedSeed);

        const progression = [startTriad];
        let prev = startTriad;

        for (let n = 1; n < length; n++) {
            const candidates = [];
            for (let root = 0; root < 12; root++) {
                for (const quality of qualities) {
                    const intervals = QUALITY_INTERVALS[quality];
                    if (!intervals) continue;
                    const pcs = intervals.map(i => (root + i) % 12);
                    const { realization, distance } = Progression._bestRealization(prev, pcs);
                    if (distance > maxVoiceLeading) continue;
                    if (distance === 0) continue; // skip identical chord repeat
                    // The candidate is voice-led from the previous chord, which
                    // can land an octave away from where the caller asked. Pull
                    // it back into the register before the bass check, so both
                    // options read the same notes.
                    const placed = octaveBounds
                        ? Progression._constrainOctave(realization, octaveBounds)
                        : realization;
                    if (bassRange !== null) {
                        const bass = Math.min(...placed);
                        if (Math.abs(bass - startBass) > bassRange) continue;
                    }
                    candidates.push({ realization: placed, distance });
                }
            }

            if (candidates.length === 0) {
                console.warn(
                    `[Progression.smooth] No candidate at step ${n} for seed=${usedSeed} ` +
                    `(maxVoiceLeading=${maxVoiceLeading}, bassRange=${bassRange}). ` +
                    `Returning ${progression.length} chords instead of ${length}.`
                );
                break;
            }

            // Smaller VL distance ⇒ higher weight (parsimony bias)
            const weights = candidates.map(c => 1 / (1 + c.distance));
            const total = weights.reduce((s, w) => s + w, 0);
            let r = rng() * total;
            let pickIdx = 0;
            for (; pickIdx < candidates.length - 1; pickIdx++) {
                r -= weights[pickIdx];
                if (r <= 0) break;
            }

            progression.push(candidates[pickIdx].realization);
            prev = candidates[pickIdx].realization;
        }

        return progression;
    }

    /**
     * Find the voice-permutation of `newPcs` (pitch-class triad) that
     * minimizes total semitone movement from `prevTriad` (MIDI). Returns the
     * realization in MIDI plus the total distance.
     * @private
     */
    static _bestRealization(prevTriad, newPcs) {
        const perms = [
            [0, 1, 2], [0, 2, 1], [1, 0, 2],
            [1, 2, 0], [2, 0, 1], [2, 1, 0],
        ];
        let best = null;
        for (const perm of perms) {
            const realization = [];
            let dist = 0;
            for (let i = 0; i < 3; i++) {
                const oldNote = prevTriad[i];
                const newPc = newPcs[perm[i]];
                const oldPc = ((oldNote % 12) + 12) % 12;
                let diff = newPc - oldPc;
                if (diff > 6) diff -= 12;
                else if (diff < -6) diff += 12;
                realization.push(oldNote + diff);
                dist += Math.abs(diff);
            }
            if (best === null || dist < best.distance) {
                best = { realization, distance: dist };
            }
        }
        return best;
    }

    /**
     * Mulberry32 — small deterministic PRNG used by `smooth()`. Same seed
     * always produces the same sequence.
     * @private
     */
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

    // ─── Neo-Riemannian transformations (PLR + derived N/S/H) ──────
    // Each operator maps a {root: 0-11, quality: 'major'|'minor'} state to
    // another such state. PLR are the primitive operations; N=RLP, S=LPR,
    // H=LPL are commonly-used compounds, hardcoded here for clarity.

    static _MINOR_FAMILY = new Set(['minor', 'phrygian', 'aeolian', 'locrian', 'dorian']);
    // How many redraws `nrtWalk` takes per chord when `inKey` rejects a move
    // before letting the chord repeat. Any vocabulary reaches any key in a
    // handful of tries; the budget only bounds the pathological case.
    static _INKEY_TRIES = 24;
    static _QUALITY_INTERVALS = {
        major: [0, 4, 7],
        minor: [0, 3, 7],
        diminished: [0, 3, 6],
        augmented: [0, 4, 8],
    };

    /**
     * Apply a single NRT primitive (P, L, R, N, S, H) to a {root, quality}
     * state. Root is mod 12; quality flips for all six operators.
     * @private
     */
    static _applyNrtOp(state, op) {
        const { root, quality } = state;
        const M = quality === 'major';
        switch (op) {
            case 'P': return { root, quality: M ? 'minor' : 'major' };
            case 'R': return M
                ? { root: (root + 9) % 12, quality: 'minor' }   // C → Am
                : { root: (root + 3) % 12, quality: 'major' };  // Cm → Eb
            case 'L': return M
                ? { root: (root + 4) % 12, quality: 'minor' }   // C → Em
                : { root: (root + 8) % 12, quality: 'major' };  // Cm → Ab
            case 'N': return M
                ? { root: (root + 5) % 12, quality: 'minor' }   // C → Fm
                : { root: (root + 7) % 12, quality: 'major' };  // Cm → G
            case 'S': return M
                ? { root: (root + 1) % 12, quality: 'minor' }   // C → C#m
                : { root: (root + 11) % 12, quality: 'major' }; // Cm → B
            case 'H': return M
                ? { root: (root + 8) % 12, quality: 'minor' }   // C → G#m (hex pole)
                : { root: (root + 4) % 12, quality: 'major' };  // Cm → E
            default:
                throw new Error(`Unknown NRT operator: ${op}`);
        }
    }

    /** Parse compound notation ('PLR' → ['P','L','R']). @private */
    static _parseCompound(opSpec) {
        if (Array.isArray(opSpec)) return opSpec;
        return String(opSpec).split('');
    }

    /** Compose a sequence of primitives on a state. @private */
    static _composeNrt(state, primitives) {
        let s = state;
        for (const op of primitives) s = Progression._applyNrtOp(s, op);
        return s;
    }

    /**
     * Realize a {root, quality} pitch-class triad as MIDI, voice-led from
     * `prevTriad`. Three shape strategies:
     *   - 'closest' (default): parsimonious voice-leading via _bestRealization
     *   - 'root': always root-position [r, r+3rd, r+5th] at closest octave
     *   - 'random': pick 'closest' or 'root' randomly (needs rng)
     * @private
     */
    static _realizeState(prevTriad, state, shape, rng) {
        const intervals = Progression._QUALITY_INTERVALS[state.quality];
        if (!intervals) throw new Error(`Unknown quality: ${state.quality}`);
        const pcs = intervals.map(i => (state.root + i) % 12);

        if (shape === 'random') {
            if (!rng) throw new Error(`shape: 'random' requires a seed`);
            const pick = rng() < 0.5 ? 'closest' : 'root';
            return Progression._realizeState(prevTriad, state, pick, rng);
        }

        if (shape === 'closest') {
            return Progression._bestRealization(prevTriad, pcs).realization;
        }

        if (shape === 'root') {
            // Root position; place root at octave closest to previous chord's
            // lowest voice (so the bass line moves smoothly).
            const prevBass = Math.min(...prevTriad);
            const prevBassPc = ((prevBass % 12) + 12) % 12;
            let diff = state.root - prevBassPc;
            if (diff > 6) diff -= 12;
            else if (diff < -6) diff += 12;
            const rootMidi = prevBass + diff;
            return intervals.map(i => rootMidi + i);
        }

        throw new Error(`Unknown shape: ${shape}`);
    }

    /**
     * Shift a triad by whole octaves to keep its centroid within
     * ±range/2 of `center`. Returns triad unchanged if `bounds` is null.
     * @private
     */
    static _constrainOctave(triad, bounds) {
        if (!bounds) return triad;
        const { center, range } = bounds;
        const mean = triad.reduce((s, n) => s + n, 0) / triad.length;
        if (Math.abs(mean - center) <= range / 2) return triad;
        const shift = Math.round((center - mean) / 12) * 12;
        if (shift === 0) return triad;
        return triad.map(n => n + shift);
    }

    /**
     * Apply a deterministic sequence of neo-Riemannian transformations
     * starting from the constructor's tonic + mode.
     *
     * Operations can be primitives ('P','L','R','N','S','H') or compound
     * strings ('PL','LRP'). A compound applies its primitives in order and
     * yields **one** result chord (the piece); an array of primitives
     * yields one chord per element.
     *
     * @param {Array<string>} ops - e.g. `['P','L','R']` or `['PL','R','H']`
     * @param {Object} [options]
     * @param {'closest'|'root'} [options.shape='closest'] - Voice-leading
     *   realization. 'closest' minimizes VL distance (parsimony, the standard
     *   NRT aesthetic). 'root' forces root-position with smooth bass.
     * @param {{center:number, range:number}} [options.octaveBounds] - Keep
     *   the triad centroid within ±range/2 of center (MIDI). Without this,
     *   long sequences may drift up/down. Try `{center: 62, range: 12}`.
     * @param {string} [options.startQuality] - Override start triad quality.
     * @returns {Array<Array<number>>} Triads in MIDI (3 notes each, in
     *   voice-leading order). Length = ops.length + 1.
     *
     * @example
     * // The Severance progression itself — explicit NRT walk from Cm:
     * new Progression({ tonic: 'C', mode: 'minor' })
     *   .applyTransforms(['L', 'R', 'P', 'L']);
     */
    applyTransforms(ops, options = {}) {
        const {
            shape = 'closest',
            octaveBounds = null,
            startQuality = Progression._MINOR_FAMILY.has(this.mode) ? 'minor' : 'major',
        } = options;

        if (shape === 'random') {
            throw new Error(`shape: 'random' is only available in nrtWalk() (needs a seed)`);
        }

        const startIntervals = Progression._QUALITY_INTERVALS[startQuality];
        const startPc = ((this.tonicMidi % 12) + 12) % 12;
        let state = { root: startPc, quality: startQuality };
        let prev = startIntervals.map(i => this.tonicMidi + i);
        const progression = [prev];

        for (const opSpec of ops) {
            const primitives = Progression._parseCompound(opSpec);
            state = Progression._composeNrt(state, primitives);
            let realization = Progression._realizeState(prev, state, shape, null);
            realization = Progression._constrainOctave(realization, octaveBounds);
            progression.push(realization);
            prev = realization;
        }

        return progression;
    }

    // Options that used to be read at the call and now belong to the
    // constructor, mapped to the name to use instead. Silently ignoring them
    // would hand back a different progression and no clue why, so they are
    // refused by name.
    static _MOVED_TO_CONSTRUCTOR = {
        vocabulary: 'vocabulary',
        weights: 'opWeights',
        inKey: 'inKey',
        maxVoiceLeading: 'maxVoiceLeading',
        qualities: 'qualities',
        bassRange: 'bassRange',
    };

    /** @private */
    static _refuseMovedOptions(where, options) {
        for (const [was, now] of Object.entries(Progression._MOVED_TO_CONSTRUCTOR)) {
            if (was in options) {
                throw new Error(
                    `${where}: "${was}" is constructor config now. ` +
                    `Pass it to new Progression({ ${now}: ... }) instead.`
                );
            }
        }
    }

    /**
     * Random walk over a vocabulary of neo-Riemannian transformations.
     * Like `smooth()` but constrained to a specific NRT vocabulary instead of
     * "any chord within VL distance N". One entry of `vocabulary` is drawn per
     * chord, so the seed only chooses among the results the vocabulary allows.
     *
     * A vocabulary entry is one move, written as a string of operator letters.
     * `P`, `L` and `R` are the primitives (Parallel, Leading-tone exchange,
     * Relative); each keeps two of the chord's three notes, so the voice
     * leading stays smooth. `N`, `S` and `H` are the standard compounds, and a
     * longer string chains them: `'RPR'` is R then P then R, and lands on a
     * chord sharing no note with the one it started from. From C major:
     *
     *     P    C E G → C Eb G     2 notes kept
     *     L    C E G → E G B     2
     *     R    C E G → C E A     2
     *     N    C E G → C F Ab    1
     *     S    C E G → C# E Ab   1
     *     H    C E G → Eb Ab B   0
     *
     * The default `['P', 'L', 'R']` is the tame walk, which tends to stay near
     * the key. Widen it with `N`, `S`, `H` or the note-free compounds to hear
     * the walk leave it.
     *
     * @param {number} length - Number of chords (including start)
     * @param {Object} [options] - Per run only. The character of the walk —
     *   `vocabulary`, `opWeights`, `inKey` — is constructor config.
     * @param {number} [options.seed=0] - Seed of the draw; the same seed gives the same walk
     * @param {'closest'|'root'|'random'} [options.shape='closest']
     * @param {{center:number, range:number}} [options.octaveBounds]
     * @param {string} [options.startQuality]
     * @returns {Array<Array<number>>} `length` triads.
     *
     * @example
     * // Severance-flavoured walk in a vocabulary rich in P, L, R:
     * new Progression({
     *   tonic: 'C', mode: 'minor',
     *   vocabulary: ['P', 'L', 'R', 'PL', 'LR'],
     * }).nrtWalk(4, { seed: 42, octaveBounds: { center: 62, range: 12 } });
     *
     * @example
     * // A walk that keeps its voice leading and never leaves D minor:
     * new Progression({ tonic: 'D', mode: 'minor', inKey: true }).nrtWalk(8, { seed: 3 });
     */
    nrtWalk(length, options = {}) {
        Progression._refuseMovedOptions("nrtWalk", options);
        const {
            seed: usedSeed = 0,
            shape = 'closest',
            octaveBounds = null,
            startQuality = Progression._MINOR_FAMILY.has(this.mode) ? 'minor' : 'major',
        } = options;
        const { vocabulary, opWeights, inKey } = this;

        const rng = Progression._mulberry32(usedSeed);
        const w = vocabulary.map(v => (opWeights && opWeights[v] !== undefined ? opWeights[v] : 1));
        const totalW = w.reduce((s, x) => s + x, 0);

        /** Draw one vocabulary entry, by weight. */
        const drawOp = () => {
            let r = rng() * totalW;
            for (let i = 0; i < w.length - 1; i++) {
                r -= w[i];
                if (r <= 0) return vocabulary[i];
            }
            return vocabulary[vocabulary.length - 1];
        };

        const allowed = inKey === true
            ? this.pitchClasses()
            : (Array.isArray(inKey) ? inKey.map(p => ((p % 12) + 12) % 12) : null);
        const fits = (candidate) => {
            if (!allowed) return true;
            const pcs = Progression._QUALITY_INTERVALS[candidate.quality]
                .map(i => (candidate.root + i) % 12);
            return pcs.every(p => allowed.includes(p));
        };

        const startIntervals = Progression._QUALITY_INTERVALS[startQuality];
        const startPc = ((this.tonicMidi % 12) + 12) % 12;
        let state = { root: startPc, quality: startQuality };
        let prev = startIntervals.map(i => this.tonicMidi + i);
        const progression = [prev];

        if (allowed && !fits(state)) {
            throw new Error(
                `nrtWalk: inKey excludes the starting chord (${prev.join(', ')}). ` +
                `Pass a set the tonic triad belongs to, or drop inKey.`
            );
        }

        for (let n = 1; n < length; n++) {
            // With inKey, a move that leaves the set is redrawn rather than
            // taken. The budget bounds the retries; running out repeats the
            // chord, which keeps the walk in the key and lets the phrase breathe.
            let candidate = null;
            for (let tries = 0; tries < Progression._INKEY_TRIES; tries++) {
                candidate = Progression._composeNrt(state, Progression._parseCompound(drawOp()));
                if (fits(candidate)) break;
            }
            if (!fits(candidate)) {
                progression.push(prev);
                continue;
            }
            state = candidate;
            let realization = Progression._realizeState(prev, state, shape, rng);
            realization = Progression._constrainOctave(realization, octaveBounds);
            progression.push(realization);
            prev = realization;
        }

        return progression;
    }
}