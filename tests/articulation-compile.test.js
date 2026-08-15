/**
 * Compiling articulations into playable and notatable form.
 *
 * This is the glissando path, which had no coverage anywhere: five one-line
 * test files claimed it and asserted nothing. Both stages here are pure —
 * `compileEvents` turns declarative articulations into modulation events for
 * the players and the WAV renderer, and `deriveVisualFromArticulations` turns
 * them into notation hints — so both are testable without a browser.
 *
 * node:test + assert. Run with: node --test tests/articulation-compile.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { compileEvents, compileComposition } from "../src/algorithms/audio/index.js";
import {
  deriveVisualFromArticulations,
  normalizeArticulations,
  getPrimaryAccent,
} from "../src/utils/notation/deriveVisualFromArticulations.js";

const note = (pitch, time, duration = 1, extra = {}) => ({
  pitch, duration, time, velocity: 0.8, ...extra,
});

const track = (notes) => ({ label: "t", notes });

const modulationsOf = (notes) => compileEvents(track(notes)).modulations;

/* --- glissando ----------------------------------------------------------- */

test("a glissando compiles to a pitch modulation spanning the note", () => {
  const [modulation] = modulationsOf([
    note(60, 0, 2, { articulations: [{ type: "glissando", target: 67 }] }),
  ]);

  assert.equal(modulation.type, "pitch");
  assert.equal(modulation.subtype, "glissando");
  assert.equal(modulation.from, 60);
  assert.equal(modulation.to, 67);
  assert.equal(modulation.start, 0);
  assert.equal(modulation.end, 2, "the slide should last the whole note");
  assert.equal(modulation.curve, "linear");
});

test("glissando accepts `to` as well as `target`", () => {
  // `to` is the common mistake, and the compiler deliberately tolerates it.
  const [byTarget] = modulationsOf([note(60, 0, 1, { articulations: [{ type: "glissando", target: 64 }] })]);
  const [byTo] = modulationsOf([note(60, 0, 1, { articulations: [{ type: "glissando", to: 64 }] })]);
  assert.equal(byTarget.to, 64);
  assert.equal(byTo.to, 64);
});

test("a glissando without a destination compiles to nothing", () => {
  assert.deepEqual(modulationsOf([note(60, 0, 1, { articulations: [{ type: "glissando" }] })]), []);
});

test("a glissando on a rest compiles to nothing", () => {
  assert.deepEqual(
    modulationsOf([{ pitch: null, duration: 1, time: 0, articulations: [{ type: "glissando", target: 67 }] }]),
    [],
  );
});

test("a descending glissando keeps its direction", () => {
  const [modulation] = modulationsOf([
    note(72, 0, 1, { articulations: [{ type: "glissando", target: 60 }] }),
  ]);
  assert.ok(modulation.to < modulation.from, "should slide downwards");
});

test("a custom curve is carried through", () => {
  const [modulation] = modulationsOf([
    note(60, 0, 1, { articulations: [{ type: "glissando", target: 67, curve: "exponential" }] }),
  ]);
  assert.equal(modulation.curve, "exponential");
});

test("portamento compiles like glissando but keeps its own subtype", () => {
  const [modulation] = modulationsOf([
    note(60, 0, 1, { articulations: [{ type: "portamento", target: 64 }] }),
  ]);
  assert.equal(modulation.subtype, "portamento");
  assert.equal(modulation.to, 64);
});

test("the glissando's modulation points at the note it came from", () => {
  const [modulation] = modulationsOf([
    note(60, 0, 1),
    note(64, 1, 1, { articulations: [{ type: "glissando", target: 72 }] }),
    note(67, 2, 1),
  ]);
  assert.equal(modulation.index, 1, "the modulation should index the second note");
  assert.equal(modulation.start, 1);
});

/* --- the other continuous articulations ---------------------------------- */

test("bend compiles with its amount", () => {
  const [modulation] = modulationsOf([
    note(60, 0, 1, { articulations: [{ type: "bend", amount: 2, returnToOriginal: true }] }),
  ]);
  assert.equal(modulation.subtype, "bend");
  assert.equal(modulation.amount, 2);
  assert.equal(modulation.returnToOriginal, true);
});

test("a bend without an amount compiles to nothing", () => {
  assert.deepEqual(modulationsOf([note(60, 0, 1, { articulations: [{ type: "bend" }] })]), []);
});

test("vibrato and tremolo compile to their own modulation types", () => {
  const vibrato = modulationsOf([note(60, 0, 2, { articulations: [{ type: "vibrato", rate: 5, depth: 50 }] })]);
  const tremolo = modulationsOf([note(60, 0, 2, { articulations: [{ type: "tremolo", rate: 8, depth: 0.3 }] })]);

  assert.equal(vibrato[0]?.type, "pitch");
  assert.equal(vibrato[0]?.subtype, "vibrato");
  assert.equal(tremolo[0]?.type, "amplitude");
  assert.equal(tremolo[0]?.subtype, "tremolo");
});

test("several articulations on one note all compile", () => {
  const modulations = modulationsOf([
    note(60, 0, 2, {
      articulations: [{ type: "glissando", target: 67 }, { type: "vibrato", rate: 6, depth: 30 }],
    }),
  ]);
  const subtypes = modulations.map((m) => m.subtype).sort();
  assert.deepEqual(subtypes, ["glissando", "vibrato"]);
});

/* --- compileEvents in general -------------------------------------------- */

test("compileEvents returns the notes alongside the modulations", () => {
  const notes = [note(60, 0, 1), note(64, 1, 1)];
  const compiled = compileEvents(track(notes));

  assert.equal(compiled.notes.length, 2);
  assert.deepEqual(compiled.modulations, [], "plain notes produce no modulations");
});

test("a track with no articulations compiles cleanly", () => {
  assert.doesNotThrow(() => compileEvents(track([note(60, 0)])));
  assert.doesNotThrow(() => compileEvents(track([])));
});

test("compileComposition compiles every track", () => {
  const composition = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [
      track([note(60, 0, 2, { articulations: [{ type: "glissando", target: 67 }] })]),
      track([note(48, 0, 2)]),
    ],
  };

  const compiled = compileComposition(composition);
  assert.equal(compiled.tracks.length, 2);
  assert.equal(compiled.tracks[0].modulations.length, 1);
  assert.equal(compiled.tracks[1].modulations.length, 0);
});

/* --- notation hints ------------------------------------------------------ */

test("a glissando yields a notation hint with its label and target", () => {
  const visual = deriveVisualFromArticulations([{ type: "glissando", target: 67 }]);
  assert.deepEqual(visual.gliss, { type: "glissando", text: "gliss.", target: 67 });
});

test("portamento is labelled differently from glissando", () => {
  const visual = deriveVisualFromArticulations([{ type: "portamento", target: 64 }]);
  assert.equal(visual.gliss.type, "portamento");
  assert.equal(visual.gliss.text, "port.");
});

test("no slide means no hint", () => {
  assert.equal(deriveVisualFromArticulations([]).gliss, null);
  assert.equal(deriveVisualFromArticulations(["staccato"]).gliss, null);
});

test("articulations normalise from strings and objects alike", () => {
  const fromStrings = normalizeArticulations(["staccato", "accent"]);
  const fromObjects = normalizeArticulations([{ type: "staccato" }, { type: "accent" }]);
  assert.deepEqual(fromStrings.map((a) => a.type), ["staccato", "accent"]);
  assert.deepEqual(fromObjects.map((a) => a.type), ["staccato", "accent"]);
});

test("marcato outranks accent when both are present", () => {
  const visual = deriveVisualFromArticulations(["accent", "marcato"]);
  assert.equal(visual.resolved.marcato, true);
  assert.equal(visual.resolved.accent, false, "one accent mark should win");
  assert.equal(getPrimaryAccent(["accent", "marcato"]), "marcato");
  assert.equal(getPrimaryAccent(["tenuto", "staccato"]), "tenuto");
  assert.equal(getPrimaryAccent([]), null);
});

test("staccato and accent coexist — they are different marks", () => {
  const visual = deriveVisualFromArticulations(["staccato", "accent"]);
  assert.equal(visual.resolved.staccato, true);
  assert.equal(visual.resolved.accent, true);
});

/* --- what MIDI does with a slide ----------------------------------------- */

test("a glissando is not carried by Standard MIDI File export", async () => {
  // Documented, not desired: the writer emits no pitch bend, so a slide is
  // flattened to its starting note. The browser player and the WAV renderer
  // read the modulation directly and do perform it.
  const { midiBytes } = await import("../src/converters/midi.js");
  const { midiToJmon } = await import("../src/converters/midi-to-jmon.js");

  const composition = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [track([note(60, 0, 2, { articulations: [{ type: "glissando", target: 67 }] })])],
  };

  const back = await midiToJmon(await midiBytes(composition));
  assert.equal(back.tracks[0].notes.length, 1);
  assert.equal(back.tracks[0].notes[0].pitch, 60, "the note keeps its starting pitch");
  assert.equal(
    JSON.stringify(back).includes("gliss"), false,
    "if this starts passing, the MIDI writer gained pitch bend — update the note above",
  );
});
