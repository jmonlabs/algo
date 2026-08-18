/**
 * Tests the ESM normalization logic in music-player.js buildSynths().
 *
 * Tone.js loaded via a CDN ESM endpoint (e.g. jsdelivr +esm) exposes flat
 * named exports.  In that shape `module.Transport` is undefined but
 * `module.getTransport` is a function.  The player normalizes this into the
 * UMD-style namespace it expects.  These tests verify that logic without
 * needing a real browser or network request.
 */

import { assertEquals, assertExists, assert } from "jsr:@std/assert";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a mock that looks like Tone loaded from an ESM endpoint. */
function makeFlatEsmTone() {
  const transport = {
    bpm: { value: 120 },
    schedule: () => 0,
    cancel: () => {},
    start: () => {},
    stop: () => {},
    pause: () => {},
    seconds: 0,
  };

  return {
    // ESM shape: getTransport() present, Transport absent
    getTransport: () => transport,
    start: async () => {},
    loaded: async () => {},
    Frequency: (val, _unit) => ({ toNote: () => "C4", toFrequency: () => 261.63 }),
    Gain: class Gain { connect() {} dispose() { this.disposed = true; } },
    Limiter: class Limiter { toDestination() { return this; } dispose() { this.disposed = true; } },
    Sampler: class Sampler { connect() {} dispose() { this.disposed = true; } },
    PolySynth: class PolySynth { connect() {} dispose() { this.disposed = true; } triggerAttackRelease() {} },
    MonoSynth: class MonoSynth { connect() {} dispose() { this.disposed = true; } },
    Vibrato: class Vibrato { constructor() { this.wet = { value: 0 }; this.frequency = { value: 5 }; this.depth = { value: 0.5 }; } connect() {} disconnect() {} dispose() { this.disposed = true; } },
    Tremolo: class Tremolo { constructor() { this.wet = { value: 0 }; this.frequency = { value: 8 }; this.depth = { value: 0.3 }; } start() { return this; } connect() {} disconnect() {} dispose() { this.disposed = true; } },
    // No Transport property — this is the ESM shape
  };
}

/** Build a mock that looks like Tone loaded via UMD / window.Tone. */
function makeUmdTone() {
  const transport = {
    bpm: { value: 120 },
    schedule: () => 0,
    cancel: () => {},
    start: () => {},
    stop: () => {},
    pause: () => {},
    seconds: 0,
  };

  return {
    Transport: transport,  // UMD shape: Transport is a direct property
    start: async () => {},
    loaded: async () => {},
    Frequency: (val, _unit) => ({ toNote: () => "C4", toFrequency: () => 261.63 }),
    Gain: class Gain { connect() {} dispose() { this.disposed = true; } },
    Limiter: class Limiter { toDestination() { return this; } dispose() { this.disposed = true; } },
    Sampler: class Sampler { connect() {} dispose() { this.disposed = true; } },
    PolySynth: class PolySynth { connect() {} dispose() { this.disposed = true; } },
    MonoSynth: class MonoSynth { connect() {} dispose() { this.disposed = true; } },
    Vibrato: class Vibrato { connect() {} dispose() { this.disposed = true; } },
    Tremolo: class Tremolo { start() { return this; } connect() {} dispose() { this.disposed = true; } },
  };
}

/** Applies the normalization logic from buildSynths() and returns the result. */
function applyNormalization(ToneLib) {
  if (ToneLib && !ToneLib.Transport && typeof ToneLib.getTransport === 'function') {
    ToneLib = {
      Transport: ToneLib.getTransport(),
      start: ToneLib.start,
      loaded: ToneLib.loaded,
      Frequency: ToneLib.Frequency,
      Gain: ToneLib.Gain,
      Limiter: ToneLib.Limiter,
      Sampler: ToneLib.Sampler,
      PolySynth: ToneLib.PolySynth,
      MonoSynth: ToneLib.MonoSynth,
      Vibrato: ToneLib.Vibrato,
      Tremolo: ToneLib.Tremolo,
    };
  }
  return ToneLib;
}

// ── Detection condition ───────────────────────────────────────────────────────

Deno.test("ESM mock: Transport is absent, getTransport is a function", () => {
  const tone = makeFlatEsmTone();
  assertEquals(tone.Transport, undefined);
  assertEquals(typeof tone.getTransport, "function");
});

Deno.test("UMD mock: Transport is present, getTransport may be absent", () => {
  const tone = makeUmdTone();
  assertExists(tone.Transport);
});

// ── Normalization output ──────────────────────────────────────────────────────

Deno.test("After normalization, Transport is defined (ESM input)", () => {
  const normalized = applyNormalization(makeFlatEsmTone());
  assertExists(normalized.Transport);
});

Deno.test("After normalization, Transport.bpm is defined (ESM input)", () => {
  const normalized = applyNormalization(makeFlatEsmTone());
  assertExists(normalized.Transport.bpm);
});

Deno.test("After normalization, PolySynth is a constructor (ESM input)", () => {
  const normalized = applyNormalization(makeFlatEsmTone());
  assertExists(normalized.PolySynth);
  assert(typeof normalized.PolySynth === 'function');
  const instance = new normalized.PolySynth();
  assert(instance instanceof normalized.PolySynth);
});

Deno.test("Normalization is a no-op when Transport already present (UMD input)", () => {
  const umd = makeUmdTone();
  const original = umd.Transport;
  const normalized = applyNormalization(umd);
  assertEquals(normalized.Transport, original);
});

Deno.test("Normalization is a no-op when ToneLib is null", () => {
  const result = applyNormalization(null);
  assertEquals(result, null);
});

// ── Required keys are forwarded ───────────────────────────────────────────────

Deno.test("All required keys are present after normalization (ESM input)", () => {
  const normalized = applyNormalization(makeFlatEsmTone());
  const required = ["Transport", "start", "loaded", "Frequency", "Gain",
                    "Limiter", "Sampler", "PolySynth", "MonoSynth", "Vibrato", "Tremolo"];
  for (const key of required) {
    assertExists(normalized[key], `Missing key: ${key}`);
  }
});
