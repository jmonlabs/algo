/**
 * The jm.key() context: setting tonic/mode once and handing it to Scale,
 * Voice, Ornament, Progression and the chord helpers.
 *
 * node:test + assert. Run with: node --test tests/key-context.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Key, key } from "../src/algorithms/theory/harmony/Key.js";
import { Scale } from "../src/algorithms/theory/harmony/Scale.js";
import { Voice } from "../src/algorithms/theory/harmony/Voice.js";
import { Ornament } from "../src/algorithms/theory/harmony/Ornament.js";
import { Chain } from "../src/algorithms/generative/walks/Chain.js";

/* --- the factory --------------------------------------------------------- */

test("key() builds a Key carrying tonic and mode", () => {
  const k = key("D", "dorian");
  assert.ok(k instanceof Key);
  assert.equal(k.tonic, "D");
  assert.equal(k.mode, "dorian");
});

test("key() defaults to C major", () => {
  assert.deepEqual([key().tonic, key().mode], ["C", "major"]);
  assert.deepEqual([key("F").tonic, key("F").mode], ["F", "major"]);
});

test("new Key(options) is the options-object form; key() stays positional-only", () => {
  const fromObject = new Key({ tonic: "A", mode: "minor" });
  assert.deepEqual([fromObject.tonic, fromObject.mode], ["A", "minor"]);

  // `key` is accepted as an alias of `tonic` in the options form.
  const fromAlias = new Key({ key: "E", mode: "phrygian" });
  assert.deepEqual([fromAlias.tonic, fromAlias.mode], ["E", "phrygian"]);
});

/* --- context-applied constructors ---------------------------------------- */

test("the context builds harmony objects without repeating tonic/mode", () => {
  const k = key("D", "dorian");

  const scale = k.scale();
  assert.ok(scale instanceof Scale);
  assert.deepEqual(scale.generate({ start: 62, length: 7 }), [62, 64, 65, 67, 69, 71, 72]);

  const voice = k.voice({ measureLength: 4 });
  assert.ok(voice instanceof Voice);
  assert.deepEqual([voice.tonic, voice.mode], ["D", "dorian"]);

  const ornament = k.ornament({ type: "mordent", parameters: { by: -1 } });
  assert.ok(ornament instanceof Ornament);

  const progression = k.progression();
  assert.equal(progression.mode, "dorian");
});

test("a context scale matches one built by hand", () => {
  const byHand = new Scale({ tonic: "F", mode: "lydian" }).generate({ start: 65, length: 7 });
  const byContext = key("F", "lydian").scale().generate({ start: 65, length: 7 });
  assert.deepEqual(byContext, byHand);
});

/* --- overrides ----------------------------------------------------------- */

test("per-call options beat the context", () => {
  const k = key("C", "major");

  assert.equal(k.scale({ mode: "minor" }).mode, "minor");
  assert.equal(k.scale({ tonic: "G" }).tonic, "G");
  assert.deepEqual(
    k.scale({ tonic: "A", mode: "minor" }).generate({ start: 69, length: 3 }),
    [69, 71, 72],
  );
  // The context itself is untouched by an override.
  assert.deepEqual([k.tonic, k.mode], ["C", "major"]);
});

/* --- chord helpers ------------------------------------------------------- */

test("chord() and chords() apply the context", () => {
  const k = key("C", "major");
  assert.deepEqual(k.chord(60), [60, 64, 67]);
  assert.deepEqual(k.chords([60, 62]), [[60, 64, 67], [62, 65, 69]]);
});

test("chord() in a minor context differs from the major one", () => {
  assert.notDeepEqual(key("A", "minor").chord(69), key("A", "major").chord(69));
});

/* --- Key accepted as an option ------------------------------------------- */

test("Voice accepts a Key instance through options.key", () => {
  const k = key("G", "mixolydian");
  const voice = new Voice({ key: k });
  assert.deepEqual([voice.tonic, voice.mode], ["G", "mixolydian"]);
});

test("an explicit tonic/mode still wins over a Key passed as options.key", () => {
  const voice = new Voice({ key: key("G", "mixolydian"), tonic: "C", mode: "minor" });
  assert.deepEqual([voice.tonic, voice.mode], ["C", "minor"]);
});

test("Voice still accepts a bare tonic string as options.key", () => {
  const voice = new Voice({ key: "E", mode: "minor" });
  assert.deepEqual([voice.tonic, voice.mode], ["E", "minor"]);
});

/* --- backward compatibility ---------------------------------------------- */

test("the pre-context constructors keep working unchanged", () => {
  const scale = new Scale({ tonic: "C", mode: "major" });
  assert.deepEqual(scale.generate({ start: 60, length: 8 }), [60, 62, 64, 65, 67, 69, 71, 72]);

  const voice = new Voice({ tonic: "C", mode: "major", measureLength: 4 });
  assert.deepEqual([voice.tonic, voice.mode], ["C", "major"]);
});

/* --- Chain.line() -------------------------------------------------------- */

test("Chain.line() returns one flat walk of the requested length", () => {
  const walk = new Chain({
    walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0,
  }).line(8, 42);

  assert.ok(Array.isArray(walk));
  assert.equal(walk.length, 8);
  assert.ok(walk.every((v) => Number.isInteger(v)), "roundTo: 0 should yield integers");
  assert.ok(walk.every((v) => v >= 0 && v <= 10), "walk left its range");
});

test("Chain.line() is reproducible for a given seed", () => {
  const build = () => new Chain({
    walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0,
  });
  assert.deepEqual(build().line(8, 42), build().line(8, 42));
  assert.notDeepEqual(build().line(8, 42), build().line(8, 7));
});

test("Chain.line() starts where walkStart says", () => {
  const walk = new Chain({
    walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0,
  }).line(4, 42);
  assert.equal(walk[0], 5);
});

test("Chain.line() leaves the instance reusable", () => {
  const chain = new Chain({
    walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0,
  });
  const first = chain.line(8, 42);
  const second = chain.line(8, 42);
  assert.deepEqual(second, first, "instance state leaked between calls");
  assert.equal(chain.walkStart, 5, "walkStart was mutated");
});

/* --- reachable from the public API --------------------------------------- */

test("jm.key is wired up on the default export", async () => {
  const { default: jm } = await import("../src/index.js");
  assert.equal(typeof jm.key, "function");
  assert.equal(typeof jm.theory.harmony.Key, "function");
  assert.deepEqual(jm.key("C", "major").chord(60), [60, 64, 67]);
});
