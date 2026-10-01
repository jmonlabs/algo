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
  invert, reverse, augment, onsets, normalize, range, span, split, deduplicate, quantize, tile, track, piece, cut, fit,
} from "../src/notes/index.js";

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
    "augment", "beatsToTime", "canon", "chordNotes", "combine", "concatenate", "cut", "deduplicate", "diatonic",
    "fit", "invert", "normalize", "onsets", "piece", "place", "quantize", "range", "reverse", "shift", "span", "split",
    "tile", "timeToBeats", "track", "transpose", "transposeDiatonic", "truncate",
  ]);
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

/* --- cut and fit --------------------------------------------------------- */

test("cut takes a slice, clipped at both ends and moved to 0", () => {
  const phrase = [n(60, 0, 4), n(62, 4, 2), n(64, 6, 4), n(65, 10, 2)];
  const slice = cut(phrase, { from: 5, to: 8 });
  assert.deepEqual(slice.map((x) => [x.pitch, x.time, x.duration]), [[62, 0, 1], [64, 1, 2]]);
  assert.deepEqual(cut(phrase, { from: 10 }).map((x) => [x.pitch, x.time, x.duration]), [[65, 0, 2]], "to defaults to the end");
  assert.throws(() => cut(phrase, { from: 8, to: 8 }), /must come after/);
});

test("fit stretches a phrase to a length, keeping its proportions", () => {
  const phrase = [n(60, 0, 1), n(62, 1, 1), n(64, 2, 1)];
  const four = fit(phrase, 4);
  assert.deepEqual(four.map((x) => [x.time, x.duration]), [[0, 4 / 3], [4 / 3, 4 / 3], [8 / 3, 4 / 3]]);
  assert.deepEqual(fit([], 4), []);
  assert.throws(() => fit(phrase, 0), /positive/);
});
