/**
 * The Rhythm Code, generalised: profiles over a cycle, claves, onset-grid
 * analysis, and the groove operator.
 *
 * node:test + assert. Run with: node --test tests/rhythm-code.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Profile, presets, RHYTHM_CODE_23 } from "../src/algorithms/theory/profile/index.js";
import { clave, clavePattern, metricStrengths } from "../src/algorithms/theory/rhythm/clave.js";
import * as R from "../src/algorithms/analysis/RhythmCode.js";
import * as S from "../src/algorithms/analysis/salience.js";
import { groove, anticipate, applySteps } from "../src/algorithms/processors/Groove.js";
import jm from "../src/index.js";

const note = (time, duration = 0.5, pitch = 60) => ({ pitch, duration, time, velocity: 0.8 });
const track = (times, duration = 0.5) => times.map((t) => note(t, duration));

// Son clave in eighth-note places, two bars
const SON_23 = [2, 4, 8, 11, 14];
const SON_32 = [0, 3, 6, 10, 12];
const DOWNBEATS = [0, 2, 4, 6, 8, 10, 12, 14];

/* --- Profile ------------------------------------------------------------- */

test("the Rhythm Code preset has 16 places and rotates into 3-2", () => {
  const p23 = presets.rhythmCode("2-3");
  assert.equal(p23.period, 16);
  assert.deepEqual(p23.weights, [...RHYTHM_CODE_23]);
  const p32 = presets.rhythmCode("3-2");
  assert.deepEqual(p32.weights, [...RHYTHM_CODE_23.slice(8), ...RHYTHM_CODE_23.slice(0, 8)]);
  assert.throws(() => presets.rhythmCode("4-4"), /orientation/);
});

test("fit is in [0,1], 1 on the strongest places, 0 on the rare ones", () => {
  const p = presets.rhythmCode("2-3");
  assert.equal(p.fit([2, 4, 7, 11, 14]), 1);
  assert.equal(p.fit([3, 10]), 0);
  assert.equal(p.rareRate([3, 10, 2]), 2 / 3);
  assert.equal(p.fit([]), 0);
});

test("the son clave sits far better on the code than a row of downbeats", () => {
  const p = presets.rhythmCode("2-3");
  assert.ok(p.fit(SON_23) > 0.85, `son fit ${p.fit(SON_23)}`);
  assert.ok(p.fit(SON_23) > p.fit(DOWNBEATS) + 0.2);
});

test("bestRotation recovers the phase of a rotated pattern", () => {
  const p = presets.rhythmCode("2-3");
  const rotated = p.rotate(5);
  const strong = rotated.weights.map((w, i) => (w === 2 ? i : -1)).filter((i) => i >= 0);
  assert.equal(p.bestRotation(strong).rotation, 5);
  // the two clave orientations are the half-period rotation
  assert.equal(p.bestRotation(SON_32, { candidates: [0, 8] }).rotation, 8);
  assert.equal(p.bestRotation(SON_23, { candidates: [0, 8] }).rotation, 0);
});

test("a profile can be folded out of positions and quantised to three levels", () => {
  const positions = [...SON_23, ...SON_23, ...SON_23, 7, 7, 0];
  const p = Profile.fromPositions(positions, { period: 16 });
  assert.equal(p.period, 16);
  assert.equal(p.weights[2], 3);
  const q = p.quantize(3);
  assert.equal(q.max, 2);
  assert.ok(q.weights.every((w) => Number.isInteger(w) && w >= 0 && w <= 2));
});

test("Profile validates its input", () => {
  assert.throws(() => new Profile({ weights: [] }), /non-empty/);
  assert.throws(() => new Profile({ weights: [1, -1] }), /non-negative/);
  assert.throws(() => Profile.fromPositions([1], { period: 0 }), /period/);
});

/* --- claves and metric strengths ---------------------------------------- */

test("clave patterns match the standard grids", () => {
  assert.equal(clavePattern("son", "2-3").map(Number).join(""), "0010100010010010");
  assert.equal(clavePattern("son", "3-2").map(Number).join(""), "1001001000101000");
  assert.equal(clavePattern("tresillo").map(Number).join(""), "10010010");
  assert.equal(clavePattern("afro").length, 12);
  assert.throws(() => clavePattern("samba"), /unknown pattern/);
});

test("clave() lays the pattern out as JMON notes", () => {
  const notes = clave({ name: "son", orientation: "3-2", pitches: 75 });
  assert.deepEqual(notes.map((n) => n.time), [0, 1.5, 3, 5, 6]);
  assert.ok(notes.every((n) => n.pitch === 75));
  assert.equal(clave({ name: "tresillo", repeat: 2 }).length, 6);
});

test("metricStrengths grades 4/4 into downbeat, half-bar, beat, upbeat", () => {
  assert.deepEqual(metricStrengths(), [3, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0]);
  assert.deepEqual(metricStrengths({ beatsPerBar: 3, bars: 1 }), [3, 0, 1, 0, 1, 0]);
});

/* --- onset grid analysis -------------------------------------------------- */

test("stops are onsets with nothing on the next pulse", () => {
  assert.deepEqual(R.stops([0, 1, 2, 5, 8]), [2, 5, 8]);
  assert.deepEqual(R.stops([]), []);
});

test("anticipations come in eighth (order 1) and quarter (order 2) flavours", () => {
  const a = R.anticipations(SON_32);
  const byPos = Object.fromEntries(a.map((x) => [x.position, x]));
  assert.equal(byPos[3].order, 1, "and-of-2 anticipates beat 3");
  assert.equal(byPos[6].order, 2, "beat 4 anticipates the next downbeat by a quarter");
  assert.equal(byPos[10], undefined, "beat 2 of bar B is not an anticipation: beat 3 is played");
  assert.equal(R.anticipations(DOWNBEATS).length, 0);
});

test("upbeatRatio and metricHistogram read the beat hierarchy", () => {
  assert.equal(R.upbeatRatio(DOWNBEATS), 0);
  assert.equal(R.upbeatRatio([1, 3, 5, 7]), 1);
  const h = R.metricHistogram([0, 8, 1, 2]);
  assert.ok(Math.abs(h.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.equal(h[3], 0.5);
});

test("detectOrientation tells 2-3 from 3-2 by the stops", () => {
  assert.equal(R.detectOrientation(track(SON_23.map((p) => p / 2))).orientation, "2-3");
  assert.equal(R.detectOrientation(track(SON_32.map((p) => p / 2))).orientation, "3-2");
});

test("analyzeRhythm ranks a clave line above a flat one and flags stops on the X", () => {
  const good = R.analyzeRhythm(track(SON_23.map((p) => p / 2)), { orientation: "2-3" });
  const flat = R.analyzeRhythm(track(DOWNBEATS.map((p) => p / 2), 1), { orientation: "2-3" });
  assert.ok(good.fit > flat.fit);
  assert.equal(good.rareRate, 0);
  assert.ok(flat.rareRate > 0, "downbeats include beat 2 of the 3 side, an X");
  assert.equal(good.orientation, "2-3");
  assert.ok(good.anticipationRate > flat.anticipationRate);
});

test("profileFromTracks learns where the stops fall", () => {
  const corpus = [track(SON_23.map((p) => p / 2)), track(SON_32.map((p) => p / 2 + 8))];
  const p = R.profileFromTracks(corpus, { period: 16, levels: 3 });
  assert.equal(p.period, 16);
  assert.equal(p.max, 2);
  // every son-clave place was hit twice (once per orientation, once per bar)
  for (const place of SON_23) assert.ok(p.weights[place] > 0, `place ${place} empty`);
});

test("onsetGrid can look through a salience: accents carry the rhythm when there are no rests", () => {
  const notes = [];
  for (let i = 0; i < 16; i++) notes.push({ pitch: 60, time: i * 0.5, duration: 0.5, velocity: SON_23.includes(i) ? 1 : 0.4 });
  assert.deepEqual(R.onsetGrid(notes, { salience: "accents" }), SON_23);
  assert.equal(R.onsetGrid(notes).length, 16);
});

/* --- salience ------------------------------------------------------------ */

test("salience modes agree with their definitions", () => {
  const notes = [note(0), note(0.5), note(1, 1), note(3.5)];
  assert.deepEqual(S.stops(notes), [0, 0, 1, 1]);
  assert.deepEqual(S.motifEdges(notes), [1, 0, 1, 1]);
  assert.deepEqual(S.long(notes), [0, 0, 1, 0]);
  assert.deepEqual(S.repeated([note(0), note(1), note(2, 0.5, 62)]), [0, 1, 0]);
  assert.throws(() => S.salience(notes, { mode: "nope" }), /unknown mode/);
});

test("chordChanges picks the note that anticipates a change over the one after it", () => {
  const notes = [note(0), note(3.5), note(4.5)];
  const w = S.chordChanges(notes, { chords: [{ time: 0, pitches: [60] }, { time: 4, pitches: [62] }] });
  assert.deepEqual(w, [1, 1, 0]);
});

/* --- groove --------------------------------------------------------------- */

const noOverlap = (notes) => {
  const s = notes.slice().sort((a, b) => a.time - b.time);
  for (let i = 1; i < s.length; i++) {
    if (s[i - 1].time + s[i - 1].duration > s[i].time + 1e-9) return false;
  }
  return true;
};

test("the book's four steps turn a flat bassline into an anticipating one", () => {
  const flat = track([0, 2, 4, 6], 2);
  const before = R.analyzeRhythm(flat, { orientation: "2-3" });
  const after = applySteps(flat, { orientation: "2-3" });
  const a = R.analyzeRhythm(after, { orientation: "2-3" });
  assert.ok(a.fit > before.fit, `${a.fit} > ${before.fit}`);
  assert.ok(a.anticipationRate > 0);
  assert.ok(noOverlap(after), "moving an onset earlier must shorten what was sounding");
  assert.equal(after.length, flat.length, "no notes appear or vanish");
});

test("groove hill-climbs stops toward heavier places and does not undo itself", () => {
  const flat = track([0, 2, 4, 6], 2);
  const once = groove(flat, { orientation: "2-3" });
  const twice = groove(once, { orientation: "2-3" });
  const fit = (n) => R.analyzeRhythm(n, { orientation: "2-3" }).fit;
  assert.ok(fit(once) > fit(flat));
  assert.ok(fit(twice) >= fit(once) - 1e-9);
  assert.ok(noOverlap(once) && noOverlap(twice));
});

test("anticipate only moves onto free places and never past another onset", () => {
  const notes = track([0, 0.5, 1]);
  const moved = anticipate(notes, { from: (place) => place === 2, by: 1 });
  assert.deepEqual(moved.map((n) => n.time), [0, 0.5, 1], "place 1 is occupied, nothing moves");
  assert.throws(() => anticipate(notes, {}), /from/);
});

test("rhythm tools are reachable from jm", () => {
  assert.equal(typeof jm.theory.profile.Profile, "function");
  assert.equal(typeof jm.theory.rhythm.clave, "function");
  assert.equal(typeof jm.analysis.rhythm.analyzeRhythm, "function");
  assert.equal(typeof jm.processors.groove, "function");
});
