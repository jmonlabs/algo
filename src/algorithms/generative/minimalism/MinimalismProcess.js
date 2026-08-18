// JMON timing utilities
import {
  offsetToBarsBeatsTicks,
  barsBeatsTicksToOffset,
  notesToTrack,
  DEFAULT_TIMING_CONFIG
} from '../../utils/jmon-timing.js';

/**
 * @typedef {'additive'|'subtractive'} MinimalismOperation
 */

/**
 * @typedef {'forward'|'backward'|'inward'|'outward'} MinimalismDirection
 */

/**
 * @typedef {Object} MinimalismOptions
 * @property {MinimalismOperation} operation - Operation type
 * @property {MinimalismDirection} direction - Direction
 * @property {number} repetition - Repetition count
 * @property {Object} [timingConfig] - Timing configuration (mainly for display conversion)
 */

/**
 * Implementation of musical minimalism processes based on the Python djalgo library
 * Supports additive and subtractive operations in four directions
 */
export class MinimalismProcess {
  operation;
  direction;
  repetition;
  timingConfig;
  sequence = [];

  constructor(options) {
    const { operation, direction, repetition, timingConfig = DEFAULT_TIMING_CONFIG } = options;
    
    if (!['additive', 'subtractive'].includes(operation)) {
      throw new Error("Invalid operation. Choose 'additive' or 'subtractive'.");
    }
    
    if (!['forward', 'backward', 'inward', 'outward'].includes(direction)) {
      throw new Error("Invalid direction. Choose 'forward', 'backward', 'inward' or 'outward'.");
    }
    
    if (repetition < 0 || !Number.isInteger(repetition)) {
      throw new Error("Invalid repetition value. Must be an integer greater than or equal to 0.");
    }
    
    this.operation = operation;
    this.direction = direction;
    this.repetition = repetition;
    this.timingConfig = timingConfig;
  }

  /**
   * Generate processed sequence based on operation and direction
   * Accepts either:
   * - JMON note objects: { pitch, duration, time }
   * - Legacy objects: { pitch, duration, offset }
   * - Legacy tuples: [pitch, duration, offset]
   * Returns: JMON note objects with numeric time (quarter notes)
   */
  generate(sequence) {
    // Normalize input to objects with numeric 'offset' in beats for internal processing
    this.sequence = this.normalizeInput(sequence);

    let processed;
    
    if (this.operation === 'additive' && this.direction === 'forward') {
      processed = this.additiveForward();
    } else if (this.operation === 'additive' && this.direction === 'backward') {
      processed = this.additiveBackward();
    } else if (this.operation === 'additive' && this.direction === 'inward') {
      processed = this.additiveInward();
    } else if (this.operation === 'additive' && this.direction === 'outward') {
      processed = this.additiveOutward();
    } else if (this.operation === 'subtractive' && this.direction === 'forward') {
      processed = this.subtractiveForward();
    } else if (this.operation === 'subtractive' && this.direction === 'backward') {
      processed = this.subtractiveBackward();
    } else if (this.operation === 'subtractive' && this.direction === 'inward') {
      processed = this.subtractiveInward();
    } else if (this.operation === 'subtractive' && this.direction === 'outward') {
      processed = this.subtractiveOutward();
    } else {
      throw new Error('Invalid operation/direction combination');
    }

    // Adjust offsets based on durations and return JMON-compliant notes
    // Always use numeric time in quarter notes
    const withOffsets = this.adjustOffsets(processed);
    return this.toJmonNotes(withOffsets, false);
  }

  additiveForward() {
    const processed = [];
    
    for (let i = 0; i < this.sequence.length; i++) {
      const segment = this.sequence.slice(0, i + 1);
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
    }
    
    return processed;
  }

  additiveBackward() {
    const processed = [];
    
    for (let i = this.sequence.length; i > 0; i--) {
      const segment = this.sequence.slice(i - 1);
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
    }
    
    return processed;
  }

  additiveInward() {
    const processed = [];
    const n = this.sequence.length;
    
    for (let i = 0; i < Math.ceil(n / 2); i++) {
      let segment;
      
      if (i < n - i - 1) {
        // Combine from start and end
        const leftPart = this.sequence.slice(0, i + 1);
        const rightPart = this.sequence.slice(n - i - 1);
        segment = [...leftPart, ...rightPart];
      } else {
        // Middle element(s)
        segment = [...this.sequence];
      }
      
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
    }
    
    return processed;
  }

  additiveOutward() {
    const processed = [];
    const n = this.sequence.length;
    
    if (n % 2 === 0) {
      // Even length
      const midLeft = Math.floor(n / 2) - 1;
      const midRight = Math.floor(n / 2);
      
      for (let i = 0; i < n / 2; i++) {
        const segment = this.sequence.slice(midLeft - i, midRight + i + 1);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
    } else {
      // Odd length
      const mid = Math.floor(n / 2);
      
      for (let i = 0; i <= mid; i++) {
        const segment = this.sequence.slice(mid - i, mid + i + 1);
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
    }
    
    return processed;
  }

  subtractiveForward() {
    const processed = [];
    
    for (let i = 0; i < this.sequence.length; i++) {
      const segment = this.sequence.slice(i);
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
    }
    
    return processed;
  }

  subtractiveBackward() {
    const processed = [];
    
    for (let i = this.sequence.length; i > 0; i--) {
      const segment = this.sequence.slice(0, i);
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
    }
    
    return processed;
  }

  subtractiveInward() {
    const processed = [];
    const n = this.sequence.length;
    const steps = Math.floor(n / 2);
    
    // Start with full sequence
    for (let rep = 0; rep <= this.repetition; rep++) {
      processed.push(...this.sequence);
    }
    
    // Remove elements from both ends
    for (let i = 1; i <= steps; i++) {
      const segment = this.sequence.slice(i, n - i);
      if (segment.length > 0) {
        for (let rep = 0; rep <= this.repetition; rep++) {
          processed.push(...segment);
        }
      }
    }
    
    return processed;
  }

  subtractiveOutward() {
    const processed = [];
    let segment = [...this.sequence];
    
    // Start with full sequence
    for (let rep = 0; rep <= this.repetition; rep++) {
      processed.push(...segment);
    }
    
    // Remove first and last elements iteratively
    while (segment.length > 2) {
      segment = segment.slice(1, -1);
      for (let rep = 0; rep <= this.repetition; rep++) {
        processed.push(...segment);
      }
    }
    
    return processed;
  }

  // Normalize heterogenous inputs into objects with pitch, duration, offset (beats)
  normalizeInput(sequence) {
    if (!Array.isArray(sequence)) return [];

    // If tuples [pitch, duration, offset]
    if (Array.isArray(sequence[0])) {
      return sequence.map(([pitch, duration, offset = 0]) => ({ pitch, duration, offset }));
    }

    // If objects
    return sequence.map((n) => {
      const pitch = n.pitch;
      const duration = n.duration;
      // Prefer numeric beats for internal work
      let offset = 0;
      if (typeof n.offset === 'number') offset = n.offset;
      else if (typeof n.time === 'number') offset = n.time;
      else if (typeof n.time === 'string') offset = this.timeToBeats(n.time);
      return { ...n, pitch, duration, offset };
    });
  }

  // Convert beats to bars:beats:ticks using centralized utility
  beatsToTime(beats) {
    return offsetToBarsBeatsTicks(beats, this.timingConfig);
  }

  // Convert bars:beats:ticks to beats using centralized utility
  timeToBeats(timeStr) {
    if (typeof timeStr !== 'string') return Number(timeStr) || 0;
    return barsBeatsTicksToOffset(timeStr, this.timingConfig);
  }

  // After process, recalc offsets sequentially in beats
  adjustOffsets(processed) {
    let currentOffset = 0;
    return processed.map((note) => {
      const newNote = {
        ...note,
        offset: currentOffset,
      };
      currentOffset += note.duration;
      return newNote;
    });
  }

  // Produce JMON notes: { pitch, duration, time }
  // Always use numeric time in quarter notes (like pitch: 60, time: 4.5)
  toJmonNotes(notesWithOffsets, useStringTime = false) {
    return notesWithOffsets.map(({ pitch, duration, offset, ...rest }) => {
      // Remove the old time property to avoid conflicts
      const { time: oldTime, ...cleanRest } = rest;
      return {
        pitch,
        duration,
        time: useStringTime ? this.beatsToTime(offset) : offset,
        ...cleanRest,
      };
    });
  }
  
  /**
   * Generate and convert to JMON track format
   * @param {Array} sequence - Input sequence
   * @param {Object} trackOptions - Track configuration options
   * @param {boolean} trackOptions.useStringTime - Use bars:beats:ticks strings for display (default: numeric)
   * @returns {Object} JMON track object
   */
  generateTrack(sequence, trackOptions = {}) {
    const processedNotes = this.generate(sequence);
    return notesToTrack(processedNotes, {
      timingConfig: this.timingConfig,
      useStringTime: false,
      ...trackOptions
    });
  }
}

/**
 * Tintinnabuli style implementation for modal piece
 * JMON-compliant: accepts mixed inputs, returns JMON notes
 * 
 * @example
 * ```js
 * // Object-based API (recommended)
 * const tint = new Tintinnabuli({
 *   tChord: [60, 64, 67],  // C major triad
 *   direction: 'up',
 *   rank: 1,
 *   extendOctaves: true
 * });
 * const tVoice = tint.generate(mVoice);
 * ```
 */
export class Tintinnabuli {
  tChord;
  extendedChord;
  direction;
  rank;
  isAlternate;
  currentDirection;
  timingConfig;
  extendOctaves;

  /**
   * Create a Tintinnabuli generator
   * @param {Object} options - Configuration options
   * @param {number[]} options.tChord - The t-chord pitches (e.g., [60, 64, 67] for C major triad)
   * @param {string} [options.direction='down'] - Direction to find t-voice: 'up', 'down', 'any', or 'alternate'
   * @param {number} [options.rank=0] - Which chord tone to select (0 = closest, 1 = second closest, etc.)
   * @param {boolean} [options.extendOctaves=true] - If true, chord is extended across all octaves (pitch classes matter).
   *                                                  If false, uses exact pitches provided.
   * @param {Object} [options.timingConfig] - Timing configuration
   */
  constructor(options = {}) {
    const {
      tChord,
      direction = 'down',
      rank = 0,
      extendOctaves = true,
      timingConfig = DEFAULT_TIMING_CONFIG
    } = options;
    
    if (!tChord || !Array.isArray(tChord) || tChord.length === 0) {
      throw new Error("tChord is required and must be a non-empty array of pitches.");
    }
    
    if (!['up', 'down', 'any', 'alternate'].includes(direction)) {
      throw new Error("Invalid direction. Choose 'up', 'down', 'any' or 'alternate'.");
    }
    
    this.tChord = tChord;
    this.extendOctaves = extendOctaves;
    
    // Extend chord across multiple octaves if enabled
    this.extendedChord = extendOctaves 
      ? this.extendChordAcrossOctaves(tChord)
      : [...tChord].sort((a, b) => a - b);
    
    this.isAlternate = direction === 'alternate';
    this.currentDirection = this.isAlternate ? 'up' : direction;
    this.direction = direction;
    this.timingConfig = timingConfig;
    
    if (!Number.isInteger(rank) || rank < 0) {
      throw new Error("Rank must be a non-negative integer.");
    }
    
    this.rank = rank;
  }
  
  /**
   * Extend chord pitches across the full MIDI range (0-127)
   * This ensures there are always enough notes above/below any melody pitch
   */
  extendChordAcrossOctaves(tChord) {
    // Get pitch classes from the chord (0-11)
    const pitchClasses = [...new Set(tChord.map(p => p % 12))].sort((a, b) => a - b);
    
    // Generate all pitches across MIDI range
    const extended = [];
    for (let octave = 0; octave <= 10; octave++) {
      for (const pc of pitchClasses) {
        const pitch = octave * 12 + pc;
        if (pitch >= 0 && pitch <= 127) {
          extended.push(pitch);
        }
      }
    }
    return extended.sort((a, b) => a - b);
  }

  /**
   * Generate t-voice from m-voice sequence
   * Accepts: JMON notes, legacy objects, or tuples
   * Returns: JMON notes with numeric time (quarter notes)
   * @param {Array} sequence - Input sequence
   * @param {boolean} useStringTime - Whether to use bars:beats:ticks strings for display (default: false)
   */
  generate(sequence, useStringTime = false) {
    const normalizedSequence = this.normalizeInput(sequence);
    const tVoice = [];
    
    // Reset direction for alternate mode at the start of each generate call
    if (this.isAlternate) {
      this.currentDirection = 'up';
    }
    
    for (const note of normalizedSequence) {
      if (note.pitch === undefined) {
        // Rest note - preserve timing
        const { offset, time: oldTime, ...rest } = note;
        tVoice.push({
          ...rest,
          pitch: undefined,
          time: useStringTime ? this.beatsToTime(offset) : offset
        });
        continue;
      }
      
      const mPitch = note.pitch;
      
      // Use extended chord for finding t-voice pitches
      // This ensures we always have notes above/below any melody pitch
      let tVoicePitch;
      
      if (this.currentDirection === 'up') {
        // Find all chord pitches > mPitch, sorted ascending
        const pitchesAbove = this.extendedChord.filter(p => p > mPitch);
        if (pitchesAbove.length > this.rank) {
          tVoicePitch = pitchesAbove[this.rank];
        } else if (pitchesAbove.length > 0) {
          tVoicePitch = pitchesAbove[pitchesAbove.length - 1];
        } else {
          // No pitches above, use highest in chord
          tVoicePitch = this.extendedChord[this.extendedChord.length - 1];
        }
      } else if (this.currentDirection === 'down') {
        // Find all chord pitches < mPitch, sorted descending
        const pitchesBelow = this.extendedChord.filter(p => p < mPitch).reverse();
        if (pitchesBelow.length > this.rank) {
          tVoicePitch = pitchesBelow[this.rank];
        } else if (pitchesBelow.length > 0) {
          tVoicePitch = pitchesBelow[pitchesBelow.length - 1];
        } else {
          // No pitches below, use lowest in chord
          tVoicePitch = this.extendedChord[0];
        }
      } else { // 'any' - find closest pitches regardless of direction
        const sortedByDistance = [...this.extendedChord]
          .map(p => ({ pitch: p, distance: Math.abs(p - mPitch) }))
          .filter(({ distance }) => distance > 0) // Exclude same pitch
          .sort((a, b) => a.distance - b.distance);
        
        if (sortedByDistance.length > this.rank) {
          tVoicePitch = sortedByDistance[this.rank].pitch;
        } else if (sortedByDistance.length > 0) {
          tVoicePitch = sortedByDistance[sortedByDistance.length - 1].pitch;
        } else {
          tVoicePitch = mPitch; // Fallback to same pitch
        }
      }
      
      // Change direction if alternate
      if (this.isAlternate) {
        this.currentDirection = this.currentDirection === 'up' ? 'down' : 'up';
      }
      
      // Output JMON note - use numeric time by default for MIDI consistency
      const { offset, time: oldTime, ...rest } = note;
      tVoice.push({
        ...rest,
        pitch: tVoicePitch,
        time: useStringTime ? this.beatsToTime(offset) : offset
      });
    }
    
    return tVoice;
  }

  // Normalize input like MinimalismProcess
  normalizeInput(sequence) {
    if (!Array.isArray(sequence)) return [];

    // If tuples [pitch, duration, offset]
    if (Array.isArray(sequence[0])) {
      return sequence.map(([pitch, duration, offset = 0]) => ({ pitch, duration, offset }));
    }

    // If objects
    return sequence.map((n) => {
      const pitch = n.pitch;
      const duration = n.duration;
      let offset = 0;
      if (typeof n.offset === 'number') offset = n.offset;
      else if (typeof n.time === 'number') offset = n.time;
      else if (typeof n.time === 'string') offset = this.timeToBeats(n.time);
      return { ...n, pitch, duration, offset };
    });
  }

  // Convert beats to bars:beats:ticks using centralized utility
  beatsToTime(beats) {
    return offsetToBarsBeatsTicks(beats, this.timingConfig);
  }

  // Convert bars:beats:ticks to beats using centralized utility
  timeToBeats(timeStr) {
    if (typeof timeStr !== 'string') return Number(timeStr) || 0;
    return barsBeatsTicksToOffset(timeStr, this.timingConfig);
  }
}
