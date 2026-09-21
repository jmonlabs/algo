/**
 * Corruptor — controlled degradation of a finished piece.
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

const piece = () => ({
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

const run = (options) => new Corruptor(options).process(piece());
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

test("corruption degrades a piece without dismantling it", () => {
  const original = piece();
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
  const original = piece();
  const snapshot = JSON.stringify(original);
  new Corruptor({ seed: 5 }).process(original);
  assert.equal(JSON.stringify(original), snapshot, "the input piece was mutated");
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
  const original = allNotes(piece());

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

/* --- one intensity per dimension ----------------------------------------- */

test("attrition works over the whole range, not just above 0.7", () => {
  // It used to be dead below 0.7 and capped at a 15% drop, so two thirds of the
  // control did nothing. Half the control should now remove some notes.
  const long = () => ({
    tempo: 120,
    tracks: [{ label: "lead", notes: Array.from({ length: 60 }, (_, i) => ({ pitch: 60 + (i % 12), duration: 0.5, time: i * 0.5, velocity: 0.8 })) }],
  });
  const kept = (attrition) =>
    new Corruptor({ seed: 4, attrition, temporalJitter: false, microtonalDrift: false }).process(long()).tracks[0].notes.length;

  assert.equal(kept(0), 60, "attrition 0 should keep every note");
  assert.ok(kept(0.5) < 60, "attrition 0.5 should remove notes");
  assert.ok(kept(1) < kept(0.5), "attrition 1 should remove more than 0.5");
});

test("the first note is never dropped", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const notes = new Corruptor({ seed, attrition: 1, temporalJitter: false }).process(piece()).tracks[0].notes;
    assert.equal(notes[0].pitch, 60, `the phrase lost its first note (seed ${seed})`);
  }
});

test("a dimension set explicitly stops following entropy", () => {
  // Entropy at its maximum, but the pitches are told to stay put.
  const notes = allNotes(run({ seed: 8, entropy: 1, drift: 0 }));
  assert.equal(notes.filter((n) => n.microtuning).length, 0, "drift 0 should leave the pitches alone");

  // And the reverse: entropy at rest, but the pitches drift.
  const drifted = allNotes(run({ seed: 8, entropy: 0, drift: 1 }));
  assert.ok(drifted.some((n) => n.microtuning), "drift 1 should detune despite entropy 0");
});

test("temporal displacement is linear in the jitter intensity", () => {
  const spread = (jitter) => {
    const notes = allNotes(run({ seed: 12, jitter, microtonalDrift: false, noteAttrition: false }));
    return Math.max(...notes.map((n, i) => Math.abs(n.time - i)));
  };
  const half = spread(0.5);
  const full = spread(1);
  assert.ok(full > half, "more jitter should displace further");
  // Linear, not squared: halving the intensity halves the displacement.
  assert.ok(Math.abs(full / 2 - half) < 0.02, `expected ${full / 2}, got ${half}`);
});

test("a note without a velocity is left without one", () => {
  const bare = { tempo: 120, tracks: [{ label: "lead", notes: [{ pitch: 60, duration: 1, time: 0 }, { pitch: 64, duration: 1, time: 1 }] }] };
  const notes = new Corruptor({ seed: 2, noteAttrition: false }).process(bare).tracks[0].notes;
  for (const note of notes) {
    assert.equal(note.velocity, undefined, "the corruptor invented a velocity");
  }
});

/* --- the violence family ------------------------------------------------- */

const bar = (notes) => ({ tempo: 120, tracks: [{ label: "lead", notes }] });
const plain = () => Array.from({ length: 8 }, (_, i) => ({ pitch: 60 + i, duration: 0.5, time: i * 0.5, velocity: 0.6 }));
const violent = (options) => new Corruptor({ seed: 3, temporalJitter: false, microtonalDrift: false, noteAttrition: false, velocitySag: false, ...options })
  .process(bar(plain())).tracks[0].notes;

test("violence is off unless asked for, at any entropy", () => {
  // Wear and violence are different axes: turning up entropy must never start
  // stuttering or slamming a piece.
  const worn = new Corruptor({ seed: 3, entropy: 1 }).process(bar(plain())).tracks[0].notes;
  assert.ok(worn.length <= plain().length, "entropy alone should never add notes");
});

test("every violence gesture at 0 leaves the notes exactly as they were", () => {
  const untouched = violent({ stutter: 0, wall: 0, reverse: 0, slam: 0, offScale: 0, detune: 0, chop: 0 });
  assert.deepEqual(untouched, plain());
});

test("stutter multiplies a note into a burst with the velocity climbing", () => {
  const notes = violent({ stutter: 1, stutterCount: 4, stutterSubdivision: 0.125 });
  assert.equal(notes.length, plain().length * 4, "every note should become four");

  const burst = notes.filter((n) => n.time < 0.5);
  assert.equal(burst.length, 4);
  for (let i = 1; i < burst.length; i++) {
    assert.ok(burst[i].velocity > burst[i - 1].velocity, "the burst should climb");
    assert.ok(Math.abs((burst[i].time - burst[i - 1].time) - 0.125) < 1e-9, "the burst should be even");
  }
});

test("wall replaces a bar with one pitch, hammered", () => {
  const notes = violent({ wall: 1, wallBar: 4, wallSubdivision: 0.25 });
  assert.equal(new Set(notes.map((n) => n.pitch)).size, 1, "a wall is one pitch");
  assert.equal(notes[0].pitch, 60, "and it is the lowest of the bar");
  assert.equal(notes.length, 16, "four beats of sixteenths");
});

test("reverse is a true retrograde: same material, opposite order", () => {
  const notes = violent({ reverse: 1, reverseWindow: 4 }).sort((a, b) => a.time - b.time);
  assert.deepEqual(notes.map((n) => n.pitch), plain().map((n) => n.pitch).reverse());
  assert.deepEqual(notes.map((n) => n.duration), plain().map((n) => n.duration));
});

test("slam moves a note by whole octaves", () => {
  for (const note of violent({ slam: 1, slamOctaves: [-1] })) {
    assert.ok(note.pitch < 60, `expected an octave down, got ${note.pitch}`);
    assert.equal(note.pitch % 12, (note.pitch + 12) % 12, "the pitch class should survive");
  }
  const kept = violent({ slam: 1, slamOctaves: [-9] });
  assert.deepEqual(kept, plain(), "a slam out of MIDI range leaves the note alone");
});

test("offScale lands the note outside the scale it was given", () => {
  const aMinor = [9, 11, 0, 2, 4, 5, 7];
  for (const note of violent({ offScale: 1, scale: aMinor })) {
    assert.ok(!aMinor.includes(note.pitch % 12), `${note.pitch} is still in the scale`);
  }
});

test("detune is a stated interval, not a sprinkle", () => {
  const notes = violent({ detune: 1, detuneCents: 50 });
  for (const note of notes) {
    assert.equal(Math.abs(note.microtuning), 0.5, "expected a quarter tone");
  }
});

test("chop shortens a note to a stab without moving it", () => {
  const notes = violent({ chop: 1, chopGrid: 0.125 });
  assert.deepEqual(notes.map((n) => n.time), plain().map((n) => n.time));
  for (const note of notes) assert.equal(note.duration, 0.125);
});

test("the gestures combine without producing a broken note", () => {
  const notes = violent({ stutter: 0.5, wall: 0.3, reverse: 0.5, slam: 0.4, offScale: 0.4, detune: 0.5, chop: 0.3 });
  assert.ok(notes.length > 0);
  for (const note of notes) {
    assert.ok(Number.isFinite(note.time) && note.time >= 0, `bad time: ${note.time}`);
    assert.ok(Number.isFinite(note.duration) && note.duration > 0, `bad duration: ${note.duration}`);
    assert.ok(note.pitch >= 0 && note.pitch <= 127, `bad pitch: ${note.pitch}`);
    assert.ok(note.velocity > 0 && note.velocity <= 1, `bad velocity: ${note.velocity}`);
  }
  for (let i = 1; i < notes.length; i++) assert.ok(notes[i].time >= notes[i - 1].time, "notes should come out in time order");
});

test("`where` aims a gesture at chosen notes and spares the rest", () => {
  // A track is layers at once. A stutter that lands on the hi-hats, which
  // outnumber everything, returns a buzz instead of a gesture.
  const kit = () => [
    { pitch: 38, duration: 0.25, time: 0, velocity: 0.8 },
    { pitch: 42, duration: 0.25, time: 0.5, velocity: 0.3 },
    { pitch: 38, duration: 0.25, time: 1, velocity: 0.8 },
    { pitch: 42, duration: 0.25, time: 1.5, velocity: 0.3 },
  ];
  const notes = new Corruptor({
    seed: 5, temporalJitter: false, microtonalDrift: false, noteAttrition: false, velocitySag: false,
    stutter: 1, stutterCount: 3, stutterSubdivision: 0.0625,
    where: { stutter: (n) => n.pitch === 38 },
  }).process({ tempo: 120, tracks: [{ label: "kit", notes: kit() }] }).tracks[0].notes;

  assert.equal(notes.filter((n) => n.pitch === 38).length, 6, "both snares should burst into three");
  assert.equal(notes.filter((n) => n.pitch === 42).length, 2, "the hats should be untouched");
  assert.deepEqual(notes.filter((n) => n.pitch === 42).map((n) => n.time), [0.5, 1.5]);
});

test("`where` also governs the span gestures", () => {
  const notes = [
    { pitch: 36, duration: 0.5, time: 0, velocity: 0.8 },
    { pitch: 42, duration: 0.5, time: 1, velocity: 0.3 },
    { pitch: 36, duration: 0.5, time: 2, velocity: 0.8 },
  ];
  const walled = new Corruptor({
    seed: 5, temporalJitter: false, microtonalDrift: false, noteAttrition: false, velocitySag: false,
    wall: 1, wallBar: 4, wallSubdivision: 1,
    where: { wall: (n) => n.pitch === 36 },
  }).process({ tempo: 120, tracks: [{ label: "kit", notes }] }).tracks[0].notes;

  const hats = walled.filter((n) => n.pitch === 42);
  assert.equal(hats.length, 1, "the hat should survive the wall");
  assert.equal(hats[0].time, 1, "and stay where it was");
  assert.equal(walled.filter((n) => n.pitch === 36).length, 4, "the wall is built from the kicks");
});

/* --- the functional form ------------------------------------------------- */

test("corruptJmon corrupts in one call", () => {
  const corrupted = corruptJmon(piece());
  assert.equal(corrupted.format, "jmon");
  assert.ok(corrupted.tracks[0].notes.length > 0);
});

test("corruptJmon is reachable from the public namespace", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.equal(typeof jm.processors.Corruptor, "function");
  assert.equal(typeof jm.processors.corruptJmon, "function");
});
