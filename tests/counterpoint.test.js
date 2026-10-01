/**
 * Tests for the voices written and read by voices/counterpoint.js,
 * and for the line helpers of notes and performance: diatonic,
 * transposeDiatonic, canon, humanize.
 *
 * Run with: node --test tests/counterpoint.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import jm from "../src/index.js";
import { counterpoint, parallelPerfects, lead as voiceChorale } from "../src/voices/index.js";
import { canon, diatonic, transposeDiatonic } from "../src/notes/index.js";
import { humanize } from "../src/performance/index.js";

const n = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, time, duration, velocity });
const pc = (pitch) => ((pitch % 12) + 12) % 12;

// A lamento bass in D minor: d c b♭ a g f e, then a.
const GROUND = [
  { bass: 50, pitchClasses: [2, 5, 9] },
  { bass: 48, pitchClasses: [0, 4, 7] },
  { bass: 46, pitchClasses: [10, 2, 5] },
  { bass: 45, pitchClasses: [5, 9, 0] },
  { bass: 43, pitchClasses: [7, 10, 2] },
  { bass: 41, pitchClasses: [2, 5, 9] },
  { bass: 40, pitchClasses: [4, 7, 10, 2] },
  { bass: 45, pitchClasses: [9, 1, 4] },
];
const RANGES = [[48, 67], [55, 74], [60, 79]];
const D_MINOR = [0, 2, 4, 5, 7, 9, 10];

/* --- parallelPerfects ---------------------------------------------------- */

test("parallelPerfects sees fifths and octaves moving together, and nothing else", () => {
  assert.equal(parallelPerfects([57, 50], [55, 48]), true, "fifth to fifth, both down");
  assert.equal(parallelPerfects([62, 50], [60, 48]), true, "octave to octave");
  assert.equal(parallelPerfects([57, 50], [57, 50]), false, "held notes are not a motion");
  assert.equal(parallelPerfects([57, 50], [59, 48]), false, "contrary motion");
  assert.equal(parallelPerfects([65, 50], [64, 48]), false, "parallel tenths are allowed");
});

/* --- voiceChorale -------------------------------------------------------- */

test("voiceChorale writes the chorale of a lamento bass", () => {
  const voicing = voiceChorale(GROUND, { ranges: RANGES, top: 69 });
  assert.deepEqual(voicing, [
    [53, 62, 69], [55, 64, 72], [58, 65, 74], [60, 65, 72],
    [58, 62, 74], [57, 62, 74], [55, 62, 70], [52, 61, 69],
  ]);
});

test("voiceChorale keeps the voices in range, uncrossed, and makes every chord heard", () => {
  const voicing = voiceChorale(GROUND, { ranges: RANGES });
  voicing.forEach((voices, k) => {
    voices.forEach((pitch, v) => {
      assert.ok(pitch >= RANGES[v][0] && pitch <= RANGES[v][1], `chord ${k}, voice ${v} in range`);
      assert.ok(GROUND[k].pitchClasses.includes(pc(pitch)), `chord ${k}, voice ${v} is a chord note`);
      if (v > 0) assert.ok(pitch > voices[v - 1] && pitch - voices[v - 1] <= 12, `chord ${k}: spacing`);
    });
    const heard = new Set([GROUND[k].bass, ...voices].map(pc));
    assert.ok(GROUND[k].pitchClasses.every((p) => heard.has(p)), `chord ${k} complete`);
  });
});

test("voiceChorale leaves no parallel fifths or octaves, the way back to the start included", () => {
  const voicing = voiceChorale(GROUND, { ranges: RANGES });
  for (let k = 0; k < GROUND.length; k++) {
    const next = (k + 1) % GROUND.length;
    const from = [GROUND[k].bass, ...voicing[k]];
    const to = [GROUND[next].bass, ...voicing[next]];
    for (let i = 0; i < from.length; i++) for (let j = i + 1; j < from.length; j++) {
      assert.equal(parallelPerfects([from[i], from[j]], [to[i], to[j]]), false, `chords ${k} to ${next}, voices ${i} and ${j}`);
    }
  }
});

test("voiceChorale takes any number of voices, and chords without a bass", () => {
  const chords = [{ pitchClasses: [0, 4, 7] }, { pitchClasses: [5, 9, 0] }, { pitchClasses: [7, 11, 2] }];
  const two = voiceChorale(chords, { ranges: [[55, 67], [60, 76]], complete: false });
  assert.equal(two.length, 3);
  assert.ok(two.every((voices) => voices.length === 2));
  const four = voiceChorale(chords, { ranges: [[40, 60], [48, 67], [55, 74], [60, 79]], cyclic: false });
  assert.ok(four.every((voices) => voices.length === 4));
});

test("voiceChorale says which chord cannot be written, and when the rules cannot be met", () => {
  assert.throws(() => voiceChorale(GROUND, {}), /ranges/);
  assert.throws(() => voiceChorale([{ pitchClasses: [0, 4, 7] }], { ranges: [[61, 63]] }), /chord 0 cannot be written/);
  // One voice an octave above the bass, both forced down a step: parallel octaves.
  const chords = [{ bass: 48, pitchClasses: [0] }, { bass: 46, pitchClasses: [10] }];
  assert.throws(() => voiceChorale(chords, { ranges: [[58, 60]] }), /no sequence/);
  assert.deepEqual(voiceChorale(chords, { ranges: [[58, 60]], allowParallels: true }), [[60], [58]]);
});

test("lead and counterpoint are reached from the voices namespace", () => {
  assert.equal(jm.voices.lead, voiceChorale);
  assert.equal(jm.voices.counterpoint, counterpoint);
});

/* --- counterpoint -------------------------------------------------------- */

test("counterpoint reports parallel fifths where the second fifth arrives", () => {
  const found = counterpoint({ viola: [n(57, 0, 4), n(55, 4, 4)], cello: [n(50, 0, 4), n(48, 4, 4)] });
  assert.deepEqual(found, [
    { kind: "parallel", time: 4, bar: 2, beat: 1, voices: ["viola", "cello"], pitches: [55, 48], from: [57, 50] },
  ]);
});

test("counterpoint reports a clash once, where one of its notes starts", () => {
  const voices = {
    violin: [n(65, 0, 4)],
    viola: [n(64, 2, 2)],   // e under f: a minor second, from beat 3
    cello: [n(48, 0, 2), n(50, 3, 1)], // the cello's entries must not report it again
  };
  const clashes = counterpoint(voices).filter((f) => f.kind === "clash");
  assert.deepEqual(clashes, [
    { kind: "clash", time: 2, bar: 1, beat: 3, voices: ["violin", "viola"], pitches: [65, 64] },
  ]);
});

test("counterpoint leaves suspensions alone: a fourth or a major second is not a clash", () => {
  const found = counterpoint({ violin: [n(65, 0, 4)], cello: [n(60, 0, 2), n(63, 2, 2)] });
  assert.deepEqual(found, []);
});

test("counterpoint can be told what to look for, and takes a list of voices", () => {
  const voices = [[n(57, 0, 4), n(55, 4, 4)], [n(50, 0, 4), n(48, 4, 4)]];
  assert.deepEqual(counterpoint(voices, { parallels: false }), []);
  const [found] = counterpoint(voices, { beatsPerBar: 3 });
  assert.deepEqual([found.voices, found.bar, found.beat], [["0", "1"], 2, 2]);
  const seconds = counterpoint({ a: [n(62, 0)], b: [n(60, 0)] }, { clashes: [1, 2] });
  assert.equal(seconds.length, 1);
});

/* --- diatonic, transposeDiatonic ----------------------------------------- */

test("diatonic moves by steps of the scale, not by semitones", () => {
  assert.equal(diatonic(77, { steps: -3, scale: D_MINOR }), 72, "f down to c: a perfect fourth");
  assert.equal(diatonic(76, { steps: -3, scale: D_MINOR }), 70, "e down to b flat: an augmented fourth");
  assert.equal(diatonic(62, { steps: 7, scale: D_MINOR }), 74, "seven steps are an octave");
  assert.equal(diatonic(62, { steps: 0, scale: D_MINOR }), 62);
  assert.equal(diatonic(60, { steps: -1, scale: D_MINOR }), 58, "across the octave, downwards");
});

test("diatonic keeps a note outside the scale at its distance from the step below", () => {
  assert.equal(diatonic(73, { steps: -3, scale: D_MINOR }), 68, "c sharp moves as c does: to g, and a semitone above");
});

test("diatonic takes a key, or a scale given in any order or octave", () => {
  const key = jm.key("D", "minor");
  for (let pitch = 40; pitch < 90; pitch++) {
    for (const steps of [-9, -3, -1, 2, 5, 8]) {
      assert.equal(diatonic(pitch, { steps: steps, scale: key }), diatonic(pitch, { steps: steps, scale: D_MINOR }));
      assert.equal(diatonic(pitch, { steps: steps, scale: [62, 64, 65, 67, 69, 70, 72] }), diatonic(pitch, { steps: steps, scale: D_MINOR }));
    }
  }
  assert.throws(() => diatonic(60, { steps: 1 }), /scale/);
});

test("diatonic counts on scales of any size", () => {
  const pentatonic = [0, 2, 4, 7, 9];
  assert.equal(diatonic(60, { steps: 5, scale: pentatonic }), 72);
  assert.equal(diatonic(64, { steps: 1, scale: pentatonic }), 67);
});

test("transposeDiatonic moves chords note by note and leaves rests", () => {
  const notes = [n(77, 0), { pitch: [62, 65, 69], time: 1, duration: 1 }, { pitch: null, time: 2, duration: 1 }];
  const out = transposeDiatonic(notes, { steps: -2, scale: D_MINOR });
  assert.deepEqual(out.map((x) => x.pitch), [74, [58, 62, 65], null]);
  assert.equal(notes[0].pitch, 77, "the notes given are not changed");
});

/* --- canon --------------------------------------------------------------- */

test("canon follows later, at an interval counted in the scale", () => {
  const theme = [n(77, 0, 6), n(76, 6, 4), n(73, 10, 2)];
  const follower = canon(theme, { delay: 4, steps: -3, octave: -1, scale: D_MINOR });
  assert.deepEqual(follower.map((x) => [x.pitch, x.time, x.duration]), [[60, 4, 6], [58, 10, 4], [56, 14, 2]]);
  assert.equal(theme[0].time, 0, "the leader is not changed");
});

test("canon at the unison, the octave or a number of semitones needs no scale", () => {
  const theme = [n(60, 0), { pitch: null, time: 1, duration: 1 }, n(64, 2)];
  assert.deepEqual(canon(theme, { delay: 2 }).map((x) => [x.pitch, x.time]), [[60, 2], [null, 3], [64, 4]]);
  assert.deepEqual(canon(theme, { octave: 1, semitones: 7 }).map((x) => x.pitch), [79, null, 83]);
  assert.throws(() => canon(theme, { steps: 2 }), /scale/);
});

/* --- humanize ------------------------------------------------------------ */

test("humanize moves each note a little, the same way for the same seed", () => {
  const notes = Array.from({ length: 50 }, (_, i) => n(60, i, 1, 0.5));
  const played = humanize(notes, { seed: 7, timing: 0.06, velocity: 0.12 });
  assert.deepEqual(played, humanize(notes, { seed: 7, timing: 0.06, velocity: 0.12 }));
  assert.notDeepEqual(played, humanize(notes, { seed: 8, timing: 0.06, velocity: 0.12 }));
  played.forEach((p, i) => {
    assert.ok(Math.abs(p.time - i) <= 0.03 + 1e-12, "within half the spread");
    assert.ok(Math.abs(p.velocity / 0.5 - 1) <= 0.06 + 1e-12);
    assert.equal(p.pitch, 60);
  });
  assert.ok(played.some((p, i) => p.time !== i), "and it does move them");
  assert.equal(notes[3].time, 3, "the notes given are not changed");
});

test("humanize keeps notes after 0, velocities in bounds, and silence silent", () => {
  const played = humanize([n(60, 0, 1, 1), n(60, 0, 1, 0.01), n(60, 4, 1, 0)], { seed: 1, timing: 0.5, velocity: 0.5 });
  assert.ok(played.every((p) => p.time >= 0));
  assert.ok(played[0].velocity <= 1);
  assert.equal(played[1].velocity, 0.03);
  assert.equal(played[2].velocity, 0);
});

test("humanize can lean late, and a rest does not change the notes after it", () => {
  const notes = Array.from({ length: 400 }, (_, i) => n(60, 10 + i, 1, 0.5));
  const mean = (list) => list.reduce((sum, p, i) => sum + (p.time - notes[i].time), 0) / list.length;
  assert.ok(Math.abs(mean(humanize(notes, { seed: 3, timing: 0.1 }))) < 0.01);
  assert.ok(mean(humanize(notes, { seed: 3, timing: 0.1, lag: 0.3 })) > 0.02);

  const withRest = [notes[0], { pitch: null, time: 11, duration: 1 }, notes[2]];
  const plain = [notes[0], notes[1], notes[2]];
  assert.deepEqual(humanize(withRest, { seed: 5 })[2], humanize(plain, { seed: 5 })[2]);
});
