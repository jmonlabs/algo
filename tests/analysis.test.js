/**
 * Musical analysis metrics.
 *
 * These are statistics, so most assertions check invariants — range, sign,
 * ordering between musically-distinct inputs — rather than exact decimals.
 * Where a value is a stable landmark it is pinned outright.
 *
 * node:test + assert. Run with: node --test tests/analysis.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { MusicalAnalysis } from "../src/algorithms/analysis/MusicalAnalysis.js";
import { MusicalIndex } from "../src/algorithms/analysis/MusicalIndex.js";

const SCALE = [60, 62, 64, 65, 67, 69, 71, 72];
const FLAT = [60, 60, 60, 60, 60, 60, 60, 60];
const JAGGED = [60, 84, 61, 83, 62, 82, 63, 81];

const note = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, duration, time, velocity });

/* --- the metric surface -------------------------------------------------- */

const PITCH_METRICS = [
  "gini", "balance", "motif", "dissonance", "fibonacciIndex",
  "contourEntropy", "intervalVariance", "density",
];

test("every advertised pitch metric exists and returns a finite number", () => {
  for (const name of PITCH_METRICS) {
    assert.equal(typeof MusicalAnalysis[name], "function", `${name} is missing`);
    const value = MusicalAnalysis[name](SCALE);
    assert.ok(Number.isFinite(value), `${name} returned ${value}`);
  }
});

test("autocorrelation returns a series", () => {
  const out = MusicalAnalysis.autocorrelation(SCALE);
  assert.ok(Array.isArray(out));
  assert.ok(out.length > 0);
  assert.ok(out.every(Number.isFinite));
});

/* --- individual metrics -------------------------------------------------- */

test("gini is zero-ish for a flat sequence and rises with spread", () => {
  assert.ok(MusicalAnalysis.gini(FLAT) < 1e-9, "a constant line should have no inequality");
  assert.ok(MusicalAnalysis.gini(JAGGED) > MusicalAnalysis.gini(SCALE));
});

test("balance is the centre of mass of the pitches", () => {
  assert.equal(MusicalAnalysis.balance(FLAT), 60);
  // Mean of the C major scale over an octave.
  assert.equal(MusicalAnalysis.balance(SCALE), 66.25);
});

test("contourEntropy is zero for a monotonic line and positive for a jagged one", () => {
  // Compared with a tolerance: the sum comes out as -0, which strict equality
  // distinguishes from 0.
  assert.ok(
    Math.abs(MusicalAnalysis.contourEntropy(SCALE)) < 1e-12,
    "a rising scale never changes direction",
  );
  assert.ok(MusicalAnalysis.contourEntropy(JAGGED) > 0);
});

test("intervalVariance separates a smooth line from a jagged one", () => {
  assert.ok(
    MusicalAnalysis.intervalVariance(JAGGED) > MusicalAnalysis.intervalVariance(SCALE),
    "leaping intervals should vary more than stepwise ones",
  );
  assert.equal(MusicalAnalysis.intervalVariance(FLAT), 0);
});

test("density counts the events it was given", () => {
  assert.equal(MusicalAnalysis.density(SCALE), SCALE.length);
});

test("dissonance is zero for a diatonic scale", () => {
  assert.equal(MusicalAnalysis.dissonance(SCALE), 0);
});

test("fibonacciIndex stays inside the unit interval", () => {
  for (const input of [SCALE, FLAT, JAGGED]) {
    const value = MusicalAnalysis.fibonacciIndex(input);
    assert.ok(value >= 0 && value <= 1, `fibonacciIndex out of [0,1]: ${value}`);
  }
});

test("motif scores repetition higher than novelty", () => {
  const repeated = [60, 62, 64, 60, 62, 64, 60, 62];
  const varied = [60, 71, 63, 68, 65, 74, 61, 70];
  assert.ok(MusicalAnalysis.motif(repeated) >= MusicalAnalysis.motif(varied));
});

/* --- rhythm-aware metrics ------------------------------------------------ */

test("syncopation is zero when every onset is on the beat", () => {
  const onBeat = [note(60, 0), note(62, 1), note(64, 2), note(65, 3)];
  assert.equal(MusicalAnalysis.syncopation(onBeat), 0);
});

test("rhythmic metrics accept JMON notes without throwing", () => {
  const notes = [note(60, 0), note(62, 0.5), note(64, 1.25), note(65, 3)];
  for (const name of ["rhythmic", "onsets", "gapVariance", "densityCurve",
                      "velocityEnvelope", "rhythmicSignature"]) {
    assert.equal(typeof MusicalAnalysis[name], "function", `${name} is missing`);
    assert.doesNotThrow(() => MusicalAnalysis[name](notes), `${name} threw`);
  }
});

/* --- edge cases ---------------------------------------------------------- */

test("metrics survive degenerate input", () => {
  for (const name of PITCH_METRICS) {
    assert.doesNotThrow(() => MusicalAnalysis[name]([]), `${name} threw on []`);
    assert.doesNotThrow(() => MusicalAnalysis[name]([60]), `${name} threw on a single note`);
  }
});

/* --- analyze() ----------------------------------------------------------- */

test("analyze() returns a keyed report covering several metrics", () => {
  const report = MusicalAnalysis.analyze(SCALE);
  assert.equal(typeof report, "object");
  assert.ok(Object.keys(report).length >= 5, "expected a multi-metric report");
  for (const [name, value] of Object.entries(report)) {
    if (typeof value === "number") {
      assert.ok(Number.isFinite(value), `analyze().${name} is ${value}`);
    }
  }
});

/* --- MusicalIndex -------------------------------------------------------- */

test("MusicalIndex scores a flat pitch sequence", () => {
  // MusicalIndex takes a flat array of numbers, not JMON notes or djalgo
  // tuples — feeding it either of those yields NaN rather than an error.
  const index = new MusicalIndex(SCALE);

  for (const name of ["gini", "balance", "motif", "dissonance", "restProportion"]) {
    const value = index[name]();
    assert.ok(Number.isFinite(value), `MusicalIndex.${name}() returned ${value}`);
  }

  const all = index.calculateAll();
  assert.equal(typeof all, "object");
  assert.ok(Object.keys(all).length > 0);
});

test("MusicalIndex.similarity rates a sequence against itself highest", () => {
  // similarity() compares two MusicalIndex instances, not raw arrays.
  const subject = new MusicalIndex(SCALE);
  const self = subject.similarity(new MusicalIndex(SCALE));
  const other = subject.similarity(new MusicalIndex(JAGGED));

  assert.ok(Number.isFinite(self), `self-similarity was ${self}`);
  assert.ok(Number.isFinite(other), `cross-similarity was ${other}`);
  assert.ok(self >= other, "a sequence should not be less similar to itself");
});

/* --- public surface ------------------------------------------------------ */

test("the analysis namespace is reachable from jm", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.equal(typeof jm.analysis.MusicalAnalysis, "function");
  assert.equal(typeof jm.analysis.MusicalIndex, "function");
});
