/**
 * Music theory: scales, progressions, voicing, ornaments, articulations,
 * rhythm, strum and arpeggio.
 *
 * Golden-master style: the expected values below are the library's actual
 * output, captured deliberately so that any change to the core theory has to
 * be an explicit decision rather than a silent drift.
 *
 * node:test + assert — a failure fails the process.
 * Run with: node --test tests/music-theory.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Scale } from "../src/algorithms/theory/harmony/Scale.js";
import { Progression } from "../src/algorithms/theory/harmony/Progression.js";
import { Voice } from "../src/algorithms/theory/harmony/Voice.js";
import { Ornament } from "../src/algorithms/theory/harmony/Ornament.js";
import { Articulation } from "../src/algorithms/theory/harmony/Articulation.js";
import { strum } from "../src/algorithms/theory/harmony/Strum.js";
import { arpeggiate } from "../src/algorithms/theory/harmony/Arpeggiate.js";
import { chordify, chordifyMany } from "../src/algorithms/theory/harmony/Chordify.js";
import { Rhythm } from "../src/algorithms/theory/rhythm/Rhythm.js";
import { isorhythm } from "../src/algorithms/theory/rhythm/isorhythm.js";
import { beatcycle } from "../src/algorithms/theory/rhythm/beatcycle.js";

const note = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, duration, time, velocity });

/* --- Scale --------------------------------------------------------------- */

test("Scale generates the major scale as semitone offsets from the tonic", () => {
  const scale = new Scale({ tonic: "C", mode: "major" });
  assert.deepEqual(scale.generate({ start: 60, length: 8 }), [60, 62, 64, 65, 67, 69, 71, 72]);
});

test("Scale with no options returns exactly one octave", () => {
  assert.deepEqual(
    new Scale({ tonic: "C", mode: "major" }).generate(),
    [60, 62, 64, 65, 67, 69, 71],
  );
});

test("Scale honours the mode's interval set", () => {
  assert.deepEqual(
    new Scale({ tonic: "D", mode: "dorian" }).generate({ start: 62, length: 7 }),
    [62, 64, 65, 67, 69, 71, 72],
  );
  assert.deepEqual(
    new Scale({ tonic: "C", mode: "major pentatonic" }).generate({ start: 60, length: 5 }),
    [60, 62, 64, 67, 69],
  );
});

test("Scale `start` selects the octave, not the first note", () => {
  // Documented quirk: start is snapped back to the tonic of its octave, so an
  // off-scale or non-tonic start does not become the first note.
  const c = new Scale({ tonic: "C", mode: "major" });
  assert.deepEqual(c.generate({ start: 61, length: 3 }), [60, 62, 64]);

  const a = new Scale({ tonic: "A", mode: "major" });
  assert.deepEqual(a.generate({ start: 60, length: 3 }), [69, 71, 73]);
});

test("Scale generates up to an `end` bound", () => {
  const out = new Scale({ tonic: "C", mode: "major" }).generate({ start: 60, end: 67 });
  assert.deepEqual(out, [60, 62, 64, 65, 67]);
});

test("Scale normalises flats to sharps and rejects nonsense", () => {
  assert.equal(new Scale({ tonic: "Bb", mode: "major" }).tonic, "A#");
  assert.throws(() => new Scale({ tonic: "H", mode: "major" }), /not a valid tonic/);
  assert.throws(() => new Scale({ tonic: "C", mode: "klingon" }), /not a valid scale/);
  assert.throws(() => new Scale({}), /'tonic' is required/);
});

test("Scale reports its note names and membership", () => {
  const scale = new Scale({ tonic: "C", mode: "major" });
  assert.deepEqual(scale.getNoteNames(), ["C", "D", "E", "F", "G", "A", "B"]);
  assert.equal(scale.isInScale(62), true);
  assert.equal(scale.isInScale(61), false);
});

test("a custom scale registered on the shared table is usable", async () => {
  const { MusicTheoryConstants } = await import(
    "../src/algorithms/constants/MusicTheoryConstants.js"
  );
  MusicTheoryConstants.scale_intervals["test hirajoshi"] = [0, 2, 3, 7, 8];
  try {
    const scale = new Scale({ tonic: "D", mode: "test hirajoshi" });
    assert.deepEqual(scale.generate({ start: 62, length: 5 }), [62, 64, 65, 69, 70]);
    assert.deepEqual(scale.getNoteNames(), ["D", "E", "F", "A", "A#"]);
  } finally {
    delete MusicTheoryConstants.scale_intervals["test hirajoshi"];
  }
});

/* --- Progression --------------------------------------------------------- */

test("Progression builds triads from roman numerals", () => {
  const progression = new Progression({ tonic: "C", mode: "major" });
  assert.deepEqual(progression.generate(["I", "IV", "V", "I"]), [
    [60, 64, 67],
    [65, 69, 72],
    [67, 71, 74],
    [60, 64, 67],
  ]);
});

test("Progression walks the circle of fifths", () => {
  const progression = new Progression({ tonic: "C", mode: "major" });
  assert.deepEqual(progression.circleOfFifths(4), [
    [60, 64, 67],
    [67, 71, 74],
    [62, 66, 69],
    [69, 73, 76],
  ]);
});

test("Progression takes an options object, not positional arguments", () => {
  // `new Progression('C', 'major')` destructures its options out of a string,
  // so both fall back to defaults and the progression comes out in the wrong
  // key entirely — silently. Locked in so that the day it starts validating,
  // this test says so.
  const positional = new Progression("F#", "minor");
  assert.equal(positional.tonicNote, "C4");
  assert.equal(positional.mode, "major");

  const correct = new Progression({ tonic: "F#", mode: "minor" });
  assert.equal(correct.tonicNote, "F#");
  assert.equal(correct.tonicMidi, 66);
  assert.equal(correct.mode, "minor");
});

test("Progression resolves a bare note name to the right octave", () => {
  assert.equal(new Progression({ tonic: "C" }).tonicMidi, 60);
  assert.equal(new Progression({ tonic: "F#" }).tonicMidi, 66);
});

test(
  "Progression should default to C4, and accept an octave-qualified tonic",
  { todo: "The default tonic is the string 'C4', whose length is 2, so the " +
          "constructor takes the bare-note-name branch and appends another " +
          "'4' — cdeToMidi('C44') is 59, a semitone flat. Both `new " +
          "Progression()` and `{ tonic: 'C4' }` are affected; `{ tonic: 'C' }` " +
          "is fine. Fix: test for a trailing digit rather than string length." },
  () => {
    assert.equal(new Progression().tonicMidi, 60);
    assert.equal(new Progression({ tonic: "C4" }).tonicMidi, 60);
  },
);

/* --- Chordify ------------------------------------------------------------ */

test("chordify stacks scale degrees into a triad", () => {
  assert.deepEqual(chordify(60, { tonic: "C", mode: "major" }), [60, 64, 67]);
  assert.deepEqual(chordify(65, { tonic: "C", mode: "major" }), [65, 69, 72]);
  assert.deepEqual(chordifyMany([60, 62], { tonic: "C", mode: "major" }), [
    [60, 64, 67],
    [62, 65, 69],
  ]);
});

/* --- Voice --------------------------------------------------------------- */

test("Voice extracts one chord per measure", () => {
  const melody = [note(60, 0), note(65, 4)];
  const voice = new Voice({ tonic: "C", mode: "major", measureLength: 4 });
  const chords = voice.generate(melody);

  assert.equal(chords.length, 2);
  assert.deepEqual(chords[0], [60, 64, 67]);
});

test("Voice emits JMON tracks and bass lines on request", () => {
  const melody = [note(60, 0), note(65, 4)];

  const track = new Voice({
    tonic: "C", mode: "major", measureLength: 4, output: "track",
  }).generate(melody);
  assert.deepEqual(track[0], { pitch: [60, 64, 67], duration: 4, time: 0 });

  const bass = new Voice({
    tonic: "C", mode: "major", measureLength: 4, output: "bass", transpose: -12,
  }).generate(melody);
  assert.deepEqual(bass.map((n) => n.pitch), [48, 53]);
});

test("Voice returns an empty array for an empty track", () => {
  assert.deepEqual(new Voice({ tonic: "C", mode: "major" }).generate([]), []);
  assert.deepEqual(new Voice({ tonic: "C", mode: "major" }).generate(null), []);
});

test(
  "Voice should build full triads on every degree",
  { todo: "Voice pre-generates a single-octave scale and passes it to " +
          "chordifyMany, so chords rooted above the 4th degree run off the " +
          "end of the array and silently lose notes. chordify() on its own " +
          "gets these right. Fix: generate a multi-octave scale in the " +
          "Voice constructor." },
  () => {
    const voice = new Voice({ tonic: "C", mode: "major" });
    for (const root of [60, 62, 64, 65, 67, 69, 71]) {
      const [chord] = voice.generate([note(root, 0)]);
      assert.equal(chord.length, 3, `root ${root} produced ${chord.length} notes`);
    }
  },
);

/* --- Ornament ------------------------------------------------------------ */

const ORNAMENT_CASES = [
  ["trill", { by: 1, trillRate: 0.25 }, 6],
  ["mordent", { by: -1 }, 5],
  ["turn", {}, 6],
  ["arpeggio", { arpeggioDegrees: [0, 2, 4], direction: "up" }, 5],
  ["grace_note", { graceNoteType: "acciaccatura", gracePitches: [62] }, 4],
];

for (const [type, parameters, expectedLength] of ORNAMENT_CASES) {
  test(`Ornament '${type}' expands the note it is applied to`, () => {
    const notes = [note(60, 0), note(62, 1), note(64, 2)];
    const ornament = new Ornament({ type, tonic: "C", mode: "major", parameters });
    const out = ornament.apply(notes.map((n) => ({ ...n })), 0);

    assert.equal(out.length, expectedLength, `${type} changed its note count`);
    // The notes it did not touch must come through untouched.
    assert.deepEqual(out.slice(-2), [note(62, 1), note(64, 2)]);
    // Timing must stay sorted and non-negative.
    const times = out.map((n) => n.time);
    assert.deepEqual([...times].sort((a, b) => a - b), times, `${type} produced unsorted times`);
    assert.ok(times.every((t) => t >= 0));
  });
}

test("Ornament 'mordent' alternates with the note below and keeps the span", () => {
  const notes = [note(60, 0), note(62, 1)];
  const out = new Ornament({
    type: "mordent", tonic: "C", mode: "major", parameters: { by: -1 },
  }).apply(notes.map((n) => ({ ...n })), 0);

  assert.deepEqual(out.slice(0, 3).map((n) => n.pitch), [60, 59, 60]);
  const spanned = out.slice(0, 3).reduce((sum, n) => sum + n.duration, 0);
  assert.ok(Math.abs(spanned - 1) < 1e-9, "the ornament overflowed its note");
});

/* --- Articulation -------------------------------------------------------- */

test("Articulation.apply is static and shortens a staccato note", () => {
  assert.equal(typeof Articulation.apply, "function");
  const out = Articulation.apply([note(60, 0)], "staccato");
  assert.ok(Array.isArray(out));
  assert.ok(out[0].duration <= 1, "staccato should not lengthen the note");
});

/* --- Strum / Arpeggiate -------------------------------------------------- */

for (const [name, fn] of [["strum", strum], ["arpeggiate", arpeggiate]]) {
  test(`${name} spreads a chord into separate, time-offset notes`, () => {
    const chordTrack = [{ pitch: [60, 64, 67], duration: 1, time: 0, velocity: 0.8 }];
    const out = fn(chordTrack, {});

    assert.equal(out.length, 3, `${name} should emit one note per chord tone`);
    assert.deepEqual(out.map((n) => n.pitch), [60, 64, 67]);
    for (let i = 1; i < out.length; i++) {
      assert.ok(out[i].time > out[i - 1].time, `${name} times should increase`);
    }
  });
}

test("strum 'up' sounds the chord high string first, guitar-style", () => {
  const chordTrack = [{ pitch: [60, 64, 67], duration: 1, time: 0, velocity: 0.8 }];
  // An up-stroke crosses the strings from high to low, so the pitch order
  // reverses while the timing still runs forward.
  const out = strum(chordTrack, { direction: "up" });
  assert.deepEqual(out.map((n) => n.pitch), [67, 64, 60]);
  assert.ok(out[2].time > out[0].time);
});

test("arpeggiate 'up' runs low to high", () => {
  const chordTrack = [{ pitch: [60, 64, 67], duration: 1, time: 0, velocity: 0.8 }];
  assert.deepEqual(
    arpeggiate(chordTrack, { direction: "up" }).map((n) => n.pitch),
    [60, 64, 67],
  );
});

/* --- Rhythm -------------------------------------------------------------- */

test("isorhythm cycles pitches against durations until they realign", () => {
  const out = isorhythm([60, 62, 64], [1, 0.5]);
  // lcm(3, 2) = 6 events.
  assert.equal(out.length, 6);
  assert.deepEqual(out.map((n) => n.pitch), [60, 62, 64, 60, 62, 64]);
  assert.deepEqual(out.map((n) => n.duration), [1, 0.5, 1, 0.5, 1, 0.5]);
  assert.deepEqual(out.map((n) => n.time), [0, 1, 1.5, 2.5, 3, 4]);
});

test("beatcycle assigns durations cyclically, one per pitch", () => {
  const out = beatcycle([60, 62, 64], [1, 0.5]);
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((n) => n.duration), [1, 0.5, 1]);
});

test("Rhythm.random fills exactly the requested measure length", () => {
  const rhythm = new Rhythm(4, [1, 0.5, 0.25]);
  for (let i = 0; i < 20; i++) {
    const out = rhythm.random(4);
    const total = out.reduce((sum, n) => sum + n.duration, 0);
    assert.ok(Math.abs(total - 4) < 1e-9, `measure summed to ${total}, expected 4`);
  }
});
