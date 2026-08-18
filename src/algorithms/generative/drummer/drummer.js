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
 * **Two modes**:
 * - `bars: N` — straight 4/4 with full ornaments, fills, ghost notes, anticipations
 * - `sections: [{meter, bars}, ...]` — multi-meter (math rock, prog), drummer adapts
 *
 * **Variations**:
 * - `'fixed'` — strict pattern, no per-bar variation (deterministic)
 * - `'live'` — bar-by-bar variation with ghost notes, anticipations, fills (default)
 * - `'follow'` — hihat layer locks to leader's onsets (4/4 mode)
 * - `'diverge'` — hihat layer plays in leader's gaps (4/4 mode)
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
  const v = preset.velocities || {};
  const kVel = (v.kick ?? 0.9) * intensity;
  const sVel = (v.snare ?? 0.85) * intensity;
  const hVel = (v.hihat ?? 0.5) * intensity;
  const ohVel = (v.openhat ?? 0.6) * intensity;

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

    for (let bar = 0; bar < bars; bar++) {
      const t0 = cursor + bar * meter;

      for (const k of kicks) out.push(makeNote(drumMap.kick, t0 + k, kVel));
      for (const s of snares) out.push(makeNote(drumMap.snare, t0 + s, sVel));

      // Hihat 8th notes with kick-position accents
      for (let h = 0; h < meter; h += 0.5) {
        const accent = kicks.some((k) => Math.abs(k - h) < 0.05);
        out.push(makeNote(drumMap.hihat, t0 + h, accent ? hVel * 1.3 : hVel * 0.8));
      }

      // Live ornaments
      if (variation === "live") {
        if (rand() < 0.3 && meter >= 3) {
          const ghostPos = snares.length > 0
            ? snares[Math.floor(rand() * snares.length)] + 0.5
            : meter / 2;
          if (ghostPos < meter && !snares.includes(ghostPos)) {
            out.push(makeNote(drumMap.snare, t0 + ghostPos, sVel * 0.35));
          }
        }
        if (rand() < 0.2 && meter >= 4) {
          out.push(makeNote(drumMap.kick, t0 + (meter - 1.25), kVel * 0.7));
        }
        if (rand() < 0.25) {
          out.push(makeNote(drumMap.openhat, t0 + (meter - 0.5), ohVel));
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
  const v = preset.velocities || {};
  const kVel = (v.kick ?? 0.9) * intensity;
  const sVel = (v.snare ?? 0.85) * intensity;
  const hVel = (v.hihat ?? 0.5) * intensity;
  const ohVel = (v.openhat ?? 0.6) * intensity;
  const stepDuration = 0.25;
  const stepsPerBar = 16;
  const barDuration = stepsPerBar * stepDuration;

  const makeNote = (pitch, time, velocity) => ({
    pitch,
    duration: stepDuration * 0.8,
    time: Math.max(0, time + humanize * (rand() - 0.5) * stepDuration * 0.5),
    velocity: Math.max(0, Math.min(1, velocity + humanize * (rand() - 0.5))),
  });

  const fixedBar = (t0) => {
    const out = [];
    out.push(makeNote(drumMap.kick, t0, kVel));
    out.push(makeNote(drumMap.kick, t0 + 8 * stepDuration, kVel * 0.95));
    out.push(makeNote(drumMap.snare, t0 + 4 * stepDuration, sVel));
    out.push(makeNote(drumMap.snare, t0 + 12 * stepDuration, sVel));
    for (let s = 0; s < 16; s += 2) {
      out.push(makeNote(drumMap.hihat, t0 + s * stepDuration, hVel * 0.8));
    }
    return out;
  };

  const grooveBar = (t0) => {
    const out = [];
    out.push(makeNote(drumMap.kick, t0, kVel));
    out.push(makeNote(drumMap.kick, t0 + 8 * stepDuration, kVel * 0.95));
    if (rand() < 0.3) out.push(makeNote(drumMap.kick, t0 + 11 * stepDuration, kVel * 0.78));
    if (rand() < 0.15) out.push(makeNote(drumMap.kick, t0 + 2 * stepDuration, kVel * 0.73));
    out.push(makeNote(drumMap.snare, t0 + 4 * stepDuration, sVel));
    out.push(makeNote(drumMap.snare, t0 + 12 * stepDuration, sVel));
    if (rand() < 0.4) out.push(makeNote(drumMap.snare, t0 + 7 * stepDuration, sVel * 0.32));
    if (rand() < 0.4) out.push(makeNote(drumMap.snare, t0 + 11 * stepDuration, sVel * 0.32));
    if (rand() < 0.2) out.push(makeNote(drumMap.snare, t0 + 14 * stepDuration, sVel * 0.27));
    for (let s = 0; s < 16; s += 2) {
      const accented = s === 0 || s === 8;
      out.push(makeNote(drumMap.hihat, t0 + s * stepDuration, accented ? hVel * 1.3 : hVel * 0.8));
    }
    if (rand() < 0.25) {
      out.push(makeNote(drumMap.openhat, t0 + 14 * stepDuration, ohVel));
    }
    return out;
  };

  const fillBar = (t0) => {
    const out = [];
    const toms = [drumMap.tom_low, drumMap.tom_mid, drumMap.tom_high];
    for (let s = 0; s < 12; s++) {
      const tom = toms[Math.floor(s / 4)];
      out.push(makeNote(tom, t0 + s * stepDuration, kVel * 0.83));
    }
    out.push(makeNote(drumMap.snare, t0 + 12 * stepDuration, sVel));
    out.push(makeNote(drumMap.snare, t0 + 13 * stepDuration, sVel * 0.9));
    out.push(makeNote(drumMap.kick, t0 + 14 * stepDuration, kVel));
    out.push(makeNote(drumMap.snare, t0 + 15 * stepDuration, sVel));
    return out;
  };

  let notes = [];

  if (variation === "fixed") {
    for (let bar = 0; bar < bars; bar++) notes.push(...fixedBar(bar * barDuration));
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
      notes.push(...(isFill ? fillBar(t0) : grooveBar(t0)));
    }
  }

  // follow/diverge: replace hihat layer with leader-aware
  if (variation === "follow" || variation === "diverge") {
    const totalDuration = bars * barDuration;
    notes = notes.filter((n) => n.pitch !== drumMap.hihat && n.pitch !== drumMap.openhat);
    if (variation === "follow") {
      for (const n of leader) {
        if (n.time < totalDuration) notes.push(makeNote(drumMap.hihat, n.time, hVel));
      }
    } else {
      const tolerance = stepDuration / 2;
      const leaderTimes = leader.map((n) => n.time);
      for (let bar = 0; bar < bars; bar++) {
        for (let s = 0; s < 16; s += 2) {
          const t = bar * barDuration + s * stepDuration;
          const onLeader = leaderTimes.some((lt) => Math.abs(lt - t) < tolerance);
          if (!onLeader) {
            const accented = s === 0 || s === 8;
            notes.push(makeNote(drumMap.hihat, t, accented ? hVel * 1.2 : hVel * 0.8));
          }
        }
      }
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes;
}

// Attach presets for discovery: drummer.presets.rock, drummer.presets['hip-hop'], etc.
drummer.presets = presets;
