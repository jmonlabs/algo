/**
 * Tests for the sequence transformations and quantization helpers migrated
 * into src/algorithms/utils.js from the former utils/music.js and
 * utils/quantize.js.
 *
 * node:test + assert, so a regression actually fails the build.
 * Run with: node --test tests/utils-transforms.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  invert,
  retrograde,
  augment,
  applySwing,
  extractRhythm,
  normalizeVelocities,
  getPitchRange,
  getTotalDuration,
  splitLongNotes,
  removeDuplicates,
  quantize,
  quantizeEvents,
  quantizeTrack,
  quantizeComposition,
} from "../src/algorithms/utils.js";

const n = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, time, duration, velocity });

/* --- invert -------------------------------------------------------------- */

test("invert reflects pitches around an explicit pivot", () => {
  const out = invert([n(60, 0), n(64, 1), n(67, 2)], 60);
  assert.deepEqual(out.map((x) => x.pitch), [60, 56, 53]);
});

test("invert defaults its pivot to the middle of the range", () => {
  // Range 60..64, midpoint 62 — the outer notes swap.
  const out = invert([n(60, 0), n(64, 1)]);
  assert.deepEqual(out.map((x) => x.pitch), [64, 60]);
});

test("invert handles chords element-wise and leaves rests alone", () => {
  const out = invert([{ pitch: [60, 64], time: 0, duration: 1 }, n(null, 1)], 60);
  assert.deepEqual(out[0].pitch, [60, 56]);
  assert.equal(out[1].pitch, null);
});

/* --- retrograde ---------------------------------------------------------- */

test("retrograde mirrors the sequence in time", () => {
  const out = retrograde([n(60, 0, 1), n(62, 1, 1), n(64, 2, 1)]);
  assert.deepEqual(out.map((x) => x.pitch), [64, 62, 60]);
  assert.deepEqual(out.map((x) => x.time), [0, 1, 2]);
});

test("retrograde preserves gaps rather than closing them up", () => {
  // A rest sits between the two notes; reversing must keep it.
  const out = retrograde([n(60, 0, 1), n(62, 2, 1)]);
  assert.deepEqual(out.map((x) => [x.pitch, x.time]), [[62, 0], [60, 2]]);
});

test("retrograde keeps simultaneous notes simultaneous", () => {
  const out = retrograde([n(60, 0, 1), n(64, 0, 1), n(67, 1, 1)]);
  const atZero = out.filter((x) => x.time === 0).map((x) => x.pitch);
  assert.deepEqual(atZero, [67]);
  assert.deepEqual(out.filter((x) => x.time === 1).map((x) => x.pitch).sort(), [60, 64]);
});

test("retrograde of a retrograde is the original", () => {
  const original = [n(60, 0, 1), n(62, 2, 0.5), n(64, 3, 1)];
  const round = retrograde(retrograde(original));
  assert.deepEqual(
    round.map((x) => [x.pitch, x.time, x.duration]),
    original.map((x) => [x.pitch, x.time, x.duration]),
  );
});

/* --- augment ------------------------------------------------------------- */

test("augment scales both time and duration", () => {
  const out = augment([n(60, 0, 1), n(62, 1, 1)], 2);
  assert.deepEqual(out.map((x) => [x.time, x.duration]), [[0, 2], [2, 2]]);
});

test("augment below 1 is a diminution", () => {
  const out = augment([n(60, 0, 2), n(62, 2, 2)], 0.5);
  assert.deepEqual(out.map((x) => [x.time, x.duration]), [[0, 1], [1, 1]]);
});

test("augment keeps a chord's notes aligned", () => {
  const out = augment([n(60, 0, 1), n(64, 0, 1)], 3);
  assert.equal(out[0].time, out[1].time);
});

test("augment rejects a non-positive factor", () => {
  assert.throws(() => augment([n(60, 0)], 0), /positive number/);
  assert.throws(() => augment([n(60, 0)], -1), /positive number/);
});

/* --- applySwing ---------------------------------------------------------- */

test("applySwing delays off-beats and leaves down-beats put", () => {
  const out = applySwing([n(60, 0), n(62, 0.5), n(64, 1), n(65, 1.5)], { ratio: 0.67 });
  assert.deepEqual(out.map((x) => x.time), [0, 0.67, 1, 1.67]);
});

test("applySwing with ratio 0.5 is a no-op", () => {
  const times = [0, 0.5, 1, 1.5];
  const out = applySwing(times.map((t, i) => n(60 + i, t)), { ratio: 0.5 });
  assert.deepEqual(out.map((x) => x.time), times);
});

/* --- small queries ------------------------------------------------------- */

test("extractRhythm returns sorted onsets", () => {
  assert.deepEqual(extractRhythm([n(60, 2), n(62, 0), n(64, 1)]), [0, 1, 2]);
});

test("getTotalDuration is the latest note end, not the note count", () => {
  assert.equal(getTotalDuration([n(60, 0, 1), n(62, 4, 2)]), 6);
  assert.equal(getTotalDuration([]), 0);
});

test("getPitchRange spans chords and ignores rests", () => {
  assert.deepEqual(
    getPitchRange([{ pitch: [60, 67], time: 0, duration: 1 }, n(72, 1), n(null, 2)]),
    { min: 60, max: 72 },
  );
  assert.equal(getPitchRange([n(null, 0)]), null);
  assert.equal(getPitchRange([]), null);
});

/* --- normalizeVelocities ------------------------------------------------- */

test("normalizeVelocities rescales into the target range", () => {
  const out = normalizeVelocities([n(60, 0, 1, 0.2), n(62, 1, 1, 0.6), n(64, 2, 1, 1.0)], 0, 1);
  // Compared with a tolerance: (0.6 - 0.2) / 0.8 is 0.49999999999999994 in
  // IEEE 754, which is the arithmetic being right, not the function being wrong.
  const expected = [0, 0.5, 1];
  out.forEach((note, i) => {
    assert.ok(
      Math.abs(note.velocity - expected[i]) < 1e-9,
      `velocity ${i}: expected ~${expected[i]}, got ${note.velocity}`,
    );
  });
});

test("normalizeVelocities collapses a flat sequence to the midpoint", () => {
  const out = normalizeVelocities([n(60, 0, 1, 0.7), n(62, 1, 1, 0.7)], 0.2, 0.8);
  assert.deepEqual(out.map((x) => x.velocity), [0.5, 0.5]);
});

/* --- splitLongNotes ------------------------------------------------------ */

test("splitLongNotes divides long notes into contiguous pieces", () => {
  const out = splitLongNotes([n(60, 0, 3)], 1);
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((x) => [x.time, x.duration]), [[0, 1], [1, 1], [2, 1]]);
});

test("splitLongNotes leaves short notes untouched", () => {
  const input = [n(60, 0, 0.5), n(62, 1, 1)];
  assert.deepEqual(splitLongNotes(input, 1), input.map((x) => ({ ...x })));
});

test("splitLongNotes rejects a non-positive maxDuration", () => {
  assert.throws(() => splitLongNotes([n(60, 0, 4)], 0), /must be positive/);
});

/* --- removeDuplicates ---------------------------------------------------- */

test("removeDuplicates merges back-to-back repeats of the same pitch", () => {
  const out = removeDuplicates([n(60, 0, 1), n(60, 1, 1), n(62, 2, 1)]);
  assert.equal(out.length, 2);
  assert.deepEqual([out[0].pitch, out[0].duration], [60, 2]);
});

test("removeDuplicates keeps repeats separated by a gap", () => {
  // Same pitch, but a rest sits between them — that is a restatement.
  const out = removeDuplicates([n(60, 0, 1), n(60, 3, 1)]);
  assert.equal(out.length, 2);
});

test("removeDuplicates does not mutate its input", () => {
  const input = [n(60, 0, 1), n(60, 1, 1)];
  removeDuplicates(input);
  assert.equal(input[0].duration, 1, "input note was mutated");
});

/* --- quantize ------------------------------------------------------------ */

test("quantize snaps to the grid in every mode", () => {
  assert.equal(quantize(1.3, 0.5, "nearest"), 1.5);
  assert.equal(quantize(1.3, 0.5, "floor"), 1);
  assert.equal(quantize(1.3, 0.5, "ceil"), 1.5);
});

test("quantize is idempotent, including on triplet grids", () => {
  for (const grid of [0.25, 0.5, 1 / 3, 1 / 6, 1]) {
    for (let v = 0; v < 8; v += 0.07) {
      const once = quantize(v, grid);
      assert.equal(quantize(once, grid), once, `not idempotent at grid=${grid} v=${v}`);
    }
  }
});

test("quantize lands on exact values where the grid divides evenly", () => {
  assert.equal(quantize(0.99, 1 / 3), 1);
  assert.equal(quantize(2.01, 1 / 3), 2);
});

test("quantize passes non-finite values through and rejects a bad grid", () => {
  assert.equal(quantize(undefined, 0.25), undefined);
  assert.equal(quantize(NaN, 0.25).toString(), "NaN");
  assert.throws(() => quantize(1, 0), /positive number/);
});

/* --- quantizeEvents / Track / Composition -------------------------------- */

test("quantizeEvents snaps time and duration", () => {
  const out = quantizeEvents([n(60, 0.3, 0.9)], { grid: 0.25 });
  assert.deepEqual([out[0].time, out[0].duration], [0.25, 1]);
});

test("quantizeEvents rounds a time down when the grid point below is nearer", () => {
  // 0.12 sits at 0.48 of a sixteenth — nearer the bar line than the sixteenth.
  assert.equal(quantizeEvents([n(60, 0.12, 1)], { grid: 0.25 })[0].time, 0);
});

test("quantizeEvents never quantizes a note out of existence", () => {
  // 0.1 would round to 0 on a quarter-note grid — the note must survive.
  const out = quantizeEvents([n(60, 0, 0.1)], { grid: 1 });
  assert.equal(out[0].duration, 1, "a short note was silently deleted");
});

test("quantizeEvents leaves non-timing fields alone", () => {
  const out = quantizeEvents([n(60, 0.12, 1, 0.33)], { grid: 0.25 });
  assert.equal(out[0].pitch, 60);
  assert.equal(out[0].velocity, 0.33);
});

test("quantizeTrack and quantizeComposition return new objects", () => {
  const track = { label: "lead", synth: 40, notes: [n(60, 0.3, 0.9)] };
  const composition = { tempo: 120, tracks: [track] };

  const qTrack = quantizeTrack(track, { grid: 0.25 });
  assert.equal(qTrack.label, "lead");
  assert.equal(qTrack.synth, 40, "track metadata should survive");
  assert.equal(track.notes[0].time, 0.3, "input track was mutated");

  const qComp = quantizeComposition(composition, { grid: 0.25 });
  assert.equal(qComp.tempo, 120);
  assert.equal(qComp.tracks[0].notes[0].time, 0.25);
  assert.equal(composition.tracks[0].notes[0].time, 0.3, "input composition was mutated");
});

test("quantize helpers pass through malformed input unchanged", () => {
  assert.equal(quantizeEvents(null), null);
  assert.deepEqual(quantizeTrack({ label: "x" }), { label: "x" });
  assert.deepEqual(quantizeComposition({ tempo: 90 }), { tempo: 90 });
});

/* --- public surface ------------------------------------------------------ */

test("everything migrated is reachable through jm.utils", async () => {
  const { default: jm } = await import("../src/index.js");
  const names = [
    "invert", "retrograde", "augment", "applySwing", "extractRhythm",
    "normalizeVelocities", "getPitchRange", "getTotalDuration",
    "splitLongNotes", "removeDuplicates",
    "quantize", "quantizeEvents", "quantizeTrack", "quantizeComposition",
  ];
  for (const name of names) {
    assert.equal(typeof jm.utils[name], "function", `jm.utils.${name} is missing`);
  }
  // The djalgo tuple-based quantizer keeps its own name and stays available.
  assert.equal(typeof jm.utils.quantizeNotes, "function");
});

/* --- the JMON builders --------------------------------------------------- */

test("createTrack labels a track the way the rest of the library reads it", async () => {
  const { createTrack, createPart } = await import("../src/utils/jmon-utils.js");
  const track = createTrack([{ pitch: 60, duration: 1, time: 0 }], "Bass");

  assert.equal(track.label, "Bass", "the players and the score renderer read `label`");
  assert.equal(track.name, undefined, "`name` is not a JMON field");
  assert.equal(createPart, createTrack, "the old name still resolves");
});

test("createComposition emits one tempo, not a tempo and a bpm", async () => {
  const { createComposition } = await import("../src/utils/jmon-utils.js");
  const notes = [{ pitch: 60, duration: 1, time: 0 }];

  const fromTempo = createComposition([notes], { tempo: 90 });
  assert.equal(fromTempo.tempo, 90);
  assert.equal(fromTempo.bpm, undefined, "a leftover bpm is a second source of truth");

  // bpm is still accepted on the way in, so older callers keep working.
  assert.equal(createComposition([notes], { bpm: 90 }).tempo, 90);
  assert.equal(createComposition([notes]).tempo, 120, "and there is a default");
});

test("createComposition accepts tracks as note arrays or as track objects", async () => {
  const { createComposition } = await import("../src/utils/jmon-utils.js");
  const notes = [{ pitch: 60, duration: 1, time: 0 }];

  const bare = createComposition([notes]);
  assert.equal(bare.tracks[0].label, "Track 1", "a bare array gets a positional label");

  const named = createComposition([{ label: "Lead", notes }, { name: "Pad", notes }]);
  assert.deepEqual(named.tracks.map((t) => t.label), ["Lead", "Pad"],
    "a track passed in as `name` comes out as `label`");
  assert.equal(named.tracks[1].name, undefined);
});

test("a composition built by the helpers is playable as-is", async () => {
  // The point of the fix: what comes out of createComposition should be
  // what the player expects, with no renaming in between.
  const { createComposition } = await import("../src/utils/jmon-utils.js");
  const comp = createComposition(
    [{ label: "Lead", notes: [{ pitch: 60, duration: 1, time: 0 }] }],
    { tempo: 90 },
  );

  assert.equal(comp.format, "jmon");
  assert.equal(comp.tempo, 90);
  assert.equal(comp.tracks[0].label, "Lead");
  assert.ok(Array.isArray(comp.tracks[0].notes) && comp.tracks[0].notes.length === 1);
});
