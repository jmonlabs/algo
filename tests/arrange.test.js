/**
 * Tests for jm.arrange: the montage of a piece.
 *
 * Run with: node --test tests/arrange.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import jm from "../src/index.js";
import { arrange } from "../src/arrange.js";

const n = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, time, duration, velocity });

test("arrange puts sections end to end by their length, one track per part", () => {
  const pad = [n(50, 0, 4), n(53, 4, 4)];
  const melody = [n(62, 0, 1), n(64, 1, 0.5)];
  const parts = {
    pad: { label: "Pad", synth: 48, notes: pad },
    melody: { label: "Melody", synth: 69, notes: melody },
    unused: { label: "Unused", synth: 0, notes: [n(60, 0)] },
  };
  const sections = {
    intro: { length: 8, parts: ["pad"] },
    verse: { length: 16, parts: { pad: { velocity: 0.3 }, melody: { time: 2, octave: 1 } } },
  };
  const piece = arrange(["intro", "verse", "intro"], { sections, parts, tempo: 96 });
  assert.equal(piece.tempo, 96, "the rest is the piece's own");
  const tracks = piece.tracks;
  assert.deepEqual(tracks.map((t) => t.label), ["Pad", "Melody"], "one track per part used, in the order of parts");
  assert.equal(tracks[0].synth, 48);
  assert.deepEqual(tracks[0].notes.map((x) => x.time), [0, 4, 8, 12, 24, 28], "each section starts at the sum of the lengths before it");
  assert.deepEqual(tracks[0].notes.map((x) => x.velocity), [0.8, 0.8, 0.3, 0.3, 0.8, 0.8], "the velocity is set for that section only");
  assert.deepEqual(tracks[1].notes.map((x) => [x.pitch, x.time]), [[74, 10], [76, 11]], "offset and octave inside the section");
  assert.throws(() => arrange(["bridge"], { sections, parts }), /no section "bridge"/);
  assert.throws(() => arrange(["x"], { sections: { x: { length: 4, parts: ["drums"] } }, parts }), /"drums", which is not a part/);
  assert.throws(() => arrange(["x"], { sections: { x: { parts: ["pad"] } }, parts }), /needs a length/);
});

test("arrange is reached as jm.arrange", () => {
  assert.equal(jm.arrange, arrange);
});
