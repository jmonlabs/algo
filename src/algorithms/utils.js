/**
 * Utility functions for JMON algorithmic composition
 * JavaScript implementation of djalgo's utils.py
 */

/**
 * Convert list of tracks to dict with default names
 * @param {Array|Object} tracks - Tracks to convert
 * @returns {Object} Dictionary with track names
 */
export function tracksToDict(tracks) {
    if (typeof tracks === 'object' && !Array.isArray(tracks)) {
        return tracks;
    }
    if (Array.isArray(tracks)) {
        if (tracks.length === 0) {
            return {};
        }
        // If it's a list of notes (not a list of tracks)
        if (tracks.every(note => Array.isArray(note) && note.length === 3)) {
            return { 'track 1': tracks };
        }
        // If it's a list of tracks
        const result = {};
        tracks.forEach((track, i) => {
            result[`track ${i + 1}`] = track;
        });
        return result;
    }
    throw new Error("Input must be a list or dict of tracks.");
}

/**
 * Rounds the given value to the nearest value in the scale list
 * @param {number} value - The value to be rounded
 * @param {Array} scale - A list of values to round to
 * @returns {number} The value from the scale list that is closest to the given value
 */
export function roundToList(value, scale) {
    return scale.reduce((prev, curr) => 
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
}

/**
 * Get octave from MIDI note number
 * @param {number} midiNote - MIDI note number
 * @returns {number} Octave number
 */
export function getOctave(midiNote) {
    return Math.floor(midiNote / 12) - 1;
}

/**
 * Convert flat notes to sharp equivalents
 * @param {string} noteString - Note string to convert
 * @returns {string} Converted note string
 */
export function getSharp(noteString) {
    const dictFlat = {
        'D-': 'C#', 'E-': 'D#', 'G-': 'F#', 'A-': 'G#', 'B-': 'A#',
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    return dictFlat[noteString] || noteString;
}

/**
 * Get scale degree from pitch
 * @param {number|string} pitch - Pitch (MIDI number or string)
 * @param {Array} scaleList - List of scale pitches
 * @param {number|string} tonicPitch - Tonic pitch
 * @returns {number} Scale degree
 */
export function getDegreeFromPitch(pitch, scaleList, tonicPitch) {
    if (typeof pitch === 'string') {
        pitch = cdeToMidi(pitch);
    }
    if (typeof tonicPitch === 'string') {
        tonicPitch = cdeToMidi(tonicPitch);
    }

    const tonicIndex = scaleList.indexOf(tonicPitch);

    // If the pitch is in the mode
    if (scaleList.includes(pitch)) {
        const pitchIndex = scaleList.indexOf(pitch);
        return pitchIndex - tonicIndex;
    } else {
        // If pitch is not in mode, find the two pitches it falls between
        const upperPitch = roundToList(pitch, scaleList);
        const upperIndex = scaleList.indexOf(upperPitch);
        const lowerIndex = upperIndex > 0 ? upperIndex - 1 : upperIndex;
        const lowerPitch = scaleList[lowerIndex];

        // Compute weighted average of degrees
        const distanceToUpper = upperPitch - pitch;
        const distanceToLower = pitch - lowerPitch;
        const totalDistance = distanceToUpper + distanceToLower;
        
        if (totalDistance === 0) return upperIndex - tonicIndex;
        
        const upperWeight = 1 - distanceToUpper / totalDistance;
        const lowerWeight = 1 - distanceToLower / totalDistance;
        const upperDegree = upperIndex - tonicIndex;
        const lowerDegree = lowerIndex - tonicIndex;
        
        return upperDegree * upperWeight + lowerDegree * lowerWeight;
    }
}

/**
 * Get pitch from scale degree
 * @param {number} degree - Scale degree
 * @param {Array} scaleList - List of scale pitches  
 * @param {number} tonicPitch - Tonic pitch
 * @returns {number} Pitch value
 */
export function getPitchFromDegree(degree, scaleList, tonicPitch) {
    const tonicIndex = scaleList.indexOf(tonicPitch);
    const pitchIndex = Math.round(tonicIndex + degree);

    // If degree is within the scale
    if (pitchIndex >= 0 && pitchIndex < scaleList.length) {
        return scaleList[pitchIndex];
    } else {
        // If degree is not within scale, find two pitches it falls between
        const lowerIndex = Math.max(0, Math.min(pitchIndex, scaleList.length - 1));
        const upperIndex = Math.min(scaleList.length - 1, Math.max(pitchIndex, 0));
        const lowerPitch = scaleList[lowerIndex];
        const upperPitch = scaleList[upperIndex];

        // Compute weighted average
        const distanceToUpper = upperIndex - pitchIndex;
        const distanceToLower = pitchIndex - lowerIndex;
        const totalDistance = distanceToUpper + distanceToLower;
        
        if (totalDistance === 0) {
            return (upperPitch + lowerPitch) / 2;
        }
        
        const upperWeight = 1 - distanceToUpper / totalDistance;
        const lowerWeight = 1 - distanceToLower / totalDistance;
        
        return upperPitch * upperWeight + lowerPitch * lowerWeight;
    }
}

/**
 * Set time according to durations (sequential timing)
 * Works with tuple format [pitch, duration, time]
 * @param {Array} notes - Array of [pitch, duration, time] notes
 * @returns {Array} Notes with recalculated time
 */
export function setTimeAccordingToDurations(notes) {
    // Handle case where notes only have [pitch, duration]
    if (notes.length > 0 && notes[0].length === 2) {
        notes = notes.map(note => [note[0], note[1], 0]);
    }
    
    const adjustedNotes = [];
    let currentTime = 0;
    
    for (const [pitch, duration, _] of notes) {
        adjustedNotes.push([pitch, duration, currentTime]);
        currentTime += duration;
    }
    
    return adjustedNotes;
}

// Alias for backwards compatibility
export const setOffsetsAccordingToDurations = setTimeAccordingToDurations;

/**
 * Fill gaps with rests
 * @param {Array} notes - Array of notes
 * @param {number} parentOffset - Parent offset for recursion
 * @returns {Array} Notes with rests inserted
 */
export function fillGapsWithRests(notes, parentOffset = 0.0) {
    // Sort notes by offset
    const notesSorted = [...notes].sort((a, b) => a[2] - b[2]);
    
    let lastOffset = 0.0;
    const filledNotes = [];
    
    for (const note of notesSorted) {
        const [pitch, duration, offset] = note;
        const currentOffset = parentOffset + offset;
        
        if (currentOffset > lastOffset) {
            // There is a gap that needs to be filled with a rest
            const gapDuration = currentOffset - lastOffset;
            const restToInsert = [null, gapDuration, lastOffset - parentOffset];
            filledNotes.push(restToInsert);
        }
        
        filledNotes.push(note);
        lastOffset = Math.max(lastOffset, currentOffset + duration);
    }
    
    return filledNotes;
}

/**
 * Adjust note durations to prevent overlaps
 * @param {Array} notes - Array of notes
 * @returns {Array} Notes with adjusted durations
 */
export function adjustNoteDurationsToPreventOverlaps(notes) {
    // Sort by offset
    notes.sort((a, b) => a[2] - b[2]);
    
    for (let i = 0; i < notes.length - 1; i++) {
        const currentNote = notes[i];
        const nextNote = notes[i + 1];
        const currentNoteEnd = currentNote[2] + currentNote[1];
        
        // If current note ends after next note starts, adjust duration
        if (currentNoteEnd > nextNote[2]) {
            const newDuration = nextNote[2] - currentNote[2];
            notes[i] = [currentNote[0], newDuration, currentNote[2]];
        }
    }
    
    return notes;
}

/**
 * Repair notes by filling gaps and preventing overlaps
 * @param {Array} notes - Array of notes
 * @returns {Array} Repaired notes
 */
export function repairNotes(notes) {
    return adjustNoteDurationsToPreventOverlaps(fillGapsWithRests(notes));
}

/**
 * Convert CDE notation to MIDI number
 * @param {string} pitch - Pitch string (e.g., 'C4', 'F#3')
 * @returns {number} MIDI note number
 */
export function cdeToMidi(pitch) {
    const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp = {
        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
        'Cb': 'B'
    };
    
    let octave = 4; // Default octave
    let noteStr = pitch;
    
    // Handle flat notes
    if (pitch.includes('b')) {
        const noteBase = pitch.slice(0, -1);
        if (flatToSharp[noteBase]) {
            noteStr = flatToSharp[noteBase] + pitch.slice(-1);
        }
    }
    
    // Extract note and octave
    let note;
    if (noteStr.length > 2 || (noteStr.length === 2 && !isNaN(noteStr[1]))) {
        note = noteStr.slice(0, -1);
        octave = parseInt(noteStr.slice(-1));
    } else {
        note = noteStr[0];
    }
    
    const midi = 12 * (octave + 1) + pitches.indexOf(note);
    return midi;
}

/**
 * Convert MIDI number to CDE notation
 * @param {number} midi - MIDI note number
 * @returns {string} Pitch string
 */
export function midiToCde(midi) {
    const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const key = midi % 12;
    return pitches[key] + octave.toString();
}

/**
 * Remove note overlaps by re-offsetting each note sequentially after the one
 * before it.
 * @param {Array} notes - Array of `[pitch, duration, offset]` tuples
 * @param {string} adjust - Accepted for forward compatibility; not currently read,
 *   offsets are always re-sequenced (durations are left untouched)
 * @returns {Array} Notes without overlaps
 */
export function noOverlap(notes, adjust = 'offsets') {
    const adjustedNotes = [];
    let currentOffset = 0;
    
    for (const [pitch, duration, _] of notes) {
        adjustedNotes.push([pitch, duration, currentOffset]);
        currentOffset += duration;
    }
    
    return adjustedNotes;
}

/**
 * Check input type
 * @param {Array} inputList - Input to check
 * @returns {string} Input type description
 */
export function checkInput(inputList) {
    if (inputList.every(item => Array.isArray(item))) {
        return 'list of tuples';
    } else if (inputList.every(item => !Array.isArray(item))) {
        return 'list';
    } else {
        return 'unknown';
    }
}

/**
 * Scale a list of numbers to a new range
 * @param {Array} numbers - Numbers to scale
 * @param {number} toMin - Target minimum value
 * @param {number} toMax - Target maximum value
 * @param {number} minNumbers - Current minimum (optional)
 * @param {number} maxNumbers - Current maximum (optional)
 * @returns {Array} Scaled numbers
 */
export function scaleList(numbers, toMin, toMax, minNumbers = null, maxNumbers = null) {
    const minNum = minNumbers !== null ? minNumbers : Math.min(...numbers);
    const maxNum = maxNumbers !== null ? maxNumbers : Math.max(...numbers);
    
    if (minNum === maxNum) {
        return new Array(numbers.length).fill((toMin + toMax) / 2);
    }
    
    return numbers.map(num => 
        (num - minNum) * (toMax - toMin) / (maxNum - minNum) + toMin
    );
}

/**
 * Offset a note sequence by a given amount
 * @param {Array} notes - Array of `[pitch, duration, offset]` tuples
 * @param {number} by - Offset amount
 * @returns {Array} Offset notes
 */
export function offsetTrack(notes, by) {
    return notes.map(([pitch, duration, offset]) => [pitch, duration, offset + by]);
}

/**
 * Quantize note durations and offsets
 * @param {Object} options - Configuration object
 * @param {Array} options.notes - Array of notes in [pitch, duration, time] tuple format
 * @param {number} options.measureLength - Measure length
 * @param {number} options.timeResolution - Time resolution for quantization
 * @returns {Array} Quantized notes
 */
export function quantizeNotes({ notes, measureLength, timeResolution }) {
    const quantizedNotes = [];

    for (const [pitch, duration, offset] of notes) {
        const quantizedOffset = Math.round(offset / timeResolution) * timeResolution;
        const measureEnd = (Math.floor(quantizedOffset / measureLength) + 1) * measureLength;
        let quantizedDuration = Math.round(duration / timeResolution) * timeResolution;
        quantizedDuration = Math.min(quantizedDuration, measureEnd - quantizedOffset);

        if (quantizedDuration > 0) {
            quantizedNotes.push([pitch, quantizedDuration, quantizedOffset]);
        }
    }

    return quantizedNotes;
}

/**
 * Find closest pitch at measure start
 * @param {Array} notes - Array of notes
 * @param {number} measureLength - Measure length
 * @returns {Array} Array of pitches at measure starts
 */
export function findClosestPitchAtMeasureStart(notes, measureLength) {
    // Filter out notes with null values
    const validNotes = notes.filter(([pitch, , offset]) => pitch !== null && offset !== null);
    
    // Sort by offset
    const notesSorted = validNotes.sort((a, b) => a[2] - b[2]);
    
    // Find max offset to determine number of measures
    const maxOffset = Math.max(...notesSorted.map(([, , offset]) => offset));
    const numMeasures = Math.floor(maxOffset / measureLength) + 1;
    
    const closestPitches = [];
    
    for (let measureNum = 0; measureNum < numMeasures; measureNum++) {
        const measureStart = measureNum * measureLength;
        let closestPitch = null;
        let closestDistance = Infinity;
        
        for (const [pitch, , offset] of notesSorted) {
            const distance = measureStart - offset;
            
            if (distance >= 0 && distance < closestDistance) {
                closestDistance = distance;
                closestPitch = pitch;
            }
            
            if (offset > measureStart) break;
        }
        
        if (closestPitch !== null) {
            closestPitches.push(closestPitch);
        }
    }
    
    return closestPitches;
}

/**
 * Tune pitch to nearest scale pitch
 * @param {number} pitch - MIDI pitch to tune
 * @param {Array} scale - Scale pitches
 * @returns {number} Tuned pitch
 */
export function tune(pitch, scale) {
    return scale.reduce((prev, curr) => 
        Math.abs(curr - pitch) < Math.abs(prev - pitch) ? curr : prev
    );
}

/**
 * Convert quarter-length duration to seconds
 * @param {number} ql - Duration in quarter-length units
 * @param {number} bpm - Beats per minute
 * @returns {number} Duration in seconds
 */
export function qlToSeconds(ql, bpm) {
    return 60 / bpm * ql;
}

/**
 * Generate Fibonacci sequence
 * @param {number} a - First number (default: 0)
 * @param {number} b - Second number (default: 1)
 * @param {number} base - Base value added to each number (default: 0)
 * @param {number} scale - Scale factor (default: 1)
 * @returns {Generator} Fibonacci generator
 */
export function* fibonacci(a = 0, b = 1, base = 0, scale = 1) {
    while (true) {
        yield base + scale * a;
        [a, b] = [b, a + b];
    }
}

/**
 * Repeat polyloops for specified measures
 * @param {Object} polyloopsDict - Dictionary of polyloops
 * @param {number} nMeasures - Number of measures to repeat
 * @param {number} measureLength - Length of a measure
 * @returns {Object} Dictionary of repeated polyloops
 */
export function repeatPolyloops(polyloopsDict, nMeasures, measureLength) {
    const repeatedDict = {};
    
    for (const [name, polyloop] of Object.entries(polyloopsDict)) {
        const repeatedPolyloop = [];
        
        for (let m = 0; m < nMeasures; m++) {
            const measureOffset = m * measureLength;
            const offsetPolyloop = offsetTrack(polyloop, measureOffset);
            repeatedPolyloop.push(...offsetPolyloop);
        }
        
        repeatedDict[name] = repeatedPolyloop;
    }
    
    return repeatedDict;
}

/**
 * MIDI instrument mapping
 */
export const instrumentMapping = {
    'Acoustic Grand Piano': 0,
    'Bright Acoustic Piano': 1,
    'Electric Grand Piano': 2,
    'Honky-tonk Piano': 3,
    'Electric Piano 1': 4,
    'Electric Piano 2': 5,
    'Harpsichord': 6,
    'Clavinet': 7,
    // ... (full mapping truncated for brevity, but would include all 128 instruments)
    'Gunshot': 127
};

/* ---------------------------------------------------------------------------
 * Sequence transformations
 *
 * Migrated from the former `utils/music.js`, which was never imported and
 * whose import of `../types/music.js` pointed at a file that does not exist.
 * Five of its methods also read and wrote `note.offset` — djalgo's field
 * name — which is `undefined` on JMON notes; they are ported to `time` here.
 *
 * All of these take and return arrays of JMON notes
 * (`{ pitch, duration, time, velocity }`), never mutate their input, and
 * tolerate rests (`pitch: null`) and chords (`pitch: [60, 64, 67]`).
 * ------------------------------------------------------------------------- */

/** Apply `fn` to a note's pitch, passing chords through element-wise and rests through untouched. */
function mapPitch(pitch, fn) {
    if (pitch === null || pitch === undefined) return pitch;
    return Array.isArray(pitch) ? pitch.map(fn) : fn(pitch);
}

/** Flatten every sounding pitch in a sequence into a single array. */
function allPitches(notes) {
    const out = [];
    for (const note of notes) {
        const p = note?.pitch;
        if (p === null || p === undefined) continue;
        if (Array.isArray(p)) out.push(...p);
        else out.push(p);
    }
    return out;
}

/**
 * Invert a melody around a pivot pitch. Each pitch is reflected to the
 * opposite side of the pivot, so an ascending third becomes a descending one.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {number} [pivot] - Pivot pitch. Defaults to the midpoint of the
 *   sequence's range, which keeps the inversion inside the original tessitura.
 * @returns {Array<Object>} New notes with inverted pitches
 *
 * @example
 * invert([{ pitch: 60, duration: 1, time: 0 }, { pitch: 64, duration: 1, time: 1 }], 60);
 * // => pitches 60 and 56
 */
export function invert(notes, pivot) {
    const pitches = allPitches(notes);
    if (pitches.length === 0) return notes.map(n => ({ ...n }));

    const axis = pivot !== undefined
        ? pivot
        : (Math.max(...pitches) + Math.min(...pitches)) / 2;

    return notes.map(note => ({
        ...note,
        pitch: mapPitch(note.pitch, p => 2 * axis - p)
    }));
}

/**
 * Retrograde: play the sequence backwards.
 *
 * Each note is mirrored within the sequence's own span
 * (`newTime = span - (time + duration)`), so rests, chords and overlapping
 * voices survive the transformation. Reversing the array and relaying notes
 * end-to-end — what the old implementation did — silently flattens polyphony
 * and drops every gap.
 *
 * @param {Array<Object>} notes - JMON notes
 * @returns {Array<Object>} New notes, ordered by their new time
 */
export function retrograde(notes) {
    if (!notes || notes.length === 0) return [];

    const span = getTotalDuration(notes);

    return notes
        .map(note => ({
            ...note,
            time: span - ((note.time || 0) + (note.duration || 0))
        }))
        .sort((a, b) => a.time - b.time);
}

/**
 * Augmentation (`factor > 1`) or diminution (`factor < 1`): scale the
 * sequence in time.
 *
 * Both `time` and `duration` are scaled, so the rhythm is stretched as a
 * whole and simultaneous notes stay simultaneous.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {number} factor - Multiplier (2 = twice as slow, 0.5 = twice as fast)
 * @returns {Array<Object>} New notes
 */
export function augment(notes, factor) {
    if (!Number.isFinite(factor) || factor <= 0) {
        throw new Error(`augment: factor must be a positive number, got ${factor}`);
    }
    return notes.map(note => ({
        ...note,
        time: (note.time || 0) * factor,
        duration: (note.duration || 0) * factor
    }));
}

/**
 * Push off-beat notes later to produce a swing feel.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.ratio=0.67] - Where the off-beat lands inside the
 *   beat, as a fraction. 0.5 is straight, 0.67 is a triplet swing.
 * @param {number} [options.subdivision=0.5] - Off-beat position in quarter
 *   notes (0.5 = eighths, 0.25 = sixteenths)
 * @param {number} [options.tolerance=0.01] - How close a note must sit to the
 *   off-beat to count as one
 * @returns {Array<Object>} New notes
 */
export function applySwing(notes, options = {}) {
    const { ratio = 0.67, subdivision = 0.5, tolerance = 0.01 } = options;
    const beat = subdivision * 2;

    return notes.map(note => {
        const time = note.time || 0;
        const positionInBeat = time % beat;
        const isOffBeat = Math.abs(positionInBeat - subdivision) < tolerance;
        if (!isOffBeat) return { ...note };

        const beatStart = time - positionInBeat;
        return { ...note, time: beatStart + beat * ratio };
    });
}

/**
 * Extract the onset times of a sequence — its rhythm, stripped of pitch.
 * @param {Array<Object>} notes - JMON notes
 * @returns {Array<number>} Sorted onset times in quarter notes
 */
export function extractRhythm(notes) {
    return notes.map(note => note.time || 0).sort((a, b) => a - b);
}

/**
 * Rescale velocities into `[min, max]`, preserving their relative shape.
 * A sequence whose velocities are all equal collapses to the midpoint.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {number} [min=0.1] - Target floor
 * @param {number} [max=1.0] - Target ceiling
 * @returns {Array<Object>} New notes
 */
export function normalizeVelocities(notes, min = 0.1, max = 1.0) {
    if (!notes || notes.length === 0) return [];

    const velocities = notes.map(n => n.velocity ?? 0.8);
    const lo = Math.min(...velocities);
    const hi = Math.max(...velocities);
    const range = hi - lo;

    if (range === 0) {
        const mid = (min + max) / 2;
        return notes.map(note => ({ ...note, velocity: mid }));
    }

    return notes.map((note, i) => ({
        ...note,
        velocity: min + ((velocities[i] - lo) / range) * (max - min)
    }));
}

/**
 * Lowest and highest sounding pitch in a sequence.
 * @param {Array<Object>} notes - JMON notes
 * @returns {{min: number, max: number}|null} `null` when nothing sounds
 */
export function getPitchRange(notes) {
    const pitches = allPitches(notes);
    if (pitches.length === 0) return null;
    return { min: Math.min(...pitches), max: Math.max(...pitches) };
}

/**
 * Total span of a sequence: the latest note end, in quarter notes.
 * @param {Array<Object>} notes - JMON notes
 * @returns {number}
 */
export function getTotalDuration(notes) {
    if (!notes || notes.length === 0) return 0;
    return Math.max(...notes.map(note => (note.time || 0) + (note.duration || 0)));
}

/**
 * Split notes longer than `maxDuration` into a run of tied-length notes.
 * Useful before exporting to formats that cap note length, or to turn long
 * pads into repeated attacks.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {number} maxDuration - Longest allowed duration in quarter notes
 * @returns {Array<Object>} New notes
 */
export function splitLongNotes(notes, maxDuration) {
    if (!Number.isFinite(maxDuration) || maxDuration <= 0) {
        throw new Error(`splitLongNotes: maxDuration must be positive, got ${maxDuration}`);
    }

    const result = [];
    for (const note of notes) {
        const duration = note.duration || 0;
        if (duration <= maxDuration) {
            result.push({ ...note });
            continue;
        }
        const pieces = Math.ceil(duration / maxDuration);
        const pieceDuration = duration / pieces;
        for (let i = 0; i < pieces; i++) {
            result.push({
                ...note,
                duration: pieceDuration,
                time: (note.time || 0) + i * pieceDuration
            });
        }
    }
    return result;
}

/**
 * Merge consecutive notes that repeat the same pitch back-to-back into one
 * longer note. Notes separated by a gap are left alone — only true
 * restatements are merged.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {number} [tolerance=0.01] - Largest gap still considered contiguous
 * @returns {Array<Object>} New notes
 */
export function removeDuplicates(notes, tolerance = 0.01) {
    if (!notes || notes.length <= 1) return (notes || []).map(n => ({ ...n }));

    const samePitch = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

    const result = [{ ...notes[0] }];
    for (let i = 1; i < notes.length; i++) {
        const current = notes[i];
        const previous = result[result.length - 1];
        const contiguous = Math.abs(
            (current.time || 0) - ((previous.time || 0) + (previous.duration || 0))
        ) <= tolerance;

        if (samePitch(current.pitch, previous.pitch) && contiguous) {
            previous.duration = (previous.duration || 0) + (current.duration || 0);
        } else {
            result.push({ ...current });
        }
    }
    return result;
}


/* ---------------------------------------------------------------------------
 * Quantization
 *
 * JMON-native (`time` / `duration` on note objects), migrated from the former
 * `src/utils/quantize.js`. Distinct from `quantizeNotes` above, which works on
 * djalgo `[pitch, duration, offset]` tuples and clamps notes to their measure.
 *
 * Grids are in quarter notes: 1 = quarter, 0.5 = eighth, 0.25 = sixteenth,
 * 1/3 = eighth-note triplet (three notes in the space of one quarter note).
 * ------------------------------------------------------------------------- */

/**
 * Snap a numeric value to a grid.
 * @param {number} value - Value in quarter notes
 * @param {number} [grid=0.25] - Grid size in quarter notes
 * @param {'nearest'|'floor'|'ceil'} [mode='nearest'] - Rounding mode
 * @returns {number} Snapped value; non-finite input is returned unchanged
 */
export function quantize(value, grid = 0.25, mode = 'nearest') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value;
    if (!Number.isFinite(grid) || grid <= 0) {
        throw new Error(`quantize: grid must be a positive number, got ${grid}`);
    }

    const steps = value / grid;
    let rounded;
    switch (mode) {
        case 'floor': rounded = Math.floor(steps); break;
        case 'ceil':  rounded = Math.ceil(steps);  break;
        case 'nearest':
        default:      rounded = Math.round(steps);
    }
    // Re-round to kill the float drift that `steps * grid` introduces on
    // grids like 1/3 (e.g. 0.6666666666666666 instead of 2/3).
    return Number((rounded * grid).toPrecision(12));
}

/**
 * Quantize the timing fields of an array of note-like objects.
 *
 * Durations never quantize to zero: a note shorter than the grid is floored
 * to one grid unit rather than silently deleted.
 *
 * @param {Array<Object>} events - Objects carrying numeric timing fields
 * @param {Object} [options]
 * @param {number} [options.grid=0.25] - Grid size in quarter notes
 * @param {string[]} [options.fields=['time','duration']] - Fields to snap
 * @param {'nearest'|'floor'|'ceil'} [options.mode='nearest'] - Rounding mode
 * @returns {Array<Object>} New array with snapped fields
 */
export function quantizeEvents(events, options = {}) {
    const { grid = 0.25, fields = ['time', 'duration'], mode = 'nearest' } = options;
    if (!Array.isArray(events)) return events;

    return events.map(event => {
        const copy = { ...event };
        for (const field of fields) {
            if (typeof copy[field] !== 'number') continue;
            const snapped = quantize(copy[field], grid, mode);
            // A note quantized out of existence is worse than one slightly
            // off the grid, so keep at least one grid unit of duration.
            copy[field] = (field === 'duration' && snapped <= 0) ? grid : snapped;
        }
        return copy;
    });
}

/**
 * Quantize a JMON track's notes, returning a new track.
 * @param {Object} track - `{ label, notes, ... }`
 * @param {Object} [options] - Same options as {@link quantizeEvents}
 * @returns {Object} New track
 */
export function quantizeTrack(track, options = {}) {
    const { grid = 0.25, mode = 'nearest' } = options;
    if (!track || !Array.isArray(track.notes)) return track;
    return {
        ...track,
        notes: quantizeEvents(track.notes, { grid, mode, fields: ['time', 'duration'] })
    };
}

/**
 * Quantize every track of a JMON piece, returning a new piece.
 * @param {Object} piece - `{ tempo, tracks, ... }`
 * @param {Object} [options] - Same options as {@link quantizeEvents}
 * @returns {Object} New piece
 *
 * @example
 * // Tighten a MIDI import onto a sixteenth grid. `midiToJmon` is
 * // `jmon/io`'s, injected through `jmon/studio` as `jm.midiToJmon`.
 * const tight = quantizePiece(jm.midiToJmon(bytes), { grid: 0.25 });
 */
export function quantizePiece(piece, options = {}) {
    const { grid = 0.25, mode = 'nearest' } = options;
    if (!piece || !Array.isArray(piece.tracks)) return piece;
    return {
        ...piece,
        tracks: piece.tracks.map(track => quantizeTrack(track, { grid, mode }))
    };
}
