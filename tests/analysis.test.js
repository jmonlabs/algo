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

import * as analysis from "../src/analysis/index.js";

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
    assert.equal(typeof analysis[name], "function", `${name} is missing`);
    const value = analysis[name](SCALE);
    assert.ok(Number.isFinite(value), `${name} returned ${value}`);
  }
});

test("autocorrelation returns a series", () => {
  const out = analysis.autocorrelation(SCALE);
  assert.ok(Array.isArray(out));
  assert.ok(out.length > 0);
  assert.ok(out.every(Number.isFinite));
});

/* --- individual metrics -------------------------------------------------- */

test("gini is zero-ish for a flat sequence and rises with spread", () => {
  assert.ok(analysis.gini(FLAT) < 1e-9, "a constant line should have no inequality");
  assert.ok(analysis.gini(JAGGED) > analysis.gini(SCALE));
});

test("balance is the centre of mass of the pitches", () => {
  assert.equal(analysis.balance(FLAT), 60);
  // Mean of the C major scale over an octave.
  assert.equal(analysis.balance(SCALE), 66.25);
});

test("contourEntropy is zero for a monotonic line and positive for a jagged one", () => {
  // Compared with a tolerance: the sum comes out as -0, which strict equality
  // distinguishes from 0.
  assert.ok(
    Math.abs(analysis.contourEntropy(SCALE)) < 1e-12,
    "a rising scale never changes direction",
  );
  assert.ok(analysis.contourEntropy(JAGGED) > 0);
});

test("intervalVariance separates a smooth line from a jagged one", () => {
  assert.ok(
    analysis.intervalVariance(JAGGED) > analysis.intervalVariance(SCALE),
    "leaping intervals should vary more than stepwise ones",
  );
  assert.equal(analysis.intervalVariance(FLAT), 0);
});

test("density counts the events it was given", () => {
  assert.equal(analysis.density(SCALE), SCALE.length);
});

test("dissonance is zero for a diatonic scale", () => {
  assert.equal(analysis.dissonance(SCALE), 0);
});

test("fibonacciIndex stays inside the unit interval", () => {
  for (const input of [SCALE, FLAT, JAGGED]) {
    const value = analysis.fibonacciIndex(input);
    assert.ok(value >= 0 && value <= 1, `fibonacciIndex out of [0,1]: ${value}`);
  }
});

test("motif scores repetition higher than novelty", () => {
  const repeated = [60, 62, 64, 60, 62, 64, 60, 62];
  const varied = [60, 71, 63, 68, 65, 74, 61, 70];
  assert.ok(analysis.motif(repeated) >= analysis.motif(varied));
});

/* --- rhythm-aware metrics ------------------------------------------------ */

test("syncopation is zero when every onset is on the beat", () => {
  const onBeat = [note(60, 0), note(62, 1), note(64, 2), note(65, 3)];
  assert.equal(analysis.syncopation(onBeat), 0);
});

test("rhythmic metrics accept JMON notes without throwing", () => {
  const notes = [note(60, 0), note(62, 0.5), note(64, 1.25), note(65, 3)];
  for (const name of ["rhythmic", "gapVariance", "densityCurve",
                      "velocityEnvelope", "rhythmicSignature"]) {
    assert.equal(typeof analysis[name], "function", `${name} is missing`);
    assert.doesNotThrow(() => analysis[name](notes), `${name} threw`);
  }
});

/* --- edge cases ---------------------------------------------------------- */

test("metrics survive degenerate input", () => {
  for (const name of PITCH_METRICS) {
    assert.doesNotThrow(() => analysis[name]([]), `${name} threw on []`);
    assert.doesNotThrow(() => analysis[name]([60]), `${name} threw on a single note`);
  }
});

/* --- analyze() ----------------------------------------------------------- */

test("analyze() returns a keyed report covering several metrics", () => {
  const report = analysis.analyze(SCALE);
  assert.equal(typeof report, "object");
  assert.ok(Object.keys(report).length >= 5, "expected a multi-metric report");
  for (const [name, value] of Object.entries(report)) {
    if (typeof value === "number") {
      assert.ok(Number.isFinite(value), `analyze().${name} is ${value}`);
    }
  }
});

/* --- public surface ------------------------------------------------------ */

test("the analysis namespace is reachable from jm", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.equal(typeof jm.analysis.gini, "function");
  assert.equal(typeof jm.analysis.rhythmCode, "function");
  assert.equal(typeof jm.analysis.emotionalMap, "function");
  assert.equal(jm.analysis.MusicalAnalysis, undefined, "one flat layer, no classes");
});
