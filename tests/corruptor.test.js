/**
 * Corruptor — controlled degradation of a finished composition.
 *
 * Everything it does is stochastic, so the assertions are about the contract:
 * seeded reproducibility, structure preserved, and degradation that scales
 * with entropy.
 *
 * node:test + assert. Run with: node --test tests/corruptor.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Corruptor, corruptJmon } from "../src/algorithms/processors/Corruptor.js";

const composition = () => ({
  format: "jmon",
  version: "1.0",
  tempo: 120,
  tracks: [{
    label: "lead",
    notes: [
      { pitch: 60, duration: 1, time: 0, velocity: 0.8 },
      { pitch: 64, duration: 1, time: 1, velocity: 0.8 },
      { pitch: 67, duration: 1, time: 2, velocity: 0.8 },
      { pitch: 72, duration: 1, time: 3, velocity: 0.8 },
    ],
  }],
});

const run = (options) => new Corruptor(options).process(composition());
const allNotes = (piece) => piece.tracks.flatMap((t) => t.notes);

/* --- the constructor contract -------------------------------------------- */

test("Corruptor takes an options object, not a bare seed", () => {
  // `new Corruptor(42)` reads `42.seed`, which is undefined, so the seed falls
  // back to Math.random() and the result stops being reproducible. The seed
  // goes in an options object.
  const corruptor = new Corruptor({ seed: 42, entropy: 0.5 });
  assert.equal(corruptor.getEntropy(), 0.5);
});

test("entropy defaults to 0.5 and is settable", () => {
  const corruptor = new Corruptor({ seed: 1 });
  assert.equal(corruptor.getEntropy(), 0.5);
  corruptor.setEntropy(0.9);
  assert.equal(corruptor.getEntropy(), 0.9);
});

/* --- reproducibility ----------------------------------------------------- */

test("the same seed produces the same corruption", () => {
  assert.deepEqual(run({ seed: 42 }), run({ seed: 42 }));
});

test("different seeds produce different corruptions", () => {
  assert.notDeepEqual(run({ seed: 42 }), run({ seed: 7 }));
});

/* --- structure preservation ---------------------------------------------- */

test("corruption degrades a composition without dismantling it", () => {
  const original = composition();
  const corrupted = run({ seed: 3 });

  assert.equal(corrupted.format, "jmon");
  assert.equal(corrupted.tempo, original.tempo);
  assert.equal(corrupted.tracks.length, original.tracks.length);
  assert.equal(corrupted.tracks[0].label, "lead");

  for (const note of allNotes(corrupted)) {
    assert.ok(Number.isFinite(note.time) && note.time >= 0, `bad time: ${note.time}`);
    assert.ok(Number.isFinite(note.duration) && note.duration > 0, `bad duration: ${note.duration}`);
    if (note.pitch !== null) {
      assert.ok(Number.isFinite(note.pitch), `bad pitch: ${note.pitch}`);
    }
  }
});

test("corruption does not mutate its input", () => {
  const original = composition();
  const snapshot = JSON.stringify(original);
  new Corruptor({ seed: 5 }).process(original);
  assert.equal(JSON.stringify(original), snapshot, "the input composition was mutated");
});

test("pitches stay inside the MIDI range", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    for (const note of allNotes(run({ seed, entropy: 1 }))) {
      if (note.pitch === null) continue;
      assert.ok(note.pitch >= 0 && note.pitch <= 127, `pitch ${note.pitch} out of range (seed ${seed})`);
    }
  }
});

/* --- entropy scales the damage ------------------------------------------- */

test("higher entropy moves the music further from the original", () => {
  const original = allNotes(composition());

  const drift = (entropy) => {
    const corrupted = allNotes(run({ seed: 11, entropy }));
    let total = 0;
    for (let i = 0; i < Math.min(original.length, corrupted.length); i++) {
      total += Math.abs((corrupted[i].time ?? 0) - original[i].time);
      total += Math.abs((corrupted[i].duration ?? 0) - original[i].duration);
    }
    // A dropped or added note is itself a large departure.
    return total + Math.abs(corrupted.length - original.length);
  };

  assert.ok(drift(1) > drift(0), "entropy 1 should depart further than entropy 0");
});

/* --- microtuning --------------------------------------------------------- */

test("microtonal drift is emitted as a JMON microtuning field", () => {
  const corrupted = run({ seed: 42, microtonalDrift: true, driftAmount: 1 });
  const drifted = allNotes(corrupted).filter((n) => n.microtuning !== undefined);

  assert.ok(drifted.length > 0, "expected at least one note to carry microtuning");
  for (const note of drifted) {
    assert.ok(Number.isFinite(note.microtuning));
    assert.ok(Math.abs(note.microtuning) <= 2, `implausible drift: ${note.microtuning}`);
  }
});

test("microtonal drift can be switched off", () => {
  const corrupted = run({ seed: 42, microtonalDrift: false });
  assert.equal(
    allNotes(corrupted).filter((n) => n.microtuning !== undefined).length,
    0,
    "microtuning appeared despite microtonalDrift: false",
  );
});

/* --- the functional form ------------------------------------------------- */

test("corruptJmon corrupts in one call", () => {
  const corrupted = corruptJmon(composition());
  assert.equal(corrupted.format, "jmon");
  assert.ok(corrupted.tracks[0].notes.length > 0);
});

test("corruptJmon is reachable from the public namespace", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.equal(typeof jm.processors.Corruptor, "function");
  assert.equal(typeof jm.processors.corruptJmon, "function");
});
