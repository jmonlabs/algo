/**
 * jmon/notes — what a composer does to a list of notes.
 *
 * A list of notes is what a track's `notes` field holds: objects with
 * `pitch`, `duration`, `time` (in beats) and `velocity`. Every function here
 * takes such a list first and returns a new one; the list given is never
 * changed. After the subject comes either one number whose meaning the name
 * gives away (`transpose(notes, 12)`) or one options object where everything
 * is named (`canon(notes, { delay, steps, scale })`).
 *
 * A verb does something to the notes: shift, transpose, reverse, tile,
 * quantize. A noun builds or measures: track, piece, chordNotes, span, range,
 * onsets.
 *
 * @license GPL-3.0-or-later
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
 * A track: the object a piece plays, `{ label, notes, … }`, from a list of
 * notes.
 *
 * @param {Array} notes - Array of notes in various formats
 * @param {Object} [options] - The track's other fields: `label`, `synth`, `effects`…
 * @param {string} [options.label='Untitled Track']
 * @returns {Object} JMON track object
 */
export function track(notes, { label = 'Untitled Track', ...options } = {}) {
  const normalizedNotes = normalizeNotes(notes);

  return {
    label,
    notes: normalizedNotes,
    ...options
  };
}

/**
 * Create a complete JMON piece.
 *
 * @param {Array} tracks - Array of tracks, or of bare note arrays
 * @param {Object} metadata - Top-level properties (tempo, keySignature…)
 * @returns {Object} Complete JMON piece
 */
export function piece(tracks, metadata = {}) {
  const normalizedTracks = tracks.map((item, index) => {
    if (Array.isArray(item)) {
      return track(item, { label: `Track ${index + 1}` });
    }
    if (item.notes) {
      // `name` is accepted on the way in so older callers keep working, but
      // only `label` goes out.
      const { name, ...rest } = item;
      return {
        ...rest,
        label: item.label || name || `Track ${index + 1}`,
        notes: normalizeNotes(item.notes)
      };
    }
    return item;
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

/**
 * Normalize notes from various formats to JMON format
 * @param {Array} notes - Notes in various formats
 * @returns {Array} JMON-compliant note objects
 */
function normalizeNotes(notes) {
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
    
    throw new Error(`notes: the note at index ${index} is not a note: ${JSON.stringify(note)}`);
  });
}

/**
 * Lay a progression on a timeline as JMON chord notes.
 *
 * A `Progression` returns chords as arrays of pitches. This gives each one a
 * time and a duration, so the result is notes you can put in a track and play,
 * export, or hand to the analyses and to Darwin as `chords`. It is
 * `createScale` with names that say what it is for.
 *
 * @example
 * const prog = jm.key("D", "minor").progression().numerals(["i", "VI", "III", "VII"]);
 * const chords = jm.utils.chordNotes(prog, { duration: 4 });
 * // [{ pitch: [50, 53, 57], duration: 4, time: 0 }, { pitch: [...], duration: 4, time: 4 }, ...]
 *
 * @param {Array<Array<number>|number>} progression - Chords as pitch arrays (a bare number is a one-note chord)
 * @param {Object} [options]
 * @param {number} [options.duration=4] - Beats per chord
 * @param {number} [options.start=0] - Time of the first chord, in beats
 * @param {number} [options.velocity=0.8]
 * @returns {Array<Object>} JMON notes with array pitches and numeric times
 */
export function chordNotes(progression, { duration = 4, start = 0, velocity = 0.8 } = {}) {
  if (!Array.isArray(progression)) return [];
  return progression.map((chord, i) => ({
    pitch: Array.isArray(chord) ? chord.slice() : chord,
    duration,
    time: start + i * duration,
    velocity,
  }));
}

/**
 * The same notes, `timeShift` beats later (or earlier, if negative).
 * @param {Array} notes - JMON notes
 * @param {number} timeShift - Time shift in beats
 * @returns {Array} Time-shifted notes
 */
export function shift(notes, timeShift) {
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

/**
 * Place a phrase on the timeline: the same notes from `time` on, and, since
 * the two almost always come with the move, at an octave and a velocity.
 *
 * Times are absolute in JMON, so material written from its own beat 0 has to
 * be moved before it can be assembled into a piece. `place(theme, { time: 16,
 * velocity: 0.85 })` says that in one call.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} options
 * @param {number} [options.time=0] - Time of the phrase's first beat, in beats
 * @param {number} [options.octave=0] - Shift by octaves, positive or negative
 * @param {number} [options.velocity] - The velocity of every note; omit to
 *   leave each note's own alone
 * @returns {Array} The notes, moved
 */
export function place(notes, { time = 0, octave = 0, velocity } = {}) {
  const semis = octave * 12;
  return notes.map(note => {
    const current = typeof note.time === 'number' ? note.time : timeToBeats(note.time);
    const moved = {
      ...note,
      time: typeof note.time === 'number' ? current + time : beatsToTime(current + time),
    };
    if (semis) moved.pitch = mapPitch(moved.pitch, (p) => p + semis);
    if (velocity !== undefined) moved.velocity = velocity;
    return moved;
  });
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
  const semis = 12 * octave + semitones;
  const move = (p) => (typeof p === "number" ? (classes ? diatonic(p, { steps, scale: classes }) : p) + semis : p);
  return shift(notes, delay).map((n) => ({
    ...n,
    pitch: Array.isArray(n.pitch) ? n.pitch.map(move) : move(n.pitch),
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
 * A slice of a phrase: the notes sounding between `from` and `to`, moved so
 * that `from` is the new time 0, and clipped at both ends.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} options
 * @param {number} [options.from=0] - Where the slice starts, in beats
 * @param {number} [options.to] - Where it ends; the end of the phrase by default
 * @returns {Array} New notes, starting at 0
 *
 * @example
 * cut(phrase, { from: 8, to: 16 });   // bars 3 and 4, as a phrase of their own
 */
export function cut(notes, { from = 0, to } = {}) {
  const end = to ?? span(notes);
  if (!(end > from)) throw new Error(`cut: \`to\` (${end}) must come after \`from\` (${from})`);
  return notes
    .filter((n) => n.time < end && n.time + n.duration > from)
    .map((n) => {
      const start = Math.max(n.time, from);
      return { ...n, time: start - from, duration: Math.min(n.time + n.duration, end) - start };
    });
}

/**
 * A phrase stretched or squeezed to last exactly `beats`: times and
 * durations scaled by the same factor, so the rhythm keeps its proportions.
 *
 * @param {Array} notes - JMON notes
 * @param {number} beats - The length wanted, from time 0 to the end of the last note
 * @returns {Array} New notes
 *
 * @example
 * fit(phrase, 16);   // a 12-beat phrase, now over four bars
 */
export function fit(notes, beats) {
  if (!(beats > 0)) throw new Error(`fit: beats must be a positive number, got ${beats}`);
  const length = span(notes);
  if (length === 0) return notes.map((n) => ({ ...n }));
  return augment(notes, beats / length);
}

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
    for (const note of shift(notes, cycleIndex * length)) out.push(note);
  }
  return out;
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
 * The notes backwards (the retrograde).
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
export function reverse(notes) {
    if (!notes || notes.length === 0) return [];

    const length = span(notes);

    return notes
        .map(note => ({
            ...note,
            time: length - ((note.time || 0) + (note.duration || 0))
        }))
        .sort((a, b) => a.time - b.time);
}

/** Apply `fn` to a note's pitch, passing chords through element-wise and rests through untouched. */
function mapPitch(pitch, fn) {
  if (pitch === null || pitch === undefined) return pitch;
  return Array.isArray(pitch) ? pitch.map(fn) : fn(pitch);
}

/** Every sounding pitch of the notes, chords flattened, rests skipped. */
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
 * Concatenate several lists of notes end to end: each list starts when the
 * previous one ends.
 * @param {Array<Array>} lists - Lists of JMON notes
 * @returns {Array} One list of notes, times adjusted
 */
export function concatenate(lists) {
  if (lists.length === 0) return [];

  const result = [];
  let currentTime = 0;

  for (const notes of lists) {
    // Shift this list to the current time
    const shiftedTrack = shift(notes, currentTime);
    result.push(...shiftedTrack);

    // Where this list ends
    const endTimes = shiftedTrack.map(note => {
      const noteTime = typeof note.time === 'number' ? note.time : timeToBeats(note.time);
      return noteTime + note.duration;
    });
    currentTime = Math.max(...endTimes, currentTime);
  }

  return result;
}

/**
 * Combine several lists of notes into one, to sound together: the times are
 * kept as they are.
 * @param {Array<Array>} lists - Lists of JMON notes
 * @returns {Array} One list of notes
 */
export function combine(lists) {
  return lists.flat();
}

/**
 * Snap a numeric value to a grid.
 * @param {number} value - Value in quarter notes
 * @param {Object} [options]
 * @param {number} [options.grid=0.25] - Grid size in quarter notes
 * @param {'nearest'|'floor'|'ceil'} [options.mode='nearest'] - Rounding mode
 * @returns {number} Snapped value; non-finite input is returned unchanged
 */
function quantizeValue(value, { grid = 0.25, mode = 'nearest' } = {}) {
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
export function quantize(notes, options = {}) {
    const { grid = 0.25, fields = ['time', 'duration'], mode = 'nearest' } = options;
    if (!Array.isArray(notes)) return notes;

    return notes.map(event => {
        const copy = { ...event };
        for (const field of fields) {
            if (typeof copy[field] !== 'number') continue;
            const snapped = quantizeValue(copy[field], { grid, mode });
            // A note quantized out of existence is worse than one slightly
            // off the grid, so keep at least one grid unit of duration.
            copy[field] = (field === 'duration' && snapped <= 0) ? grid : snapped;
        }
        return copy;
    });
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
export function deduplicate(notes, tolerance = 0.01) {
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

/**
 * Split notes longer than `maxDuration` into a run of tied-length notes.
 * Useful before exporting to formats that cap note length, or to turn long
 * pads into repeated attacks.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {number} maxDuration - Longest allowed duration in quarter notes
 * @returns {Array<Object>} New notes
 */
export function split(notes, maxDuration) {
    if (!Number.isFinite(maxDuration) || maxDuration <= 0) {
        throw new Error(`split: maxDuration must be positive, got ${maxDuration}`);
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
 * Rescale velocities into `[min, max]`, preserving their relative shape.
 * A sequence whose velocities are all equal collapses to the midpoint.
 *
 * @param {Array<Object>} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.min=0.1] - Target floor
 * @param {number} [options.max=1.0] - Target ceiling
 * @returns {Array<Object>} New notes
 */
export function normalize(notes, { min = 0.1, max = 1.0 } = {}) {
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
 * Extract the onset times of a sequence — its rhythm, stripped of pitch.
 * @param {Array<Object>} notes - JMON notes
 * @returns {Array<number>} Sorted onset times in quarter notes
 */
export function onsets(notes) {
    return notes.map(note => note.time || 0).sort((a, b) => a - b);
}

/**
 * Lowest and highest sounding pitch in a sequence.
 * @param {Array<Object>} notes - JMON notes
 * @returns {{min: number, max: number}|null} `null` when nothing sounds
 */
export function range(notes) {
    const pitches = allPitches(notes);
    if (pitches.length === 0) return null;
    return { min: Math.min(...pitches), max: Math.max(...pitches) };
}

/**
 * Total span of a sequence: the latest note end, in quarter notes.
 * @param {Array<Object>} notes - JMON notes
 * @returns {number}
 */
export function span(notes) {
    if (!notes || notes.length === 0) return 0;
    return Math.max(...notes.map(note => (note.time || 0) + (note.duration || 0)));
}
