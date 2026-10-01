/**
 * jmon/performance — how the notes are played.
 *
 * A list of notes says what to play; these functions say how, and write it
 * back into the notes: a held note as strokes, the shape of a bow stroke, the
 * small errors of a hand, the ornaments and articulations of a style, the
 * swing and the groove of a rhythm, and the corruption of a whole piece.
 * Every function takes the notes first and returns new ones; a verb for each.
 *
 * @license GPL-3.0-or-later
 */

import { Ornament } from "./Ornament.js";
import { Articulation } from "./Articulation.js";
import { Corruptor } from "./Corruptor.js";
export { strum } from "./Strum.js";
export { arpeggiate } from "./Arpeggiate.js";
export { groove, anticipate, applySteps, STEPS as steps } from "./Groove.js";

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
 * const drone = sustain(38, { duration: 24, velocity: 0.4 });
 *
 * @example
 * // String pad on a chord, each note re-attacked every 6 beats
 * const pad = chordPitches.flatMap((p) =>
 *   sustain(p, { duration: totalDur, time: startTime, velocity: 0.25, step: 6 })
 * );
 *
 * @example
 * // A bowing rather than a metronome: two quarters and a half, cycled, with
 * // the downbeat carrying the weight. `step` and `velocity` advance together.
 * const bowed = sustain(69, { duration: 8, velocity: [0.5, 0.36, 0.43], step: [1, 1, 2] });
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
export function sustain(pitch, { duration, time = 0, velocity = 0.4, step = 4 } = {}) {
  const totalDur = duration;
  const startTime = time;
  if (!(totalDur > 0)) {
    throw new Error("sustain: `duration` must be a number of beats greater than 0");
  }
  const pattern = Array.isArray(step) ? step : [step];
  const velocities = Array.isArray(velocity) ? velocity : [velocity];

  if (pattern.length === 0 || pattern.some((d) => !(d > 0))) {
    throw new Error("sustain: every step must be a duration greater than 0");
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
 * A breath between the notes: each note shortened by `gap` beats, so that it
 * ends before the next one begins. A note shorter than `gap` keeps a tenth
 * of itself. For strings, the silence that separates two bow strokes.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} [options]
 * @param {number} [options.gap=0.0625] - Beats taken off the end of each note
 * @returns {Array} New notes
 *
 * @example
 * detach(sustain(69, { duration: 12, step: 6 }), { gap: 1 / 16 });
 */
export function detach(notes, { gap = 1 / 16 } = {}) {
  if (!(gap >= 0)) throw new Error(`detach: gap must be a number of beats, got ${gap}`);
  return notes.map((n) => ({ ...n, duration: Math.max(n.duration - gap, n.duration / 10) }));
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
export function embellish(notes, options = {}) {
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
export function swing(notes, options = {}) {
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
 * Ornament a note: a trill, a mordent, a turn, a grace note… written out as
 * the notes it stands for, in the scale of `key` when the ornament needs one.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} options
 * @param {string} options.type - The ornament: 'trill', 'mordent', 'turn', 'grace_note', 'arpeggio'…
 * @param {number|null} [options.at=null] - The index of the note to ornament; omitted, one is drawn
 * @param {Object} [options.parameters] - The ornament's own parameters
 * @param {Object} [options.key] - A key context, for the neighbouring notes
 * @param {number} [options.seed] - Makes the draws reproducible
 * @returns {Array} New notes
 *
 * @example
 * ornament(melody, { type: "mordent", at: 3, key: jm.key("D", "minor") });
 */
export function ornament(notes, { type, at = null, parameters, key, tonic, mode, seed } = {}) {
  return new Ornament({ type, parameters, key, tonic, mode, seed }).apply(notes, at);
}

/**
 * Articulate a note: staccato, tenuto, accent, glissando, vibrato… as the
 * articulation the players and the exporters read.
 *
 * @param {Array} notes - JMON notes
 * @param {Object} options
 * @param {string} options.type - The articulation
 * @param {number|Array<number>|null} [options.at=null] - The index, or indices, of the notes; omitted, one is drawn
 * @param {Object} [options.parameters] - The articulation's own parameters (a glissando's target, a vibrato's rate…)
 * @returns {Array} New notes
 *
 * @example
 * articulate(melody, { type: "staccato", at: [0, 2, 4] });
 */
export function articulate(notes, { type, at = null, parameters } = {}) {
  return new Articulation({ type, parameters }).apply(notes, at);
}

/**
 * Corrupt a piece: tape wobble, dropouts, stutters, drift… the way the
 * `Corruptor` does. The options are the Corruptor's: `entropy` (0 leaves the
 * piece alone, 1 wrecks it), which gestures may play and where, and `seed`.
 *
 * @param {Object} piece - A JMON piece
 * @param {Object} [options] - The Corruptor's options
 * @returns {Object} A new piece
 */
export function corrupt(piece, options = {}) {
  return new Corruptor(options).corrupt(piece);
}
