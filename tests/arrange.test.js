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

const pad = { label: "Pad", synth: 48 };
const bass = { label: "Bass", synth: 33 };

test("arrange puts sections end to end and gathers tracks by label", () => {
  const intro = { length: 8, tracks: [{ ...pad, notes: [n(50, 0, 8)] }] };
  const verse = { length: 16, tracks: [{ ...pad, notes: [n(53, 0, 16)] }, { ...bass, notes: [n(38, 0), n(38, 2)] }] };
  const piece = arrange([intro, verse, verse], { tempo: 96, title: "t" });
  assert.equal(piece.tempo, 96);
  assert.equal(piece.title, "t");
  assert.deepEqual(piece.tracks.map((t) => [t.label, t.synth]), [["Pad", 48], ["Bass", 33]], "one track per label, in order of first appearance");
  assert.deepEqual(piece.tracks[0].notes.map((x) => [x.pitch, x.time]), [[50, 0], [53, 8], [53, 24]], "each section starts at the sum of the lengths before it");
  assert.deepEqual(piece.tracks[1].notes.map((x) => x.time), [8, 10, 24, 26]);
});

test("a section's length is its own: short notes leave silence, long notes run over", () => {
  const a = { length: 4, tracks: [{ ...bass, notes: [n(38, 0, 0.9)] }] };
  const b = { length: 4, tracks: [{ ...pad, notes: [n(50, 0, 10)] }] };
  const piece = arrange([a, b, a]);
  assert.deepEqual(piece.tracks.find((t) => t.label === "Bass").notes.map((x) => x.time), [0, 8]);
  assert.equal(piece.tracks.find((t) => t.label === "Pad").notes[0].duration, 10, "a held note is not cut");
});

test("arrange keeps a track's other fields and refuses two synths for one label", () => {
  const withOutput = { length: 4, tracks: [{ ...pad, output: "padBus", notes: [n(50, 0)] }] };
  assert.equal(arrange([withOutput]).tracks[0].output, "padBus");
  const other = { length: 4, tracks: [{ label: "Pad", synth: 0, notes: [n(50, 0)] }] };
  assert.throws(() => arrange([withOutput, other]), /"Pad" has two synths/);
  assert.throws(() => arrange([{ tracks: [] }]), /section 0 needs a length/);
  assert.throws(() => arrange([{ length: 4, tracks: [{ synth: 0, notes: [] }] }]), /has no label/);
});

test("arrange is reached as jm.arrange", () => {
  assert.equal(jm.arrange, arrange);
});
