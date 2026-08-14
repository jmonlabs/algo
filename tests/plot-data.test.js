/**
 * Tests for the toPlotData() family — the data-shaping helpers that replaced
 * the removed `visualization/` renderers.
 *
 * These use node:test + assert, so a failure actually fails the process.
 * Run with: node --test tests/plot-data.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Mandelbrot } from "../src/algorithms/generative/fractals/Mandelbrot.js";
import { Julia } from "../src/algorithms/generative/fractals/Julia.js";
import { BurningShip } from "../src/algorithms/generative/fractals/BurningShip.js";
import { Fractal } from "../src/algorithms/generative/fractals/Fractal.js";
import { Loop } from "../src/algorithms/generative/loops/Loop.js";
import { CellularAutomata } from "../src/algorithms/generative/cellular-automata/CellularAutomata.js";

const GRID = { width: 7, height: 5, maxIterations: 20 };
const JULIA_C = { c: { real: -0.4, imaginary: 0.6 } };

/** The reshape that used to live inline in userguide/07-fractals.html. */
function referenceReshape(grid) {
  const out = [];
  grid.forEach((row, y) => row.forEach((value, x) => out.push({ x, y, value })));
  return out;
}

test("ComplexPlaneFractal.toPlotData matches the reference reshape", () => {
  for (const [name, F, extra] of [
    ["Mandelbrot", Mandelbrot, {}],
    ["Julia", Julia, JULIA_C],
    ["BurningShip", BurningShip, {}],
  ]) {
    const f = new F({ ...GRID, ...extra });
    const grid = f.generate();
    assert.deepEqual(
      f.toPlotData(grid),
      referenceReshape(grid),
      `${name}.toPlotData(grid) diverged from the reference reshape`,
    );
  }
});

test("toPlotData() without a grid generates one itself", () => {
  const mb = new Mandelbrot(GRID);
  assert.deepEqual(mb.toPlotData(), mb.toPlotData(mb.generate()));
});

test("toPlotData returns one row per cell, with in-range coordinates", () => {
  const mb = new Mandelbrot(GRID);
  const data = mb.toPlotData();

  assert.equal(data.length, GRID.width * GRID.height);
  for (const { x, y, value } of data) {
    assert.ok(x >= 0 && x < GRID.width, `x out of range: ${x}`);
    assert.ok(y >= 0 && y < GRID.height, `y out of range: ${y}`);
    assert.ok(Number.isFinite(value), `value not finite: ${value}`);
  }
});

test("the Fractal factory yields instances that carry toPlotData", () => {
  for (const type of Fractal.types()) {
    const opts = type === "julia" ? { ...GRID, ...JULIA_C } : GRID;
    const f = Fractal(type, opts);
    assert.equal(typeof f.toPlotData, "function", `${type} lacks toPlotData`);
    assert.equal(f.toPlotData().length, GRID.width * GRID.height);
  }
});

test("Loop.toPlotData emits sounding notes and drops rests", () => {
  // Euclidean 3/8 places 3 onsets across 8 beats; the gaps are null-pitch rests.
  const loop = Loop.euclidean(8, 3, [60]);
  const data = loop.toPlotData();

  assert.equal(data.length, 3, "expected exactly the 3 Euclidean onsets");
  assert.deepEqual(data.map((d) => d.time), [1, 4, 7]);
  for (const row of data) {
    assert.equal(row.pitch, 60);
    assert.equal(row.loop, "Euclidean 3/8");
    assert.ok(Number.isFinite(row.duration));
    assert.ok(Number.isFinite(row.velocity));
  }
});

test("Loop.toPlotData accepts a bare note array as well as a JMON track", () => {
  const loop = new Loop({
    loops: [[{ pitch: 62, duration: 1, time: 0, velocity: 0.5 }]],
    measureLength: 4,
  });
  assert.deepEqual(loop.toPlotData(), [
    { loop: "Loop 1", time: 0, duration: 1, pitch: 62, velocity: 0.5 },
  ]);
});

test("CellularAutomata.toPlotData still shapes the CA grid", () => {
  const ca = new CellularAutomata({ ruleNumber: 30, width: 9, ruleLength: 3 });
  ca.generate(4);
  const data = ca.toPlotData();

  assert.ok(data.length > 0, "expected live cells for rule 30");
  for (const row of data) {
    assert.ok(Number.isInteger(row.time));
    assert.ok(Number.isFinite(row.pitch));
  }
});

test("the removed visualization wrappers are gone from the public surface", async () => {
  const { default: jm } = await import("../src/index.js");

  assert.equal(jm.visualization, undefined, "jm.visualization should be removed");

  const ca = new CellularAutomata({ ruleNumber: 30, width: 9, ruleLength: 3 });
  for (const method of ["plotEvolution", "plotGeneration", "plotDensity"]) {
    assert.equal(ca[method], undefined, `CellularAutomata.${method} should be removed`);
  }
  assert.equal(Loop.euclidean(8, 3, [60]).plot, undefined, "Loop.plot should be removed");
});
