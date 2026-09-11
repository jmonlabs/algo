import { DEFAULT_DRUM_MAP } from "./drum-map.js";
import { presets, getPreset } from "./presets.js";
import { presets as profilePresets } from "../../theory/profile/presets.js";
import { clavePattern } from "../../theory/rhythm/clave.js";

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
 * Bars where the leader's density changes sharply enough to warrant a fill
 * in the PREVIOUS bar (= anticipation). `barStarts` has one entry per bar
 * plus the end time, so uneven meters work.
 */
function findAnticipationBars(leader, barStarts, threshold) {
  const bars = barStarts.length - 1;
  const density = new Array(bars).fill(0);
  for (const note of leader) {
    for (let b = 0; b < bars; b++) {
      if (note.time >= barStarts[b] && note.time < barStarts[b + 1]) { density[b]++; break; }
    }
  }
  const fillBars = new Set();
  for (let i = 1; i < bars; i++) {
    const prev = Math.max(1, density[i - 1]);
    const cur = Math.max(1, density[i]);
    const ratio = cur / prev;
    if (ratio >= threshold || ratio <= 1 / threshold) fillBars.add(i - 1);
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
  tomLow: 0.8, tomMid: 0.8, tomHigh: 0.8,
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
 * What a live drummer adds around the grid. All probabilities are per
 * opportunity and only roll in sampled (non-fixed) variations, so `fixed`
 * stays the pattern as written.
 *
 *   ghosts     chance of a ghost snare on each 16th-note off-step the grid leaves empty
 *   openhat    chance the hihat on the "and of 4" opens
 *   crash      crash on the first bar of each phrase and after a fill
 *   phrase     bars per phrase
 *   clave      chance per clave note of a sidestick playing the son clave (0 = off)
 *   claveInstrument
 *   fills      fill shapes to draw from
 *   halfFills  chance a fill takes only the second half of its bar
 */
const DEFAULT_DECORATIONS = {
  ghosts: 0.12,
  openhat: 0.25,
  crash: true,
  phrase: 8,
  clave: 0,
  claveInstrument: "rim",
  fills: ["toms", "snareRoll", "kickSnare", "clave"],
  halfFills: 0.5,
};

function resolveDecorations(option) {
  if (option === false) return null;
  if (option === true || option === undefined || option === null) return { ...DEFAULT_DECORATIONS };
  return { ...DEFAULT_DECORATIONS, ...option };
}

/**
 * How the Rhythm Code reweights a kick probability by the weight of its
 * place: X places are nearly silenced, occasional places damped, frequent
 * places kept — and given a floor, so a frequent place the preset never
 * plays still gets a chance. Under `fixed` the floor stays below 0.5 and
 * never fires; the style's own kicks on X places do get dropped, which is
 * the book's point about a kick on the second downbeat.
 */
const CLAVE_FACTOR = [0.15, 0.75, 1.0];
const CLAVE_FLOOR = 0.3;

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
 * @property {number} [seed=42] - PRNG seed. `live` draws a fresh seed per call unless one is given explicitly.
 * @property {number} [fillEvery=4] - Fill bar every N bars. Only applies when `leader`
 *   produces zero anticipated fills — a single anticipated bar anywhere in the piece
 *   switches every bar to anticipation-only for the whole piece.
 * @property {boolean} [anticipate=true] - Place fills BEFORE leader transitions
 * @property {number} [anticipateThreshold=1.5]
 * @property {string|null} [orientation=null] - '2-3' or '3-2': orient the kick around the
 *   Rhythm Code over a two-bar cycle (4/4 bars only). The kick is what tells a listener
 *   which side of the clave they are on; hats and snare are left to the style.
 * @property {boolean|Object} [decorations=true] - Ghost notes, open hats, crashes, clave
 *   sidestick and fill shapes; see DEFAULT_DECORATIONS. `false` for the bare grid.
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
 * - `bars: N` — straight 4/4, the grid as written plus decorations and fills
 * - `sections: [{meter, bars}, ...]` — multi-meter (math rock, prog): meter-natural
 *   kick/snare anchors, with the style's cymbal and ornament layers laid over them
 *
 * **Variations**:
 * - `'fixed'` — the style's canonical pattern (every step at probability ≥ 0.5),
 *   identical every bar, deterministic under `seed`
 * - `'live'` — every bar is a fresh roll of the style grid, plus fills (default)
 * - `'follow'` — the timekeeper layer (hihat, or ride for jazz) locks to the
 *   leader's onsets
 * - `'diverge'` — the timekeeper layer plays in the leader's gaps
 *
 * **Clave**: `orientation: '2-3'` or `'3-2'` reweights the kick by the Rhythm
 * Code, so bar A and bar B differ the way a two-bar groove should. Add
 * `decorations: { clave: 0.8 }` to hear the son clave itself on a sidestick.
 *
 * @param {DrummerOptions} options
 * @returns {Array<{pitch:number,duration:number,time:number,velocity:number}>}
 *
 * @example
 * const drum = drummer({ style: 'rock', bars: 16 });
 *
 * @example
 * // A funk kick oriented 3-2, with the clave on the rim
 * const drum = drummer({ style: 'funk', bars: 8, orientation: '3-2', decorations: { clave: 0.8 } });
 *
 * @example
 * // Multi-meter (math rock)
 * const drum = drummer({
 *   style: 'rock',
 *   sections: [{ meter: 4, bars: 4 }, { meter: 7, bars: 12 }, { meter: 5, bars: 8 }],
 * });
 *
 * @example
 * // Drum responds to a leader track
 * const drum = drummer({ style: 'jazz', bars: 16, variation: 'follow', leader: pianoNotes });
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
    orientation = null,
    decorations = true,
    drumMap = DEFAULT_DRUM_MAP,
  } = options;

  if ((variation === "follow" || variation === "diverge") && !leader) {
    throw new Error(`drummer: variation "${variation}" requires \`leader\``);
  }
  if (orientation !== null && orientation !== "2-3" && orientation !== "3-2") {
    throw new Error(`drummer: orientation must be '2-3', '3-2' or null`);
  }

  // `live` takes a fresh seed every call unless you hand it one — then a
  // live take is a reproducible live take.
  const effectiveSeed = variation === "live" && options.seed === undefined
    ? Math.floor(Math.random() * 1e9)
    : seed;
  const rand = makeRand(effectiveSeed);

  const anchored = Array.isArray(sections) && sections.length > 0;
  const plan = anchored ? sections : [{ meter: 4, bars }];

  return compose(plan, {
    intensity, humanize, drumMap, rand, variation, style, leader,
    fillEvery, anticipate, anticipateThreshold, anchored,
    orientation, decorations: resolveDecorations(decorations),
  });
}

// ─── One renderer for every mode ───────────────────────────────────────
function compose(plan, ctx) {
  const {
    intensity, humanize, drumMap, rand, variation, style, leader,
    fillEvery, anticipate, anticipateThreshold, anchored, orientation, decorations,
  } = ctx;
  const preset = getPreset(style);
  const patterns = preset.patterns || {};
  const stepsIn44 = preset.steps || 16;
  const sampled = variation !== "fixed";
  const velFor = (inst) =>
    ((preset.velocities || {})[inst] ?? DEFAULT_VELOCITIES[inst] ?? 0.7) * intensity;

  const claveProfile = orientation ? profilePresets.rhythmCode(orientation) : null;
  const claveGrid = decorations && decorations.clave > 0
    ? clavePattern("son", orientation || "2-3")
    : null;

  const makeNote = (pitch, time, velocity, stepDur) => ({
    pitch,
    duration: stepDur * 0.8,
    time: Math.max(0, time + humanize * (rand() - 0.5) * stepDur * 0.5),
    velocity: Math.max(0, Math.min(1, velocity + humanize * (rand() - 0.5))),
  });

  // Lay the plan out as bars
  const barList = [];
  let cursor = 0;
  for (const section of plan) {
    const { meter, bars } = section;
    const stepsPerBar = Math.max(1, Math.round(meter * (stepsIn44 / 4)));
    for (let b = 0; b < bars; b++) {
      barList.push({ t0: cursor + b * meter, meter, stepsPerBar, stepDur: meter / stepsPerBar });
    }
    cursor += bars * meter;
  }
  const totalDuration = cursor;
  const barStarts = [...barList.map((b) => b.t0), totalDuration];

  const anticipatedFills = (sampled && anticipate && leader)
    ? findAnticipationBars(leader, barStarts, anticipateThreshold)
    : new Set();

  /** Rhythm Code weight of a step, or null when the step is off the eighth grid or the bar is not 4/4. */
  const claveWeight = (bar, barIndex, step) => {
    if (!claveProfile || Math.abs(bar.meter - 4) > 0.01 || bar.stepsPerBar % 8 !== 0) return null;
    const perEighth = bar.stepsPerBar / 8;
    if (step % perEighth !== 0) return null;
    return claveProfile.at((barIndex % 2) * 8 + step / perEighth);
  };

  /** The style grid over [from, to) steps of a bar, with anchors and decorations. */
  const renderBar = (bar, barIndex, from, to) => {
    const out = [];
    const { t0, meter, stepsPerBar, stepDur } = bar;
    let anchors = null;
    if (anchored) {
      anchors = positionsForMeter(meter);
      for (const k of anchors.kicks) if (k >= from * stepDur && k < to * stepDur) out.push(makeNote(drumMap.kick, t0 + k, velFor("kick"), stepDur));
      for (const s of anchors.snares) if (s >= from * stepDur && s < to * stepDur) out.push(makeNote(drumMap.snare, t0 + s, velFor("snare"), stepDur));
    }
    const onAnchor = (t) => anchors &&
      (anchors.kicks.some((k) => Math.abs(k - t) < stepDur / 2) ||
       anchors.snares.some((s) => Math.abs(s - t) < stepDur / 2));

    for (const [inst, patt] of Object.entries(patterns)) {
      const pitch = drumMap[inst];
      if (pitch === undefined) continue;
      const isBackbone = inst === "kick" || inst === "snare";
      const base = velFor(inst);
      for (let s = from; s < to; s++) {
        let p = patt[s % stepsIn44] ?? 0;
        const t = s * stepDur;
        if (anchors && isBackbone) {
          // Grid kick/snare are syncopation on top of the meter's anchors:
          // damped so the meter stays in charge, never doubling an anchor.
          p *= 0.5;
          if (onAnchor(t)) continue;
        }
        if (inst === "kick") {
          const w = claveWeight(bar, barIndex, s);
          if (w !== null) p = Math.max(p * CLAVE_FACTOR[w], w === 2 ? CLAVE_FLOOR : 0);
        }
        if (sampled && decorations && inst === "snare" && p <= 0 && s % 2 === 1) {
          p = decorations.ghosts * intensity;
        }
        if (p <= 0) continue;
        const hit = sampled ? rand() < p : p >= 0.5;
        if (!hit) continue;
        let outPitch = pitch;
        let vel = base * accent(p);
        if (sampled && decorations && inst === "hihat" && s === stepsPerBar - 2 &&
            drumMap.openhat !== undefined && rand() < decorations.openhat) {
          outPitch = drumMap.openhat;
          vel = velFor("openhat");
        }
        out.push(makeNote(outPitch, t0 + t, vel, stepDur));
      }
    }

    if (claveGrid && Math.abs(meter - 4) < 0.01 && stepsPerBar % 8 === 0) {
      const perEighth = stepsPerBar / 8;
      const pitch = drumMap[decorations.claveInstrument];
      if (pitch !== undefined) {
        for (let e = 0; e < 8; e++) {
          const s = e * perEighth;
          if (s < from || s >= to || !claveGrid[(barIndex % 2) * 8 + e]) continue;
          const hit = sampled ? rand() < decorations.clave : decorations.clave >= 0.5;
          if (hit) out.push(makeNote(pitch, t0 + s * stepDur, velFor(decorations.claveInstrument), stepDur));
        }
      }
    }
    return out;
  };

  /** A fill over steps [from, stepsPerBar) in one of several shapes. */
  const fillBar = (bar, barIndex, from, shape) => {
    const out = [];
    const { t0, stepsPerBar, stepDur } = bar;
    const n = stepsPerBar - from;
    const at = (inst, s, vel) => out.push(makeNote(drumMap[inst], t0 + s * stepDur, vel ?? velFor(inst), stepDur));
    const toms = ["tomHigh", "tomMid", "tomLow"];
    const cadence = Math.min(4, n);

    switch (shape) {
      case "snareRoll": {
        for (let i = 0; i < n; i++) {
          at("snare", from + i, velFor("snare") * (0.55 + 0.45 * (i / Math.max(1, n - 1))));
        }
        at("kick", stepsPerBar - 1);
        break;
      }
      case "kickSnare": {
        for (let i = 0; i < n - cadence; i++) at(i % 2 === 0 ? "kick" : "snare", from + i);
        for (let i = n - cadence; i < n; i++) at("snare", from + i, velFor("snare") * (i % 2 ? 0.7 : 1));
        break;
      }
      case "clave": {
        // The clave on the toms: what a Cuban drummer does with a fill.
        const grid = clavePattern("son", orientation || "2-3");
        const perEighth = Math.max(1, Math.round(stepsPerBar / 8));
        for (let e = 0; e < 8; e++) {
          const s = e * perEighth;
          if (s < from || s >= stepsPerBar || !grid[(barIndex % 2) * 8 + e]) continue;
          at(toms[e % 3], s);
          if (e === 0) at("kick", s);
        }
        at("snare", stepsPerBar - 1);
        break;
      }
      case "toms":
      default: {
        const tomSteps = n - cadence;
        for (let i = 0; i < tomSteps; i++) {
          at(toms[Math.min(2, Math.floor((i / Math.max(1, tomSteps)) * 3))], from + i);
        }
        const c = ["snare", "snare", "kick", "snare"];
        for (let i = 0; i < cadence; i++) {
          at(c[(4 - cadence + i) % 4], stepsPerBar - cadence + i, velFor(c[(4 - cadence + i) % 4]) * (i === 1 ? 0.9 : 1));
        }
      }
    }
    return out;
  };

  let notes = [];
  let previousWasFill = false;
  barList.forEach((bar, barIndex) => {
    const isLast = barIndex === barList.length - 1;
    const isAnticipated = anticipatedFills.has(barIndex);
    const isScheduled = !isLast && fillEvery > 0 && (barIndex + 1) % fillEvery === 0;
    const isFill = sampled && !isLast && (isAnticipated || (anticipatedFills.size === 0 && isScheduled));

    if (decorations && decorations.crash && drumMap.crash !== undefined) {
      const phraseStart = decorations.phrase > 0 && barIndex % decorations.phrase === 0;
      if (phraseStart || previousWasFill) notes.push(makeNote(drumMap.crash, bar.t0, velFor("crash"), bar.stepDur));
    }

    if (isFill) {
      const shapes = (decorations && decorations.fills && decorations.fills.length > 0) ? decorations.fills : ["toms"];
      const shape = shapes[Math.floor(rand() * shapes.length)];
      const half = decorations && rand() < decorations.halfFills;
      const from = half ? Math.floor(bar.stepsPerBar / 2) : 0;
      if (from > 0) notes.push(...renderBar(bar, barIndex, 0, from));
      notes.push(...fillBar(bar, barIndex, from, shape));
    } else {
      notes.push(...renderBar(bar, barIndex, 0, bar.stepsPerBar));
    }
    previousWasFill = isFill;
  });

  // follow/diverge: replace the timekeeper layer with a leader-aware one.
  if (variation === "follow" || variation === "diverge") {
    const timekeeper = timekeeperOf(patterns);
    const tkVel = velFor(timekeeper);
    const stepDur = barList[0]?.stepDur ?? 0.25;
    const timePitches = new Set(
      [drumMap.hihat, drumMap.openhat, drumMap.ride].filter((p) => p !== undefined),
    );
    notes = notes.filter((n) => !timePitches.has(n.pitch));
    if (variation === "follow") {
      for (const n of leader) {
        if (n.time < totalDuration) notes.push(makeNote(drumMap[timekeeper], n.time, tkVel, stepDur));
      }
    } else {
      const tolerance = stepDur / 2;
      const leaderTimes = leader.map((n) => n.time);
      for (let e = 0; e * 0.5 < totalDuration; e++) {
        const t = e * 0.5; // 8th-note grid
        const onLeader = leaderTimes.some((lt) => Math.abs(lt - t) < tolerance);
        if (!onLeader) {
          const accented = e % 8 === 0 || e % 8 === 4;
          notes.push(makeNote(drumMap[timekeeper], t, tkVel * (accented ? 1.2 : 0.8), stepDur));
        }
      }
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes;
}

// Attach presets for discovery: drummer.presets.rock, drummer.presets['hip-hop'], etc.
drummer.presets = presets;
drummer.decorations = DEFAULT_DECORATIONS;
