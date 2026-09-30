/**
 * Utility functions for JMON algorithmic composition
 * JavaScript implementation of djalgo's utils.py
 */

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
 * Scale degree of a pitch, counted from the tonic; fractional between scale notes.
 * @param {number|string} pitch - Pitch (MIDI number or note name)
 * @param {Object} options
 * @param {Array<number>} options.scale - The scale's pitches
 * @param {number|string} options.tonic - Tonic pitch
 * @returns {number} Scale degree
 */
export function getDegreeFromPitch(pitch, { scale: scaleList, tonic: tonicPitch } = {}) {
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
 * Pitch of a scale degree, counted from the tonic.
 * @param {number} degree - Scale degree
 * @param {Object} options
 * @param {Array<number>} options.scale - The scale's pitches
 * @param {number} options.tonic - Tonic pitch
 * @returns {number} Pitch value
 */
export function getPitchFromDegree(degree, { scale: scaleList, tonic: tonicPitch } = {}) {
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

// Alias for backwards compatibility

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
 * Scale a list of numbers to a new range
 * @param {Array} numbers - Numbers to scale
 * @param {number} toMin - Target minimum value
 * @param {number} toMax - Target maximum value
 * @param {number} minNumbers - Current minimum (optional)
 * @param {number} maxNumbers - Current maximum (optional)
 * @returns {Array} Scaled numbers
 */
export function scaleList(numbers, { toMin, toMax, from = null, to = null } = {}) {
    const minNumbers = from, maxNumbers = to;
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
 * Repeat polyloops for specified measures
 * @param {Object} polyloopsDict - Dictionary of polyloops
 * @param {Object} options
 * @param {number} options.measures - Number of measures to repeat
 * @param {number} options.measureLength - Length of a measure
 * @returns {Object} Dictionary of repeated polyloops
 */
export function repeatPolyloops(polyloopsDict, { measures: nMeasures, measureLength } = {}) {
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

