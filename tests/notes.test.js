/**
 * Tests for jm.notes: what a composer does to a list of notes, and the
 * builders track, piece and chordNotes. The swing, the bow and the held note
 * are performance and will move with it.
 *
 * Run with: node --test tests/notes.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  invert, reverse, augment, onsets, normalize, range, span, split, deduplicate, quantize, tile, track, piece,
} from "../src/notes/index.js";
import { applySwing } from "../src/algorithms/utils.js";
import { bow, sustained } from "../src/utils/jmon-utils.js";

const n = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, time, duration, velocity });

/* --- invert -------------------------------------------------------------- */

test("invert reflects pitches around an explicit pivot", () => {
  const out = invert([n(60, 0), n(64, 1), n(67, 2)], 60);
  assert.deepEqual(out.map((x) => x.pitch), [60, 56, 53]);
});

test("invert defaults its pivot to the middle of the range", () => {
  // Range 60..64, midpoint 62 — the outer notes swap.
  const out = invert([n(60, 0), n(64, 1)]);
  assert.deepEqual(out.map((x) => x.pitch), [64, 60]);
});

test("invert handles chords element-wise and leaves rests alone", () => {
  const out = invert([{ pitch: [60, 64], time: 0, duration: 1 }, n(null, 1)], 60);
  assert.deepEqual(out[0].pitch, [60, 56]);
  assert.equal(out[1].pitch, null);
});

/* --- reverse ---------------------------------------------------------- */

test("reverse mirrors the sequence in time", () => {
  const out = reverse([n(60, 0, 1), n(62, 1, 1), n(64, 2, 1)]);
  assert.deepEqual(out.map((x) => x.pitch), [64, 62, 60]);
  assert.deepEqual(out.map((x) => x.time), [0, 1, 2]);
});

test("reverse preserves gaps rather than closing them up", () => {
  // A rest sits between the two notes; reversing must keep it.
  const out = reverse([n(60, 0, 1), n(62, 2, 1)]);
  assert.deepEqual(out.map((x) => [x.pitch, x.time]), [[62, 0], [60, 2]]);
});

test("reverse keeps simultaneous notes simultaneous", () => {
  const out = reverse([n(60, 0, 1), n(64, 0, 1), n(67, 1, 1)]);
  const atZero = out.filter((x) => x.time === 0).map((x) => x.pitch);
  assert.deepEqual(atZero, [67]);
  assert.deepEqual(out.filter((x) => x.time === 1).map((x) => x.pitch).sort(), [60, 64]);
});

test("reverse of a reverse is the original", () => {
  const original = [n(60, 0, 1), n(62, 2, 0.5), n(64, 3, 1)];
  const round = reverse(reverse(original));
  assert.deepEqual(
    round.map((x) => [x.pitch, x.time, x.duration]),
    original.map((x) => [x.pitch, x.time, x.duration]),
  );
});

/* --- augment ------------------------------------------------------------- */

test("augment scales both time and duration", () => {
  const out = augment([n(60, 0, 1), n(62, 1, 1)], 2);
  assert.deepEqual(out.map((x) => [x.time, x.duration]), [[0, 2], [2, 2]]);
});

test("augment below 1 is a diminution", () => {
  const out = augment([n(60, 0, 2), n(62, 2, 2)], 0.5);
  assert.deepEqual(out.map((x) => [x.time, x.duration]), [[0, 1], [1, 1]]);
});

test("augment keeps a chord's notes aligned", () => {
  const out = augment([n(60, 0, 1), n(64, 0, 1)], 3);
  assert.equal(out[0].time, out[1].time);
});

test("augment rejects a non-positive factor", () => {
  assert.throws(() => augment([n(60, 0)], 0), /positive number/);
  assert.throws(() => augment([n(60, 0)], -1), /positive number/);
});

/* --- applySwing ---------------------------------------------------------- */

test("applySwing delays off-beats and leaves down-beats put", () => {
  const out = applySwing([n(60, 0), n(62, 0.5), n(64, 1), n(65, 1.5)], { ratio: 0.67 });
  assert.deepEqual(out.map((x) => x.time), [0, 0.67, 1, 1.67]);
});

test("applySwing with ratio 0.5 is a no-op", () => {
  const times = [0, 0.5, 1, 1.5];
  const out = applySwing(times.map((t, i) => n(60 + i, t)), { ratio: 0.5 });
  assert.deepEqual(out.map((x) => x.time), times);
});

/* --- small queries ------------------------------------------------------- */

test("onsets returns sorted onsets", () => {
  assert.deepEqual(onsets([n(60, 2), n(62, 0), n(64, 1)]), [0, 1, 2]);
});

test("span is the latest note end, not the note count", () => {
  assert.equal(span([n(60, 0, 1), n(62, 4, 2)]), 6);
  assert.equal(span([]), 0);
});

test("range spans chords and ignores rests", () => {
  assert.deepEqual(
    range([{ pitch: [60, 67], time: 0, duration: 1 }, n(72, 1), n(null, 2)]),
    { min: 60, max: 72 },
  );
  assert.equal(range([n(null, 0)]), null);
  assert.equal(range([]), null);
});

/* --- normalize ------------------------------------------------- */

test("normalize rescales into the target range", () => {
  const out = normalize([n(60, 0, 1, 0.2), n(62, 1, 1, 0.6), n(64, 2, 1, 1.0)], { min: 0, max: 1 });
  // Compared with a tolerance: (0.6 - 0.2) / 0.8 is 0.49999999999999994 in
  // IEEE 754, which is the arithmetic being right, not the function being wrong.
  const expected = [0, 0.5, 1];
  out.forEach((note, i) => {
    assert.ok(
      Math.abs(note.velocity - expected[i]) < 1e-9,
      `velocity ${i}: expected ~${expected[i]}, got ${note.velocity}`,
    );
  });
});

test("normalize collapses a flat sequence to the midpoint", () => {
  const out = normalize([n(60, 0, 1, 0.7), n(62, 1, 1, 0.7)], { min: 0.2, max: 0.8 });
  assert.deepEqual(out.map((x) => x.velocity), [0.5, 0.5]);
});

/* --- split ------------------------------------------------------ */

test("split divides long notes into contiguous pieces", () => {
  const out = split([n(60, 0, 3)], 1);
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((x) => [x.time, x.duration]), [[0, 1], [1, 1], [2, 1]]);
});

test("split leaves short notes untouched", () => {
  const input = [n(60, 0, 0.5), n(62, 1, 1)];
  assert.deepEqual(split(input, 1), input.map((x) => ({ ...x })));
});

test("split rejects a non-positive maxDuration", () => {
  assert.throws(() => split([n(60, 0, 4)], 0), /must be positive/);
});

/* --- deduplicate ---------------------------------------------------- */

test("deduplicate merges back-to-back repeats of the same pitch", () => {
  const out = deduplicate([n(60, 0, 1), n(60, 1, 1), n(62, 2, 1)]);
  assert.equal(out.length, 2);
  assert.deepEqual([out[0].pitch, out[0].duration], [60, 2]);
});

test("deduplicate keeps repeats separated by a gap", () => {
  // Same pitch, but a rest sits between them — that is a restatement.
  const out = deduplicate([n(60, 0, 1), n(60, 3, 1)]);
  assert.equal(out.length, 2);
});

test("deduplicate does not mutate its input", () => {
  const input = [n(60, 0, 1), n(60, 1, 1)];
  deduplicate(input);
  assert.equal(input[0].duration, 1, "input note was mutated");
});

/* --- quantize ------------------------------------------------------------ */

test("quantize snaps time and duration to the grid, in every mode", () => {
  const at = (mode) => quantize([n(60, 1.3, 0.9)], { grid: 0.5, mode })[0];
  assert.deepEqual([at("nearest").time, at("nearest").duration], [1.5, 1]);
  assert.deepEqual([at("floor").time, at("floor").duration], [1, 0.5]);
  assert.deepEqual([at("ceil").time, at("ceil").duration], [1.5, 1]);
});

test("quantize is idempotent, including on triplet grids", () => {
  for (const grid of [0.25, 0.5, 1 / 3, 1 / 6, 1]) {
    for (let v = 0; v < 8; v += 0.07) {
      const once = quantize([n(60, v, 1)], { grid });
      assert.deepEqual(quantize(once, { grid }), once, `not idempotent at grid=${grid} v=${v}`);
    }
  }
});

test("quantize lands on exact values where the grid divides evenly", () => {
  assert.equal(quantize([n(60, 0.99, 1)], { grid: 1 / 3 })[0].time, 1);
  assert.equal(quantize([n(60, 2.01, 1)], { grid: 1 / 3 })[0].time, 2);
});

test("quantize rounds a time down when the grid point below is nearer", () => {
  // 0.12 sits at 0.48 of a sixteenth — nearer the bar line than the sixteenth.
  assert.equal(quantize([n(60, 0.12, 1)], { grid: 0.25 })[0].time, 0);
});

test("quantize never quantizes a note out of existence", () => {
  // 0.1 would round to 0 on a quarter-note grid — the note must survive.
  assert.equal(quantize([n(60, 0, 0.1)], { grid: 1 })[0].duration, 1, "a short note was silently deleted");
});

test("quantize leaves non-timing fields alone, rejects a bad grid, and passes malformed input through", () => {
  const out = quantize([n(60, 0.12, 1, 0.33)], { grid: 0.25 });
  assert.equal(out[0].pitch, 60);
  assert.equal(out[0].velocity, 0.33);
  assert.throws(() => quantize([n(60, 1, 1)], { grid: 0 }), /positive number/);
  assert.equal(quantize(null), null);
});

/* --- public surface ------------------------------------------------------ */

test("jm.notes is the list of verbs and nouns, and nothing else", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.deepEqual(Object.keys(jm.notes).sort(), [
    "augment", "beatsToTime", "canon", "chordNotes", "combine", "concatenate", "deduplicate", "diatonic",
    "invert", "normalize", "onsets", "piece", "place", "quantize", "range", "reverse", "shift", "span", "split",
    "tile", "timeToBeats", "track", "transpose", "transposeDiatonic", "truncate",
  ]);
});

test("the names of 4.x still answer under jm.utils, for one release", async () => {
  const { default: jm } = await import("../src/index.js");
  for (const [was, is] of [["shiftTime", "shift"], ["retrograde", "reverse"], ["createTrack", "track"], ["getTotalDuration", "span"]]) {
    assert.equal(jm.utils[was], jm.notes[is], `jm.utils.${was} is jm.notes.${is}`);
  }
});

/* --- the JMON builders --------------------------------------------------- */

test("track labels a track the way the rest of the library reads it", () => {
  const built = track([{ pitch: 60, duration: 1, time: 0 }], { label: "Bass" });

  assert.equal(built.label, "Bass", "the players and the score renderer read `label`");
  assert.equal(built.name, undefined, "`name` is not a JMON field");
});

test("piece emits one tempo, not a tempo and a bpm", () => {
  const notes = [{ pitch: 60, duration: 1, time: 0 }];

  const fromTempo = piece([notes], { tempo: 90 });
  assert.equal(fromTempo.tempo, 90);
  assert.equal(fromTempo.bpm, undefined, "a leftover bpm is a second source of truth");

  // bpm is still accepted on the way in, so older callers keep working.
  assert.equal(piece([notes], { bpm: 90 }).tempo, 90);
  assert.equal(piece([notes]).tempo, 120, "and there is a default");
});

test("piece accepts tracks as note arrays or as track objects", () => {
  const notes = [{ pitch: 60, duration: 1, time: 0 }];

  const bare = piece([notes]);
  assert.equal(bare.tracks[0].label, "Track 1", "a bare array gets a positional label");

  const named = piece([{ label: "Lead", notes }, { name: "Pad", notes }]);
  assert.deepEqual(named.tracks.map((t) => t.label), ["Lead", "Pad"],
    "a track passed in as `name` comes out as `label`");
  assert.equal(named.tracks[1].name, undefined);
});

test("a piece built by the helpers is playable as-is", async () => {
  // The point of the fix: what comes out of piece should be
  // what the player expects, with no renaming in between.
  const comp = piece(
    [{ label: "Lead", notes: [{ pitch: 60, duration: 1, time: 0 }] }],
    { tempo: 90 },
  );

  assert.equal(comp.format, "jmon");
  assert.equal(comp.tempo, 90);
  assert.equal(comp.tracks[0].label, "Lead");
  assert.ok(Array.isArray(comp.tracks[0].notes) && comp.tracks[0].notes.length === 1);
});

test("the declared version is the same in both places", async () => {
  // package.json and jm.VERSION drifted apart once (1.1.0 against 1.0.0)
  // because nothing compared them.
  const { default: jm } = await import("../src/index.js");
  const pkg = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      new URL("../package.json", import.meta.url), "utf8",
    ),
  );
  assert.equal(jm.VERSION, pkg.version, "jm.VERSION and package.json disagree");
});

test("jm imports nothing outside itself", async () => {
  // The whole point of the split: `import jm` reaches no other package and no
  // npm module, so it runs the same in Node, Deno and a browser.
  //
  // This walks the real import graph from src/index.js rather than the
  // directory, because src/ also holds modules nothing imports — the Gaussian
  // process wrapper is deliberately unreachable so that `@tangent.to/ds` is
  // only paid for by someone who imports it directly.
  const { readFile } = await import("node:fs/promises");
  const { dirname, resolve } = await import("node:path");

  const entry = new URL("../src/index.js", import.meta.url).pathname;
  const seen = new Set();
  const external = [];

  const visit = async (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    const text = await readFile(file, "utf8");
    // Anchored at the start of a line, so URLs quoted in a doc comment (which
    // begin with ` *`) are not mistaken for imports.
    const IMPORT = /^\s*(?:import|export)[^;\n]*?from\s+["']([^"']+)["']/gm;
    for (const [, spec] of text.matchAll(IMPORT)) {
      if (!spec.startsWith(".")) {
        external.push(`${file} imports "${spec}"`);
        continue;
      }
      await visit(resolve(dirname(file), spec));
    }
  };

  await visit(entry);

  assert.deepEqual(external, [], "algo must reach nothing outside itself");
  assert.ok(seen.size > 30, `only walked ${seen.size} files; the graph looks wrong`);
});

/* --- sustained ------------------------------------------------------------ */

test("sustained fills the span with a uniform step, as it always did", () => {
  const out = sustained(38, { duration: 10, time: 0, velocity: 0.4, step: 4 });

  assert.deepEqual(out.map((x) => [x.duration, x.time]), [[4, 0], [4, 4], [2, 8]]);
  assert.ok(out.every((x) => x.pitch === 38 && x.velocity === 0.4));
});

test("sustained takes a pattern of durations, cycled", () => {
  const out = sustained(69, { duration: 8, time: 0, velocity: 0.5, step: [1, 1, 2] });

  assert.deepEqual(out.map((x) => x.duration), [1, 1, 2, 1, 1, 2]);
  assert.deepEqual(out.map((x) => x.time), [0, 1, 2, 4, 5, 6]);
});

test("sustained shapes velocity alongside the pattern", () => {
  const out = sustained(69, { duration: 8, time: 0, velocity: [0.5, 0.36, 0.43], step: [1, 1, 2] });

  assert.deepEqual(out.map((x) => x.velocity), [0.5, 0.36, 0.43, 0.5, 0.36, 0.43]);
});

test("sustained never overruns the span it was given", () => {
  for (const [total, step] of [[7, [1, 1, 2]], [5, [2, 3]], [3.5, [1, 1, 2]], [10, 4]]) {
    const out = sustained(60, { duration: total, time: 2, velocity: 0.4, step: step });
    const spanned = out.reduce((sum, x) => sum + x.duration, 0);
    assert.ok(Math.abs(spanned - total) < 1e-9,
      `pattern ${JSON.stringify(step)} spanned ${spanned} of ${total}`);
    assert.equal(out[0].time, 2);
    assert.ok(out.every((x) => x.duration > 0), "produced a zero-length note");
  }
});

test("sustained refuses a step that would never advance", () => {
  assert.throws(() => sustained(60, { duration: 8, time: 0, velocity: 0.4, step: 0 }), /greater than 0/);
  assert.throws(() => sustained(60, { duration: 8, time: 0, velocity: 0.4, step: [1, 0, 2] }), /greater than 0/);
  assert.throws(() => sustained(60, { duration: 8, time: 0, velocity: 0.4, step: [] }), /greater than 0/);
});

/* --- tile ---------------------------------------------------------------- */

test("tile repeats a phrase on its own extent by default", () => {
  const cell = [
    { pitch: 60, duration: 0.75, time: 0 },
    { pitch: 62, duration: 0.25, time: 0.75 },
  ];
  const out = tile(cell, { times: 3 });
  assert.deepEqual(out.map((n) => n.time), [0, 0.75, 1, 1.75, 2, 2.75]);
  assert.deepEqual(out.map((n) => n.pitch), [60, 62, 60, 62, 60, 62]);
  assert.deepEqual(cell.map((n) => n.time), [0, 0.75], "the source must not be mutated");
});

test("tile honours an explicit cycle length, leaving air or overlapping", () => {
  const cell = [{ pitch: 60, duration: 1, time: 0 }];
  assert.deepEqual(tile(cell, { times: 4, cycle: 4 }).map((n) => n.time), [0, 4, 8, 12], "a beat per bar");
  assert.deepEqual(tile(cell, { times: 3, cycle: 0.5 }).map((n) => n.time), [0, 0.5, 1], "cycles may overlap");
});

test("tile keeps bars:beats:ticks times in their own notation", () => {
  const out = tile([{ pitch: 60, duration: 1, time: "0:0:0" }], { times: 2, cycle: 4 });
  assert.deepEqual(out.map((n) => n.time), ["0:0:0", "1:0:0"]);
});

test("tile returns nothing when there is nothing to repeat", () => {
  assert.deepEqual(tile([], { times: 4 }), []);
  assert.deepEqual(tile([{ pitch: 60, duration: 1, time: 0 }], { times: 0 }), []);
});

/* --- bow ------------------------------------------------------------------ */

test("bow gives a long note a stroke: soft entry, swell, easing off", () => {
  const [shaped] = bow([{ pitch: 69, duration: 4, time: 8, velocity: 0.6 }]);
  assert.deepEqual(shaped.dynamics, [
    { time: 0, value: 0 },
    { time: 0.25, value: 0.65 },
    { time: 2.4, value: 1 },
    { time: 4, value: 0.75 },
  ]);
  assert.equal(shaped.velocity, 0.6, "the velocity stays, as the stroke's peak");
  assert.equal(shaped.time, 8, "and the anchors are relative to the note, not the piece");
});

test("bow gives a short note a soft attack only, and never an attack longer than a third", () => {
  const [short] = bow([{ pitch: 60, duration: 0.5, time: 0 }]);
  assert.deepEqual(short.dynamics, [
    { time: 0, value: 0 },
    { time: 0.5 / 3, value: 1 },
    { time: 0.5, value: 1 },
  ]);
});

test("bow leaves rests and existing envelopes alone, and does not mutate", () => {
  const own = [{ time: 0, value: 1 }];
  const input = [
    { pitch: null, duration: 2, time: 0 },
    { pitch: 60, duration: 2, time: 2, dynamics: own },
    { pitch: 62, duration: 2, time: 4 },
  ];
  const out = bow(input, { swell: 0.5, peak: 0.5, fade: 0 });
  assert.equal(out[0].dynamics, undefined);
  assert.equal(out[1].dynamics, own);
  assert.deepEqual(out[2].dynamics.map((a) => a.value), [0, 0.5, 1, 1]);
  assert.equal(input[2].dynamics, undefined, "the input notes are untouched");
});
