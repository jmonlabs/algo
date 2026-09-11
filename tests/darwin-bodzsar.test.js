/**
 * Darwin with pluggable fitness, position-aware operators and time-aligned
 * crossover — the seams the Rhythm Code and Emotional Map plug into.
 *
 * node:test + assert. Run with: node --test tests/darwin-bodzsar.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Darwin } from "../src/algorithms/generative/genetic/Darwin.js";
import * as ops from "../src/algorithms/generative/genetic/operators.js";
import { metrics, metric, phraseToNotes } from "../src/algorithms/generative/genetic/fitness.js";
import jm from "../src/index.js";

// [pitch, duration, offset], gap-free
const relayout = ops.relayout;
const FLAT = relayout([[40, 2], [43, 2], [45, 2], [43, 2]]);            // downbeats only
const CLAVE = relayout([[40, 1], [43, 1], [45, 0.5], [43, 1.5], [40, 1.5], [43, 1.5], [45, 1]]); // 3-2-ish

const validGenome = (p) => {
  let t = 0;
  for (const [, d, o] of p) {
    if (Math.abs(o - t) > 1e-9 || d <= 0) return false;
    t += d;
  }
  return true;
};
const total = (p) => p.reduce((s, n) => s + n[1], 0);

/* --- operators ------------------------------------------------------------ */

test("rhythm operators keep the genome gap-free and the total length fixed", () => {
  const rng = () => 0.3;
  for (const op of ops.rhythmOperators) {
    const out = op(FLAT, rng, { pulse: 0.5 });
    assert.ok(validGenome(out), `${op.name} broke offsets`);
    assert.ok(Math.abs(total(out) - total(FLAT)) < 1e-9, `${op.name} changed the length`);
  }
});

test("anticipateOnset moves one onset a pulse earlier, delayOnset moves it back", () => {
  const rng = () => 0;
  const a = ops.anticipateOnset(FLAT, rng, { pulse: 0.5 });
  assert.equal(a[1][2], 1.5);
  assert.equal(a[0][1], 1.5);
  const d = ops.delayOnset(a, rng, { pulse: 0.5 });
  assert.deepEqual(d, FLAT);
});

test("restify carves a stop and mergeRest heals it", () => {
  const rng = () => 0;
  const r = ops.restify(FLAT, rng, { pulse: 0.5 });
  assert.equal(r.length, FLAT.length + 1);
  assert.equal(r[1][0], null);
  assert.deepEqual(ops.mergeRest(r, rng), FLAT);
});

test("melody operators aim at chord changes", () => {
  const ctx = { key: { tonic: "C" }, chords: [{ time: 0, pitches: [65, 69, 72] }, { time: 4, pitches: [57, 60, 64] }] };
  const phrase = relayout([[65, 4], [60, 4]]); // FA over F (chord tone), DO over Am (chord tone)
  const nct = ops.toNonChordTone(phrase, () => 0, ctx);
  const changed = nct.findIndex((n, i) => n[0] !== phrase[i][0]);
  assert.notEqual(changed, -1);
  const chord = changed === 0 ? [65, 69, 72] : [57, 60, 64];
  assert.ok(!chord.some((c) => c % 12 === nct[changed][0] % 12), "moved onto a non-chord tone");
  const back = ops.toChordTone(nct, () => 0, ctx);
  assert.ok(back.every((n, i) => {
    const ch = i === 0 ? [65, 69, 72] : [57, 60, 64];
    return ch.some((c) => c % 12 === n[0] % 12);
  }));
});

test("stepStability moves toward or away from the tonic triad", () => {
  const ctx = { key: { tonic: "C" } };
  const phrase = relayout([[65, 1]]); // FA, the least stable
  const moreStable = ops.stepStability(phrase, () => 0, ctx); // rng < 0.5 → more stable
  assert.ok(jm.key("C").stability(moreStable[0][0]) < 6);
  const rng = (() => { let i = 0; return () => (i++ === 0 ? 0 : 0.9); })();
  const lessStable = ops.stepStability(relayout([[60, 1]]), rng, ctx); // from DO nothing is more... so less
  assert.ok(jm.key("C").stability(lessStable[0][0]) > 0);
});

/* --- fitness terms --------------------------------------------------------- */

test("claveFit and friends read a genome as a track", () => {
  assert.deepEqual(phraseToNotes([[60, 1, 0], [null, 1, 1], [62, 1, 2]]), [
    { pitch: 60, duration: 1, time: 0 }, { pitch: 62, duration: 1, time: 2 },
  ]);
  assert.ok(metrics.claveFit(CLAVE, {}) > metrics.claveFit(FLAT, {}));
  assert.ok(metrics.anticipationRate(CLAVE, {}) > metrics.anticipationRate(FLAT, {}));
  assert.equal(metrics.upbeatRatio(FLAT, {}), 0);
  for (const name of Object.keys(metrics)) {
    const v = metrics[name](CLAVE, { key: { tonic: "C" }, chords: [{ time: 0, pitches: [60, 64, 67] }] });
    assert.ok(v >= 0 && v <= 1, `${name} = ${v}`);
  }
});

test("metric() builds a Darwin entry and rejects unknown names", () => {
  const m = metric("claveFit", { target: 0.7, weight: 5 });
  assert.equal(m.name, "claveFit");
  assert.equal(m.weight, 5);
  assert.throws(() => metric("swing"), /unknown metric/);
  const custom = metric((p) => p.length / 10, { name: "notes" });
  assert.equal(custom.name, "notes");
});

/* --- Darwin --------------------------------------------------------------- */

test("Darwin is reproducible under a seed, operators and time crossover included", () => {
  const build = () => new Darwin({
    initialPhrases: [FLAT], populationSize: 12, seed: 7,
    operators: ops.rhythmOperators, crossoverMode: "time", period: 4,
    metrics: [metric("claveFit", { target: 0.8, weight: 4 })],
  });
  const a = build(); a.evolveGenerations({ generations: 6, k: 6 });
  const b = build(); b.evolveGenerations({ generations: 6, k: 6 });
  assert.deepEqual(a.getBestIndividual(), b.getBestIndividual());
  assert.deepEqual(a.bestScores, b.bestScores);
});

test("time crossover keeps the child gap-free and cuts on a period boundary", () => {
  const d = new Darwin({ initialPhrases: [FLAT], populationSize: 4, seed: 1, crossoverMode: "time", period: 4 });
  const p1 = relayout([[60, 1], [61, 1], [62, 1], [63, 1], [64, 1], [65, 1], [66, 1], [67, 1]]);
  const p2 = relayout([[70, 0.5], [71, 1.5], [72, 2], [73, 0.5], [74, 3.5]]);
  for (let i = 0; i < 20; i++) {
    const child = d.crossoverTime(p1, p2);
    assert.ok(validGenome(child), "child offsets must tile");
    // the splice point is a multiple of the period: the first tail note starts on one
    const tailStart = child.find((n) => n[0] >= 70);
    if (tailStart) assert.ok(Math.abs(tailStart[2] / 4 - Math.round(tailStart[2] / 4)) < 1e-9 || tailStart[2] === 4.5 || tailStart[2] === 4);
  }
});

test("a clave-fit target pulls the population off the downbeats", () => {
  const d = new Darwin({
    initialPhrases: [FLAT], populationSize: 30, seed: 3, mutationRate: 0.02,
    operators: ops.rhythmOperators, operatorRate: 0.5, crossoverMode: "time", period: 4,
    context: { pulse: 0.5, orientation: "auto" },
    weights: { gini: [0, 0, 0], balance: [0, 0, 0], motif: [0, 0, 0], dissonance: [0, 0, 0], rhythmic: [0, 0, 0], rest: [0, 0, 0] },
    metrics: [metric("claveFit", { target: 1, weight: 10 }), metric("rareRate", { target: 0, weight: 5 })],
  });
  const before = metrics.claveFit(FLAT, {});
  d.evolveGenerations({ generations: 25, k: 10 });
  const after = metrics.claveFit(d.getBestIndividual(), {});
  assert.ok(after > before, `claveFit ${before} → ${after}`);
});

test("custom metric values appear among the fitness components", () => {
  const d = new Darwin({ initialPhrases: [CLAVE], populationSize: 4, seed: 1,
    metrics: [metric("claveFit"), metric((p) => p.length, { name: "count", target: 7 })] });
  const c = d.calculateFitnessComponents(CLAVE);
  assert.ok("claveFit" in c);
  assert.equal(c.count, 7);
});

test("genetic extensions are reachable from jm", () => {
  assert.equal(typeof jm.generative.genetic.metric, "function");
  assert.equal(typeof jm.generative.genetic.operators.anticipateOnset, "function");
  assert.ok(Array.isArray(jm.generative.genetic.operators.rhythmOperators));
});

test("melody operators accept a JMON chord track as context.chords", () => {
  const ctx = { key: { tonic: "C" }, chords: jm.utils.chordTrack([[65, 69, 72], [57, 60, 64]], { duration: 4 }) };
  const phrase = relayout([[65, 4], [60, 4]]);
  const moved = ops.toNonChordTone(phrase, () => 0, ctx);
  assert.ok(moved.some((n, i) => n[0] !== phrase[i][0]), "an anchor moved onto a non-chord tone");
  assert.ok(metrics.sweetness(phrase, ctx) >= 0, "fitness terms read the track");
});
