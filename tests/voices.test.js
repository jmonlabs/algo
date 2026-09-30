/**
 * Tests for jm.voices: the neo-Riemannian moves and walks, and the smooth
 * walk, which know a chord and not a key.
 *
 * Run with: node --test tests/voices.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import jm from "../src/index.js";
import { neoRiemannian, neoRiemannianWalk, smoothWalk } from "../src/voices/index.js";

const D_MINOR = [62, 65, 69];
const C_MINOR = [60, 63, 67];
const pc = (triad) => new Set(triad.map((p) => ((p % 12) + 12) % 12));
const spelled = (triad) => [...pc(triad)].sort((a, b) => a - b).join(" ");
const centroid = (triad) => triad.reduce((s, n) => s + n, 0) / triad.length;

/* --- neoRiemannian ------------------------------------------------------- */

test("P, L and R each move one voice by a semitone or two", () => {
  const [d, p, l, r] = neoRiemannian(D_MINOR, ["P", "L", "R"]);
  assert.deepEqual(d, D_MINOR, "the first chord is the one given");
  assert.equal(spelled(p), "2 6 9", "P: D minor to D major");
  assert.equal(spelled(l), "1 6 9", "L from D major: F# minor");
  assert.equal(spelled(r), "1 4 9", "R from F# minor: A major");
});

test("a string of letters is one move, and an unknown letter is refused", () => {
  assert.deepEqual(neoRiemannian(D_MINOR, ["PLR"]).at(-1), neoRiemannian(D_MINOR, ["P", "L", "R"]).at(-1));
  assert.throws(() => neoRiemannian(D_MINOR, ["X"]), /unknown move "X"/);
  assert.throws(() => neoRiemannian([62, 65], ["P"]), /three MIDI pitches/);
  assert.throws(() => neoRiemannian([62, 63, 64], ["P"]), /not a major, minor/);
});

test("the moves are reached from the namespace", () => {
  assert.equal(jm.voices.neoRiemannian, neoRiemannian);
  assert.equal(jm.voices.neoRiemannianWalk, neoRiemannianWalk);
  assert.equal(jm.voices.smoothWalk, smoothWalk);
});

/* --- neoRiemannianWalk --------------------------------------------------- */

test("a seed makes the walk reproducible, and lengths count the start", () => {
  const a = neoRiemannianWalk(C_MINOR, { length: 4, seed: 42 });
  assert.equal(a.length, 4);
  assert.deepEqual(a[0], C_MINOR);
  assert.deepEqual(a, neoRiemannianWalk(C_MINOR, { length: 4, seed: 42 }));
  assert.notDeepEqual(a, neoRiemannianWalk(C_MINOR, { length: 4, seed: 43 }));
  assert.throws(() => neoRiemannianWalk(C_MINOR, { seed: 1 }), /`length`/);
});

test("every step is a real neo-Riemannian move, whatever the length", () => {
  // P, L and R each keep two of three notes, so a walk built from them only
  // ever shares two. This is what makes it a walk and not a progression.
  const prog = neoRiemannianWalk(D_MINOR, { length: 10, seed: 3 });
  for (let i = 1; i < prog.length; i++) {
    const shared = [...pc(prog[i - 1])].filter((p) => pc(prog[i]).has(p)).length;
    assert.ok(shared >= 2, `chord ${i} (${spelled(prog[i])}) shares only ${shared} note(s)`);
  }
});

test("vocabulary and opWeights change the walk", () => {
  const plain = neoRiemannianWalk(D_MINOR, { length: 8, seed: 1 });
  const wide = neoRiemannianWalk(D_MINOR, { length: 8, seed: 1, vocabulary: ["P", "L", "R", "N", "S", "RPR", "PRP"] });
  const parallel = neoRiemannianWalk(D_MINOR, { length: 8, seed: 1, opWeights: { P: 50 } });
  assert.notDeepEqual(plain, wide);
  assert.notDeepEqual(plain, parallel);
});

test("inKey keeps a walk in the key it is given, as pitch classes or a key", () => {
  const k = jm.key("D", "minor");
  const inKey = k.pitchClasses();
  for (const seed of [1, 2, 3, 4, 5]) {
    const prog = neoRiemannianWalk(D_MINOR, { length: 8, seed, inKey });
    assert.equal(prog.length, 8, "a constrained walk is still the length asked for");
    for (const chord of prog) {
      for (const p of pc(chord)) assert.ok(inKey.includes(p), `${spelled(chord)} leaves D minor`);
    }
  }
  assert.deepEqual(
    neoRiemannianWalk(D_MINOR, { length: 8, seed: 3, inKey: k }),
    neoRiemannianWalk(D_MINOR, { length: 8, seed: 3, inKey }),
    "a key context and its pitch classes say the same thing",
  );
  // A set that excludes the starting chord is a contradiction, not a shrug.
  assert.throws(() => neoRiemannianWalk(D_MINOR, { length: 4, seed: 1, inKey: [0, 2, 4, 7, 9] }), /excludes the starting chord/);
});

test("without inKey, a long walk does leave the key", () => {
  const inKey = jm.key("D", "minor").pitchClasses();
  const outside = neoRiemannianWalk(D_MINOR, { length: 8, seed: 1 }).filter((c) => [...pc(c)].some((p) => !inKey.includes(p)));
  assert.ok(outside.length > 0, "the unconstrained walk is expected to drift; update the seed if not");
});

/* --- smoothWalk ---------------------------------------------------------- */

test("maxVoiceLeading bounds how far the three voices move in all", () => {
  const tight = smoothWalk(C_MINOR, { length: 6, seed: 5, maxVoiceLeading: 2 });
  const loose = smoothWalk(C_MINOR, { length: 6, seed: 5, maxVoiceLeading: 12 });
  assert.notDeepEqual(tight, loose);
  for (let i = 1; i < tight.length; i++) {
    const moved = tight[i].reduce((s, p, v) => s + Math.abs(p - tight[i - 1][v]), 0);
    assert.ok(moved <= 2, `chord ${i} moves ${moved} semitones`);
  }
});

test("octaveBounds keeps the walk in its register", () => {
  // A walk started an octave above the register is brought down into it.
  const bounds = { center: 57, range: 12 };
  const bounded = smoothWalk([69, 72, 76], { length: 12, seed: 3, octaveBounds: bounds });
  for (const chord of bounded) {
    assert.ok(Math.abs(centroid(chord) - 57) <= 6.01, `centroid ${centroid(chord).toFixed(1)} is outside ${bounds.center} ±${bounds.range / 2}`);
  }
  assert.notDeepEqual(bounded, smoothWalk([69, 72, 76], { length: 12, seed: 3 }), "the option must actually change the result");
});

test("octaveBounds and bassRange agree instead of cancelling", () => {
  const walk = smoothWalk([69, 72, 76], {
    length: 12, seed: 3, maxVoiceLeading: 4, qualities: ["major", "minor"], bassRange: 4,
    octaveBounds: { center: 57, range: 12 },
  });
  assert.equal(walk.length, 12, "a full walk, not a single chord");
  const startBass = Math.min(...walk[0]);
  for (const chord of walk) assert.ok(Math.min(...chord) - startBass <= 4, "the bass still respects bassRange");
  assert.ok(Math.abs(centroid(walk[0]) - 57) <= 6.01, "and the start chord is in the register");
});
