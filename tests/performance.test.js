/**
 * Tests for jm.performance: how the notes are played.
 *
 * Run with: node --test tests/performance.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import jm from "../src/index.js";
import { articulate, bow, corrupt, detach, embellish, ornament, sustain, swing } from "../src/performance/index.js";

const n = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, time, duration, velocity });

/* --- swing ---------------------------------------------------------- */

test("swing delays off-beats and leaves down-beats put", () => {
  const out = swing([n(60, 0), n(62, 0.5), n(64, 1), n(65, 1.5)], { ratio: 0.67 });
  assert.deepEqual(out.map((x) => x.time), [0, 0.67, 1, 1.67]);
});

test("swing with ratio 0.5 is a no-op", () => {
  const times = [0, 0.5, 1, 1.5];
  const out = swing(times.map((t, i) => n(60 + i, t)), { ratio: 0.5 });
  assert.deepEqual(out.map((x) => x.time), times);
});

/* --- sustain ------------------------------------------------------------ */

test("sustain fills the span with a uniform step, as it always did", () => {
  const out = sustain(38, { duration: 10, time: 0, velocity: 0.4, step: 4 });

  assert.deepEqual(out.map((x) => [x.duration, x.time]), [[4, 0], [4, 4], [2, 8]]);
  assert.ok(out.every((x) => x.pitch === 38 && x.velocity === 0.4));
});

test("sustain takes a pattern of durations, cycled", () => {
  const out = sustain(69, { duration: 8, time: 0, velocity: 0.5, step: [1, 1, 2] });

  assert.deepEqual(out.map((x) => x.duration), [1, 1, 2, 1, 1, 2]);
  assert.deepEqual(out.map((x) => x.time), [0, 1, 2, 4, 5, 6]);
});

test("sustain shapes velocity alongside the pattern", () => {
  const out = sustain(69, { duration: 8, time: 0, velocity: [0.5, 0.36, 0.43], step: [1, 1, 2] });

  assert.deepEqual(out.map((x) => x.velocity), [0.5, 0.36, 0.43, 0.5, 0.36, 0.43]);
});

test("sustain never overruns the span it was given", () => {
  for (const [total, step] of [[7, [1, 1, 2]], [5, [2, 3]], [3.5, [1, 1, 2]], [10, 4]]) {
    const out = sustain(60, { duration: total, time: 2, velocity: 0.4, step: step });
    const spanned = out.reduce((sum, x) => sum + x.duration, 0);
    assert.ok(Math.abs(spanned - total) < 1e-9,
      `pattern ${JSON.stringify(step)} spanned ${spanned} of ${total}`);
    assert.equal(out[0].time, 2);
    assert.ok(out.every((x) => x.duration > 0), "produced a zero-length note");
  }
});

test("sustain refuses a step that would never advance", () => {
  assert.throws(() => sustain(60, { duration: 8, time: 0, velocity: 0.4, step: 0 }), /greater than 0/);
  assert.throws(() => sustain(60, { duration: 8, time: 0, velocity: 0.4, step: [1, 0, 2] }), /greater than 0/);
  assert.throws(() => sustain(60, { duration: 8, time: 0, velocity: 0.4, step: [] }), /greater than 0/);
});

/* --- bow ------------------------------------------------------------------ */

test("bow gives a long note a stroke: soft entry, swell, easing off", () => {
  const [shaped] = bow([{ pitch: 69, duration: 4, time: 8, velocity: 0.6 }]);
  assert.deepEqual(shaped.dynamics, [
    { time: 0, value: 0 },
    { time: 0.25, value: 0.65 },
    { time: 2.4, value: 1 },
    { time: 4, value: 0.75 },
  ]);
  assert.equal(shaped.velocity, 0.6, "the velocity stays, as the stroke's peak");
  assert.equal(shaped.time, 8, "and the anchors are relative to the note, not the piece");
});

test("bow gives a short note a soft attack only, and never an attack longer than a third", () => {
  const [short] = bow([{ pitch: 60, duration: 0.5, time: 0 }]);
  assert.deepEqual(short.dynamics, [
    { time: 0, value: 0 },
    { time: 0.5 / 3, value: 1 },
    { time: 0.5, value: 1 },
  ]);
});

test("bow leaves rests and existing envelopes alone, and does not mutate", () => {
  const own = [{ time: 0, value: 1 }];
  const input = [
    { pitch: null, duration: 2, time: 0 },
    { pitch: 60, duration: 2, time: 2, dynamics: own },
    { pitch: 62, duration: 2, time: 4 },
  ];
  const out = bow(input, { swell: 0.5, peak: 0.5, fade: 0 });
  assert.equal(out[0].dynamics, undefined);
  assert.equal(out[1].dynamics, own);
  assert.deepEqual(out[2].dynamics.map((a) => a.value), [0, 0.5, 1, 1]);
  assert.equal(input[2].dynamics, undefined, "the input notes are untouched");
});

/* --- ornament, articulate ----------------------------------------------- */

test("ornament writes the ornament out as notes, in the key it is given", () => {
  const melody = [n(62, 0, 1), n(64, 1, 2), n(65, 3, 1)];
  const out = ornament(melody, { type: "mordent", at: 1, key: jm.key("D", "minor") });
  assert.ok(out.length > melody.length, "a mordent is several notes");
  assert.equal(melody.length, 3, "the notes given are not changed");
  assert.throws(() => ornament(melody, { type: "wobble", at: 0 }), /Unknown ornament/);
});

test("articulate marks the notes it is pointed at", () => {
  const melody = [n(62, 0), n(64, 1), n(65, 2)];
  const out = articulate(melody, { type: "staccato", at: [0, 2] });
  // A staccato halves the note and writes a rest for the other half, so the
  // three notes come out as five events.
  const marked = out.filter((note) => (note.articulations || []).includes("staccato")).map((note) => note.pitch);
  assert.deepEqual(marked, [62, 65]);
  assert.equal(out.find((note) => note.pitch === 64).duration, 1, "the note not pointed at is left alone");
});

/* --- embellish, corrupt -------------------------------------------------- */

test("embellish is expressivize under its name: the same seed, the same bends", () => {
  const long = () => Array.from({ length: 12 }, (_, i) => n(60 + i, i * 3, 3));
  const a = embellish(long(), { seed: 4, bendProb: 1, vibratoProb: 1 });
  const b = embellish(long(), { seed: 4, bendProb: 1, vibratoProb: 1 });
  assert.deepEqual(a, b);
  assert.ok(a.some((x) => (x.articulations || []).length > 0));
});

test("corrupt takes the piece first and its entropy named, and returns a new piece", () => {
  const piece = { tempo: 120, tracks: [{ label: "L", notes: [n(60, 0), n(62, 1), n(64, 2)] }] };
  const out = corrupt(piece, { entropy: 0.4, seed: 1 });
  assert.ok(out !== piece && Array.isArray(out.tracks));
  assert.equal(piece.tracks[0].notes[0].time, 0, "the piece given is not changed");
});

/* --- public surface ------------------------------------------------------ */

test("jm.performance is the list of verbs, and jm.utils still answers to the old names", () => {
  assert.deepEqual(Object.keys(jm.performance).sort(), [
    "anticipate", "applySteps", "arpeggiate", "articulate", "bow", "corrupt", "detach", "embellish", "groove",
    "humanize", "ornament", "steps", "strum", "sustain", "swing",
  ]);
  assert.equal(jm.utils.sustained, jm.performance.sustain);
  assert.equal(jm.utils.expressivize, jm.performance.embellish);
  assert.equal(jm.utils.applySwing, jm.performance.swing);
});

/* --- detach -------------------------------------------------------------- */

test("detach shortens each note by the gap, and never to nothing", () => {
  const notes = [{ pitch: 69, duration: 2, time: 0, velocity: 0.8 }, { pitch: 69, duration: 0.05, time: 2, velocity: 0.8 }];
  const out = detach(notes, { gap: 0.25 });
  assert.equal(out[0].duration, 1.75);
  assert.equal(out[1].duration, 0.005, "a note shorter than the gap keeps a tenth of itself");
  assert.equal(detach(notes)[0].duration, 2 - 1 / 16, "the default gap is a sixteenth");
  assert.throws(() => detach(notes, { gap: -1 }), /gap/);
});
