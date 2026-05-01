/**
 * JMON Utilities - Official helpers for working with JMON format
 * These utilities provide a consistent API for creating and manipulating JMON objects
 */

/**
 * Convert beats (quarter notes) to bars:beats:ticks format
 * @param {number} beats - Time in beats (quarter notes)
 * @param {number} beatsPerBar - Beats per bar (default: 4 for 4/4 time)
 * @param {number} ticksPerBeat - Ticks per quarter note (default: 480, MIDI standard)
 * @returns {string} Time in "bars:beats:ticks" format
 */
export function beatsToTime(beats, beatsPerBar = 4, ticksPerBeat = 480) {
  const bars = Math.floor(beats / beatsPerBar);
  const remainingBeats = beats - bars * beatsPerBar;
  const wholeBeats = Math.floor(remainingBeats);
  const fractionalBeat = remainingBeats - wholeBeats;
  const ticks = Math.round(fractionalBeat * ticksPerBeat);
  
  return `${bars}:${wholeBeats}:${ticks}`;
}

/**
 * Convert bars:beats:ticks format to beats (quarter notes)
 * @param {string|number} timeString - Time in "bars:beats:ticks" format or number
 * @param {number} beatsPerBar - Beats per bar (default: 4 for 4/4 time)
 * @param {number} ticksPerBeat - Ticks per quarter note (default: 480, MIDI standard)
 * @returns {number} Time in beats (quarter notes)
 */
export function timeToBeats(timeString, beatsPerBar = 4, ticksPerBeat = 480) {
  if (typeof timeString === 'number') return timeString;
  if (typeof timeString !== 'string') return 0;
  
  const parts = timeString.split(':').map(x => parseFloat(x || '0'));
  const [bars = 0, beats = 0, ticks = 0] = parts;
  
  return bars * beatsPerBar + beats + ticks / ticksPerBeat;
}

/**
 * Create a JMON part from a sequence of notes
 * @param {Array} notes - Array of notes in various formats
 * @param {string} name - Part name
 * @param {Object} options - Additional options
 * @returns {Object} JMON part object
 */
export function createPart(notes, name = 'Untitled Part', options = {}) {
  const normalizedNotes = normalizeNotes(notes);
  
  return {
    name,
    notes: normalizedNotes,
    ...options
  };
}

/**
 * Create a complete JMON composition
 * @param {Array} parts - Array of parts or note sequences
 * @param {Object} metadata - Composition metadata
 * @returns {Object} Complete JMON composition
 */
export function createComposition(parts, metadata = {}) {
  // Normalize parts
  const normalizedParts = parts.map((part, index) => {
    if (Array.isArray(part)) {
      // If it's just an array of notes, create a part
      return createPart(part, `Track ${index + 1}`);
    } else if (part.name && part.notes) {
      // Already a part, normalize the notes
      return {
        ...part,
        notes: normalizeNotes(part.notes)
      };
    } else {
      return part;
    }
  });

  // Create basic JMON structure
  const composition = {
    format: 'jmon',
    version: '1.0',
    bpm: metadata.bpm || 120,
    keySignature: metadata.keySignature || 'C',
    timeSignature: metadata.timeSignature || '4/4',
    tracks: normalizedParts,
    ...metadata
  };

  // Remove metadata fields that are now top-level
  delete composition.metadata?.bpm;
  delete composition.metadata?.keySignature;
  delete composition.metadata?.timeSignature;

  return composition;
}

/**
 * Normalize notes from various formats to JMON format
 * @param {Array} notes - Notes in various formats
 * @returns {Array} JMON-compliant note objects
 */
export function normalizeNotes(notes) {
  if (!Array.isArray(notes)) return [];
  
  return notes.map((note, index) => {
    // Handle tuple format [pitch, duration, offset]
    if (Array.isArray(note)) {
      const [pitch, duration, offset = 0] = note;
      return {
        pitch,
        duration,
        time: beatsToTime(offset)
      };
    }
    
    // Handle object format
    if (typeof note === 'object' && note !== null) {
      const { pitch, duration } = note;
      let time = '0:0:0';
      
      // Convert various time formats
      if (typeof note.time === 'string') {
        time = note.time;
      } else if (typeof note.time === 'number') {
        time = beatsToTime(note.time);
      } else if (typeof note.offset === 'number') {
        time = beatsToTime(note.offset);
      }
      
      return {
        pitch,
        duration,
        time,
        // Preserve other properties
        ...Object.fromEntries(
          Object.entries(note).filter(([key]) => 
            !['time', 'offset'].includes(key)
          )
        )
      };
    }
    
    // Fallback for unexpected formats
    console.warn(`Unexpected note format at index ${index}:`, note);
    return {
      pitch: 60, // Default to middle C
      duration: 1,
      time: '0:0:0'
    };
  });
}

/**
 * Convert legacy tuple sequences to JMON notes
 * @param {Array} tuples - Array of [pitch, duration, offset] tuples
 * @returns {Array} JMON note objects
 */
export function tuplesToJmon(tuples) {
  return tuples.map(([pitch, duration, offset = 0]) => ({
    pitch,
    duration,
    time: beatsToTime(offset)
  }));
}

/**
 * Convert JMON notes to legacy tuple format
 * @param {Array} notes - JMON note objects
 * @returns {Array} Array of [pitch, duration, offset] tuples
 */
export function jmonToTuples(notes) {
  return notes.map(note => [
    note.pitch,
    note.duration,
    timeToBeats(note.time)
  ]);
}

/**
 * Create a basic scale sequence in JMON format
 * @param {Array} pitches - Array of MIDI note numbers
 * @param {number} duration - Duration for each note (default: 1 beat)
 * @param {number} startTime - Starting time in beats (default: 0)
 * @returns {Array} JMON note objects
 */
export function createScale(pitches, duration = 1, startTime = 0) {
  let currentTime = startTime;
  
  return pitches.map(pitch => {
    const note = {
      pitch,
      duration,
      time: beatsToTime(currentTime)
    };
    currentTime += duration;
    return note;
  });
}

/**
 * Shift all notes in a sequence by a given time
 * @param {Array} notes - JMON notes
 * @param {number} timeShift - Time shift in beats
 * @returns {Array} Time-shifted notes
 */
export function shiftTime(notes, timeShift) {
  return notes.map(note => {
    const currentTime = typeof note.time === 'number' ? note.time : timeToBeats(note.time);
    return {
      ...note,
      time: typeof note.time === 'number' 
        ? currentTime + timeShift 
        : beatsToTime(currentTime + timeShift)
    };
  });
}

// Alias for backwards compatibility
export const offsetNotes = shiftTime;

/**
 * Concatenate multiple note sequences with proper timing
 * Each sequence's timing is adjusted to start after the previous one ends
 * @param {Array} sequences - Array of note sequences
 * @returns {Array} Concatenated notes with adjusted timing
 */
export function concatenateSequences(sequences) {
  if (sequences.length === 0) return [];
  
  const result = [];
  let currentTime = 0;
  
  // Detect if we're using numeric or string time format from first sequence
  const useNumericTime = sequences[0]?.length > 0 && typeof sequences[0][0]?.time === 'number';
  
  for (const sequence of sequences) {
    // Shift this sequence by the current time
    const shiftedSequence = shiftTime(sequence, currentTime);
    result.push(...shiftedSequence);
    
    // Calculate the end time of this sequence
    const endTimes = shiftedSequence.map(note => {
      const noteTime = typeof note.time === 'number' ? note.time : timeToBeats(note.time);
      return noteTime + note.duration;
    });
    currentTime = Math.max(...endTimes, currentTime);
  }
  
  return result;
}

/**
 * Chain/concatenate tracks with proper timing adjustment
 * Alias for concatenateSequences for clarity
 * @param {...Array} tracks - Note sequences to chain
 * @returns {Array} Chained notes with sequential timing
 */
export function chain(...tracks) {
  return concatenateSequences(tracks);
}

/**
 * Recalculate timing based on durations (sequential playback)
 * Useful after processes that don't preserve timing
 * @param {Array} notes - Notes to recalculate timing for
 * @param {number} startTime - Starting time (default: 0)
 * @returns {Array} Notes with recalculated timing
 */
export function recalculateTiming(notes, startTime = 0) {
  let currentTime = startTime;
  const useNumericTime = notes.length > 0 && typeof notes[0]?.time === 'number';
  
  return notes.map(note => {
    const newNote = {
      ...note,
      time: useNumericTime ? currentTime : beatsToTime(currentTime)
    };
    currentTime += note.duration;
    return newNote;
  });
}

/**
 * Combine multiple sequences to play simultaneously
 * @param {Array} sequences - Array of note sequences
 * @returns {Array} Combined notes
 */
export function combineSequences(sequences) {
  return sequences.flat();
}

/**
 * Transpose all notes by a number of semitones. Handles both single-pitch
 * notes and chord notes (where `pitch` is an array of MIDI numbers).
 * @param {Array} notes - JMON notes
 * @param {number} semitones - Semitones to shift (positive = up)
 * @returns {Array} Transposed notes
 */
export function transpose(notes, semitones) {
  return notes.map((n) => ({
    ...n,
    pitch: Array.isArray(n.pitch)
      ? n.pitch.map((p) => p + semitones)
      : n.pitch + semitones,
  }));
}

/**
 * Clip a note sequence to a maximum time. Notes starting after `maxTime`
 * are dropped; notes overlapping the boundary have their duration trimmed.
 * @param {Array} notes - JMON notes (numeric `time` field)
 * @param {number} maxTime - Cutoff time (beats)
 * @returns {Array} Truncated notes
 */
export function truncate(notes, maxTime) {
  return notes
    .filter((n) => n.time < maxTime)
    .map((n) => ({
      ...n,
      duration: Math.min(n.duration, maxTime - n.time),
    }));
}

/**
 * Concatenate composition sections into a flat per-label note map.
 *
 * Each section is `{ tracks: [{ label, notes }], duration?: number }`.
 * Tracks with the same label across sections are merged into one stream
 * with note times offset by the cumulative duration of preceding sections.
 * Section duration falls back to the latest note end-time if not provided.
 *
 * Tempos are NOT rescaled — sections must share a tempo, or the caller
 * must pre-rescale times.
 *
 * @example
 * const merged = concatSections([sectionA, sectionB, sectionC]);
 * const piece = {
 *   tempo: 120,
 *   tracks: [
 *     { label: "Drums", notes: merged.Drums },
 *     { label: "Bass", notes: merged.Bass },
 *   ],
 * };
 *
 * @param {Array} sections - Sections to concatenate in order
 * @returns {Object} Map of label → flat array of time-offset notes
 */
export function concatSections(sections) {
  const merged = {};
  let offset = 0;
  for (const sec of sections) {
    for (const track of sec.tracks) {
      if (!merged[track.label]) merged[track.label] = [];
      for (const n of track.notes) {
        merged[track.label].push({ ...n, time: n.time + offset });
      }
    }
    const computed = Math.max(
      0,
      ...sec.tracks.flatMap((t) => t.notes.map((n) => n.time + n.duration)),
    );
    offset += sec.duration ?? computed;
  }
  return merged;
}

/**
 * Extract timing information from notes
 * @param {Array} notes - JMON notes
 * @returns {Object} Timing statistics
 */
export function getTimingInfo(notes) {
  if (notes.length === 0) return { start: 0, end: 0, duration: 0 };
  
  const startTimes = notes.map(note => timeToBeats(note.time));
  const endTimes = notes.map(note => timeToBeats(note.time) + note.duration);
  
  const start = Math.min(...startTimes);
  const end = Math.max(...endTimes);
  
  return {
    start,
    end,
    duration: end - start,
    startTime: beatsToTime(start),
    endTime: beatsToTime(end)
  };
}
