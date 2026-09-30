/**
 * JMON Utilities - Official helpers for working with JMON format
 * These utilities provide a consistent API for creating and manipulating JMON objects
 */

/**
 * Convert beats (quarter notes) to bars:beats:ticks format
 * @param {number} beats - Time in beats (quarter notes)
 * @param {Object} [options]
 * @param {number} [options.beatsPerBar=4] - Beats per bar (4 for 4/4 time)
 * @param {number} [options.ticksPerBeat=480] - Ticks per quarter note (480 is MIDI's usual)
 * @returns {string} Time in "bars:beats:ticks" format
 */
export function beatsToTime(beats, { beatsPerBar = 4, ticksPerBeat = 480 } = {}) {
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
 * @param {Object} [options]
 * @param {number} [options.beatsPerBar=4] - Beats per bar (4 for 4/4 time)
 * @param {number} [options.ticksPerBeat=480] - Ticks per quarter note (480 is MIDI's usual)
 * @returns {number} Time in beats (quarter notes)
 */
export function timeToBeats(timeString, { beatsPerBar = 4, ticksPerBeat = 480 } = {}) {
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
 * @param {Object} [options] - The track's other fields: `label`, `synth`, `effects`…
 * @param {string} [options.label='Untitled Track']
 * @returns {Object} JMON track object
 */
export function createTrack(notes, { label = 'Untitled Track', ...options } = {}) {
  const normalizedNotes = normalizeNotes(notes);

  return {
    label,
    notes: normalizedNotes,
    ...options
  };
}

/** @deprecated Use {@link createTrack}. JMON calls them tracks, not parts. */

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
      return createTrack(track, { label: `Track ${index + 1}` });
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
 * @param {Object} [options]
 * @param {number} [options.duration=1] - Duration of each note, in beats
 * @param {number} [options.time=0] - Time of the first note, in beats
 * @returns {Array} JMON note objects
 */
export function createScale(pitches, { duration = 1, time = 0 } = {}) {
  let currentTime = time;
  
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
 * Lay a progression on a timeline as JMON chord notes.
 *
 * A `Progression` returns chords as arrays of pitches. This gives each one a
 * time and a duration, so the result is a track you can play, export, or hand
 * to the analyses and to Darwin as `chords`. It is `createScale` with names
 * that say what it is for.
 *
 * @example
 * const prog = jm.key("D", "minor").progression().generate(["i", "VI", "III", "VII"]);
 * const chords = jm.utils.chordTrack(prog, { duration: 4 });
 * // [{ pitch: [50, 53, 57], duration: 4, time: 0 }, { pitch: [...], duration: 4, time: 4 }, ...]
 *
 * @param {Array<Array<number>|number>} progression - Chords as pitch arrays (a bare number is a one-note chord)
 * @param {Object} [options]
 * @param {number} [options.duration=4] - Beats per chord
 * @param {number} [options.start=0] - Time of the first chord, in beats
 * @param {number} [options.velocity=0.8]
 * @returns {Array<Object>} JMON notes with array pitches and numeric times
 */
export function chordTrack(progression, { duration = 4, start = 0, velocity = 0.8 } = {}) {
  if (!Array.isArray(progression)) return [];
  return progression.map((chord, i) => ({
    pitch: Array.isArray(chord) ? chord.slice() : chord,
    duration,
    time: start + i * duration,
    velocity,
  }));
}

/**
 * Greatest common divisor of two whole numbers.
 *
 * Exported because it is half of a question that comes up whenever two
 * repeating patterns are stacked: the pair realigns after their least common
 * multiple, and `lcm` is built on this.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 *
 * @example
 * gcd(7, 8); // 1
 */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Least common multiple of two whole numbers: when two cycles line up again.
 *
 * Two patterns of 7 and 8 steps repeat together every 56. This is the number
 * a polymeter is measured in, and `isorhythm` returns exactly this many notes
 * before its two series realign.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 *
 * @example
 * lcm(7, 8); // 56
 */
export function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Place a phrase on the timeline.
 *
 * Times are absolute in JMON, so material from separate cells has to be moved
 * before it can be assembled into a piece. This is that move, plus the two
 * changes that almost always accompany it: an octave and a velocity. Doing all
 * three in one call keeps a call site from reading `shiftTime(notes, 48)`.
 *
 * @param {Array} notes - JMON notes
 * @param {number} start - Time of the phrase's first note, in beats
 * @param {Object} [options]
 * @param {number} [options.octave=0] - Shift by octaves, positive or negative
 * @param {number} [options.velocity] - Set the velocity of every note; omit to
 *   leave each note's own alone
 * @returns {Array} The notes, moved
 *
 * @example
 * at(MELODY, 16, { velocity: 0.85 });
 * at(TEXTURE, 76, { octave: 1 });
 */
export function at(notes, start, { octave = 0, velocity } = {}) {
  const shift = octave * 12;
  return notes.map(note => {
    const current = typeof note.time === 'number' ? note.time : timeToBeats(note.time);
    const moved = {
      ...note,
      time: typeof note.time === 'number' ? current + start : beatsToTime(current + start),
    };
    if (shift) {
      moved.pitch = Array.isArray(moved.pitch)
        ? moved.pitch.map(p => p + shift)
        : typeof moved.pitch === 'number'
        ? moved.pitch + shift
        : moved.pitch;
    }
    if (velocity !== undefined) moved.velocity = velocity;
    return moved;
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

/**
 * Repeat a phrase end to end.
 *
 * The phrase keeps its own internal timing; each repeat starts `cycle` beats
 * after the previous one. Pass `cycle` when the phrase should sit in a longer
 * frame than its notes occupy — a 3-beat cell tiled every 4 leaves a beat of
 * air per bar; omit it and the phrase's own extent (its latest note end) is
 * used, which is what "just repeat this" usually means.
 *
 * A player that loops per track (JMON `tracks[].loop`) does this at playback
 * time; this is the same repeat as data, for rendering, engraving and export,
 * where there is no player to do the looping.
 *
 * @example
 * const cell = isorhythm({ pitches: [60, 62, 64], durations: [0.75, 0.75, 0.5] });
 * const notes = tile(cell, { times: 4 });            // four cycles, back to back
 * const spaced = tile(cell, { times: 4, cycle: 8 }); // one cycle per 8 beats
 *
 * @param {Array} notes - JMON notes
 * @param {Object} options
 * @param {number} options.times - How many cycles to emit (0 gives an empty array)
 * @param {number} [options.cycle] - Beats between cycle starts; defaults to the phrase's extent
 * @returns {Array} The tiled notes, in time order
 */
export function tile(notes, { times, cycle } = {}) {
  if (!Array.isArray(notes) || notes.length === 0 || !(times > 0)) return [];

  let length = cycle;
  if (typeof length !== 'number' || !(length > 0)) {
    length = notes.reduce(
      (end, note) => Math.max(end, timeToBeats(note.time) + (note.duration || 0)),
      0,
    );
  }
  if (!(length > 0)) return notes.map((note) => ({ ...note }));

  const out = [];
  for (let cycleIndex = 0; cycleIndex < times; cycleIndex++) {
    for (const note of shiftTime(notes, cycleIndex * length)) out.push(note);
  }
  return out;
}

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
 * const drone = sustained(38, { duration: 24, velocity: 0.4 });
 *
 * @example
 * // String pad on a chord, each note re-attacked every 6 beats
 * const pad = chordPitches.flatMap((p) =>
 *   sustained(p, { duration: totalDur, time: startTime, velocity: 0.25, step: 6 })
 * );
 *
 * @example
 * // A bowing rather than a metronome: two quarters and a half, cycled, with
 * // the downbeat carrying the weight. `step` and `velocity` advance together.
 * const bowed = sustained(69, { duration: 8, velocity: [0.5, 0.36, 0.43], step: [1, 1, 2] });
 *
 * @param {number} pitch - MIDI pitch
 * @param {Object} options - Named like a note's own fields
 * @param {number} options.duration - Total duration to fill (beats)
 * @param {number} [options.time=0] - When the held tone begins (beats)
 * @param {number|number[]} [options.velocity=0.4] - Velocity per attack. An
 *   array cycles alongside `step`, so an uneven pattern can be shaped as a
 *   bowing or a strum rather than a row of identical attacks.
 * @param {number|number[]} [options.step=4] - Re-attack interval (beats).
 *   Smaller = more attacks. An array is a pattern of durations, cycled until
 *   `duration` is filled: `[1, 1, 2]` fills a 4/4 bar with two quarters and a half.
 * @returns {Array} Array of JMON notes covering `[time, time + duration)`
 */
export function sustained(pitch, { duration, time = 0, velocity = 0.4, step = 4 } = {}) {
  const totalDur = duration;
  const startTime = time;
  if (!(totalDur > 0)) {
    throw new Error("sustained: `duration` must be a number of beats greater than 0");
  }
  const pattern = Array.isArray(step) ? step : [step];
  const velocities = Array.isArray(velocity) ? velocity : [velocity];

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
 * The pitch classes of a scale, in ascending order from C: what the diatonic
 * helpers count their steps on.
 *
 * @param {Array<number>|Object} scale - Pitch classes or MIDI pitches, or a
 *   key context (`jm.key("D", "minor")`), anything with `pitchClasses()`
 * @returns {Array<number>}
 */
function scalePitchClasses(scale) {
  const given = typeof scale?.pitchClasses === "function" ? scale.pitchClasses() : scale;
  if (!Array.isArray(given) || given.length === 0) {
    throw new Error("a scale is needed: pitch classes such as [0, 2, 4, 5, 7, 9, 11], or a key");
  }
  return [...new Set(given.map((p) => ((p % 12) + 12) % 12))].sort((a, b) => a - b);
}

/**
 * Move a pitch by steps of a scale rather than by semitones: up a third is
 * two steps, whatever the third turns out to be. In D minor, F down three
 * steps is C (a perfect fourth) and E down three steps is B flat (an
 * augmented fourth); the same number of semitones would leave the key.
 *
 * A pitch outside the scale keeps its distance above the scale note below
 * it: in D minor, C sharp moves as C does, and stays a semitone above where
 * C lands.
 *
 * @param {number} pitch - MIDI pitch
 * @param {Object} options
 * @param {number} options.steps - Scale steps, negative to go down
 * @param {Array<number>|Object} options.scale - Pitch classes of the scale,
 *   or a key context (`jm.key("D", "minor")`)
 * @returns {number} MIDI pitch
 *
 * @example
 * diatonic(77, { steps: -3, scale: [0, 2, 4, 5, 7, 9, 10] });  // F5 -> C5, 72
 * diatonic(77, { steps: -3, scale: jm.key("D", "minor") });    // the same
 */
export function diatonic(pitch, { steps, scale } = {}) {
  const classes = scalePitchClasses(scale);
  const size = classes.length;
  const pc = (p) => ((p % 12) + 12) % 12;
  let below = Math.floor(pitch);
  while (!classes.includes(pc(below))) below--;
  const index = Math.floor(below / 12) * size + classes.indexOf(pc(below)) + steps;
  const octave = Math.floor(index / size);
  return octave * 12 + classes[index - octave * size] + (pitch - below);
}

/**
 * Transpose notes by steps of a scale (see `diatonic`). Chords are moved note
 * by note; rests are copied as they are.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} options
 * @param {number} options.steps - Scale steps, negative to go down
 * @param {Array<number>|Object} options.scale - Pitch classes of the scale, or a key
 * @returns {Array} New notes
 */
export function transposeDiatonic(notes, { steps, scale } = {}) {
  const classes = scalePitchClasses(scale);
  const move = (p) => (typeof p === "number" ? diatonic(p, { steps, scale: classes }) : p);
  return notes.map((n) => ({
    ...n,
    pitch: Array.isArray(n.pitch) ? n.pitch.map(move) : move(n.pitch),
  }));
}

/**
 * The following voice of a canon: the same line, later, at another pitch.
 *
 * The interval is given in steps of a scale (`steps`, with `scale`), so the
 * follower stays in the key, and in octaves or semitones on top of that. The
 * leader is the line as it is; play both.
 *
 * @param {Array} notes - The leader, as JMON notes
 * @param {Object} [options]
 * @param {number} [options.delay=0] - Beats between the leader and the follower
 * @param {number} [options.steps=0] - Scale steps, negative for below; needs `scale`
 * @param {Array<number>|Object} [options.scale] - Pitch classes of the scale, or a key
 * @param {number} [options.octave=0] - Octaves added to the interval
 * @param {number} [options.semitones=0] - Semitones added to the interval
 * @returns {Array} The follower, as new notes
 *
 * @example
 * // A bar later, an eleventh below: three steps and an octave down.
 * canon(theme, { delay: 4, steps: -3, octave: -1, scale: jm.key("D", "minor") });
 */
export function canon(notes, options = {}) {
  const { delay = 0, steps = 0, scale, octave = 0, semitones = 0 } = options;
  const classes = steps === 0 ? null : scalePitchClasses(scale);
  const shift = 12 * octave + semitones;
  const move = (p) => (typeof p === "number" ? (classes ? diatonic(p, { steps, scale: classes }) : p) + shift : p);
  return shiftTime(notes, delay).map((n) => ({
    ...n,
    pitch: Array.isArray(n.pitch) ? n.pitch.map(move) : move(n.pitch),
  }));
}

/**
 * Play notes the way a person does: never exactly in place, never exactly at
 * the same strength. Each note moves a little in time and in velocity, from a
 * seeded generator, so the same seed gives the same performance every time.
 *
 * Every note draws twice, in order (time, then velocity), whether or not it
 * is moved: adding a rest to a line does not change how the notes after it
 * are played.
 *
 * @param {Array} notes - JMON notes, times in beats
 * @param {Object} [options]
 * @param {number} [options.seed=0] - Seed of the generator
 * @param {number} [options.timing=0.03] - Spread of the onsets, in beats: a
 *   note lands within ± half of it
 * @param {number} [options.velocity=0.1] - Spread of the velocities, as a
 *   proportion: 0.1 is ± 5 %
 * @param {number} [options.lag=0] - Leans the onsets late, as a share of
 *   `timing`: 0.05 plays a little behind the beat more often than ahead
 * @param {number} [options.minVelocity=0.03] - Floor of a sounding note's velocity
 * @returns {Array} New notes. No note starts before 0; silent notes
 *   (velocity 0) stay silent.
 *
 * @example
 * humanize(strings, { seed: 1729, timing: 0.06, velocity: 0.12 });
 */
export function humanize(notes, options = {}) {
  const { seed = 0, timing = 0.03, velocity = 0.1, lag = 0, minVelocity = 0.03 } = options;
  // mulberry32
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const early = 0.5 - lag;

  return notes.map((note) => {
    const push = (random() - early) * timing;
    const press = 1 + (random() - 0.5) * velocity;
    const played = { ...note };
    if (typeof note.time === "number") played.time = Math.max(0, note.time + push);
    if (typeof note.velocity === "number" && note.velocity > 0) {
      played.velocity = Math.max(minVelocity, Math.min(1, note.velocity * press));
    }
    return played;
  });
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
 * Shape each note like a bow stroke: its loudness enters softly, swells to a
 * peak, and eases off before the note ends.
 *
 * A sampled string held for several seconds otherwise sits at one level from
 * its attack to its release, which is the sound of a tape loop rather than a
 * bow. This writes `dynamics` on every note — anchors in beats
 * from the note's start, values as multiples of its velocity — which jmon/io
 * compiles, the player applies to sampled instruments, and a MIDI export
 * writes as CC 11. The note's `velocity` becomes the peak of the stroke.
 *
 * Returns new notes. Rests, and notes that already have an envelope, are
 * copied as they are. A note shorter than `minDuration` gets a soft attack
 * only: a swell on a short note is not heard as one.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.attack=0.25] - Beats to reach the stroke's first
 *   level, at most a third of the note
 * @param {number} [options.swell=0.35] - How much the stroke grows: it starts
 *   at `1 - swell` of the peak
 * @param {number} [options.peak=0.6] - Where the peak falls, as a fraction of
 *   the note's duration
 * @param {number} [options.fade=0.25] - How much it eases off by the end: it
 *   ends at `1 - fade` of the peak
 * @param {number} [options.minDuration=1] - Beats below which a note is only
 *   given a soft attack
 * @returns {Array} New notes with `dynamics`
 *
 * @example
 * // A long note: 0 → 0.65 in a quarter beat, 1 at 60 %, 0.75 at the end.
 * bow([{ pitch: 69, duration: 4, time: 0, velocity: 0.6 }]);
 */
export function bow(notes, options = {}) {
  const {
    attack = 0.25,
    swell = 0.35,
    peak = 0.6,
    fade = 0.25,
    minDuration = 1,
  } = options;

  return notes.map((note) => {
    const duration = note.duration || 0;
    if (note.pitch === null || note.pitch === undefined || note.dynamics || note.amplitudeEnvelope || !(duration > 0)) {
      return { ...note };
    }
    const rise = Math.min(attack, duration / 3);
    if (duration < minDuration) {
      return {
        ...note,
        dynamics: [
          { time: 0, value: 0 },
          { time: rise, value: 1 },
          { time: duration, value: 1 },
        ],
      };
    }
    return {
      ...note,
      dynamics: [
        { time: 0, value: 0 },
        { time: rise, value: 1 - swell },
        { time: Math.max(rise, duration * peak), value: 1 },
        { time: duration, value: 1 - fade },
      ],
    };
  });
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
