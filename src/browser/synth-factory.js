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
