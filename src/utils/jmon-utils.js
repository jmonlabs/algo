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
 * Create a JMON track from an array of notes.
 *
 * The label goes out as `label`, which is what the schema declares and what
 * the players, the score renderer and the MIDI writer read. This used to
 * emit `name`, so a track built here arrived unnamed everywhere.
 *
 * @param {Array} notes - Array of notes in various formats
 * @param {string} label - Track label
 * @param {Object} options - Additional track properties (synth, effects…)
 * @returns {Object} JMON track object
 */
export function createTrack(notes, label = 'Untitled Track', options = {}) {
  const normalizedNotes = normalizeNotes(notes);

  return {
    label,
    notes: normalizedNotes,
    ...options
  };
}

/** @deprecated Use {@link createTrack}. JMON calls them tracks, not parts. */
export const createPart = createTrack;

/**
 * Create a complete JMON piece.
 *
 * @param {Array} tracks - Array of tracks, or of bare note arrays
 * @param {Object} metadata - Top-level properties (tempo, keySignature…)
 * @returns {Object} Complete JMON piece
 */
export function createPiece(tracks, metadata = {}) {
  const normalizedTracks = tracks.map((track, index) => {
    if (Array.isArray(track)) {
      return createTrack(track, `Track ${index + 1}`);
    }
    if (track.notes) {
      // `name` is accepted on the way in so older callers keep working, but
      // only `label` goes out.
      const { name, ...rest } = track;
      return {
        ...rest,
        label: track.label || name || `Track ${index + 1}`,
        notes: normalizeNotes(track.notes)
      };
    }
    return track;
  });

  const { bpm, ...restMetadata } = metadata;

  return {
    format: 'jmon',
    version: '1.0',
    // The schema says `tempo`. `bpm` is accepted as a synonym on the way in;
    // it is not emitted, so the result has one tempo, not two.
    tempo: metadata.tempo || bpm || 120,
    keySignature: metadata.keySignature || 'C',
    timeSignature: metadata.timeSignature || '4/4',
    tracks: normalizedTracks,
    ...restMetadata
  };
}

/** @deprecated Use {@link createPiece}. JMON calls them pieces. */
export const createComposition = createPiece;

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
 * Concatenate multiple tracks with proper timing
 * Each track's timing is adjusted to start after the previous one ends
 * @param {Array} tracks - Array of tracks (note arrays)
 * @returns {Array} Concatenated notes with adjusted timing
 */
export function concatenateTracks(tracks) {
  if (tracks.length === 0) return [];

  const result = [];
  let currentTime = 0;

  // Detect if we're using numeric or string time format from first track
  const useNumericTime = tracks[0]?.length > 0 && typeof tracks[0][0]?.time === 'number';

  for (const track of tracks) {
    // Shift this track by the current time
    const shiftedTrack = shiftTime(track, currentTime);
    result.push(...shiftedTrack);

    // Calculate the end time of this track
    const endTimes = shiftedTrack.map(note => {
      const noteTime = typeof note.time === 'number' ? note.time : timeToBeats(note.time);
      return noteTime + note.duration;
    });
    currentTime = Math.max(...endTimes, currentTime);
  }

  return result;
}

/** @deprecated Use {@link concatenateTracks}. JMON calls them tracks, not sequences. */
export function concatenateSequences(sequences) {
  return concatenateTracks(sequences);
}

/**
 * Chain/concatenate tracks with proper timing adjustment
 * Variadic wrapper around concatenateTracks for clarity
 * @param {...Array} tracks - Tracks (note arrays) to chain
 * @returns {Array} Chained notes with sequential timing
 */
export function chain(...tracks) {
  return concatenateTracks(tracks);
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
 * Combine multiple tracks to play simultaneously
 * @param {Array} tracks - Array of tracks (note arrays)
 * @returns {Array} Combined notes
 */
export function combineTracks(tracks) {
  return tracks.flat();
}

/** @deprecated Use {@link combineTracks}. JMON calls them tracks, not sequences. */
export function combineSequences(sequences) {
  return combineTracks(sequences);
}

/**
 * Build a long held tone by re-attacking the same pitch every `step` beats.
 *
 * GM samplers (acoustic instruments, strings, organs, etc.) don't loop —
 * the sample plays once and decays naturally, even if you ask for a 30-beat
 * note. The result is unintended silence in the middle of supposedly held
 * notes. This helper splits a long sustain into shorter re-attacks so the
 * sample stays audible while preserving the perceived "tied" feel.
 *
 * @example
 * // Drone D2 held for 24 beats, re-attacked every 4 beats
 * const drone = sustained(38, 24, 0, 0.4);
 *
 * @example
 * // String pad on a chord, each note re-attacked every 6 beats
 * const pad = chordPitches.flatMap((p) =>
 *   sustained(p, totalDur, startTime, 0.25, 6)
 * );
 *
 * @example
 * // A bowing rather than a metronome: two quarters and a half, cycled, with
 * // the downbeat carrying the weight. `step` and `vel` advance together.
 * const bowed = sustained(69, 8, 0, [0.5, 0.36, 0.43], [1, 1, 2]);
 *
 * @param {number} pitch - MIDI pitch
 * @param {number} totalDur - Total duration to fill (beats)
 * @param {number} [startTime=0] - When the held tone begins (beats)
 * @param {number|number[]} [vel=0.4] - Velocity per attack. An array cycles
 *   alongside `step`, so an uneven pattern can be shaped as a bowing or a
 *   strum rather than a row of identical attacks.
 * @param {number|number[]} [step=4] - Re-attack interval (beats). Smaller =
 *   more attacks. An array is a pattern of durations, cycled until `totalDur`
 *   is filled: `[1, 1, 2]` fills a 4/4 bar with two quarters and a half.
 * @returns {Array} Array of JMON notes covering `[startTime, startTime+totalDur)`
 */
export function sustained(pitch, totalDur, startTime = 0, vel = 0.4, step = 4) {
  const pattern = Array.isArray(step) ? step : [step];
  const velocities = Array.isArray(vel) ? vel : [vel];

  if (pattern.length === 0 || pattern.some((d) => !(d > 0))) {
    throw new Error("sustained: every step must be a duration greater than 0");
  }

  const notes = [];
  let t = 0;
  for (let i = 0; t < totalDur - 1e-9; i++) {
    const dur = Math.min(pattern[i % pattern.length], totalDur - t);
    notes.push({
      pitch,
      duration: dur,
      time: startTime + t,
      velocity: velocities[i % velocities.length],
    });
    t += pattern[i % pattern.length];
  }
  return notes;
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
 * Sprinkle expressive bend and vibrato articulations onto "long unique" notes
 * in a track. A note qualifies when:
 *   - its `pitch` is a single MIDI number (chords are skipped);
 *   - its `duration` is at least `minDuration` beats;
 *   - no other note within ±`uniqueWindow` beats shares the same pitch.
 *
 * For each qualifying note, two independent rolls are performed: one for
 * bend (probability `bendProb`) and one for vibrato (probability
 * `vibratoProb`). Both may apply to the same note. Parameters (bend amount,
 * vibrato rate/depth) are drawn from the given ranges using a seeded RNG so
 * the output is reproducible.
 *
 * Mutates the notes in place (pushes onto each note's `articulations` array,
 * creating it if absent) and returns the same array for chaining.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.seed=0] - RNG seed
 * @param {number} [options.bendProb=0.15]
 * @param {number} [options.vibratoProb=0.25]
 * @param {number} [options.minDuration=1] - Minimum duration in beats
 * @param {number} [options.uniqueWindow=2] - Uniqueness window in beats
 * @param {number} [options.bendCentsMin=50]
 * @param {number} [options.bendCentsMax=200]
 * @param {number} [options.bendReturnProb=0.4] - Probability that a bend
 *   returns to the original pitch before release
 * @param {number} [options.vibratoRateMin=4] - Hz
 * @param {number} [options.vibratoRateMax=8]
 * @param {number} [options.vibratoDepthMin=20] - cents
 * @param {number} [options.vibratoDepthMax=50]
 * @returns {Array} The same notes array (mutated).
 */
export function expressivize(notes, options = {}) {
  const {
    seed = 0,
    bendProb = 0.15,
    vibratoProb = 0.25,
    minDuration = 1,
    uniqueWindow = 2,
    bendCentsMin = 50,
    bendCentsMax = 200,
    bendReturnProb = 0.4,
    vibratoRateMin = 4,
    vibratoRateMax = 8,
    vibratoDepthMin = 20,
    vibratoDepthMax = 50,
  } = options;

  // Mulberry32 — same deterministic PRNG used by Progression.smooth
  let s = seed >>> 0;
  const rng = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (Array.isArray(n.pitch)) continue;
    if (typeof n.pitch !== "number") continue;
    if ((n.duration || 0) < minDuration) continue;

    // Uniqueness in pitch within ±uniqueWindow beats
    let unique = true;
    for (let j = 0; j < notes.length; j++) {
      if (j === i) continue;
      const m = notes[j];
      if (Array.isArray(m.pitch) || typeof m.pitch !== "number") continue;
      if (m.pitch !== n.pitch) continue;
      if (Math.abs((m.time || 0) - (n.time || 0)) <= uniqueWindow) {
        unique = false;
        break;
      }
    }
    if (!unique) continue;

    if (rng() < bendProb) {
      const sign = rng() < 0.5 ? -1 : 1;
      const amount = sign * Math.round(
        bendCentsMin + rng() * (bendCentsMax - bendCentsMin),
      );
      const returnToOriginal = rng() < bendReturnProb;
      if (!n.articulations) n.articulations = [];
      n.articulations.push({ type: "bend", amount, returnToOriginal });
    }

    if (rng() < vibratoProb) {
      const rate = Math.round(
        (vibratoRateMin + rng() * (vibratoRateMax - vibratoRateMin)) * 10,
      ) / 10;
      const depth = Math.round(
        vibratoDepthMin + rng() * (vibratoDepthMax - vibratoDepthMin),
      );
      if (!n.articulations) n.articulations = [];
      n.articulations.push({ type: "vibrato", rate, depth });
    }
  }

  return notes;
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
 * Concatenate piece sections into a flat per-label note map.
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
