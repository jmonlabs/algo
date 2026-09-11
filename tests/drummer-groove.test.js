/**
 * The drummer's clave orientation and decorations.
 *
 * node:test + assert. Run with: node --test tests/drummer-groove.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { drummer } from "../src/algorithms/generative/drummer/index.js";
import { detectOrientation } from "../src/algorithms/analysis/RhythmCode.js";

const GM = { kick: 36, snare: 38, hihat: 42, openhat: 46, crash: 49, rim: 37, tomLow: 41 };
const only = (hits, pitch) => hits.filter((h) => h.pitch === pitch);

test("orientation reweights the kick so bar A and bar B differ, and the analysis hears it", () => {
  for (const orientation of ["2-3", "3-2"]) {
    const hits = drummer({ style: "funk", bars: 16, variation: "diverge", seed: 11, humanize: 0,
      orientation, fillEvery: 0, decorations: false, leader: [{ pitch: 40, time: 1000, duration: 1 }] });
    const kicks = only(hits, GM.kick);
    assert.ok(kicks.length > 8, "the kick still plays");
    const heard = detectOrientation(kicks);
    assert.equal(heard.orientation, orientation, `asked ${orientation}, heard ${heard.orientation}`);
  }
  assert.throws(() => drummer({ style: "rock", bars: 2, orientation: "4-4" }), /orientation/);
});

test("under fixed, an X place loses its kick: house four-on-the-floor drops beat 2 of the 3 side", () => {
  const kicks = only(drummer({ style: "house", bars: 2, variation: "fixed", seed: 1, humanize: 0, orientation: "2-3", decorations: false }), GM.kick)
    .map((h) => h.time);
  assert.ok(kicks.includes(1), "beat 2 of the 2 side is a frequent place");
  assert.ok(!kicks.includes(5), "beat 2 of the 3 side is the X");
});

test("decorations add ghost snares and open hats to a sampled take, and can be turned off", () => {
  // live with an explicit seed: sampled, reproducible, and the hihat layer stays
  const base = { style: "rock", bars: 8, variation: "live", seed: 5, humanize: 0, fillEvery: 0 };
  const plain = drummer({ ...base, decorations: false });
  assert.deepEqual(drummer({ ...base, decorations: false }), plain, "a seeded live take is reproducible");
  const dressed = drummer({ ...base, decorations: { ghosts: 0.6, openhat: 1, crash: false } });
  assert.ok(only(dressed, GM.snare).length > only(plain, GM.snare).length, "ghost snares");
  assert.ok(only(dressed, GM.openhat).length > 0 && only(plain, GM.openhat).length === 0, "open hats on the and-of-4");
  const offBeat = only(dressed, GM.snare).filter((h) => (h.time * 4) % 2 === 1);
  const back = only(dressed, GM.snare).filter((h) => [1, 3].includes(h.time % 4));
  assert.ok(offBeat.length > 0);
  for (const g of offBeat) for (const b of back) assert.ok(g.velocity < b.velocity, "ghosts are quiet");
});

test("crashes mark phrase starts", () => {
  const hits = drummer({ style: "rock", bars: 16, variation: "fixed", seed: 1, humanize: 0, decorations: { phrase: 8 } });
  assert.deepEqual(only(hits, GM.crash).map((h) => h.time), [0, 32]);
  assert.equal(only(drummer({ style: "rock", bars: 16, variation: "fixed", seed: 1, decorations: false }), GM.crash).length, 0);
});

test("the clave sidestick plays the son clave in the requested orientation", () => {
  const hits = drummer({ style: "rock", bars: 2, variation: "diverge", seed: 1, humanize: 0, orientation: "3-2",
    fillEvery: 0, decorations: { clave: 1, crash: false, ghosts: 0, openhat: 0 }, leader: [{ pitch: 40, time: 1000, duration: 1 }] });
  assert.deepEqual(only(hits, GM.rim).map((h) => h.time), [0, 1.5, 3, 5, 6]);
});

test("fills come in shapes, and half fills keep the groove in the first half", () => {
  // 5 bars so bar 4 (beats 12-16) is a fill bar and not the last bar
  const base = { style: "rock", bars: 5, variation: "live", seed: 2, humanize: 0, fillEvery: 4 };
  const roll = drummer({ ...base, decorations: { fills: ["snareRoll"], halfFills: 0, crash: false, ghosts: 0 } });
  const fillBar = roll.filter((h) => h.time >= 12 && h.time < 16);
  assert.ok(only(fillBar, GM.snare).length >= 16, "a snare roll fills every step");
  const toms = drummer({ ...base, decorations: { fills: ["toms"], halfFills: 1, crash: false, ghosts: 0 } });
  const firstHalf = toms.filter((h) => h.time >= 12 && h.time < 14);
  assert.ok(only(firstHalf, GM.hihat).length > 0, "the groove plays through the first half of a half fill");
  assert.ok(only(toms.filter((h) => h.time >= 14 && h.time < 16), GM.tomLow).length > 0);
});

test("multi-meter sections still get fills, now meter-sized", () => {
  const hits = drummer({ style: "rock", sections: [{ meter: 3, bars: 8 }], variation: "diverge", seed: 4, humanize: 0,
    fillEvery: 4, decorations: { fills: ["toms"], halfFills: 0, crash: false }, leader: [{ pitch: 40, time: 1000, duration: 1 }] });
  assert.ok(hits.every((h) => h.time < 24));
  const fill = hits.filter((h) => h.time >= 9 && h.time < 12);
  assert.ok(only(fill, GM.tomLow).length > 0, "fill lands in the 4th bar of 3/4");
});
