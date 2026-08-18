/**
 * Shared synth/routing factory used by the live player (`music-player.js`)
 * and the offline renderer (`converters/wav.js`).
 *
 * Both paths must produce identical synth choices and audioGraph routing,
 * otherwise pieces sound different live vs. exported. Centralizing the
 * dispatch here is the only way to keep them in sync.
 */

import { generateSamplerUrls, resolveSoundfontBase } from "../utils/gm-instruments.js";
import { parseDrumKitSpec } from "../utils/drumkits.js";
import { midiToNoteName } from "./../utils/normalize.js";
import { ALL_EFFECTS } from "../constants/audio-effects.js";

/**
 * Resolve where a track's synth should connect.
 *
 * Priority:
 *   1. `track.output` — explicit per-track bus reference
 *   2. `audioGraph` node with `default: true`
 *   3. First effect node in `audioGraph` not targeted by anything (legacy)
 *   4. `fallbackTarget`
 */
export function resolveConnectTarget(track, audioGraph, graphNodes, fallbackTarget) {
  if (track && track.output) {
    if (graphNodes && graphNodes[track.output]) return graphNodes[track.output];
    console.warn(`[track ${track.label || ""}] output "${track.output}" not found in audioGraph`);
  }
  if (audioGraph && audioGraph.length > 0 && graphNodes) {
    const defaultNode = audioGraph.find((n) => n.default === true);
    if (defaultNode && graphNodes[defaultNode.id]) return graphNodes[defaultNode.id];

    const targetedIds = new Set(audioGraph.map((n) => n.target).filter(Boolean));
    const effectEntry = audioGraph.find(
      (n) => ALL_EFFECTS.includes(n.type) && !targetedIds.has(n.id),
    );
    if (effectEntry && graphNodes[effectEntry.id]) return graphNodes[effectEntry.id];
  }
  return fallbackTarget;
}

/**
 * Create a Tone.js synth/sampler for a track.
 *
 * @param {Object} track — JMON track object (uses `synth` field)
 * @param {Object} ToneLib — Tone.js library namespace
 * @param {Object|null} [sharedSynth] — pre-existing node to reuse (e.g., from
 *   audioGraph via `synthRef`); when provided and `track.synth` is unset,
 *   it is returned as the track's synth without creating a new instance.
 *
 * @returns {{synth: Object, isLoadable: boolean, isShared: boolean}}
 *   - `synth` — the Tone.js node ready to be connected to a target
 *   - `isLoadable` — true if the synth uses samples; caller should await
 *     `synth.loaded` before scheduling notes
 *   - `isShared` — true if the synth came from `sharedSynth`; caller should
 *     not disconnect or reconfigure its routing
 */
/**
 * Resolve a track's `synth` field against a composition's `customPresets`.
 *
 * A preset is `{ id, type, options }`. A track referencing it by id — as a
 * bare string or as `{ preset: "id" }` — gets the preset's `{ type, options }`
 * in its place, with any inline options layered on top so a track can borrow
 * a preset and still adjust one value.
 *
 * Pure and exported so it can be tested without Tone.js.
 *
 * @param {*} synthSpec - The track's `synth` field
 * @param {Array<{id: string, type: string, options: Object}>} [presets]
 * @returns {*} The spec with any preset reference expanded
 */
/**
 * Expand a preset into the spec it stands for.
 *
 * A preset's `type` is a Tone class name, or a General MIDI program number —
 * the same two things a track's `synth` accepts, so there is one rule to
 * learn rather than one per place. A GM preset may also carry `strategy`,
 * `noteRange` and `baseUrl`, which is how a named instrument asks for a
 * sample density other than the default.
 */
function expandPreset(preset, extra = {}, inlineOptions = undefined) {
  const options = { ...preset.options, ...inlineOptions };

  if (typeof preset.type === "number") {
    return {
      gm: preset.type,
      ...(preset.strategy !== undefined && { strategy: preset.strategy }),
      ...(preset.noteRange !== undefined && { noteRange: preset.noteRange }),
      ...(preset.baseUrl !== undefined && { baseUrl: preset.baseUrl }),
      ...extra,
      options,
    };
  }

  return { type: preset.type, ...extra, options };
}

export function resolveSynthPreset(synthSpec, presets) {
  if (!Array.isArray(presets) || presets.length === 0) return synthSpec;

  const find = (id) => presets.find((preset) => preset && preset.id === id);

  if (typeof synthSpec === "string") {
    const preset = find(synthSpec);
    return preset ? expandPreset(preset) : synthSpec;
  }

  if (synthSpec && typeof synthSpec === "object" && typeof synthSpec.preset === "string") {
    const preset = find(synthSpec.preset);
    if (!preset) {
      console.warn(`Unknown preset "${synthSpec.preset}". Falling back to the inline spec.`);
      const { preset: _ignored, ...rest } = synthSpec;
      return rest;
    }
    const { preset: _dropped, options: inline, ...rest } = synthSpec;
    return expandPreset(preset, rest, inline);
  }

  return synthSpec;
}

export function createTrackSynth(track, ToneLib, sharedSynth = null, presets = null) {
  if (sharedSynth && (!track || track.synth === undefined)) {
    return { synth: sharedSynth, isLoadable: false, isShared: true };
  }

  const synthSpec = resolveSynthPreset(track && track.synth, presets);

  if (typeof synthSpec === "number") {
    const urls = generateSamplerUrls(synthSpec);
    return {
      synth: new ToneLib.Sampler({ urls, baseUrl: "" }),
      isLoadable: true,
      isShared: false,
    };
  }

  if (typeof synthSpec === "string") {
    const drumKitSpec = parseDrumKitSpec(synthSpec);
    if (drumKitSpec) {
      if (!drumKitSpec.kit) {
        console.warn(`Unknown drumkit "${drumKitSpec.name}". Falling back to PolySynth.`);
        return { synth: new ToneLib.PolySynth(), isLoadable: false, isShared: false };
      }
      const urls = {};
      for (const [midi, file] of Object.entries(drumKitSpec.kit.samples)) {
        urls[midiToNoteName(parseInt(midi, 10))] = file;
      }
      return {
        synth: new ToneLib.Sampler({ urls, baseUrl: drumKitSpec.kit.baseUrl }),
        isLoadable: true,
        isShared: false,
      };
    }
    try {
      return { synth: new ToneLib[synthSpec](), isLoadable: false, isShared: false };
    } catch {
      return { synth: new ToneLib.PolySynth(), isLoadable: false, isShared: false };
    }
  }

  if (typeof synthSpec === "object" && synthSpec !== null) {
    // `{ gm: 40, strategy: "complete" }` — the same GM sampler a bare number
    // builds, but with the sampling density spelled out. The default is
    // `balanced`, which is right for most material; a sustained instrument
    // whose resampling artefacts you can hear wants `complete`.
    const gmProgram = typeof synthSpec.gm === "number"
      ? synthSpec.gm
      : (typeof synthSpec.program === "number" ? synthSpec.program : null);
    if (gmProgram !== null) {
      const urls = generateSamplerUrls(
        gmProgram,
        synthSpec.baseUrl,
        synthSpec.noteRange,
        synthSpec.strategy,
      );
      return {
        synth: new ToneLib.Sampler({ urls, baseUrl: "", ...(synthSpec.options || {}) }),
        isLoadable: true,
        isShared: false,
      };
    }

    const synthType = synthSpec.type || "PolySynth";
    const opts = synthSpec.options || {};
    try {
      if (synthType === "Sampler") {
        return { synth: new ToneLib.Sampler(opts), isLoadable: true, isShared: false };
      }
      return { synth: new ToneLib[synthType](opts), isLoadable: false, isShared: false };
    } catch {
      return { synth: new ToneLib.PolySynth(), isLoadable: false, isShared: false };
    }
  }

  return { synth: new ToneLib.PolySynth(), isLoadable: false, isShared: false };
}

/**
 * True when a Tone.js node exposes a schedulable `detune` signal (cents).
 * Mono synths (Synth, MonoSynth, AMSynth, FMSynth) do; PolySynth and
 * Sampler do not — pitch curves on those need a dedicated glide voice.
 */
export function hasDetuneParam(synth) {
  return !!(synth && synth.detune && typeof synth.detune.setValueAtTime === "function");
}

/**
 * Create a dedicated monophonic voice for pitch curves (glissando,
 * portamento, bend, pitch envelopes) on tracks whose synth has no `detune`
 * signal (PolySynth, Sampler). Uses Tone.Synth — the same voice PolySynth
 * uses by default — with the track's nested voice options when present, so
 * the glide voice matches the track timbre as closely as possible. The
 * caller is responsible for connecting it to the track's effect chain.
 *
 * @param {Object} track — JMON track object
 * @param {Object} ToneLib — Tone.js library namespace
 * @returns {Object|null} a Tone.Synth, or null if construction failed
 */
export function createGlideVoice(track, ToneLib) {
  const spec = track && track.synth;
  // PolySynth object specs nest voice options under options.options
  const voiceOptions =
    (spec && typeof spec === "object" && spec.options && spec.options.options) || undefined;
  try {
    return new ToneLib.Synth(voiceOptions);
  } catch {
    try {
      return new ToneLib.Synth();
    } catch {
      return null;
    }
  }
}

/**
 * Schedule a compiled pitch curve on a `detune` signal (cents), then reset
 * it to the baseline shortly after the curve ends so later notes on the
 * same voice start clean.
 *
 * @param {Object} detuneParam — Tone.js Signal/AudioParam in cents
 * @param {number} startTime — absolute time in seconds of the note start
 * @param {Array<{time:number,value:number}>} anchors — time in seconds
 *   relative to `startTime`, value in cents relative to the written pitch
 * @param {number} [baseCents=0] — baseline detune (e.g. microtuning * 100)
 * @param {number} [resetDelay=0.05] — seconds after the last anchor at
 *   which the signal returns to `baseCents`
 */
export function applyPitchAnchors(detuneParam, startTime, anchors, baseCents = 0, resetDelay = 0.05) {
  if (!detuneParam || !Array.isArray(anchors) || anchors.length === 0) return;
  if (typeof detuneParam.cancelScheduledValues === "function") {
    detuneParam.cancelScheduledValues(startTime);
  }
  detuneParam.setValueAtTime(baseCents + anchors[0].value, startTime + Math.max(0, anchors[0].time));
  for (let k = 1; k < anchors.length; k++) {
    detuneParam.linearRampToValueAtTime(baseCents + anchors[k].value, startTime + anchors[k].time);
  }
  const last = anchors[anchors.length - 1];
  detuneParam.setValueAtTime(baseCents, startTime + last.time + resetDelay);
}

/**
 * True when an instrument's sounding voices can be resampled — which is how a
 * `Sampler` slides without losing its timbre.
 *
 * Tone's `Sampler` exposes no `detune` Signal, so a curve on a sampled
 * instrument would otherwise go to a substitute synth and a violin glissando
 * would not sound like a violin. It does keep its sounding
 * `ToneBufferSource`s in `_activeSources`, and each one's `playbackRate` is an
 * automatable Param. Ramping that resamples the instrument instead of
 * replacing it — the same lever a soundfont engine pulls to bend a note.
 *
 * `_activeSources` is Tone-internal, so this is feature-detected: a future
 * version that moves it simply falls back to the glide voice.
 */
export function canResample(synth) {
  return typeof synth?._activeSources?.get === "function";
}

/**
 * Schedule a compiled pitch curve on a Sampler's sounding voices.
 *
 * Unlike a shared `detune` Signal, these voices belong to this note alone and
 * are discarded when it ends, so there is nothing to reset afterwards.
 *
 * @param {Object} synth — a Tone.Sampler
 * @param {number} midi — the note's MIDI number, which keys `_activeSources`
 * @param {number} startTime — absolute time in seconds of the note start
 * @param {Array<{time:number,value:number}>} anchors — time in seconds
 *   relative to `startTime`, value in cents relative to the written pitch
 * @param {number} [baseCents=0] — baseline detune (e.g. microtuning * 100)
 * @returns {boolean} whether any voice was reached
 */
export function applyPitchAnchorsToSampler(synth, midi, startTime, anchors, baseCents = 0) {
  if (!Array.isArray(anchors) || anchors.length === 0) return false;
  const sources = synth?._activeSources?.get?.(Math.round(midi));
  if (!Array.isArray(sources) || sources.length === 0) return false;

  const ratioAt = (cents) => Math.pow(2, (baseCents + cents) / 1200);
  let applied = false;

  for (const source of sources) {
    const rate = source?.playbackRate;
    if (!rate || typeof rate.linearRampToValueAtTime !== "function") continue;

    const base = rate.value ?? 1;
    if (typeof rate.cancelScheduledValues === "function") {
      rate.cancelScheduledValues(startTime);
    }
    rate.setValueAtTime(
      base * ratioAt(anchors[0].value),
      startTime + Math.max(0, anchors[0].time),
    );
    for (let k = 1; k < anchors.length; k++) {
      rate.linearRampToValueAtTime(base * ratioAt(anchors[k].value), startTime + anchors[k].time);
    }
    applied = true;
  }
  return applied;
}

/**
 * Settle which CDN the FluidR3 samples come from, but only when the piece
 * actually needs them — the probe costs one request, and a composition of
 * pure Tone synths should not pay it.
 *
 * Call this before building synths. It never rejects: a failed probe keeps
 * the primary source, so the worst case is the behaviour from before there
 * was a fallback at all.
 *
 * @param {Array<Object>} tracks - JMON tracks
 * @param {Array<Object>|null} presets - composition.customPresets
 * @returns {Promise<string|null>} The chosen base, or null if none was needed
 */
export async function prepareSoundfonts(tracks, presets = null) {
  const needed = (tracks || []).some((track) => {
    const spec = resolveSynthPreset(track && track.synth, presets);
    return typeof spec === "number"
      || (spec && typeof spec === "object"
          && (typeof spec.gm === "number" || typeof spec.program === "number"));
  });
  if (!needed) return null;

  try {
    return await resolveSoundfontBase();
  } catch {
    return null;
  }
}

/* --- sustaining a note past the end of its sample ------------------------- */

/** Analysis is per buffer and never changes, so compute it once. */
const sustainAnalyses = new WeakMap();

/**
 * Decide whether a sample can be looped to hold a note, and where.
 *
 * A soundfont stores loop points; a folder of MP3s does not, so they are
 * measured. The test is simply whether the recording still has energy at the
 * end: a string, organ, flute or pad holds 60-95% of its peak level there and
 * loops cleanly, while a piano has decayed to a few percent and would loop as
 * an obviously stuck note.
 *
 * The loop points are snapped to rising zero crossings, which is what keeps
 * the seam from clicking once per cycle.
 *
 * @param {Object} buffer — a Tone.ToneAudioBuffer
 * @param {Object} [options]
 * @param {number} [options.threshold=0.25] — tail level, relative to peak,
 *   above which the sample counts as sustaining
 * @returns {{loops: boolean, loopStart: number, loopEnd: number}|null}
 */
export function analyseSustain(buffer, options = {}) {
  if (!buffer || typeof buffer.getChannelData !== "function") return null;
  if (sustainAnalyses.has(buffer)) return sustainAnalyses.get(buffer);

  const { threshold = 0.25 } = options;
  let data;
  try {
    data = buffer.getChannelData(0);
  } catch {
    return null;
  }
  const duration = buffer.duration || 0;
  if (!data || data.length === 0 || duration <= 0) return null;

  const rate = data.length / duration;
  const window = Math.max(1, Math.floor(rate * 0.05));
  const levels = [];
  for (let i = 0; i + window <= data.length; i += window) {
    let sum = 0;
    for (let j = i; j < i + window; j++) sum += data[j] * data[j];
    levels.push(Math.sqrt(sum / window));
  }
  if (levels.length < 4) return null;

  const peak = Math.max(...levels);
  const tail = levels[levels.length - 1];
  const loops = peak > 0 && tail / peak >= threshold;

  // Loop the steady part: past the attack, short of the very end, where an
  // encoder's fade-out lives.
  const from = zeroCrossingNear(data, Math.floor(data.length * 0.45));
  const to = zeroCrossingNear(data, Math.floor(data.length * 0.92));

  const analysis = {
    loops: loops && to > from,
    loopStart: from / rate,
    loopEnd: to / rate,
  };
  sustainAnalyses.set(buffer, analysis);
  return analysis;
}

/** Nearest sample index at or after `index` where the signal crosses zero upwards. */
function zeroCrossingNear(data, index) {
  const limit = Math.min(data.length - 1, index + Math.floor(data.length * 0.05));
  for (let i = Math.max(1, index); i < limit; i++) {
    if (data[i - 1] <= 0 && data[i] > 0) return i;
  }
  return index;
}

/**
 * Hold a sampled note for as long as it is written, by looping the sample's
 * sustaining region.
 *
 * Every FluidR3 sample is a fixed 3.19-second render, so a longer note used to
 * run out of sound — a whole note at 60 BPM ended in silence. Tone's
 * `Sampler` schedules each voice to stop at the end of its buffer, but setting
 * `loop` on a started `ToneBufferSource` cancels exactly that stop, which is
 * the hook this uses. The note's real end is then scheduled here instead.
 *
 * Samples that decay — piano, guitar, plucked and percussive instruments — are
 * left alone: they are supposed to die away.
 *
 * @param {Object} synth — a Tone.Sampler
 * @param {number} midi — the note's MIDI number, which keys `_activeSources`
 * @param {number} startTime — absolute time in seconds of the note start
 * @param {number} seconds — the note's duration in seconds
 * @param {Object} [options] — passed to {@link analyseSustain}
 * @returns {boolean} whether any voice was made to loop
 */
export function sustainSampledNote(synth, midi, startTime, seconds, options = {}) {
  const sources = synth?._activeSources?.get?.(Math.round(midi));
  if (!Array.isArray(sources) || sources.length === 0) return false;

  let looped = false;
  for (const source of sources) {
    const buffer = source?.buffer;
    if (!buffer || typeof source.stop !== "function") continue;

    // What the voice can already play, allowing for glissando resampling.
    const rate = source.playbackRate?.value ?? 1;
    const natural = (buffer.duration || 0) / (rate || 1);
    if (!(seconds > natural)) continue;

    const analysis = analyseSustain(buffer, options);
    if (!analysis || !analysis.loops) continue;

    source.loopStart = analysis.loopStart;
    source.loopEnd = analysis.loopEnd;
    source.loop = true;          // this cancels Sampler's stop-at-buffer-end
    source.stop(startTime + seconds);   // so the note has to be ended here
    looped = true;
  }
  return looped;
}
