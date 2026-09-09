/**
 * The Emotional Map of Melody: solfège stability × chord distance.
 *
 * node:test + assert. Run with: node --test tests/emotional-map.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import * as Sol from "../src/algorithms/theory/harmony/Solfege.js";
import * as E from "../src/algorithms/analysis/EmotionalMap.js";
import jm from "../src/index.js";

const C = { tonic: "C", mode: "major" };
const note = (pitch, time, duration = 1) => ({ pitch, duration, time, velocity: 0.8 });

/* --- solfège --------------------------------------------------------------- */

test("solfège is relative to the relative major: the minor tonic is LA", () => {
  assert.equal(Sol.solfege(60, C), "DO");
  assert.equal(Sol.solfege(65, C), "FA");
  assert.equal(Sol.solfege(69, { tonic: "A", mode: "minor" }), "LA");
  assert.equal(Sol.solfege(60, { tonic: "A", mode: "minor" }), "DO");
  assert.equal(Sol.solfege(62, { tonic: "D", mode: "dorian" }), "RE");
  assert.equal(Sol.solfege(61, C), null, "chromatic notes have no syllable");
  assert.throws(() => Sol.solfege(60, { tonic: "C", mode: "harmonic minor" }), /relative major/);
});

test("stability follows DO SO MI LA RE TI FA, then chromatic", () => {
  const order = ["DO", "SO", "MI", "LA", "RE", "TI", "FA"];
  const pitchOf = { DO: 60, RE: 62, MI: 64, FA: 65, SO: 67, LA: 69, TI: 71 };
  order.forEach((syl, rank) => assert.equal(Sol.stability(pitchOf[syl], C), rank, syl));
  assert.equal(Sol.stability(61, C), 7);
  // the order is a parameter, not a constant
  assert.equal(Sol.stability(65, C, { order: [0, 0, 0, 6, 0, 0, 0] }), 0);
});

test("chordDistance is 0 on chord tones and counts semitones otherwise", () => {
  const Cmaj = [60, 64, 67];
  assert.equal(Sol.chordDistance(72, Cmaj), 0);
  assert.equal(Sol.chordDistance(65, Cmaj), 1);
  assert.equal(Sol.chordDistance(62, Cmaj), 2);
  assert.ok(Sol.isChordTone(64, Cmaj));
  assert.deepEqual(Sol.triadOf([60, 64, 67, 71]), [60, 64, 67], "the book counts only the triad");
});

test("Key exposes solfège and stability", () => {
  const k = jm.key("A", "minor");
  assert.equal(k.solfege(69), "LA");
  assert.equal(k.stability(60), 0);
  assert.equal(k.degree(64), 2);
});

/* --- the map --------------------------------------------------------------- */

const F = [65, 69, 72];
const Am = [57, 60, 64];
const G = [55, 59, 62];
const chords = [{ time: 0, pitches: F }, { time: 4, pitches: Am }, { time: 8, pitches: G }];

test("mapNotes places each note in the quadrant the book describes", () => {
  // SO over C: stable chord tone (1). DO over Dm: stable non-chord tone (2).
  // FA over Dm: unstable chord tone (3). TI over Dm: unstable non-chord tone (4).
  const Cmaj = [60, 64, 67];
  const Dm = [62, 65, 69];
  const q = (pitch, chord) => E.mapNotes([note(pitch, 0)], { key: C, chords: [{ time: 0, pitches: chord }] })[0].quadrant;
  assert.equal(q(67, Cmaj), 1);
  assert.equal(q(60, Dm), 2);
  assert.equal(q(65, Dm), 3);
  assert.equal(q(71, Dm), 4);
});

test("a melody of stable chord tones is all sweetness; non-chord tones are not", () => {
  const sweet = E.emotionalMap([note(65, 0, 2), note(60, 4, 2), note(67, 8, 2)], { key: C, chords });
  // F over F is FA: chord tone but unstable, so quadrant 3, not 1
  assert.equal(sweet.chordToneRate, 1);
  assert.ok(sweet.quadrants[0] + sweet.quadrants[2] > 0.99);

  // SO over F, SO over Am, MI over G: stable degrees, none a chord tone
  const edgy = E.emotionalMap([note(67, 0, 2), note(67, 4, 2), note(64, 8, 2)], { key: C, chords });
  assert.equal(edgy.chordToneRate, 0);
  assert.equal(edgy.sweetness, 0);
  assert.ok(edgy.quadrants[1] > 0.99, "SO and MI are stable-side non-chord tones");
  // RE sits on the unstable side of the book's diagram
  const re = E.emotionalMap([note(62, 4, 2)], { key: C, chords });
  assert.equal(re.points[0].quadrant, 4);
});

test("behaviour at a chord change: stay, resolve, twist", () => {
  // FA on the change then immediately MI (chord tone of F): nctResolve
  const resolve = E.emotionalMap([note(67, 0, 0.5), note(69, 0.5, 0.5)], {
    key: C, chords: [{ time: 0, pitches: F }],
  });
  assert.equal(resolve.behaviours.nctResolve, 1);

  // chord tone on the change then immediately a non-chord tone: ctTwist
  const twist = E.emotionalMap([note(69, 0, 0.5), note(67, 0.5, 0.5)], {
    key: C, chords: [{ time: 0, pitches: F }],
  });
  assert.equal(twist.behaviours.ctTwist, 1);

  // a long chord tone with nothing after it: ctStay
  const stay = E.emotionalMap([note(69, 0, 2)], { key: C, chords: [{ time: 0, pitches: F }] });
  assert.equal(stay.behaviours.ctStay, 1);
});

test("a note just before a chord change is read against the chord it anticipates", () => {
  const Cmaj = [60, 64, 67];
  // E an eighth before C major arrives: its third (chord tone), not the semitone below F's root
  const e = [note(76, 3.5, 2)];
  const anticipating = E.mapNotes(e, { key: C, chords: [{ time: 0, pitches: F }, { time: 4, pitches: Cmaj }] });
  assert.equal(anticipating[0].chordTone, true);
  const sounding = E.mapNotes(e, { key: C, chords: [{ time: 0, pitches: F }, { time: 4, pitches: Cmaj }], anticipation: 0 });
  assert.equal(sounding[0].chordDistance, 1, "read against F, E is a semitone from F");
  // D an eighth before C major: the ninth, a non-chord tone two semitones from C and E
  const d = E.mapNotes([note(74, 3.5, 2)], { key: C, chords: [{ time: 0, pitches: G }, { time: 4, pitches: Cmaj }] });
  assert.equal(d[0].chordTone, false);
  assert.equal(d[0].chordDistance, 2);
  // a full beat early is outside the default window
  const early = E.mapNotes([note(76, 3, 2)], { key: C, chords: [{ time: 0, pitches: F }, { time: 4, pitches: Cmaj }] });
  assert.equal(early[0].chordDistance, 1);
});

test("first and last notes are reported; an empty melody is harmless", () => {
  const m = E.emotionalMap([note(64, 0), note(60, 3)], { key: C, chords });
  assert.equal(m.first.solfege, "MI");
  assert.equal(m.last.solfege, "DO");
  const empty = E.emotionalMap([], { key: C, chords });
  assert.deepEqual(empty.quadrants, [0, 0, 0, 0]);
  assert.equal(empty.first, null);
});

test("quadrant entropy is 0 for one corner and 2 bits for an even spread", () => {
  const Cmaj = [60, 64, 67];
  const Dm = [62, 65, 69];
  const corner = E.emotionalMap([note(67, 0), note(67, 1)], { key: C, chords: [{ time: 0, pitches: Cmaj }], salience: "all" });
  assert.equal(corner.entropy, 0);
  const spread = E.emotionalMap([note(67, 0), note(60, 1), note(65, 2), note(71, 3)], {
    key: C,
    chords: [{ time: 0, pitches: Cmaj }, { time: 1, pitches: Dm }],
    salience: "all",
  });
  assert.ok(Math.abs(spread.entropy - 2) < 1e-9, `entropy ${spread.entropy}`);
});

/* --- pillars ------------------------------------------------------------- */

test("pillars land a diatonic non-chord tone on every chord", () => {
  const p = E.pillars(chords, { key: C });
  assert.equal(p.length, 3);
  for (const x of p) {
    assert.equal(x.chordTone, false);
    assert.notEqual(Sol.degree(x.pitch, C), null);
    assert.ok(x.pitch >= 60 && x.pitch <= 72);
  }
  assert.deepEqual(p.map((x) => x.time), [0, 4, 8]);
});

test("pillars can alternate with chord tones and prefer tension on request", () => {
  const alt = E.pillars(chords, { key: C, alternate: true });
  assert.deepEqual(alt.map((x) => x.chordTone), [false, true, false]);
  const tense = E.pillars(chords, { key: C, prefer: "tense" });
  const stable = E.pillars(chords, { key: C, prefer: "stable" });
  const rank = (list) => list.reduce((s, x) => s + Sol.stability(x.pitch, C), 0);
  assert.ok(rank(tense) >= rank(stable));
  assert.throws(() => E.pillars(chords, {}), /key/);
});

test("melody analysis is reachable from jm", () => {
  assert.equal(typeof jm.analysis.melody.emotionalMap, "function");
  assert.equal(typeof jm.analysis.salience.salient, "function");
  assert.equal(typeof jm.theory.harmony.Solfege.stability, "function");
});
