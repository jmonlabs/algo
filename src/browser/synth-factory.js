/**
 * Shared synth/routing factory used by the live player (`music-player.js`)
 * and the offline renderer (`converters/wav.js`).
 *
 * Both paths must produce identical synth choices and audioGraph routing,
 * otherwise pieces sound different live vs. exported. Centralizing the
 * dispatch here is the only way to keep them in sync.
 */

import { generateSamplerUrls } from "../utils/gm-instruments.js";
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
export function resolveSynthPreset(synthSpec, presets) {
  if (!Array.isArray(presets) || presets.length === 0) return synthSpec;

  const find = (id) => presets.find((preset) => preset && preset.id === id);

  if (typeof synthSpec === "string") {
    const preset = find(synthSpec);
    return preset ? { type: preset.type, options: { ...preset.options } } : synthSpec;
  }

  if (synthSpec && typeof synthSpec === "object" && typeof synthSpec.preset === "string") {
    const preset = find(synthSpec.preset);
    if (!preset) {
      console.warn(`Unknown preset "${synthSpec.preset}". Falling back to the inline spec.`);
      const { preset: _ignored, ...rest } = synthSpec;
      return rest;
    }
    const { preset: _dropped, options: inline, ...rest } = synthSpec;
    return {
      type: preset.type,
      ...rest,
      options: { ...preset.options, ...inline },
    };
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
