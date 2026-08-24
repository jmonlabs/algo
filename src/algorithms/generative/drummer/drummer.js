import { DEFAULT_DRUM_MAP } from "./drum-map.js";
import { presets, getPreset } from "./presets.js";

/**
 * Mulberry32 PRNG, seeded.
 */
function makeRand(seed) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Natural kick/snare positions per meter (in quarter notes from bar start).
 * The drummer "knows" how to play any time signature naturally — no user
 * input required.
 */
function positionsForMeter(meter) {
  const eq = (a, b) => Math.abs(a - b) < 0.01;
  if (eq(meter, 4)) return { kicks: [0, 2], snares: [1, 3] };
  if (eq(meter, 7)) return { kicks: [0, 3, 5], snares: [3] }; // 3+2+2 default
  if (eq(meter, 3.5)) return { kicks: [0, 1.5, 2.5], snares: [1.5] }; // 7/8 in eighths
  if (eq(meter, 5)) return { kicks: [0, 3], snares: [1, 4] }; // 3+2 default
  if (eq(meter, 6)) return { kicks: [0, 3], snares: [1.5, 4.5] };
  if (eq(meter, 3)) return { kicks: [0], snares: [1] }; // waltz
  if (eq(meter, 9)) return { kicks: [0, 3, 6], snares: [3, 6] }; // 9/8 = 3+3+3
  if (eq(meter, 11)) return { kicks: [0, 4, 7, 9], snares: [4, 9] }; // 11/8 ≈ 4+3+2+2
  if (meter >= 4) {
    return { kicks: [0, Math.floor(meter / 2)], snares: [1, Math.floor(meter) - 1] };
  }
  if (meter >= 2) return { kicks: [0], snares: [1] };
  return { kicks: [0], snares: [] };
}

/**
 * Detect leader bars where density changes sharply enough to warrant a
 * fill in the PREVIOUS bar (= anticipation).
 */
function findAnticipationBars(leader, bars, barDuration, threshold) {
  const density = new Array(bars).fill(0);
  for (const note of leader) {
    const bar = Math.floor(note.time / barDuration);
    if (bar >= 0 && bar < bars) density[bar]++;
  }
  const fillBars = new Set();
  for (let i = 1; i < bars; i++) {
    const prev = Math.max(1, density[i - 1]);
    const cur = Math.max(1, density[i]);
    const ratio = cur / prev;
    if (ratio >= threshold || ratio <= 1 / threshold) {
      fillBars.add(i - 1);
    }
  }
  return fillBars;
}

/**
 * Base velocity per instrument when a preset does not name one. Presets only
 * declare velocities for the instruments their patterns use; a style-agnostic
 * layer (the tom fill) still needs sane levels.
 */
const DEFAULT_VELOCITIES = {
  kick: 0.9, snare: 0.85, hihat: 0.5, openhat: 0.6,
  ride: 0.6, crash: 0.8, clap: 0.8, rim: 0.6,
  tom_low: 0.8, tom_mid: 0.8, tom_high: 0.8,
};

/**
 * A step's probability doubles as its accent: a 0.95 slot is a structural
 * hit at full base velocity, a 0.15 slot — when the dice land on it — comes
 * out as a ghost note. This is what keeps sampled bars sounding played
 * rather than randomized.
 */
const accent = (p) => 0.35 + 0.65 * p;

/**
 * The style's timekeeper layer — what follow/diverge replace with a
 * leader-aware line. Most styles keep time on the hihat; jazz keeps it on
 * the ride, so pick whichever pattern carries more weight.
 */
function timekeeperOf(patterns) {
  const mass = (patt) => (patt || []).reduce((a, b) => a + b, 0);
  return mass(patterns.ride) > mass(patterns.hihat) ? "ride" : "hihat";
}

/**
 * @typedef {Object} DrumSection
 * @property {number} meter - Bar duration in quarter notes (4=4/4, 7=7/4, 3.5=7/8, 5=5/4, 3=3/4, ...)
 * @property {number} bars - Number of bars in this section
 *
 * @typedef {Object} DrummerOptions
 * @property {string} [style='rock'] - Preset style ('rock', 'hip-hop', 'jazz', 'ambient', 'funk', etc.)
 * @property {number} [intensity=0.7] - Overall energy 0-1 (scales velocities)
 * @property {number} [bars=16] - Total bars in 4/4 mode (ignored if sections)
 * @property {DrumSection[]} [sections] - Per-section meters. Drum changes meter per section, keeping its style character.
 * @property {string} [variation='live'] - 'fixed' | 'live' | 'follow' | 'diverge'
 * @property {Array} [leader] - JMON notes — required for follow/diverge, drives anticipation
 * @property {number} [humanize=0.12]
 * @property {number} [seed=42] - PRNG seed (overridden if variation='live')
 * @property {number} [fillEvery=4] - Fill bar every N bars (4/4 mode only). Only applies
 *   when `leader` produces zero anticipated fills — a single anticipated bar anywhere in
 *   the piece switches every bar to anticipation-only for the whole piece, not just from
 *   that bar on.
 * @property {boolean} [anticipate=true] - Place fills BEFORE leader transitions (4/4 mode only)
 * @property {number} [anticipateThreshold=1.5]
 * @property {Object} [drumMap] - Override MIDI map (default: General MIDI drum kit)
 */

/**
 * Drop-a-drummer-in-your-band. Pick a style, list sections, get drums.
 *
 * Every bar is drawn from the style's step grid (see presets.js): each
 * preset gives per-instrument probabilities per 16th-note step, and the
 * drummer rolls seeded dice against them — so `house` actually plays
 * four-on-the-floor with claps, `jazz` keeps time on the ride, `reggae`
 * drops beat one. A step's probability is also its accent: sure slots hit
 * hard, unlikely slots come out as ghost notes.
 *
 * **Two modes**:
 * - `bars: N` — straight 4/4 with full ornaments, fills, ghost notes, anticipations
 * - `sections: [{meter, bars}, ...]` — multi-meter (math rock, prog): meter-natural
 *   kick/snare anchors, with the style's cymbal and ornament layers laid over them
 *
 * **Variations**:
 * - `'fixed'` — the style's canonical pattern (every step at probability ≥ 0.5),
 *   identical every bar, deterministic under `seed`
 * - `'live'` — every bar is a fresh roll of the style grid, plus fills (default)
 * - `'follow'` — the timekeeper layer (hihat, or ride for jazz) locks to the
 *   leader's onsets (4/4 mode)
 * - `'diverge'` — the timekeeper layer plays in the leader's gaps (4/4 mode)
 *
 * @param {DrummerOptions} options
 * @returns {Array<{pitch:number,duration:number,time:number,velocity:number}>}
 *
 * @example
 * // Simple — drop a rock drummer in 4/4
 * const drum = drummer({ style: 'rock', bars: 16 });
 *
 * @example
 * // Multi-meter (math rock)
 * const drum = drummer({
 *   style: 'rock',
 *   sections: [
 *     { meter: 4, bars: 4 },
 *     { meter: 7, bars: 12 },
 *     { meter: 5, bars: 8 },
 *   ],
 * });
 *
 * @example
 * // Drum responds to a leader track
 * const drum = drummer({
 *   style: 'jazz',
 *   bars: 16,
 *   variation: 'follow',
 *   leader: pianoNotes,
 * });
 */
export function drummer(options = {}) {
  const {
    style = "rock",
    intensity = 0.7,
    bars = 16,
    sections = null,
    variation = "live",
    leader = null,
    humanize = 0.12,
    seed = 42,
    fillEvery = 4,
    anticipate = true,
    anticipateThreshold = 1.5,
    drumMap = DEFAULT_DRUM_MAP,
  } = options;

  if ((variation === "follow" || variation === "diverge") && !leader) {
    throw new Error(`drummer: variation "${variation}" requires \`leader\``);
  }

  const effectiveSeed = variation === "live"
    ? Math.floor(Math.random() * 1e9)
    : seed;
  const rand = makeRand(effectiveSeed);

  // Multi-meter mode
  if (Array.isArray(sections) && sections.length > 0) {
    return composeFromSections(sections, { intensity, humanize, drumMap, rand, variation, style });
  }

  // 4/4 mode (full bar-by-bar drumming with fills, ornaments, anticipations)
  return composeBars({ bars, intensity, humanize, drumMap, rand, variation, style, leader, fillEvery, anticipate, anticipateThreshold });
}

// ─── Multi-meter piece ─────────────────────────────────
function composeFromSections(sections, ctx) {
  const { intensity, humanize, drumMap, rand, variation, style } = ctx;
  const preset = getPreset(style);
  const patterns = preset.patterns || {};
  const stepsIn44 = preset.steps || 16;
  const velFor = (inst) =>
    ((preset.velocities || {})[inst] ?? DEFAULT_VELOCITIES[inst] ?? 0.7) * intensity;

  const out = [];
  let cursor = 0;

  const makeNote = (pitch, time, velocity) => {
    const tj = humanize * (rand() - 0.5) * 0.1;
    const vj = humanize * (rand() - 0.5) * 0.4;
    return {
      pitch,
      duration: 0.4,
      time: Math.max(0, time + tj),
      velocity: Math.max(0, Math.min(1, velocity + vj)),
    };
  };

  for (const section of sections) {
    const { meter, bars } = section;
    const { kicks, snares } = positionsForMeter(meter);
    // The style grid is written for one bar of 4/4; here it is tiled over
    // the section's own 16th grid, restarting at the barline. The truncation
    // (7/8 uses the first 14 of 16 steps) is what makes an odd bar still
    // sound like the style rather than like a stretched copy of it.
    const stepsPerBar = Math.max(1, Math.round(meter * (stepsIn44 / 4)));
    const stepDur = meter / stepsPerBar;

    for (let bar = 0; bar < bars; bar++) {
      const t0 = cursor + bar * meter;

      // Meter anchors — how the drummer "knows" 7/8 from 5/4. Style does not
      // move these; it decorates around them.
      for (const k of kicks) out.push(makeNote(drumMap.kick, t0 + k, velFor("kick")));
      for (const s of snares) out.push(makeNote(drumMap.snare, t0 + s, velFor("snare")));

      const onAnchor = (t) =>
        kicks.some((k) => Math.abs(k - t) < stepDur / 2) ||
        snares.some((s) => Math.abs(s - t) < stepDur / 2);

      for (const [inst, patt] of Object.entries(patterns)) {
        const pitch = drumMap[inst];
        if (pitch === undefined) continue;
        const isBackbone = inst === "kick" || inst === "snare";
        for (let s = 0; s < stepsPerBar; s++) {
          // Kick/snare from the grid are syncopation on top of the anchors:
          // damped so the meter stays in charge, and never doubling an anchor.
          const p = (patt[s % stepsIn44] ?? 0) * (isBackbone ? 0.5 : 1);
          if (p <= 0) continue;
          const t = s * stepDur;
          if (isBackbone && onAnchor(t)) continue;
          const hit = variation === "fixed" ? p >= 0.5 : rand() < p;
          if (hit) out.push(makeNote(pitch, t0 + t, velFor(inst) * accent(p)));
        }
      }
    }

    cursor += bars * meter;
  }

  out.sort((a, b) => a.time - b.time);
  return out;
}

// ─── 4/4 bars piece (live drummer with fills, ghosts, anticipations) ───
function composeBars(ctx) {
  const { bars, intensity, humanize, drumMap, rand, variation, style, leader, fillEvery, anticipate, anticipateThreshold } = ctx;
  const preset = getPreset(style);
  const patterns = preset.patterns || {};
  const stepsPerBar = preset.steps || 16;
  const stepDuration = 4 / stepsPerBar;
  const barDuration = 4;
  const velFor = (inst) =>
    ((preset.velocities || {})[inst] ?? DEFAULT_VELOCITIES[inst] ?? 0.7) * intensity;

  const makeNote = (pitch, time, velocity) => ({
    pitch,
    duration: stepDuration * 0.8,
    time: Math.max(0, time + humanize * (rand() - 0.5) * stepDuration * 0.5),
    velocity: Math.max(0, Math.min(1, velocity + humanize * (rand() - 0.5))),
  });

  // One bar drawn from the style grid. `sampled` rolls the dice per step
  // (live); otherwise only the canonical steps (probability ≥ 0.5) play,
  // which is the pattern as written — the fixed variation.
  const patternBar = (t0, sampled) => {
    const out = [];
    for (const [inst, patt] of Object.entries(patterns)) {
      const pitch = drumMap[inst];
      if (pitch === undefined) continue;
      const base = velFor(inst);
      for (let s = 0; s < stepsPerBar; s++) {
        const p = patt[s] ?? 0;
        if (p <= 0) continue;
        const hit = sampled ? rand() < p : p >= 0.5;
        if (hit) out.push(makeNote(pitch, t0 + s * stepDuration, base * accent(p)));
      }
    }
    return out;
  };

  const fillBar = (t0) => {
    const out = [];
    const toms = ["tom_low", "tom_mid", "tom_high"];
    for (let s = 0; s < 12; s++) {
      const tom = toms[Math.floor(s / 4)];
      out.push(makeNote(drumMap[tom], t0 + s * 0.25, velFor(tom)));
    }
    out.push(makeNote(drumMap.snare, t0 + 12 * 0.25, velFor("snare")));
    out.push(makeNote(drumMap.snare, t0 + 13 * 0.25, velFor("snare") * 0.9));
    out.push(makeNote(drumMap.kick, t0 + 14 * 0.25, velFor("kick")));
    out.push(makeNote(drumMap.snare, t0 + 15 * 0.25, velFor("snare")));
    return out;
  };

  let notes = [];

  if (variation === "fixed") {
    for (let bar = 0; bar < bars; bar++) notes.push(...patternBar(bar * barDuration, false));
  } else {
    const anticipatedFills = (anticipate && leader)
      ? findAnticipationBars(leader, bars, barDuration, anticipateThreshold)
      : new Set();
    for (let bar = 0; bar < bars; bar++) {
      const t0 = bar * barDuration;
      const isLast = bar === bars - 1;
      const isAnticipated = anticipatedFills.has(bar);
      const isScheduled = !isLast && fillEvery > 0 && (bar + 1) % fillEvery === 0;
      const isFill = !isLast && (isAnticipated || (anticipatedFills.size === 0 && isScheduled));
      notes.push(...(isFill ? fillBar(t0) : patternBar(t0, true)));
    }
  }

  // follow/diverge: replace the timekeeper layer with a leader-aware one.
  if (variation === "follow" || variation === "diverge") {
    const timekeeper = timekeeperOf(patterns);
    const tkVel = velFor(timekeeper);
    const totalDuration = bars * barDuration;
    const timePitches = new Set(
      [drumMap.hihat, drumMap.openhat, drumMap.ride].filter((p) => p !== undefined),
    );
    notes = notes.filter((n) => !timePitches.has(n.pitch));
    if (variation === "follow") {
      for (const n of leader) {
        if (n.time < totalDuration) notes.push(makeNote(drumMap[timekeeper], n.time, tkVel));
      }
    } else {
      const tolerance = stepDuration / 2;
      const leaderTimes = leader.map((n) => n.time);
      for (let e = 0; e < bars * 8; e++) {
        const t = e * 0.5; // 8th-note grid
        const onLeader = leaderTimes.some((lt) => Math.abs(lt - t) < tolerance);
        if (!onLeader) {
          const accented = e % 8 === 0 || e % 8 === 4;
          notes.push(makeNote(drumMap[timekeeper], t, tkVel * (accented ? 1.2 : 0.8)));
        }
      }
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes;
}

// Attach presets for discovery: drummer.presets.rock, drummer.presets['hip-hop'], etc.
drummer.presets = presets;
