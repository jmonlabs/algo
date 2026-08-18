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
async function slideWith(trackSpec, withoutDetune = [], extra = {}) {
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
    }], extra), { Tone });

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

  assert.ok(ramps.length >= 3, "expected a start value, a ramp and a reset");
  assert.equal(ramps[0].value, 0, "the slide starts at the written pitch");
  // 60 -> 67 is a perfect fifth: seven semitones, 700 cents.
  const arrival = Math.max(...ramps.map((r) => r.value));
  assert.ok(Math.abs(arrival - 700) < 1, `arrived at ${arrival} cents`);
});

test("the detune returns to its baseline once the slide is over", async () => {
  // Without this the whole track stays transposed by whatever the last slide
  // travelled: a glissando of a fifth leaves every following note a fifth
  // sharp, on the same voice.
  const record = await slideWith({ label: "lead", synth: { type: "MonoSynth" } });
  const ramps = record.params.filter((p) => p.param.endsWith(".detune"));

  assert.equal(ramps.at(-1).value, 0, "the signal ends where it started");
  const arrivalAt = ramps.findLast((r) => Math.abs(r.value - 700) < 1).time;
  assert.ok(ramps.at(-1).time > arrivalAt, "the reset comes after the arrival");
});

test("the slide runs on the track's own synth when it has a detune", async () => {
  const record = await slideWith({ label: "lead", synth: { type: "MonoSynth" } });

  assert.deepEqual(record.nodes.map((n) => n.type), ["MonoSynth"],
    "no extra instrument should be needed");
  assert.ok(record.params.some((p) => p.param === "MonoSynth.detune"));
});

test("a sampled instrument slides by resampling, keeping its timbre", async () => {
  // Tone's Sampler exposes no detune Signal, but it keeps its sounding buffer
  // sources and their playbackRate is automatable — the same lever a soundfont
  // engine pulls to bend a note. Ramping it slides the violin as a violin,
  // rather than handing the note to a stand-in.
  const record = await slideWith({ label: "violin", synth: 40 });
  const types = record.nodes.map((n) => n.type);

  assert.ok(types.includes("Sampler"), "the track's own instrument carries the slide");
  assert.equal(
    record.params.filter((p) => p.param === "Sampler.detune").length, 0,
    "the Sampler has no detune to ramp",
  );

  const rates = record.params.filter((p) => p.param === "Sampler.playbackRate");
  assert.ok(rates.length >= 2, "expected a starting rate and a ramp");
  assert.equal(rates[0].value, 1, "the slide starts at the sample's own pitch");
  // A perfect fifth resamples by 2^(7/12).
  assert.ok(
    Math.abs(rates.at(-1).value - Math.pow(2, 7 / 12)) < 1e-4,
    `ended at rate ${rates.at(-1).value}`,
  );
});

test("a Sampler slide needs no reset, unlike a shared detune signal", async () => {
  // Each note gets fresh buffer sources that are discarded when it ends, so
  // there is no lingering state to undo — which is why the rate ramp has no
  // trailing return to 1 the way applyPitchAnchors has one to 0 cents.
  const record = await slideWith({ label: "violin", synth: 40 });
  const rates = record.params.filter((p) => p.param === "Sampler.playbackRate");

  assert.ok(rates.at(-1).value > 1, "the rate ends where the slide arrives");
});

test("a PolySynth slides on a glide voice too", async () => {
  // PolySynth sets options through set(), not through a Signal, so it takes
  // the same path as the Sampler.
  const record = await slideWith({ label: "lead" });
  const types = record.nodes.map((n) => n.type);

  assert.ok(types.includes("PolySynth"), "the track's own synth is still built");
  assert.ok(types.includes("Synth"), "a glide voice carries the slide");

  const ramps = record.params.filter((p) => p.param === "Synth.detune");
  const arrival = Math.max(...ramps.map((r) => r.value));
  assert.ok(Math.abs(arrival - 700) < 1, `arrived at ${arrival} cents`);
});

test("the glide voice goes through the track's effects, not straight out", async () => {
  // A slide that bypassed the chain would jump out of the mix — dry, and at
  // the wrong level — for exactly the notes that slide.
  const record = await slideWith(
    { label: "lead", synth: { type: "PolySynth" } },
    [],
    { audioGraph: [{ id: "reverb", type: "Reverb", options: { decay: 2 } }] },
  );

  const glideTargets = record.connections.filter((c) => c.from === "Synth").map((c) => c.to);
  const synthTargets = record.connections.filter((c) => c.from === "PolySynth").map((c) => c.to);

  assert.ok(glideTargets.length > 0, "the glide voice should be connected to something");
  assert.deepEqual(
    glideTargets, synthTargets,
    "the glide voice should land where the track synth lands",
  );
  assert.ok(glideTargets.includes("Reverb"), `routed to ${glideTargets.join(", ")}`);
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
    const arrival = Math.min(...ramps.map((r) => r.value));
    assert.ok(Math.abs(arrival + 1200) < 1, `arrived at ${arrival} cents`);
    assert.equal(ramps.at(-1).value, 0, "and comes back to centre");
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

/* --- GM soundfonts ------------------------------------------------------- */

test("synth: { gm, strategy } asks for the density it names", async () => {
  // A bare number takes the balanced default. Naming `complete` is how a
  // sustained instrument gets one sample per semitone back.
  const balanced = await playAndRecord(composition([
    { label: "violin", synth: 40, notes: [note(60, 0)] },
  ]));
  const complete = await playAndRecord(composition([
    { label: "violin", synth: { gm: 40, strategy: "complete" }, notes: [note(60, 0)] },
  ]));

  const urlCount = (r) =>
    Object.keys(r.record.nodes.find((n) => n.type === "Sampler").options.urls).length;

  assert.equal(urlCount(complete), 88);
  assert.ok(
    urlCount(balanced) < urlCount(complete),
    `balanced ${urlCount(balanced)} should be lighter than complete`,
  );
});

test("prepareSoundfonts probes only when a track needs samples", async () => {
  const { prepareSoundfonts } = await import("../src/browser/synth-factory.js");

  assert.equal(
    await prepareSoundfonts([{ label: "a", synth: "MonoSynth" }, { label: "b" }]),
    null,
    "a piece of pure Tone synths should not pay for a request",
  );
  assert.notEqual(
    await prepareSoundfonts([{ label: "a", synth: 40 }]), null,
    "a GM number needs a base url",
  );
  assert.notEqual(
    await prepareSoundfonts([{ label: "a", synth: { gm: 40 } }]), null,
    "the object spelling counts too",
  );
  assert.notEqual(
    await prepareSoundfonts(
      [{ label: "a", synth: "violin" }],
      [{ id: "violin", type: 40 }],
    ),
    null,
    "a preset that names a GM program needs samples just the same",
  );
});

test("a customPreset can name a GM program", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "strings", synth: "violin", notes: [note(67, 0)] }],
    { customPresets: [{ id: "violin", type: 40 }] },
  ));

  const sampler = record.nodes.find((n) => n.type === "Sampler");
  assert.ok(sampler, `no Sampler; got ${record.nodes.map((n) => n.type).join(", ")}`);
  assert.match(Object.values(sampler.options.urls)[0], /\/violin-mp3\//);
});

test("a GM preset carries its sampling strategy", async () => {
  const { record } = await playAndRecord(composition(
    [{ label: "strings", synth: "violin", notes: [note(67, 0)] }],
    { customPresets: [{ id: "violin", type: 40, strategy: "complete" }] },
  ));

  const sampler = record.nodes.find((n) => n.type === "Sampler");
  assert.equal(Object.keys(sampler.options.urls).length, 88);
});

test("a track can override a GM preset's strategy", async () => {
  const { record } = await playAndRecord(composition(
    [{
      label: "strings",
      synth: { preset: "violin", strategy: "minimal" },
      notes: [note(67, 0)],
    }],
    { customPresets: [{ id: "violin", type: 40, strategy: "complete" }] },
  ));

  const sampler = record.nodes.find((n) => n.type === "Sampler");
  assert.ok(
    Object.keys(sampler.options.urls).length < 20,
    `the track's minimal should win, got ${Object.keys(sampler.options.urls).length}`,
  );
});

test("a preset naming a Tone class still resolves to that class", async () => {
  // The GM branch must not swallow the string case.
  const { record } = await playAndRecord(composition(
    [{ label: "lead", synth: "warm", notes: [note(60, 0)] }],
    { customPresets: [{ id: "warm", type: "MonoSynth", options: { detune: 7 } }] },
  ));

  assert.equal(record.nodes.find((n) => n.type === "MonoSynth")?.options?.detune, 7);
});

/* --- sustaining past the end of the sample -------------------------------- */

/** Play one note of `beats` on a GM sampler whose samples have `shape`. */
async function sustainWith(beats, shape = "sustaining", trackExtra = {}) {
  const restore = installFakeBrowser();
  try {
    const { Tone, record } = createFakeTone();
    // The fake Sampler reads its buffer shape out of its constructor options.
    const Base = Tone.Sampler;
    Tone.Sampler = class extends Base {
      constructor(options) { super({ ...options, sampleShape: shape }); }
    };
    globalThis.Tone = Tone;

    const { createPlayer } = await import(`../src/browser/music-player.js?s=${shape}${beats}${JSON.stringify(trackExtra)}`);
    const ui = createPlayer(composition(
      [{ label: "held", synth: { gm: 48, ...trackExtra }, notes: [note(60, 0, beats)] }],
      { tempo: 60 },   // one beat is one second, so beats are seconds
    ), { Tone });

    const { collectHandlers } = await import("./helpers/fake-browser.mjs");
    await collectHandlers(ui).find((h) => typeof h.click === "function").click();
    for (const event of record.scheduled) event.callback(0);
    return record;
  } finally {
    restore();
  }
}

test("a note longer than the sample loops the sample's sustain", async () => {
  // Every FluidR3 sample is a fixed 3.19s render, so an 8-second note used to
  // end in 4.8 seconds of silence. Tone's Sampler schedules each voice to stop
  // at the end of its buffer; setting `loop` on a started ToneBufferSource
  // cancels exactly that stop, which is the hook this uses.
  const record = await sustainWith(8);
  const source = record.sources[0];

  assert.ok(source, "the sampler should have sounded a voice");
  assert.equal(source.loop, true, "the voice should loop");
  assert.ok(source.loopEnd > source.loopStart, "with a real loop window");
  assert.ok(source.loopStart > 0, "the loop should start past the attack");
});

test("the note is then stopped where it actually ends", async () => {
  // Enabling the loop cancels Sampler's own stop, so without this the note
  // would ring for the rest of the piece.
  const record = await sustainWith(8);

  assert.equal(record.stops.length, 1, "exactly one explicit stop");
  assert.equal(record.stops[0].time, 8, "at the written end of the note");
});

test("a note that fits inside the sample is left alone", async () => {
  const record = await sustainWith(2);

  assert.equal(record.sources[0].loop, false, "no loop is needed");
  assert.equal(record.stops.length, 0, "and Sampler's own stop is right");
});

test("a decaying sample is not looped", async () => {
  // A piano is supposed to die away. Looping its tail would be an obviously
  // stuck note, so analyseSustain measures the recording rather than trusting
  // a list of instrument families.
  const record = await sustainWith(8, "decaying");

  assert.equal(record.sources[0].loop, false, "a decayed tail must not loop");
  assert.equal(record.stops.length, 0);
});

test("loopSustain: false opts out", async () => {
  const record = await sustainWith(8, "sustaining", { loopSustain: false });

  assert.equal(record.sources[0].loop, false);
  assert.equal(record.stops.length, 0);
});

test("analyseSustain tells a sustaining sample from a decaying one", async () => {
  const { analyseSustain } = await import("../src/browser/synth-factory.js");

  const make = (envelope) => {
    const data = new Float32Array(8000);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(i * 0.05) * envelope(i / data.length);
    }
    return { duration: 2, getChannelData: () => data };
  };

  assert.equal(analyseSustain(make(() => 1)).loops, true, "a flat organ tone loops");
  assert.equal(analyseSustain(make((t) => Math.exp(-6 * t))).loops, false, "a piano does not");
  assert.equal(analyseSustain(null), null, "and a missing buffer is not a crash");
});

test("the loop join is levelled and crossfaded before it is used", async () => {
  // Looping raw audio leaves two seams: a level step, because the recording
  // decays across the window, and a waveform step at the join. Landing on a
  // zero crossing removes the click but not the discontinuity in the
  // partials, so the buffer is edited once.
  const { analyseSustain, prepareLoopRegion } = await import("../src/browser/synth-factory.js");

  const length = 20000;
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    // Sustaining, but decaying across its length — which is what causes the step.
    data[i] = Math.sin(i * 0.05) * (1 - 0.7 * (i / length));
  }
  const buffer = { duration: 2, length, numberOfChannels: 1, getChannelData: () => data };

  const analysis = analyseSustain(buffer);
  assert.equal(analysis.loops, true);

  const rms = (from, to) => {
    let s = 0;
    for (let i = from; i < to; i++) s += data[i] * data[i];
    return Math.sqrt(s / (to - from));
  };
  const { startSample: s, endSample: e } = analysis;
  const measure = Math.round(length * 0.1);
  const stepBefore = Math.abs(data[e - 1] - data[s - 1]);
  const levelBefore = rms(s, s + measure) / rms(e - measure, e);

  assert.equal(prepareLoopRegion(buffer, analysis), true);

  // The crossfade closes the waveform step exactly: the signal arriving at
  // loopEnd is made equal to what precedes loopStart.
  // Measured on this signal: 1.6e-2 unfixed, 1.0e-2 with the gain ramp alone,
  // 5e-5 once the crossfade runs. The bound isolates the crossfade.
  assert.ok(stepBefore > 1e-3, `nothing to fix; step was already ${stepBefore}`);
  const stepAfter = Math.abs(data[e - 1] - data[s - 1]);
  assert.ok(stepAfter < 1e-3, `the join should be near-exact, got ${stepAfter.toExponential(2)}`);

  // And 4.15 dB unfixed, 2.35 dB with the crossfade alone, 0.30 dB once the
  // gain ramp levels the loop. Likewise isolates the ramp.
  const levelAfter = Math.abs(20 * Math.log10(rms(s, s + measure) / rms(e - measure, e)));
  assert.ok(Math.abs(20 * Math.log10(levelBefore)) > 2, "nothing to fix");
  assert.ok(levelAfter < 1, `loop should be level, got ${levelAfter.toFixed(2)} dB`);
});

test("the buffer is edited once, not on every note", async () => {
  const { analyseSustain, prepareLoopRegion } = await import("../src/browser/synth-factory.js");

  const length = 20000;
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) data[i] = Math.sin(i * 0.05) * (1 - 0.7 * (i / length));
  const buffer = { duration: 2, length, numberOfChannels: 1, getChannelData: () => data };

  const analysis = analyseSustain(buffer);
  prepareLoopRegion(buffer, analysis);
  const once = Float32Array.from(data);

  prepareLoopRegion(buffer, analysis);
  prepareLoopRegion(buffer, analysis);

  assert.deepEqual(Array.from(data), Array.from(once), "repeat calls must not re-blend");
});

test("a decaying sample is never edited", async () => {
  const { analyseSustain, prepareLoopRegion } = await import("../src/browser/synth-factory.js");

  const length = 20000;
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) data[i] = Math.sin(i * 0.05) * Math.exp(-6 * (i / length));
  const original = Float32Array.from(data);
  const buffer = { duration: 2, length, numberOfChannels: 1, getChannelData: () => data };

  assert.equal(prepareLoopRegion(buffer, analyseSustain(buffer)), false);
  assert.deepEqual(Array.from(data), Array.from(original), "a piano's recording is left alone");
});
