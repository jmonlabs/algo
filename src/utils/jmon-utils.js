/**
 * JMON Utilities - Official helpers for working with JMON format
 * These utilities provide a consistent API for creating and manipulating JMON objects
 */

/** @deprecated Use {@link createTrack}. JMON calls them tracks, not parts. */

/** @deprecated Use {@link createPiece}. JMON calls them pieces. */

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

// Alias for backwards compatibility



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

