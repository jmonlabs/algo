/**
 * JMON Timing Utilities
 * JMON uses numeric time in quarter notes as the primary format for MIDI compatibility.
 * Provides conversion to/from bars:beats:ticks format for display and external formats only.
 */

/**
 * Default timing configuration
 * @type {Object}
 */
export const DEFAULT_TIMING_CONFIG = {
  timeSignature: [4, 4],     // 4/4 time
  ticksPerQuarterNote: 480,  // Standard MIDI resolution
  beatsPerBar: 4             // Derived from time signature
};

/**
 * Convert numeric offset (in beats) to bars:beats:ticks format
 * @param {number} offsetInBeats - Numeric offset in beats
 * @param {Object} config - Timing configuration
 * @param {Array<number>} config.timeSignature - Time signature as [numerator, denominator]
 * @param {number} config.ticksPerQuarterNote - Ticks per quarter note (default 480)
 * @returns {string} Time in "bars:beats:ticks" format
 */
export function offsetToBarsBeatsTicks(offsetInBeats, config = DEFAULT_TIMING_CONFIG) {
  const { timeSignature, ticksPerQuarterNote } = config;
  const [numerator, denominator] = timeSignature;
  
  // Calculate beats per bar based on time signature
  const beatsPerBar = (numerator * 4) / denominator;
  
  // Convert to bars, beats, ticks
  const bars = Math.floor(offsetInBeats / beatsPerBar);
  const remainingBeats = offsetInBeats % beatsPerBar;
  const beats = Math.floor(remainingBeats);
  const fractionalBeat = remainingBeats - beats;
  const ticks = Math.round(fractionalBeat * ticksPerQuarterNote);
  
  return `${bars}:${beats}:${ticks}`;
}

/**
 * Convert bars:beats:ticks format to numeric offset (in beats)
 * @param {string} barsBeatsTicks - Time in "bars:beats:ticks" format
 * @param {Object} config - Timing configuration
 * @param {Array<number>} config.timeSignature - Time signature as [numerator, denominator]
 * @param {number} config.ticksPerQuarterNote - Ticks per quarter note (default 480)
 * @returns {number} Offset in beats
 */
export function barsBeatsTicksToOffset(barsBeatsTicks, config = DEFAULT_TIMING_CONFIG) {
  const { timeSignature, ticksPerQuarterNote } = config;
  const [numerator, denominator] = timeSignature;
  
  // Parse the bars:beats:ticks string
  const parts = barsBeatsTicks.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid bars:beats:ticks format: ${barsBeatsTicks}`);
  }
  
  const bars = parseInt(parts[0], 10);
  const beats = parseFloat(parts[1]);
  const ticks = parseInt(parts[2], 10);
  
  if (isNaN(bars) || isNaN(beats) || isNaN(ticks)) {
    throw new Error(`Invalid numeric values in bars:beats:ticks: ${barsBeatsTicks}`);
  }
  
  // Calculate beats per bar based on time signature
  const beatsPerBar = (numerator * 4) / denominator;
  
  // Convert to total offset in beats
  const totalBeats = bars * beatsPerBar + beats + (ticks / ticksPerQuarterNote);
  
  return totalBeats;
}

/**
 * Convert a sequence with offset/time properties to standard JMON format
 * @param {Array} sequence - Array of notes with offset or time properties
 * @param {Object} config - Timing configuration (used for bars:beats:ticks conversion if needed)
 * @param {boolean} keepNumericDuration - Keep numeric durations (default: true for MIDI consistency)
 * @returns {Array} Array of JMON-format notes with numeric time
 */
export function sequenceToJMONTiming(sequence, config = DEFAULT_TIMING_CONFIG, keepNumericDuration = true) {
  return sequence.map(note => {
    const jmonNote = { ...note };
    
    // Convert offset to time - always use numeric for JMON
    if (note.offset !== undefined) {
      jmonNote.time = note.offset;
      delete jmonNote.offset;
    }
    
    // Convert string time to numeric if present
    if (typeof note.time === 'string' && note.time.includes(':')) {
      jmonNote.time = barsBeatsTicksToOffset(note.time, config);
    }
    
    // Handle duration - keep numeric by default for MIDI compatibility
    if (typeof note.duration === 'number' && !keepNumericDuration) {
      // Convert to note values only if specifically requested
      const duration = note.duration;
      if (duration === 1) jmonNote.duration = '4n';         // quarter note
      else if (duration === 0.5) jmonNote.duration = '8n';  // eighth note
      else if (duration === 0.25) jmonNote.duration = '16n'; // sixteenth note
      else if (duration === 2) jmonNote.duration = '2n';     // half note
      else if (duration === 4) jmonNote.duration = '1n';     // whole note
      // Otherwise keep numeric duration
    }
    
    return jmonNote;
  });
}

/**
 * Convert a JMON sequence back to numeric timing (for internal processing)
 * @param {Array} jmonSequence - Array of JMON-format notes
 * @param {Object} config - Timing configuration
 * @returns {Array} Array of notes with numeric offset/duration
 */
export function jmonTimingToSequence(jmonSequence, config = DEFAULT_TIMING_CONFIG) {
  return jmonSequence.map(note => {
    const numericNote = { ...note };
    
    // Convert time to offset
    if (note.time && typeof note.time === 'string' && note.time.includes(':')) {
      numericNote.offset = barsBeatsTicksToOffset(note.time, config);
      delete numericNote.time;
    }
    
    // Convert duration strings to numeric values (simplified)
    if (typeof note.duration === 'string') {
      if (note.duration === '4n') numericNote.duration = 1;
      else if (note.duration === '8n') numericNote.duration = 0.5;
      else if (note.duration === '16n') numericNote.duration = 0.25;
      else if (note.duration === '2n') numericNote.duration = 2;
      else if (note.duration === '1n') numericNote.duration = 4;
      else if (note.duration.includes(':')) {
        // Convert bars:beats:ticks duration to numeric
        numericNote.duration = barsBeatsTicksToOffset(note.duration, config);
      }
    }
    
    return numericNote;
  });
}

/**
 * Create a proper JMON track from a notes sequence
 * @param {Array} notes - Array of note objects
 * @param {Object} options - Track creation options
 * @param {string} options.label - Track label
 * @param {number} options.midiChannel - MIDI channel (0-15)
 * @param {number} [options.midiProgram] - GM program (0-127), omitted if undefined
 * @param {number} [options.pan] - Stereo position (-1..+1), omitted if undefined
 * @param {Object} options.synth - Synth configuration
 * @param {Object} options.timingConfig - Timing configuration
 * @param {boolean} options.keepNumericDuration - Keep numeric durations (default: true)
 * @returns {Object} JMON track object
 */
export function notesToTrack(notes, options = {}) {
  const {
    label = 'track',
    midiChannel = 0,
    midiProgram,
    pan,
    synth = { type: 'Synth' },
    timingConfig = DEFAULT_TIMING_CONFIG,
    keepNumericDuration = true  // Default to numeric for MIDI consistency
  } = options;

  // Convert notes to JMON timing format - always numeric time
  const jmonNotes = sequenceToJMONTiming(notes, timingConfig, keepNumericDuration);

  const track = {
    label,
    midiChannel,
    synth,
    notes: jmonNotes
  };
  if (midiProgram !== undefined) track.midiProgram = midiProgram;
  if (pan !== undefined) track.pan = pan;
  return track;
}

/**
 * @deprecated Use notesToTrack instead
 * Backward compatibility alias for notesToTrack
 */
export const sequenceToPart = notesToTrack;

/**
 * Validate that a time string follows bars:beats:ticks format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid format
 */
export function isValidBarsBeatsTicks(timeString) {
  if (typeof timeString !== 'string') return false;
  
  const pattern = /^\d+:\d+(\.\d+)?:\d+$/;
  return pattern.test(timeString);
}

/**
 * Adjust time values in a sequence based on durations (JMON-compatible version)
 * @param {Array} sequence - Note sequence
 * @param {Object} config - Timing configuration, used to interpret a `duration`
 *   given as a `bars:beats:ticks` string
 * @returns {Array} Sequence with adjusted numeric time values
 */
export function setOffsetsAccordingToDurationsJMON(sequence, config = DEFAULT_TIMING_CONFIG) {
  let currentOffset = 0;
  
  return sequence.map(note => {
    const jmonNote = {
      ...note,
      time: currentOffset  // Always use numeric time in quarter notes
    };
    
    // Add duration to current offset
    let durationInBeats = 0;
    if (typeof note.duration === 'number') {
      durationInBeats = note.duration;
    } else if (typeof note.duration === 'string') {
      if (note.duration === '4n') durationInBeats = 1;
      else if (note.duration === '8n') durationInBeats = 0.5;
      else if (note.duration === '16n') durationInBeats = 0.25;
      else if (note.duration === '2n') durationInBeats = 2;
      else if (note.duration === '1n') durationInBeats = 4;
      else if (note.duration.includes(':')) {
        durationInBeats = barsBeatsTicksToOffset(note.duration, config);
      }
    }
    
    currentOffset += durationInBeats;
    return jmonNote;
  });
}
