/**
 * Converters: MIDI out, MIDI in, MusicXML, SuperCollider, Tone.js, and the
 * validator that guards them.
 *
 * The headline is the MIDI round-trip. It was impossible before: midiToJmon
 * required a `Tone.Midi` parser that Tone.js does not have (the class it was
 * written against lives in @tonejs/midi, which was never a dependency), so
 * nothing here had ever been exercised against real bytes.
 *
 * node:test + assert. Run with: node --test tests/converters.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { midiBytes, midiBase64 } from "../src/converters/midi.js";
import { midiToJmon } from "../src/converters/midi-to-jmon.js";
import { parseMidiFile } from "../src/converters/midi-parser.js";
import { supercollider } from "../src/converters/supercollider.js";
import { JmonValidator } from "../src/utils/jmon-validator.js";

const note = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, duration, time, velocity });

const COMPOSITION = {
  format: "jmon",
  version: "1.0",
  tempo: 120,
  tracks: [
    { label: "lead", notes: [note(60, 0, 1), note(64, 1, 0.5), note(67, 2, 2)] },
    { label: "bass", notes: [note(36, 0, 2), note(38, 2, 2)] },
  ],
};

/* --- the MIDI writer ----------------------------------------------------- */

test("midiBytes emits a well-formed Standard MIDI File", async () => {
  const bytes = await midiBytes(COMPOSITION);

  assert.ok(bytes instanceof Uint8Array || Array.isArray(bytes));
  const header = Array.from(bytes.slice(0, 4)).map((b) => String.fromCharCode(b)).join("");
  assert.equal(header, "MThd", "missing MThd chunk");
  assert.ok(bytes.length > 20, "file is implausibly short");
});

test("midiBase64 produces decodable base64", async () => {
  const encoded = await midiBase64(COMPOSITION);
  assert.equal(typeof encoded, "string");
  assert.match(encoded, /^[A-Za-z0-9+/]+=*$/);
  assert.equal(Buffer.from(encoded, "base64").subarray(0, 4).toString(), "MThd");
});

/* --- the parser ---------------------------------------------------------- */

test("parseMidiFile reads the header it was given", async () => {
  const parsed = parseMidiFile(await midiBytes(COMPOSITION));

  assert.equal(parsed.timeUnit, "beats", "times must be in quarter notes");
  assert.ok(parsed.header.ppq > 0);
  assert.equal(parsed.header.tempos[0].bpm, 120);
  assert.ok(Array.isArray(parsed.tracks));
});

test("parseMidiFile rejects data that is not a MIDI file", () => {
  assert.throws(() => parseMidiFile(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])), /Not a Standard MIDI File/);
});

test("parseMidiFile accepts every byte container", async () => {
  const bytes = await midiBytes(COMPOSITION);
  const asArray = Array.from(bytes);
  const asBuffer = Uint8Array.from(bytes).buffer;

  const fromArray = parseMidiFile(asArray);
  const fromBuffer = parseMidiFile(asBuffer);
  assert.equal(fromArray.tracks.length, fromBuffer.tracks.length);
});

test("parseMidiFile needs no audio library", async () => {
  // Nothing about reading a file should require Tone.js. If this ever starts
  // throwing about a missing Tone instance, the dependency crept back in.
  const parsed = parseMidiFile(await midiBytes(COMPOSITION));
  assert.ok(parsed.tracks.length > 0);
});

/* --- the round trip ------------------------------------------------------ */

test("a composition survives jmon -> midi -> jmon unchanged", async () => {
  const back = await midiToJmon(await midiBytes(COMPOSITION));

  assert.equal(back.tempo, COMPOSITION.tempo);
  assert.equal(back.tracks.length, COMPOSITION.tracks.length);

  for (const [i, original] of COMPOSITION.tracks.entries()) {
    const recovered = back.tracks[i];
    assert.deepEqual(
      recovered.notes.map((n) => [n.pitch, n.time, n.duration]),
      original.notes.map((n) => [n.pitch, n.time, n.duration]),
      `track ${i} (${original.label}) did not round-trip`,
    );
  }
});

test("the round trip preserves velocity to within MIDI's resolution", async () => {
  const back = await midiToJmon(await midiBytes(COMPOSITION));

  const originals = COMPOSITION.tracks.flatMap((t) => t.notes).map((n) => n.velocity);
  const recovered = back.tracks.flatMap((t) => t.notes).map((n) => n.velocity);

  assert.equal(recovered.length, originals.length);
  recovered.forEach((velocity, i) => {
    // MIDI velocity is 7-bit, so a value can move by up to 1/127.
    assert.ok(
      Math.abs(velocity - originals[i]) <= 1 / 127,
      `velocity ${i}: ${velocity} vs ${originals[i]}`,
    );
  });
});

test("the round trip holds for fractional and long durations", async () => {
  const awkward = {
    format: "jmon", version: "1.0", tempo: 90,
    tracks: [{
      label: "t",
      notes: [note(60, 0, 0.25), note(62, 0.25, 0.75), note(64, 1, 3), note(65, 4, 0.5)],
    }],
  };

  const back = await midiToJmon(await midiBytes(awkward));
  assert.equal(back.tempo, 90);
  assert.deepEqual(
    back.tracks[0].notes.map((n) => [n.pitch, n.time, n.duration]),
    awkward.tracks[0].notes.map((n) => [n.pitch, n.time, n.duration]),
  );
});

test("a chord round-trips as simultaneous notes", async () => {
  const chordal = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{ label: "t", notes: [{ pitch: [60, 64, 67], duration: 2, time: 0, velocity: 0.8 }] }],
  };

  const back = await midiToJmon(await midiBytes(chordal));
  const notes = back.tracks[0].notes;
  assert.equal(notes.length, 3, "a triad should come back as three notes");
  assert.deepEqual(notes.map((n) => n.pitch).sort((a, b) => a - b), [60, 64, 67]);
  assert.ok(notes.every((n) => n.time === 0), "chord tones should stay aligned");
});

test("rests are not written as notes", async () => {
  const withRest = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{ label: "t", notes: [note(60, 0, 1), { pitch: null, duration: 1, time: 1 }, note(64, 2, 1)] }],
  };

  const back = await midiToJmon(await midiBytes(withRest));
  assert.deepEqual(back.tracks[0].notes.map((n) => n.pitch), [60, 64]);
  assert.deepEqual(back.tracks[0].notes.map((n) => n.time), [0, 2], "the gap should survive");
});

test("an injected parser is preferred over the built-in one", async () => {
  let used = false;
  class FakeMidi {
    constructor() {
      used = true;
      this.header = { tempos: [{ time: 0, bpm: 96 }], timeSignatures: [] };
      this.tracks = [{ channel: 0, name: "fake", notes: [{ midi: 72, time: 0, duration: 0.5, velocity: 1 }] }];
    }
  }

  const back = await midiToJmon(await midiBytes(COMPOSITION), { parser: FakeMidi });
  assert.ok(used, "the injected parser was ignored");
  assert.equal(back.tempo, 96);
});

/* --- other converters ---------------------------------------------------- */

test("supercollider emits source text mentioning the pitches", async () => {
  const out = await supercollider(COMPOSITION);
  assert.equal(typeof out, "string");
  assert.ok(out.length > 0);
  assert.match(out, /60/, "expected the first pitch to appear in the output");
});

/* --- the validator ------------------------------------------------------- */

test("the validator accepts a well-formed composition quietly", () => {
  const { valid, errors, normalized } = new JmonValidator().validateAndNormalize(COMPOSITION);
  assert.equal(valid, true, `unexpected errors: ${JSON.stringify(errors)}`);
  assert.equal(normalized.tracks.length, 2);
});

test("the validator normalises the shorthand forms", () => {
  const validator = new JmonValidator();

  const fromArray = validator.validateAndNormalize([note(60, 0)]);
  assert.ok(Array.isArray(fromArray.normalized.tracks), "a bare note array should become tracks");

  const fromSingleTrack = validator.validateAndNormalize({ tempo: 100, notes: [note(60, 0)] });
  assert.ok(Array.isArray(fromSingleTrack.normalized.tracks));
  assert.equal(fromSingleTrack.normalized.notes, undefined, "notes should move under a track");
});

test("the validator rejects what is not an object", () => {
  const { valid } = new JmonValidator().validateAndNormalize(null);
  assert.equal(valid, false);
});

test("the declared version is the same in both places", async () => {
  // package.json and jm.VERSION drifted apart (1.1.0 against 1.0.0) because
  // nothing compared them.
  const { default: jm } = await import("../src/index.js");
  const pkg = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      new URL("../package.json", import.meta.url), "utf8",
    ),
  );
  assert.equal(jm.VERSION, pkg.version, "jm.VERSION and package.json disagree");
});

test("constructing the validator prints nothing", () => {
  // It used to warn on every construction, pointing at a Node-with-ajv build
  // that does not exist — so every midiToJmon call emitted it.
  const original = console.warn;
  const seen = [];
  console.warn = (...args) => seen.push(args.join(" "));
  try {
    new JmonValidator();
  } finally {
    console.warn = original;
  }
  assert.deepEqual(seen, []);
});

/* --- mid-score changes in MusicXML --------------------------------------- */

test("MusicXML carries key, metre, tempo and annotation changes", async () => {
  const { musicxml } = await import("../src/converters/verovio.js");

  const xml = musicxml({
    format: "jmon", version: "1.0", tempo: 120, timeSignature: "4/4", keySignature: "C",
    keySignatureMap: [{ time: 8, keySignature: "G" }],
    timeSignatureMap: [{ time: 8, timeSignature: "3/4" }],
    tempoMap: [{ time: 0, tempo: 120 }, { time: 4, tempo: 90 }],
    annotations: [{ time: 0, text: "Intro", type: "rehearsal" }, { time: 4, text: "dolce" }],
    tracks: [{
      label: "t",
      notes: Array.from({ length: 12 }, (_, i) => note(60 + i, i, 1)),
    }],
  });

  assert.match(xml, /<rehearsal>Intro<\/rehearsal>/);
  assert.match(xml, /<words>dolce<\/words>/);
  assert.match(xml, /<per-minute>90<\/per-minute>/, "the tempo change should appear");
  assert.match(xml, /<fifths>1<\/fifths>/, "G major is one sharp");
  assert.match(xml, /<beats>3<\/beats>/, "the metre change should appear");
});

test("MusicXML interpolates the tempo instead of writing it literally", async () => {
  const { musicxml } = await import("../src/converters/verovio.js");
  const xml = musicxml({
    format: "jmon", version: "1.0", tempo: 96,
    tracks: [{ label: "t", notes: [note(60, 0)] }],
  });

  assert.match(xml, /<sound tempo="96"\/>/);
  assert.ok(!xml.includes("${tempo}"), "the template placeholder leaked into the output");
});

test("a composition with no maps produces no stray mid-score attributes", async () => {
  const { musicxml } = await import("../src/converters/verovio.js");
  const xml = musicxml({
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{ label: "t", notes: Array.from({ length: 8 }, (_, i) => note(60, i, 1)) }],
  });

  assert.equal((xml.match(/<attributes>/g) || []).length, 1, "only the opening attributes");
  assert.equal((xml.match(/<per-minute>/g) || []).length, 1, "only the opening tempo");
});

/* --- custom presets ------------------------------------------------------ */

test("a track's synth resolves against customPresets", async () => {
  const { resolveSynthPreset } = await import("../src/browser/synth-factory.js");
  const presets = [{ id: "lead", type: "PolySynth", options: { volume: -6, detune: 5 } }];

  assert.deepEqual(resolveSynthPreset("lead", presets), {
    type: "PolySynth", options: { volume: -6, detune: 5 },
  });

  // Inline options layer over the preset's.
  assert.deepEqual(resolveSynthPreset({ preset: "lead", options: { volume: -12 } }, presets), {
    type: "PolySynth", options: { volume: -12, detune: 5 },
  });
});

test("preset resolution leaves everything else alone", async () => {
  const { resolveSynthPreset } = await import("../src/browser/synth-factory.js");
  const presets = [{ id: "lead", type: "PolySynth", options: {} }];

  assert.equal(resolveSynthPreset(40, presets), 40, "a GM number is not a preset id");
  assert.equal(resolveSynthPreset("absent", presets), "absent", "an unknown id passes through");
  assert.deepEqual(resolveSynthPreset({ type: "MonoSynth" }, presets), { type: "MonoSynth" });
  assert.equal(resolveSynthPreset("lead", null), "lead", "no presets, no resolution");
});

/* --- glissando through MIDI ---------------------------------------------- */

test("a glissando survives jmon -> midi -> jmon", async () => {
  // Standard MIDI File has no glissando message, so the writer emits a pitch
  // bend sweep — preceded by an RPN 0 that widens the bend range, since the
  // 2-semitone default cannot express a slide of a fifth.
  const slide = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{
      label: "lead",
      notes: [{ ...note(60, 0, 2), articulations: [{ type: "glissando", target: 67 }] }],
    }],
  };

  const back = await midiToJmon(await midiBytes(slide));
  const recovered = back.tracks[0].notes[0];

  assert.equal(recovered.pitch, 60);
  assert.deepEqual(recovered.articulations, [{ type: "glissando", target: 67 }]);
});

test("a descending slide keeps its direction", async () => {
  const slide = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{
      label: "lead",
      notes: [{ ...note(72, 0, 2), articulations: [{ type: "glissando", target: 60 }] }],
    }],
  };

  const back = await midiToJmon(await midiBytes(slide));
  assert.deepEqual(back.tracks[0].notes[0].articulations, [{ type: "glissando", target: 60 }]);
});

test("the bend returns to centre, so following notes are in tune", async () => {
  const mixed = {
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{
      label: "lead",
      notes: [
        { ...note(60, 0, 2), articulations: [{ type: "glissando", target: 67 }] },
        note(72, 2, 1),
        note(74, 3, 1),
      ],
    }],
  };

  const back = await midiToJmon(await midiBytes(mixed));
  const [slid, plain, alsoPlain] = back.tracks[0].notes;

  assert.deepEqual(slid.articulations, [{ type: "glissando", target: 67 }]);
  assert.equal(plain.articulations, undefined, "the return to centre is not a bend of its own");
  assert.equal(alsoPlain.articulations, undefined);
});

test("the writer sets a bend range wide enough for the slide", async () => {
  const bytes = await midiBytes({
    format: "jmon", version: "1.0", tempo: 120,
    tracks: [{
      label: "lead",
      notes: [{ ...note(60, 0, 2), articulations: [{ type: "glissando", target: 72 }] }],
    }],
  });

  const parsed = parseMidiFile(bytes);
  const track = parsed.tracks.find((t) => t.notes.length > 0);
  assert.ok(track.pitchBendRange >= 12, `range ${track.pitchBendRange} cannot express an octave`);
  assert.ok(track.pitchBends.length > 8, "expected a sweep, not a single jump");
});

test("a plain composition emits no pitch bend at all", async () => {
  const parsed = parseMidiFile(await midiBytes(COMPOSITION));
  for (const track of parsed.tracks) {
    assert.equal(track.pitchBends.length, 0, "nothing here slides");
  }
});
