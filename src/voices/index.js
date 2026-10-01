/**
 * jmon/voices — what the voices do from one chord to the next.
 *
 * Harmony says which chord; this says how the notes get there. A
 * neo-Riemannian move changes one note of a triad and keeps the other two,
 * a smooth walk takes the chord where the voices move least, `lead` writes
 * the voices of a whole progression, and `counterpoint` reads voices already
 * written. None of it knows a key: everything starts from a chord, three
 * MIDI pitches, and stays in the register it was given.
 *
 * @license GPL-3.0-or-later
 */

export { counterpoint, parallelPerfects, voiceChorale as lead } from "./counterpoint.js";

const QUALITY_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
};

/** A small seeded generator: the same seed gives the same walk. */
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pc = (p) => ((p % 12) + 12) % 12;

/**
 * The root and quality of a triad given as pitches, whatever its voicing.
 * @param {Array<number>} chord - Three MIDI pitches
 * @returns {{root:number, quality:string}}
 */
function chordState(chord) {
  if (!Array.isArray(chord) || chord.length !== 3 || chord.some((p) => typeof p !== "number")) {
    throw new Error("voices: a chord is three MIDI pitches, e.g. [62, 65, 69]");
  }
  const classes = new Set(chord.map(pc));
  for (const [quality, intervals] of Object.entries(QUALITY_INTERVALS)) {
    for (const root of classes) {
      if (intervals.every((i) => classes.has(pc(root + i)))) return { root, quality };
    }
  }
  throw new Error(`voices: [${chord.join(", ")}] is not a major, minor, diminished or augmented triad`);
}

/** The pitch classes of a scale, from a list of pitches or a key context. */
function pitchClassesOf(scale) {
  const given = typeof scale?.pitchClasses === "function" ? scale.pitchClasses() : scale;
  if (!Array.isArray(given) || given.length === 0) {
    throw new Error("voices: `inKey` takes pitch classes such as [0, 2, 4, 5, 7, 9, 11], or a key");
  }
  return given.map(pc);
}

// ─── Neo-Riemannian moves ────────────────────────────────────────────────
// Each move takes a {root, quality} state to another. P, L and R are the
// primitives; N, S and H are the usual compounds (N = RLP, S = LPR, H = LPL).

function applyMove(state, op) {
  const { root, quality } = state;
  const M = quality === "major";
  switch (op) {
    case "P": return { root, quality: M ? "minor" : "major" };
    case "R": return M ? { root: pc(root + 9), quality: "minor" } : { root: pc(root + 3), quality: "major" };
    case "L": return M ? { root: pc(root + 4), quality: "minor" } : { root: pc(root + 8), quality: "major" };
    case "N": return M ? { root: pc(root + 5), quality: "minor" } : { root: pc(root + 7), quality: "major" };
    case "S": return M ? { root: pc(root + 1), quality: "minor" } : { root: pc(root + 11), quality: "major" };
    case "H": return M ? { root: pc(root + 8), quality: "minor" } : { root: pc(root + 4), quality: "major" };
    default: throw new Error(`voices: unknown move "${op}" (P, L, R, N, S, H, or a string of them)`);
  }
}

/** 'PLR' → ['P', 'L', 'R']; an array is taken as it is. */
function primitivesOf(opSpec) {
  return Array.isArray(opSpec) ? opSpec : String(opSpec).split("");
}

function compose(state, primitives) {
  let s = state;
  for (const op of primitives) s = applyMove(s, op);
  return s;
}

/**
 * The voicing of `newPcs` (three pitch classes) that moves least from
 * `prevTriad` (three MIDI pitches), voice by voice, and how far it moves.
 */
function bestRealization(prevTriad, newPcs) {
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  let best = null;
  for (const perm of perms) {
    const realization = [];
    let dist = 0;
    for (let i = 0; i < 3; i++) {
      const oldNote = prevTriad[i];
      let diff = newPcs[perm[i]] - pc(oldNote);
      if (diff > 6) diff -= 12;
      else if (diff < -6) diff += 12;
      realization.push(oldNote + diff);
      dist += Math.abs(diff);
    }
    if (best === null || dist < best.distance) best = { realization, distance: dist };
  }
  return best;
}

/** A {root, quality} as MIDI pitches, voice-led from `prevTriad`. */
function realize(prevTriad, state, shape, rng) {
  const intervals = QUALITY_INTERVALS[state.quality];
  if (!intervals) throw new Error(`voices: unknown quality ${state.quality}`);
  const pcs = intervals.map((i) => pc(state.root + i));
  if (shape === "random") {
    if (!rng) throw new Error("voices: shape 'random' needs a seed");
    return realize(prevTriad, state, rng() < 0.5 ? "closest" : "root", rng);
  }
  if (shape === "closest") return bestRealization(prevTriad, pcs).realization;
  if (shape === "root") {
    // Root position, the root at the octave closest to the previous bass.
    const prevBass = Math.min(...prevTriad);
    let diff = state.root - pc(prevBass);
    if (diff > 6) diff -= 12;
    else if (diff < -6) diff += 12;
    const rootMidi = prevBass + diff;
    return intervals.map((i) => rootMidi + i);
  }
  throw new Error(`voices: unknown shape ${shape}`);
}

/** The triad moved by whole octaves to keep its centre within `bounds`. */
function constrainOctave(triad, bounds) {
  if (!bounds) return triad;
  const { center, range } = bounds;
  const mean = triad.reduce((s, n) => s + n, 0) / triad.length;
  if (Math.abs(mean - center) <= range / 2) return triad;
  const shift = Math.round((center - mean) / 12) * 12;
  return shift === 0 ? triad : triad.map((n) => n + shift);
}

/**
 * Neo-Riemannian moves from a chord: each move changes one note of the
 * triad by a semitone or a tone and keeps the other two, so the voices
 * barely move. From C major: P gives C minor (the third drops), L gives E
 * minor (the root drops to B), R gives A minor (the fifth rises to A). N, S
 * and H are the usual compounds; a string such as "PLR" chains moves and
 * counts as one.
 *
 * @param {Array<number>} chord - The starting triad, three MIDI pitches in voice order
 * @param {Array<string>} ops - The moves, in order: "P", "L", "R", "N", "S", "H", or strings of them
 * @param {Object} [options]
 * @param {'closest'|'root'} [options.shape='closest'] - How each chord is voiced: the voices that move least, or root position with a smooth bass
 * @param {{center:number, range:number}} [options.octaveBounds] - Keep the chords' centre within `range` of `center`
 * @returns {Array<Array<number>>} The chords, the starting one first: `ops.length + 1` triads
 *
 * @example
 * neoRiemannian([62, 65, 69], ["P", "L", "R"]);  // D minor, D major, F# minor, A major
 */
export function neoRiemannian(chord, ops, { shape = "closest", octaveBounds = null } = {}) {
  if (shape === "random") throw new Error("voices: shape 'random' is for neoRiemannianWalk, which has a seed");
  let state = chordState(chord);
  let prev = chord;
  const progression = [prev];
  for (const opSpec of ops) {
    state = compose(state, primitivesOf(opSpec));
    const realization = constrainOctave(realize(prev, state, shape, null), octaveBounds);
    progression.push(realization);
    prev = realization;
  }
  return progression;
}

// How many redraws a walk takes per chord when `inKey` rejects a move
// before letting the chord repeat.
const INKEY_TRIES = 24;

/**
 * A walk by neo-Riemannian moves drawn at random from a vocabulary. With
 * P, L and R alone the walk stays near where it started; N, S, H and the
 * compounds take it further. `inKey` keeps it inside a set of pitch classes:
 * a move that leaves the set is redrawn, and the chord repeats when none fits.
 *
 * @param {Array<number>} chord - The starting triad, three MIDI pitches
 * @param {Object} options
 * @param {number} options.length - How many chords, the starting one included
 * @param {number} [options.seed=0] - The same seed gives the same walk
 * @param {Array<string>} [options.vocabulary=['P','L','R']] - The moves that may be drawn
 * @param {Object<string,number>} [options.opWeights] - How likely each move is; absent ones weigh 1
 * @param {Array<number>|Object} [options.inKey] - Pitch classes, or a key context, the walk must stay in
 * @param {'closest'|'root'|'random'} [options.shape='closest']
 * @param {{center:number, range:number}} [options.octaveBounds]
 * @returns {Array<Array<number>>} `length` triads
 *
 * @example
 * neoRiemannianWalk([62, 65, 69], { length: 8, seed: 1, vocabulary: ["P", "L", "R", "N", "S", "H"] });
 * neoRiemannianWalk([62, 65, 69], { length: 8, seed: 3, inKey: jm.key("D", "minor") });
 */
export function neoRiemannianWalk(chord, options = {}) {
  const { length, seed = 0, vocabulary = ["P", "L", "R"], opWeights = null, inKey = null, shape = "closest", octaveBounds = null } = options;
  if (!(length > 0)) throw new Error("voices: `length` is how many chords, at least 1");
  const rng = mulberry32(seed);
  const weights = vocabulary.map((v) => (opWeights && opWeights[v] !== undefined ? opWeights[v] : 1));
  const totalW = weights.reduce((s, x) => s + x, 0);
  const drawOp = () => {
    let r = rng() * totalW;
    for (let i = 0; i < weights.length - 1; i++) {
      r -= weights[i];
      if (r <= 0) return vocabulary[i];
    }
    return vocabulary[vocabulary.length - 1];
  };
  const allowed = inKey ? pitchClassesOf(inKey) : null;
  const fits = (candidate) => !allowed
    || QUALITY_INTERVALS[candidate.quality].map((i) => pc(candidate.root + i)).every((p) => allowed.includes(p));

  let state = chordState(chord);
  let prev = chord;
  if (allowed && !fits(state)) {
    throw new Error(`voices: inKey excludes the starting chord (${chord.join(", ")}); pass a set it belongs to, or drop inKey`);
  }
  const progression = [prev];
  for (let n = 1; n < length; n++) {
    let candidate = null;
    for (let tries = 0; tries < INKEY_TRIES; tries++) {
      candidate = compose(state, primitivesOf(drawOp()));
      if (fits(candidate)) break;
    }
    if (!fits(candidate)) {
      progression.push(prev);
      continue;
    }
    state = candidate;
    const realization = constrainOctave(realize(prev, state, shape, rng), octaveBounds);
    progression.push(realization);
    prev = realization;
  }
  return progression;
}

/**
 * A walk from chord to chord where the voices move least: at each step,
 * every triad of the allowed qualities on every root is voiced as close as
 * possible to the last chord, those within `maxVoiceLeading` semitones of
 * total movement are kept, and one is drawn, the closer the likelier. This
 * is the chromatic-mediant writing of film scores; it knows no key.
 *
 * @param {Array<number>} chord - The starting triad, three MIDI pitches
 * @param {Object} options
 * @param {number} options.length - How many chords, the starting one included
 * @param {number} [options.seed=0] - The same seed gives the same walk
 * @param {number} [options.maxVoiceLeading=4] - Most semitones the three voices may move in all
 * @param {Array<string>} [options.qualities=['major','minor']] - The triad qualities allowed
 * @param {number} [options.bassRange] - Keep the lowest voice within this many semitones of where it started
 * @param {{center:number, range:number}} [options.octaveBounds] - Keep the chords' centre within `range` of `center`
 * @returns {Array<Array<number>>} Triads, voice by voice: voice i of one chord goes to voice i of the next
 *
 * @example
 * smoothWalk([69, 72, 76], { length: 6, seed: 7, bassRange: 4 });  // from A minor
 */
export function smoothWalk(chord, options = {}) {
  const { length, seed = 0, maxVoiceLeading = 4, qualities = ["major", "minor"], bassRange = null, octaveBounds = null } = options;
  if (!(length > 0)) throw new Error("voices: `length` is how many chords, at least 1");
  chordState(chord);
  const start = octaveBounds ? constrainOctave(chord, octaveBounds) : chord;
  const startBass = Math.min(...start);
  const rng = mulberry32(seed);
  const progression = [start];
  let prev = start;

  for (let n = 1; n < length; n++) {
    const candidates = [];
    for (let root = 0; root < 12; root++) {
      for (const quality of qualities) {
        const intervals = QUALITY_INTERVALS[quality];
        if (!intervals) continue;
        const pcs = intervals.map((i) => (root + i) % 12);
        const { realization, distance } = bestRealization(prev, pcs);
        if (distance > maxVoiceLeading || distance === 0) continue;
        const placed = octaveBounds ? constrainOctave(realization, octaveBounds) : realization;
        if (bassRange !== null && Math.abs(Math.min(...placed) - startBass) > bassRange) continue;
        candidates.push({ realization: placed, distance });
      }
    }
    if (candidates.length === 0) {
      throw new Error(`smoothWalk: no chord within reach at step ${n} (seed ${seed}, maxVoiceLeading ${maxVoiceLeading}, bassRange ${bassRange}); widen maxVoiceLeading or bassRange, or change the seed`);
    }
    // The closer, the likelier.
    const weights = candidates.map((c) => 1 / (1 + c.distance));
    const total = weights.reduce((s, w) => s + w, 0);
    let r = rng() * total;
    let pick = 0;
    for (; pick < candidates.length - 1; pick++) {
      r -= weights[pick];
      if (r <= 0) break;
    }
    progression.push(candidates[pick].realization);
    prev = candidates[pick].realization;
  }
  return progression;
}
