/**
 * The offline player, driven against a recording Tone.js.
 *
 * `src/browser/` had no automated coverage because it needs a browser and an
 * audio library. It needs very little of either: `document.createElement`,
 * `document.head`, `requestAnimationFrame`, and a Tone-shaped object. Stubbing
 * those runs the player's real logic and lets the interesting layer be
 * asserted — what it schedules, when, on which node.
 *
 * This tests the library's decisions, not Tone's behaviour.
 *
 * node:test + assert. Run with: node --test tests/music-player.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { playAndRecord, installFakeBrowser, createFakeTone } from "./helpers/fake-browser.mjs";

const note = (pitch, time, duration = 1, velocity = 0.8) => ({ pitch, duration, time, velocity });

const composition = (tracks, extra = {}) => ({
  format: "jmon", version: "1.0", tempo: 120, tracks, ...extra,
});

/** Scheduled times, sorted, rounded past float noise. */
const times = (record) =>
  record.scheduled.map((e) => Number(Number(e.time).toFixed(6))).sort((a, b) => a - b);

/* --- construction -------------------------------------------------------- */

test("the player rejects what it cannot play", async () => {
  const restore = installFakeBrowser();
  try {
    const { Tone } = createFakeTone();
    globalThis.Tone = Tone;
    const { createPlayer } = await import("../src/browser/music-player.js");

    assert.throws(() => createPlayer(null, { Tone }), /Invalid composition/);
    assert.throws(() => createPlayer("nope", { Tone }), /Invalid composition/);
    assert.throws(() => createPlayer({ tracks: "not an array" }, { Tone }), /must be an array/);
  } finally {
    restore();
  }
});

test("a bare array of pitches is accepted as a composition", async () => {
  const { record } = await playAndRecord([60, 62, 64]);
  assert.equal(record.scheduled.length, 3, "one event per pitch");
});

/* --- scheduling ---------------------------------------------------------- */

test("notes are scheduled at their beat positions converted to seconds", async () => {
  // 120 BPM: one beat is half a second.
  const { record } = await playAndRecord(
    composition([{ label: "lead", notes: [note(60, 0), note(64, 1), note(67, 2)] }]),
  );

  assert.deepEqual(times(record), [0, 0.5, 1]);
});

test("the tempo governs the conversion", async () => {
  const { record } = await playAndRecord(
    composition([{ label: "lead", notes: [note(60, 0), note(64, 2)] }], { tempo: 60 }),
  );

  // 60 BPM: one beat is a full second, so beat 2 is at 2s.
  assert.deepEqual(times(record), [0, 2]);
});

test("the transport takes the composition's tempo", async () => {
  const { record, Tone } = await playAndRecord(
    composition([{ label: "lead", notes: [note(60, 0)] }], { tempo: 144 }),
  );
  assert.equal(Tone.Transport.bpm.value, 144);
  assert.ok(record.transport.starts > 0, "the transport should have been started");
});

test("every track is scheduled, not just the first", async () => {
  const { record } = await playAndRecord(composition([
    { label: "lead", notes: [note(60, 0), note(64, 1)] },
    { label: "bass", notes: [note(36, 0), note(38, 1), note(40, 2)] },
  ]));

  assert.equal(record.scheduled.length, 5);
});

test("rests are not scheduled", async () => {
  const { record } = await playAndRecord(composition([{
    label: "lead",
    notes: [note(60, 0), { pitch: null, duration: 1, time: 1 }, note(64, 2)],
  }]));

  assert.equal(record.scheduled.length, 2, "a rest is silence, not an event");
});

/* --- tempo maps ---------------------------------------------------------- */

test("a tempoMap moves the notes that follow it", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "lead", notes: [note(60, 0), note(62, 2), note(64, 4), note(65, 6)] }],
    { tempoMap: [{ time: 0, tempo: 120 }, { time: 4, tempo: 60 }] },
  ));

  // Beats 0, 2, 4 at 120 BPM → 0s, 1s, 2s. Beat 6 is two beats into the
  // 60 BPM section, so 2s + 2s = 4s rather than the 3s a flat rate gives.
  const scheduled = times(record);
  assert.ok(scheduled.includes(0));
  assert.ok(scheduled.includes(1));
  assert.ok(scheduled.includes(2));
  assert.ok(scheduled.includes(4), `expected a 4s event, got ${scheduled.join(", ")}`);
  assert.ok(!scheduled.includes(3), "the flat-rate position should not appear");
});

test("without a tempoMap the schedule is unchanged", async () => {
  const notes = [note(60, 0), note(62, 1), note(64, 2), note(65, 3)];
  const flat = await playAndRecord(composition([{ label: "lead", notes }]));
  const mapped = await playAndRecord(composition([{ label: "lead", notes }], {
    tempoMap: [{ time: 0, tempo: 120 }],
  }));

  assert.deepEqual(times(mapped.record), times(flat.record));
});

/* --- synths -------------------------------------------------------------- */

test("a GM program number builds a Sampler", async () => {
  const { record } = await playAndRecord(composition([
    { label: "violin", synth: 40, notes: [note(67, 0)] },
  ]));
  assert.ok(record.nodes.some((n) => n.type === "Sampler"), "GM programs are sampled");
});

test("an explicit synth type is honoured", async () => {
  const { record } = await playAndRecord(composition([
    { label: "pad", synth: { type: "FMSynth", options: { detune: 3 } }, notes: [note(60, 0)] },
  ]));

  const built = record.nodes.find((n) => n.type === "FMSynth");
  assert.ok(built, `FMSynth not built; got ${record.nodes.map((n) => n.type).join(", ")}`);
  assert.equal(built.options?.detune, 3, "constructor options should be passed through");
});

test("a customPreset resolves to its type and options", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "lead", synth: "warmPad", notes: [note(60, 0)] }],
    { customPresets: [{ id: "warmPad", type: "MonoSynth", options: { detune: 7 } }] },
  ));

  const built = record.nodes.find((n) => n.type === "MonoSynth");
  assert.ok(built, "the preset's type should have been constructed");
  assert.equal(built.options?.detune, 7);
});

test("inline options layer over a referenced preset", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "lead", synth: { preset: "warmPad", options: { detune: 1 } }, notes: [note(60, 0)] }],
    { customPresets: [{ id: "warmPad", type: "MonoSynth", options: { detune: 7, portamento: 0.2 } }] },
  ));

  const built = record.nodes.find((n) => n.type === "MonoSynth");
  assert.equal(built.options?.detune, 1, "the inline value should win");
  assert.equal(built.options?.portamento, 0.2, "the preset's other options should survive");
});

/* --- audio graph --------------------------------------------------------- */

test("audioGraph nodes are constructed", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "lead", notes: [note(60, 0)] }],
    {
      audioGraph: [
        { id: "reverb", type: "Reverb", options: { decay: 2 } },
        { id: "out", type: "Destination" },
      ],
    },
  ));

  const reverb = record.nodes.find((n) => n.type === "Reverb");
  assert.ok(reverb, "the reverb should have been built");
  assert.equal(reverb.options?.decay, 2);
});

/* --- automation ---------------------------------------------------------- */

test("automation targeting an audioGraph node reaches its parameter", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "lead", notes: [note(60, 0), note(62, 4)] }],
    {
      audioGraph: [{ id: "reverb", type: "Reverb", options: {} }],
      automation: {
        global: [{
          id: "wet", target: "reverb.wet",
          anchorPoints: [{ time: 0, value: 0 }, { time: 4, value: 1 }],
        }],
      },
    },
  ));

  // Two anchor points become two scheduled events on top of the two notes.
  assert.equal(record.scheduled.length, 4, "automation points should be scheduled");

  for (const event of record.scheduled) event.callback(0);
  const wetWrites = record.params.filter((p) => p.param === "Reverb.wet");
  assert.ok(wetWrites.length >= 2, `expected writes to Reverb.wet, got ${wetWrites.length}`);
  assert.equal(wetWrites.at(-1).value, 1, "the curve should end at its last anchor");
});

test("a midi.cc channel drives nothing without a hint, and something with one", async () => {
  const base = {
    audioGraph: [{ id: "filter", type: "Filter", options: {} }],
    automation: {
      global: [{
        id: "cc1", target: "midi.cc1",
        anchorPoints: [{ time: 0, value: 0 }, { time: 2, value: 1 }],
      }],
    },
  };
  const tracks = [{ label: "lead", notes: [note(60, 0)] }];

  const unhinted = await playAndRecord(composition(tracks, base));
  assert.equal(unhinted.record.scheduled.length, 1, "only the note — the CC has no target");

  const hinted = await playAndRecord(composition(tracks, {
    ...base,
    converterHints: { tone: { cc1: { target: "filter", parameter: "frequency", range: [200, 2000] } } },
  }));
  assert.equal(hinted.record.scheduled.length, 3, "the note plus two automation points");

  for (const event of hinted.record.scheduled) event.callback(0);
  const writes = hinted.record.params.filter((p) => p.param === "Filter.frequency");
  assert.ok(writes.length >= 2);
  assert.equal(writes.at(-1).value, 2000, "value 1 should scale to the top of the range");
});

/* --- time signatures ----------------------------------------------------- */

test("the transport takes the composition's time signature", async () => {
  const { Tone } = await playAndRecord(composition(
    [{ label: "lead", notes: [note(60, 0)] }],
    { timeSignature: "7/8" },
  ));
  assert.deepEqual(Tone.Transport.timeSignature, [7, 8]);
});

/* --- the returned UI ----------------------------------------------------- */

test("the player returns a DOM element with controls attached", async () => {
  const { ui } = await playAndRecord(composition([{ label: "lead", notes: [note(60, 0)] }]));
  assert.ok(ui, "createPlayer should return an element");
  assert.ok(ui.children.length > 0, "the player should have built some UI");
});

/* --- glissando ----------------------------------------------------------- */

/** Play a slide with `detune` removed from the named synth types. */
async function slideWith(trackSpec, withoutDetune = []) {
  const restore = installFakeBrowser();
  try {
    const { Tone, record } = createFakeTone();
    for (const type of withoutDetune) {
      const Base = Tone[type];
      Tone[type] = class extends Base {
        constructor(options) { super(options); delete this.detune; }
      };
    }
    globalThis.Tone = Tone;

    const { createPlayer } = await import(`../src/browser/music-player.js?${withoutDetune.join("-")}`);
    const ui = createPlayer(composition([{
      ...trackSpec,
      notes: [{ ...note(60, 0, 2), articulations: [{ type: "glissando", target: 67 }] }],
    }]), { Tone });

    const { collectHandlers } = await import("./helpers/fake-browser.mjs");
    const play = collectHandlers(ui).find((h) => typeof h.click === "function");
    await play.click();
    for (const event of record.scheduled) event.callback(0);

    return record;
  } finally {
    restore();
  }
}

test("a glissando is performed as a detune ramp in cents", async () => {
  const record = await slideWith({ label: "lead", synth: { type: "MonoSynth" } });
  const ramps = record.params.filter((p) => p.param.endsWith(".detune"));

  assert.ok(ramps.length >= 2, "expected a start value and a ramp");
  assert.equal(ramps[0].value, 0, "the slide starts at the written pitch");
  // 60 -> 67 is a perfect fifth: seven semitones, 700 cents.
  assert.ok(Math.abs(ramps.at(-1).value - 700) < 1, `ended at ${ramps.at(-1).value} cents`);
});

test("the slide runs on the track's own synth when it has a detune", async () => {
  const record = await slideWith({ label: "lead", synth: { type: "MonoSynth" } });

  assert.deepEqual(record.nodes.map((n) => n.type), ["MonoSynth"],
    "no extra instrument should be needed");
  assert.ok(record.params.some((p) => p.param === "MonoSynth.detune"));
});

test("a sampled instrument slides by resampling, keeping its timbre", async () => {
  // Tone's Sampler has no detune Signal, but it keeps its sounding buffer
  // sources and their playbackRate is automatable — the same lever a soundfont
  // engine pulls to bend a note. Ramping it slides the violin as a violin,
  // rather than handing the note to a substitute synth.
  const record = await slideWith({ label: "violin", synth: 40 });
  const types = record.nodes.map((n) => n.type);

  assert.ok(types.includes("Sampler"));
  assert.ok(!types.includes("MonoSynth"), "no substitute should be needed");

  const rates = record.params.filter((p) => p.param === "Sampler.playbackRate");
  assert.ok(rates.length >= 2, "expected a starting rate and a ramp");
  assert.equal(rates[0].value, 1, "the slide starts at the sample's own pitch");
  // A perfect fifth resamples by 2^(7/12).
  assert.ok(
    Math.abs(rates.at(-1).value - Math.pow(2, 7 / 12)) < 1e-4,
    `ended at rate ${rates.at(-1).value}`,
  );
});

test("a synth with neither detune nor voices falls back to a substitute", async () => {
  // PolySynth exposes options through set(), not a Signal, and keeps no
  // reachable sources — so the slide does need a stand-in instrument. Still
  // audible; the timbre is what is lost.
  const record = await slideWith({ label: "lead" });
  const types = record.nodes.map((n) => n.type);

  assert.ok(types.includes("PolySynth"), "the track's own synth is still built");
  assert.ok(types.includes("MonoSynth"), "a substitute carries the slide");

  const ramps = record.params.filter((p) => p.param === "MonoSynth.detune");
  assert.ok(Math.abs(ramps.at(-1).value - 700) < 1, `ended at ${ramps.at(-1).value}c`);
});

test("a descending slide ramps downwards", async () => {
  const restore = installFakeBrowser();
  try {
    const { Tone, record } = createFakeTone();
    globalThis.Tone = Tone;
    const { createPlayer } = await import("../src/browser/music-player.js?down");
    const ui = createPlayer(composition([{
      label: "lead", synth: { type: "MonoSynth" },
      notes: [{ ...note(72, 0, 2), articulations: [{ type: "glissando", target: 60 }] }],
    }]), { Tone });

    const { collectHandlers } = await import("./helpers/fake-browser.mjs");
    await collectHandlers(ui).find((h) => typeof h.click === "function").click();
    for (const event of record.scheduled) event.callback(0);

    const ramps = record.params.filter((p) => p.param.endsWith(".detune"));
    assert.ok(Math.abs(ramps.at(-1).value + 1200) < 1, `ended at ${ramps.at(-1).value} cents`);
  } finally {
    restore();
  }
});

test("a note without a slide sets no detune ramp", async () => {
  const { record } = await playAndRecord(composition([
    { label: "lead", synth: { type: "MonoSynth" }, notes: [note(60, 0), note(64, 1)] },
  ]));
  for (const event of record.scheduled) event.callback(0);

  assert.equal(
    record.params.filter((p) => p.param.endsWith(".detune")).length, 0,
    "plain notes should leave detune alone",
  );
});
