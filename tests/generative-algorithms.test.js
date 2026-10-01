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

import { CellularAutomata } from "../src/generative/cellular-automata/CellularAutomata.js";
import { Mandelbrot } from "../src/generative/fractals/Mandelbrot.js";
import { Julia } from "../src/generative/fractals/Julia.js";
import { LogisticMap } from "../src/generative/fractals/LogisticMap.js";
import { Chain } from "../src/generative/walks/Chain.js";
import { RandomWalk } from "../src/generative/walks/RandomWalk.js";
import { Phasor, PhasorSystem } from "../src/generative/walks/PhasorWalk.js";
import { Tintinnabuli } from "../src/generative/minimalism/MinimalismProcess.js";
import { unfold, phase } from "../src/generative/index.js";
import { Darwin } from "../src/generative/genetic/Darwin.js";
import { drummer, presets } from "../src/generative/drummer/index.js";

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

test("pitches maps each row of a strip onto a pitch set", () => {
  // A strip is a 2-D binary grid: one row per step, one column per pitch.
  const strip = [[1, 0, 0], [0, 0, 1], [0, 1, 0]];
  assert.deepEqual(CellularAutomata.pitches(strip, [60, 62, 64]), [60, 64, 62]);
});

test("pitches returns a chord for a row with several live cells", () => {
  assert.deepEqual(
    CellularAutomata.pitches([[1, 0, 1], [0, 0, 0]], [60, 62, 64]),
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

test("sequence pulls a 1-D series out of the plane along a path", () => {
  const mb = new Mandelbrot({ width: 5, height: 5, maxIterations: 20 });
  for (const path of ["diagonal", "border", "spiral", "column", "row"]) {
    const seq = mb.sequence({ path });
    assert.ok(Array.isArray(seq), `${path} did not return an array`);
    assert.ok(seq.length > 0, `${path} returned nothing`);
    assert.ok(seq.every(Number.isFinite), `${path} produced non-finite values`);
  }
  assert.equal(mb.sequence({ path: "spiral" }).length, 25, "the spiral visits every cell");
  assert.deepEqual(mb.sequence({ path: "row", index: 2 }), mb.generate()[2]);
  assert.throws(() => mb.sequence({ path: "zigzag" }), /unknown path/);
});

test("notes reads the plane as a piano roll and merges held cells", () => {
  const mb = new Mandelbrot({ width: 8, height: 4, maxIterations: 20 });
  const notes = mb.notes({ pitches: [60, 62, 64, 65], duration: 0.5 });
  assert.ok(notes.length > 0);
  assert.ok(notes.every((n) => [60, 62, 64, 65].includes(n.pitch) && n.velocity >= 0.2 && n.velocity <= 1));
  assert.ok(notes.every((n, i) => i === 0 || n.time >= notes[i - 1].time), "sorted by time");
  assert.throws(() => mb.notes({}), /pitches/);
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
    range: [0, 10], start: 5, steps: [-1, 0, 1], roundTo: 0,
  });
  const walk = build().line({ length: 20, seed: 42 });

  assert.equal(walk.length, 20);
  assert.ok(walk.every((v) => v >= 0 && v <= 10), "walk left [0,10]");
  assert.deepEqual(build().line({ length: 20, seed: 42 }), walk);
  assert.notDeepEqual(build().line({ length: 20, seed: 7 }), walk);
});

test("Chain.generate returns branches, line() flattens to one", () => {
  const chain = new Chain({
    range: [0, 10], start: 5, steps: [-1, 0, 1], roundTo: 0,
  });
  const branches = chain.generate({ length: 10, seed: 42 });

  assert.ok(Array.isArray(branches));
  assert.ok(Array.isArray(branches[0]), "generate() should nest its walks");
  assert.equal(chain.line({ length: 10, seed: 42 }).length, 10);
});

test("Chain steps only by the offsets it was given", () => {
  const walk = new Chain({
    range: [0, 100], start: 50, steps: [-2, 2], roundTo: 0,
  }).line({ length: 30, seed: 3 });

  for (let i = 1; i < walk.length; i++) {
    assert.ok([-2, 2].includes(walk[i] - walk[i - 1]), `illegal step ${walk[i] - walk[i - 1]}`);
  }
});

test("RandomWalk stays in its bounds and repeats for a seed", () => {
  const walk = new RandomWalk({ dimensions: 2, stepSize: 2, bounds: [-10, 10], branching: 0.2, merging: 0.5 });
  const out = walk.generate({ length: 40, seed: 3 });
  assert.equal(out.length, 40);
  assert.ok(out.every((p) => p.length === 2 && p.every((v) => v >= -10 && v <= 10)));
  assert.deepEqual(out, walk.generate({ length: 40, seed: 3 }));
  assert.notDeepEqual(out, walk.generate({ length: 40, seed: 4 }));
  const line = walk.line({ length: 10, seed: 3, dimension: 1 });
  assert.equal(line.length, 10);
  assert.ok(line.every(Number.isFinite));
  assert.throws(() => walk.generate({}), /length/);
});

test("an attractor pulls the walk toward its position", () => {
  const free = new RandomWalk({ stepSize: 1 }).line({ length: 200, seed: 1, start: [50] });
  const pulled = new RandomWalk({ stepSize: 1, attractor: { strength: 0.1 } }).line({ length: 200, seed: 1, start: [50] });
  const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  assert.ok(Math.abs(mean(pulled)) < Math.abs(mean(free)), "the pulled walk sits nearer 0");
});

test("a phasor turns around its centre, and its sub-phasors around it", () => {
  const moon = new Phasor({ distance: 0.5, frequency: 4 });
  const planet = new Phasor({ distance: 2, frequency: 1, subPhasors: [moon] });
  const at0 = planet.position(0);
  assert.deepEqual([at0.x, at0.y], [2, 0]);
  const results = planet.simulate([0, Math.PI / 2]);
  assert.equal(results.length, 4, "planet and moon, at two times");
  assert.ok(Math.abs(results[1].distance - 2.5) < 1e-9, "the moon at time 0 is 2.5 from the origin");
  assert.ok(results.every((r) => Number.isFinite(r.distance) && r.angle >= 0 && r.angle < 360));
});

test("a phasor system reads its phasors as notes", () => {
  const system = new PhasorSystem({ phasors: [new Phasor({ distance: 1 }), new Phasor({ distance: 3, frequency: 0.5 })] });
  const times = PhasorSystem.times({ start: 0, end: 4, steps: 5 });
  assert.deepEqual(times, [0, 1, 2, 3, 4]);
  const notes = system.notes(times, { pitchRange: [60, 72], pitches: [60, 62, 64, 65, 67, 69, 71, 72] });
  assert.equal(notes.length, 2);
  assert.equal(notes[0].length, 5);
  assert.ok(notes.flat().every((n) => [60, 62, 64, 65, 67, 69, 71, 72].includes(n.pitch) && n.duration > 0));
  assert.deepEqual(notes[0].map((n) => n.time), times);
});

/* --- minimalism ---------------------------------------------------------- */

test("additive forward accumulates the sequence note by note", () => {
  const out = unfold(SEQ, { operation: "additive", direction: "forward" });
  assert.deepEqual(out.map((n) => n.pitch), [60, 60, 62, 60, 62, 64]);
});

test("subtractive forward peels the sequence from the front", () => {
  const out = unfold(SEQ, { operation: "subtractive", direction: "forward" });
  assert.deepEqual(out.map((n) => n.pitch), [60, 62, 64, 62, 64, 64]);
});

test("every operation/direction pair produces sorted, non-negative timing", () => {
  for (const operation of ["additive", "subtractive"]) {
    for (const direction of ["forward", "backward", "inward", "outward"]) {
      const out = unfold(SEQ, { operation, direction });
      assert.ok(out.length > 0, `${operation}/${direction} produced nothing`);
      const times = out.map((n) => n.time);
      assert.deepEqual([...times].sort((a, b) => a - b), times, `${operation}/${direction} unsorted`);
      assert.ok(times.every((t) => t >= 0), `${operation}/${direction} went negative`);
    }
  }
});

test("unfold validates its options", () => {
  assert.throws(() => unfold(SEQ, { operation: "sideways", direction: "forward" }), /Invalid operation/);
  assert.throws(() => unfold(SEQ, { operation: "additive", direction: "sideways" }), /Invalid direction/);
  assert.throws(() => unfold(SEQ, { operation: "additive", direction: "forward", repetition: -1 }), /Invalid repetition/);
});

test("unfold still accepts djalgo tuples", () => {
  const tuples = [[60, 1, 0], [62, 1, 1], [64, 1, 2]];
  const out = unfold(tuples, { operation: "additive", direction: "forward" });
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

test("phase returns two voices that drift apart", () => {
  const out = phase(SEQ, { cycles: 2, shift: 0.25 });
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

  const perGeneration = darwin.evolve({ generations: 3, survivors: 6 });
  assert.equal(perGeneration.length, 3, "one entry per generation");

  const best = darwin.best();
  assert.ok(best, "no best individual after evolving");

  // history() returns a report object, not an array.
  const history = darwin.history();
  assert.equal(typeof history, "object");
  assert.ok(Array.isArray(history.scores), "history.scores should be an array");
  assert.ok(Array.isArray(history.individuals));
  assert.equal(history.generations, 3);

  const stats = darwin.stats();
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
  a.evolve({ generations: 2, survivors: 5 });
  b.evolve({ generations: 2, survivors: 5 });
  assert.deepEqual(a.best(), b.best());
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

test("the style grid decides where the drums land", () => {
  const GM_KICK = 36;
  const onsets = (style, pitch) => {
    // humanize: 0 so onsets sit exactly on the grid
    return drummer({ style, bars: 1, variation: "fixed", seed: 1, humanize: 0 })
      .filter((h) => h.pitch === pitch)
      .map((h) => h.time);
  };

  // house: four-on-the-floor — kick on every beat
  assert.deepEqual(onsets("house", GM_KICK), [0, 1, 2, 3]);
  // rock: kick on 1 and 3 only
  assert.deepEqual(onsets("rock", GM_KICK), [0, 2]);
  // reggae one-drop: nothing on beat 1, kick on beat 3
  assert.deepEqual(onsets("reggae", GM_KICK), [2]);
});

test("each style plays its own instrument layers", () => {
  const GM = { ride: 51, clap: 39, hihat: 42 };
  const pitches = (style) => new Set(
    drummer({ style, bars: 2, variation: "fixed", seed: 1 }).map((h) => h.pitch),
  );

  assert.ok(pitches("jazz").has(GM.ride), "jazz keeps time on the ride");
  assert.ok(pitches("house").has(GM.clap), "house claps the backbeat");
  assert.ok(pitches("rock").has(GM.hihat), "rock keeps time on the hihat");
});

test("a seeded non-live drummer is reproducible, and probability shapes accents", () => {
  const build = () => drummer({ style: "funk", bars: 4, variation: "follow", seed: 9,
    leader: [{ pitch: 40, time: 0, duration: 1 }] });
  assert.deepEqual(build(), build(), "same seed, same leader — same take");

  // In the funk grid the backbeat snare (p=0.9) must come out louder than
  // any ghost-slot snare (p≤0.25). diverge samples the grid under the given
  // seed (unlike live), so the roll is reproducible and ghosts do land.
  const GM_SNARE = 38;
  const hits = drummer({
    style: "funk", bars: 8, variation: "diverge", seed: 3, humanize: 0,
    fillEvery: 0, leader: [{ pitch: 40, time: 1000, duration: 1 }],
  }).filter((h) => h.pitch === GM_SNARE);
  const backbeat = hits.filter((h) => [1, 3].includes(h.time % 4));
  const ghosts = hits.filter((h) => ![1, 3].includes(h.time % 4));
  assert.ok(backbeat.length > 0, "no backbeat snare");
  assert.ok(ghosts.length > 0, "the roll landed no ghost notes — pick another seed");
  for (const g of ghosts) {
    for (const b of backbeat) {
      assert.ok(g.velocity < b.velocity, "ghost slots must be quieter than the backbeat");
    }
  }
});

test("multi-meter sections keep the meter's anchors and add the style's layers", () => {
  const GM = { kick: 36, clap: 39, openhat: 46 };
  const hits = drummer({
    style: "house",
    sections: [{ meter: 3.5, bars: 2 }],
    variation: "fixed",
    seed: 1,
    humanize: 0,
  });
  // Meter anchors: 7/8 kick pattern starts every bar at 0, 1.5, 2.5.
  const kicks = hits.filter((h) => h.pitch === GM.kick).map((h) => h.time);
  for (const anchor of [0, 1.5, 2.5, 3.5, 5, 6]) {
    assert.ok(kicks.some((t) => Math.abs(t - anchor) < 1e-9), `missing kick anchor at ${anchor}`);
  }
  // Style layer: house's off-beat open hihat survives the odd meter.
  assert.ok(hits.some((h) => h.pitch === GM.openhat), "style cymbal layer missing");
  assert.ok(hits.every((h) => h.time < 7), "3.5 × 2 beats is the whole span");
});

/* --- project and rescale ------------------------------------------------- */

test("project maps a series onto a list by rank, keeping nulls", async () => {
  const { project, rescale } = await import("../src/generative/index.js");
  assert.deepEqual(project([0, 5, 10], [60, 64, 67]), [60, 64, 67]);
  assert.deepEqual(project([3, null, 3], ["a", "b"]), ["a", null, "a"], "a flat series lands on the first target");
  assert.deepEqual(project([0, 0.49, 0.5, 1], [1, 2]), [1, 1, 2, 2]);
  assert.throws(() => project([1, 2], []), /targets/);
  const scaled = rescale([2, 4, 6], { min: 0.3, max: 0.9 });
  [0.3, 0.6, 0.9].forEach((v, i) => assert.ok(Math.abs(scaled[i] - v) < 1e-12));
  assert.deepEqual(rescale([], { min: 0, max: 1 }), []);
});
