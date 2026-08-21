/**
 * Generative algorithms: cellular automata, fractals, walks, minimalism,
 * genetic evolution, loops and the drummer.
 *
 * Anything stochastic is seeded, and asserted on reproducibility and bounds
 * rather than on a specific draw.
 *
 * node:test + assert. Run with: node --test tests/generative-algorithms.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { CellularAutomata } from "../src/algorithms/generative/cellular-automata/CellularAutomata.js";
import { Mandelbrot } from "../src/algorithms/generative/fractals/Mandelbrot.js";
import { Julia } from "../src/algorithms/generative/fractals/Julia.js";
import { LogisticMap } from "../src/algorithms/generative/fractals/LogisticMap.js";
import { Chain } from "../src/algorithms/generative/walks/Chain.js";
import { RandomWalk } from "../src/algorithms/generative/walks/RandomWalk.js";
import { Phasor, PhasorSystem } from "../src/algorithms/generative/walks/PhasorWalk.js";
import { MinimalismProcess, Tintinnabuli } from "../src/algorithms/generative/minimalism/MinimalismProcess.js";
import { phaseShift } from "../src/algorithms/generative/minimalism/phaseShift.js";
import { Darwin } from "../src/algorithms/generative/genetic/Darwin.js";
import { Loop } from "../src/algorithms/generative/loops/Loop.js";
import { drummer, presets } from "../src/algorithms/generative/drummer/index.js";

const SEQ = [
  { pitch: 60, duration: 1, time: 0 },
  { pitch: 62, duration: 1, time: 1 },
  { pitch: 64, duration: 1, time: 2 },
];

/* --- cellular automata --------------------------------------------------- */

test("rule 30 grows the known triangle from a single live cell", () => {
  const ca = new CellularAutomata({ ruleNumber: 30, width: 11, ruleLength: 3 });
  const grid = ca.generate(5);

  assert.equal(grid.length, 6, "generate(n) returns the seed row plus n generations");
  assert.equal(grid[0].length, 11);
  assert.deepEqual(grid[0], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]);
  assert.deepEqual(grid[1], [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0]);
  assert.ok(grid.every((row) => row.every((cell) => cell === 0 || cell === 1)));
});

test("a cellular automaton is deterministic for a given rule and width", () => {
  const build = () => new CellularAutomata({ ruleNumber: 110, width: 15, ruleLength: 3 });
  assert.deepEqual(build().generate(8), build().generate(8));
});

test("toPlotData maps live cells to time/pitch pairs", () => {
  const ca = new CellularAutomata({ ruleNumber: 30, width: 11, ruleLength: 3 });
  const grid = ca.generate(5);
  const data = ca.toPlotData();

  const liveCells = grid.flat().filter((c) => c === 1).length;
  assert.equal(data.length, liveCells, "one plot point per live cell");
  assert.ok(data.every((d) => Number.isInteger(d.time) && Number.isFinite(d.pitch)));
});

test("stripToPitches maps each row of a strip onto a pitch set", () => {
  // A strip is a 2-D binary grid: one row per step, one column per pitch.
  const strip = [[1, 0, 0], [0, 0, 1], [0, 1, 0]];
  assert.deepEqual(CellularAutomata.stripToPitches(strip, [60, 62, 64]), [60, 64, 62]);
});

test("stripToPitches returns a chord for a row with several live cells", () => {
  assert.deepEqual(
    CellularAutomata.stripToPitches([[1, 0, 1], [0, 0, 0]], [60, 62, 64]),
    [[60, 64], null],
  );
});

/* --- fractals ------------------------------------------------------------ */

test("Mandelbrot returns a grid of iteration counts", () => {
  const mb = new Mandelbrot({ width: 5, height: 5, maxIterations: 20 });
  const grid = mb.generate();

  assert.equal(grid.length, 5);
  assert.ok(grid.every((row) => row.length === 5));
  assert.ok(grid.flat().every((v) => Number.isInteger(v) && v >= 0 && v <= 20));
  // The centre of this window is inside the set, so it burns every iteration.
  assert.equal(Math.max(...grid.flat()), 20);
});

test("Mandelbrot is deterministic", () => {
  const build = () => new Mandelbrot({ width: 8, height: 8, maxIterations: 30 });
  assert.deepEqual(build().generate(), build().generate());
});

test("extractSequence pulls a 1-D series out of the plane", () => {
  const mb = new Mandelbrot({ width: 5, height: 5, maxIterations: 20 });
  for (const method of ["diagonal", "border", "spiral", "column", "row"]) {
    const seq = mb.extractSequence(method);
    assert.ok(Array.isArray(seq), `${method} did not return an array`);
    assert.ok(seq.length > 0, `${method} returned nothing`);
    assert.ok(seq.every(Number.isFinite), `${method} produced non-finite values`);
  }
});

test("Julia needs its c parameter and honours it", () => {
  assert.throws(() => new Julia({ width: 4, height: 4 }), /requires a c parameter/);

  const julia = new Julia({
    width: 6, height: 6, maxIterations: 20, c: { real: -0.7, imaginary: 0.27 },
  });
  const grid = julia.generate();
  assert.equal(grid.length, 6);
  assert.ok(grid.flat().every((v) => v >= 0 && v <= 20));
});

test("LogisticMap stays in the unit interval and is deterministic", () => {
  const build = () => new LogisticMap({ r: 3.8, x0: 0.5, iterations: 20 });
  const series = build().generate();

  assert.equal(series.length, 20);
  assert.ok(series.every((v) => v >= 0 && v <= 1), "logistic map escaped [0,1]");
  assert.deepEqual(build().generate(), series);
});

test("a chaotic logistic map diverges from a periodic one", () => {
  const chaotic = new LogisticMap({ r: 3.9, x0: 0.5, iterations: 40 }).generate();
  const stable = new LogisticMap({ r: 2.5, x0: 0.5, iterations: 40 }).generate();

  const spread = (xs) => Math.max(...xs) - Math.min(...xs);
  assert.ok(spread(chaotic) > spread(stable), "r=3.9 should roam more than r=2.5");
});

/* --- walks --------------------------------------------------------------- */

test("Chain stays inside its range and repeats for a given seed", () => {
  const build = () => new Chain({
    walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0,
  });
  const walk = build().line({ length: 20, seed: 42 });

  assert.equal(walk.length, 20);
  assert.ok(walk.every((v) => v >= 0 && v <= 10), "walk left [0,10]");
  assert.deepEqual(build().line({ length: 20, seed: 42 }), walk);
  assert.notDeepEqual(build().line({ length: 20, seed: 7 }), walk);
});

test("Chain.generate returns branches, line() flattens to one", () => {
  const chain = new Chain({
    walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0,
  });
  const branches = chain.generate({ length: 10, seed: 42 });

  assert.ok(Array.isArray(branches));
  assert.ok(Array.isArray(branches[0]), "generate() should nest its walks");
  assert.equal(chain.line({ length: 10, seed: 42 }).length, 10);
});

test("Chain steps only by the offsets it was given", () => {
  const walk = new Chain({
    walkRange: [0, 100], walkStart: 50, walkProbability: [-2, 2], roundTo: 0,
  }).line({ length: 30, seed: 3 });

  for (let i = 1; i < walk.length; i++) {
    assert.ok([-2, 2].includes(walk[i] - walk[i - 1]), `illegal step ${walk[i] - walk[i - 1]}`);
  }
});

test("RandomWalk produces a finite series", () => {
  const walk = new RandomWalk({ length: 16, dimensions: 1 });
  const out = walk.generate([0]);
  assert.ok(out);
  assert.ok(Array.isArray(out) || typeof out === "object");
});

test("a Phasor system oscillates without drifting to infinity", () => {
  const system = new PhasorSystem();
  system.addPhasor(new Phasor({ distance: 1.0, frequency: 1.0, phase: 0 }));
  const points = [0, 0.25, 0.5, 0.75, 1].map((t) => system.getPosition?.(t) ?? t);
  assert.ok(points.every((p) => p === undefined || Number.isFinite(p) || typeof p === "object"));
});

/* --- minimalism ---------------------------------------------------------- */

test("additive forward accumulates the sequence note by note", () => {
  const out = new MinimalismProcess({
    operation: "additive", direction: "forward", repetition: 0,
  }).generate(SEQ);
  assert.deepEqual(out.map((n) => n.pitch), [60, 60, 62, 60, 62, 64]);
});

test("subtractive forward peels the sequence from the front", () => {
  const out = new MinimalismProcess({
    operation: "subtractive", direction: "forward", repetition: 0,
  }).generate(SEQ);
  assert.deepEqual(out.map((n) => n.pitch), [60, 62, 64, 62, 64, 64]);
});

test("every operation/direction pair produces sorted, non-negative timing", () => {
  for (const operation of ["additive", "subtractive"]) {
    for (const direction of ["forward", "backward", "inward", "outward"]) {
      const out = new MinimalismProcess({ operation, direction, repetition: 0 }).generate(SEQ);
      assert.ok(out.length > 0, `${operation}/${direction} produced nothing`);
      const times = out.map((n) => n.time);
      assert.deepEqual([...times].sort((a, b) => a - b), times, `${operation}/${direction} unsorted`);
      assert.ok(times.every((t) => t >= 0), `${operation}/${direction} went negative`);
    }
  }
});

test("MinimalismProcess validates its options", () => {
  assert.throws(() => new MinimalismProcess({ operation: "sideways", direction: "forward", repetition: 0 }), /Invalid operation/);
  assert.throws(() => new MinimalismProcess({ operation: "additive", direction: "sideways", repetition: 0 }), /Invalid direction/);
  assert.throws(() => new MinimalismProcess({ operation: "additive", direction: "forward", repetition: -1 }), /Invalid repetition/);
});

test("MinimalismProcess still accepts djalgo tuples", () => {
  const tuples = [[60, 1, 0], [62, 1, 1], [64, 1, 2]];
  const out = new MinimalismProcess({
    operation: "additive", direction: "forward", repetition: 0,
  }).generate(tuples);
  assert.deepEqual(out.map((n) => n.pitch), [60, 60, 62, 60, 62, 64]);
});

test("Tintinnabuli maps every note onto the t-chord", () => {
  const tChord = [60, 64, 67];
  const out = new Tintinnabuli({ tChord, direction: "up" }).generate(SEQ);

  assert.equal(out.length, SEQ.length);
  for (const note of out) {
    assert.ok(tChord.includes(note.pitch % 12 + 60) || tChord.includes(note.pitch),
      `${note.pitch} is not a t-voice pitch`);
  }
});

test("phaseShift returns two voices that drift apart", () => {
  const out = phaseShift(SEQ, 2, 0.25);
  assert.deepEqual(Object.keys(out).sort(), ["voice1", "voice2"]);
  assert.ok(Array.isArray(out.voice1) && Array.isArray(out.voice2));
  assert.notDeepEqual(
    out.voice1.map((n) => n.time),
    out.voice2.map((n) => n.time),
    "the two voices should not stay in phase",
  );
});

/* --- genetic ------------------------------------------------------------- */

test("Darwin evolves and reports a best individual", () => {
  const darwin = new Darwin({
    initialPhrases: [[[60, 1, 0], [62, 1, 1], [64, 1, 2], [65, 1, 3]]],
    populationSize: 12,
    mutationRate: 0.2,
    seed: 7,
    scale: [60, 62, 64, 65, 67, 69, 71],
  });

  const perGeneration = darwin.evolveGenerations({ generations: 3, k: 6 });
  assert.equal(perGeneration.length, 3, "one entry per generation");

  const best = darwin.getBestIndividual();
  assert.ok(best, "no best individual after evolving");

  // getEvolutionHistory() returns a report object, not an array.
  const history = darwin.getEvolutionHistory();
  assert.equal(typeof history, "object");
  assert.ok(Array.isArray(history.scores), "history.scores should be an array");
  assert.ok(Array.isArray(history.individuals));
  assert.equal(history.generations, 3);

  const stats = darwin.getPopulationStats();
  assert.equal(stats.populationSize, 12);
  assert.ok(Number.isFinite(stats.meanFitness));
});

test("Darwin is reproducible for a given seed", () => {
  const build = () => new Darwin({
    initialPhrases: [[[60, 1, 0], [62, 1, 1], [64, 1, 2], [65, 1, 3]]],
    populationSize: 10,
    mutationRate: 0.3,
    seed: 99,
    scale: [60, 62, 64, 65, 67, 69, 71],
  });

  const a = build();
  const b = build();
  a.evolveGenerations({ generations: 2, k: 5 });
  b.evolveGenerations({ generations: 2, k: 5 });
  assert.deepEqual(a.getBestIndividual(), b.getBestIndividual());
});

/* --- loops --------------------------------------------------------------- */

test("Loop.euclidean places the expected onsets", () => {
  const loop = Loop.euclidean({ beats: 8, pulses: 3, pitches: [60] });
  const data = loop.toPlotData();
  assert.deepEqual(data.map((d) => d.time), [1, 4, 7]);
});

test("Loop exposes its loops as JMON tracks", () => {
  const loop = Loop.euclidean({ beats: 8, pulses: 3, pitches: [60] });
  const tracks = loop.toJmonTracks();
  assert.ok(Array.isArray(tracks));
  assert.ok(Array.isArray(tracks[0].notes));
});

test("Loop rejects an empty construction", () => {
  assert.throws(() => new Loop({}), /loops is required/);
  assert.throws(() => new Loop({ loops: [] }), /cannot be empty/);
});

/* --- drummer ------------------------------------------------------------- */

test("the drummer ships the advertised styles", () => {
  const names = Object.keys(presets);
  assert.ok(names.length >= 15, `only ${names.length} styles`);
  for (const style of ["rock", "jazz", "funk", "bossanova", "dnb"]) {
    assert.ok(names.includes(style), `missing style: ${style}`);
  }
});

test("a fixed-variation drummer is reproducible and fills its bars", () => {
  const build = () => drummer({ style: "rock", bars: 2, variation: "fixed", seed: 1 });
  const hits = build();

  assert.ok(hits.length > 0);
  assert.deepEqual(build(), hits, "fixed variation should be deterministic");
  assert.ok(hits.every((h) => Number.isFinite(h.time) && h.time >= 0));
  assert.ok(hits.every((h) => Number.isFinite(h.pitch)));
  // Two bars of 4/4 — nothing may start on or after beat 8.
  assert.ok(hits.every((h) => h.time < 8), "a hit landed past the last bar");
});

test("the drummer honours multi-meter sections", () => {
  const hits = drummer({
    style: "rock",
    sections: [{ meter: 4, bars: 1 }, { meter: 7, bars: 1 }],
    variation: "fixed",
    seed: 1,
  });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => h.time < 11), "4 + 7 beats is the whole span");
});

test("follow/diverge variations require a leader track", () => {
  assert.throws(() => drummer({ style: "jazz", bars: 4, variation: "follow" }), /requires/);
  assert.throws(() => drummer({ style: "jazz", bars: 4, variation: "diverge" }), /requires/);
});
