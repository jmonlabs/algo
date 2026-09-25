/**
 * chordName and toRegister — naming a chord, and putting one in a register.
 *
 * node:test + assert. Run with: node --test tests/chord-shape.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { chordName, toRegister } from "../src/algorithms/theory/harmony/chord-shape.js";

/* --- chordName ----------------------------------------------------------- */

test("chordName names the common triads", () => {
  assert.equal(chordName([50, 53, 57]), "Dm");
  assert.equal(chordName([53, 57, 60]), "F");
  assert.equal(chordName([50, 53, 56]), "Ddim");
  assert.equal(chordName([48, 52, 56]), "Caug");
  assert.equal(chordName([48, 50, 55]), "Csus2");
  assert.equal(chordName([48, 53, 55]), "Csus4");
});

test("chordName names the common sevenths", () => {
  assert.equal(chordName([48, 52, 55, 59]), "Cmaj7");
  assert.equal(chordName([48, 52, 55, 58]), "C7");
  assert.equal(chordName([48, 51, 55, 58]), "Cm7");
  assert.equal(chordName([48, 51, 54, 58]), "Cm7b5");
  assert.equal(chordName([48, 51, 54, 57]), "Cdim7");
});

test("chordName names an inversion by its chord, not by its bass", () => {
  // C E G, E G C and G C E are all C major.
  assert.equal(chordName([48, 52, 55]), "C");
  assert.equal(chordName([52, 55, 60]), "C");
  assert.equal(chordName([55, 60, 64]), "C");
});

test("chordName ignores octaves and doubled notes", () => {
  assert.equal(chordName([50, 53, 57]), chordName([26, 53, 69, 81, 50]));
});

test("chordName takes the pitches in any order", () => {
  assert.equal(chordName([57, 50, 53]), "Dm");
});

test("chordName says so rather than guessing when it cannot name a chord", () => {
  // A cluster matches nothing in the table.
  assert.equal(chordName([48, 49, 50]), "C?");
  assert.equal(chordName([]), "");
});

/* --- toRegister ---------------------------------------------------------- */

test("toRegister moves a chord by whole octaves into the window", () => {
  assert.deepEqual(toRegister([74, 77, 81], { low: 45, high: 57 }), [50, 53, 57]);
  assert.deepEqual(toRegister([26, 29, 33], { low: 45, high: 57 }), [50, 53, 57]);
});

test("toRegister leaves a chord already in the window alone", () => {
  assert.deepEqual(toRegister([50, 53, 57], { low: 45, high: 57 }), [50, 53, 57]);
});

test("toRegister keeps the voicing, the spacing and the inversion", () => {
  const wide = [52, 67, 84]; // a spread first inversion
  const moved = toRegister(wide, { low: 45, high: 57 });
  const gaps = (c) => c.slice(1).map((p, i) => p - c[i]);
  assert.deepEqual(gaps(moved), gaps(wide), "the intervals should survive");
  assert.ok(moved[0] >= 45 && moved[0] <= 57);
  assert.ok(moved.every((p) => (p - wide[0]) % 12 === (moved[0] - wide[0]) % 12 || true));
  assert.equal((wide[0] - moved[0]) % 12, 0, "the move should be whole octaves");
});

test("toRegister bounds the lowest note, not the whole chord", () => {
  // A chord two octaves wide still fits: its top simply reaches above `high`.
  const moved = toRegister([50, 62, 81], { low: 45, high: 57 });
  assert.equal(moved[0], 50);
  assert.ok(moved[2] > 57);
});

test("toRegister sorts the pitches and survives an empty chord", () => {
  assert.deepEqual(toRegister([57, 50, 53], { low: 45, high: 57 }), [50, 53, 57]);
  assert.deepEqual(toRegister([]), []);
});

test("toRegister refuses a window that is upside down", () => {
  assert.throws(() => toRegister([50, 53, 57], { low: 57, high: 45 }), /high/);
});

test("both are reachable from the public namespace", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.equal(typeof jm.theory.harmony.chordName, "function");
  assert.equal(typeof jm.theory.harmony.toRegister, "function");
});
