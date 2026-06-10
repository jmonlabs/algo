/**
 * Pitch-curve compilation tests.
 *
 * Glissando/portamento/bend articulations and note.pitchEnvelope are two
 * frontends to the same backend mechanism: every pitch curve compiles to an
 * `anchors` array of { time: beats (absolute), value: cents relative to the
 * written pitch } that players and exporters consume uniformly.
 *
 * Runs standalone with `node` and under `deno test`.
 */

import assert from "node:assert";
import { compileEvents } from "../audio/index.js";

function pitchMods(notes) {
  return compileEvents({ notes }).modulations.filter((m) => m.type === "pitch");
}

// Glissando articulation compiles to cents anchors
{
  const mods = pitchMods([
    { pitch: 60, time: 0, duration: 2, articulations: [{ type: "glissando", target: 64 }] },
  ]);
  assert.strictEqual(mods.length, 1);
  assert.strictEqual(mods[0].subtype, "glissando");
  assert.deepStrictEqual(mods[0].anchors, [
    { time: 0, value: 0 },
    { time: 2, value: 400 },
  ]);
  console.log("✓ glissando articulation compiles to cents anchors");
}

// pitchEnvelope numbers shorthand is equivalent to a glissando to the same target
{
  const viaArticulation = pitchMods([
    { pitch: 60, time: 0, duration: 2, articulations: [{ type: "glissando", target: 64 }] },
  ]);
  const viaEnvelope = pitchMods([
    { pitch: 60, time: 0, duration: 2, pitchEnvelope: [0, 4] },
  ]);
  assert.strictEqual(viaEnvelope.length, 1);
  assert.strictEqual(viaEnvelope[0].subtype, "envelope");
  assert.deepStrictEqual(viaEnvelope[0].anchors, viaArticulation[0].anchors);
  console.log("✓ pitchEnvelope [0, 4] equals glissando target +4 semitones");
}

// Multi-point numbers shorthand spreads anchors evenly (SCAMP-style)
{
  const mods = pitchMods([{ pitch: 71, time: 0, duration: 2, pitchEnvelope: [0, 3, 1] }]);
  assert.deepStrictEqual(mods[0].anchors, [
    { time: 0, value: 0 },
    { time: 1, value: 300 },
    { time: 2, value: 100 },
  ]);
  console.log("✓ pitchEnvelope numbers spread evenly across the note");
}

// Anchor-object form: explicit times, absolute beats in output
{
  const mods = pitchMods([
    {
      pitch: 60,
      time: 4,
      duration: 2,
      pitchEnvelope: [
        { time: 0, value: 0 },
        { time: 1, value: 3 },
        { time: 2, value: 1 },
      ],
    },
  ]);
  assert.deepStrictEqual(mods[0].anchors, [
    { time: 4, value: 0 },
    { time: 5, value: 300 },
    { time: 6, value: 100 },
  ]);
  console.log("✓ anchor objects respect note onset and convert semitones to cents");
}

// Late-starting envelope holds the written pitch first
{
  const mods = pitchMods([
    { pitch: 60, time: 0, duration: 2, pitchEnvelope: [{ time: 1, value: 1 }] },
  ]);
  assert.deepStrictEqual(mods[0].anchors, [
    { time: 0, value: 0 },
    { time: 1, value: 100 },
  ]);
  console.log("✓ late-starting envelope holds written pitch until first anchor");
}

// Single-number envelope is a constant offset
{
  const mods = pitchMods([{ pitch: 60, time: 0, duration: 1, pitchEnvelope: [0.5] }]);
  assert.deepStrictEqual(mods[0].anchors, [
    { time: 0, value: 50 },
    { time: 1, value: 50 },
  ]);
  console.log("✓ single-value envelope holds a constant offset");
}

// Bend articulation: fast ramp, optional return
{
  const mods = pitchMods([
    {
      pitch: 60,
      time: 0,
      duration: 2,
      articulations: [{ type: "bend", amount: 100, returnToOriginal: true }],
    },
  ]);
  assert.deepStrictEqual(mods[0].anchors, [
    { time: 0, value: 0 },
    { time: 0.5, value: 100 },
    { time: 2, value: 0 },
  ]);
  console.log("✓ bend compiles to ramp/return anchors");
}

// Rests are skipped
{
  const mods = pitchMods([{ pitch: null, time: 0, duration: 1, pitchEnvelope: [0, 1] }]);
  assert.strictEqual(mods.length, 0);
  console.log("✓ pitchEnvelope on a rest emits nothing");
}

console.log("\nAll pitch-curve compilation tests passed");
