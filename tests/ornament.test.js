/**
 * Ornament: what an ornamented note keeps, and how long it lasts.
 *
 * Three defects this file pins down, all of them silent:
 *   - every ornament rebuilt its notes as bare `{ pitch, duration, time }`,
 *     dropping `velocity` and everything else the note carried;
 *   - the acciaccatura kept the main note at full length while starting it a
 *     grace later, so the figure ran 12.5% past the note it replaced;
 *   - the two random choices used `Math.random` in a library that is
 *     otherwise seeded, so the same call gave different music.
 *
 * node:test + assert — a failure fails the process.
 * Run with: node --test tests/ornament.test.js
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Ornament } from "../src/algorithms/theory/harmony/Ornament.js";

const note = (pitch, time, duration = 1, velocity = 0.8) =>
    ({ pitch, duration, time, velocity });

const span = (notes) => notes.reduce((sum, n) => sum + n.duration, 0);

const KEY = { tonic: "C", mode: "major" };

const CASES = [
    ["trill", { by: 1, trillRate: 0.25 }],
    ["mordent", { by: -1 }],
    ["turn", {}],
    ["arpeggio", { arpeggioDegrees: [0, 2, 4], direction: "up" }],
    ["grace_note", { graceNoteType: "acciaccatura", gracePitches: [62] }],
    ["grace_note", { graceNoteType: "appoggiatura", gracePitches: [62] }],
];

/* --- what the note keeps -------------------------------------------------- */

for (const [type, parameters] of CASES) {
    const label = parameters.graceNoteType || type;

    test(`Ornament '${label}' keeps the velocity it was given`, () => {
        const notes = [note(60, 0, 4, 0.37), note(64, 4)];
        const out = new Ornament({ type, ...KEY, parameters }).apply(notes, 0);
        const produced = out.slice(0, out.length - 1);

        assert.ok(produced.length >= 2, `${label} produced nothing to check`);
        for (const n of produced) {
            assert.equal(n.velocity, 0.37, `${label} dropped or changed velocity`);
        }
    });

    test(`Ornament '${label}' carries the note's other properties through`, () => {
        const source = { pitch: 60, duration: 4, time: 0, velocity: 0.5, channel: 3, label: "Lead" };
        const out = new Ornament({ type, ...KEY, parameters }).apply([source, note(64, 4)], 0);

        for (const n of out.slice(0, out.length - 1)) {
            assert.equal(n.channel, 3, `${label} dropped channel`);
            assert.equal(n.label, "Lead", `${label} dropped label`);
        }
    });

    test(`Ornament '${label}' fills exactly the note it replaces`, () => {
        const out = new Ornament({ type, ...KEY, parameters }).apply([note(60, 0, 4), note(64, 4)], 0);
        const produced = out.slice(0, out.length - 1);

        assert.ok(Math.abs(span(produced) - 4) < 1e-9,
            `${label} spans ${span(produced)} where the note was 4`);
        assert.equal(produced[0].time, 0, `${label} moved the start of the figure`);
        const last = produced[produced.length - 1];
        assert.ok(Math.abs(last.time + last.duration - 4) < 1e-9,
            `${label} overruns into the note that follows`);
    });
}

/* --- the acciaccatura, specifically --------------------------------------- */

test("acciaccatura is brief and takes its time from the main note", () => {
    const out = new Ornament({
        type: "grace_note", ...KEY,
        parameters: { graceNoteType: "acciaccatura", gracePitches: [62] },
    }).apply([note(60, 0, 4), note(64, 4)], 0);

    const [grace, main] = out;
    assert.equal(grace.pitch, 62);
    assert.equal(grace.duration, 0.5);        // 4 * 0.125
    assert.equal(main.pitch, 60);
    assert.equal(main.duration, 3.5);         // le reste, pas les 4 d'origine
    assert.equal(main.time, 0.5);
});

test("appoggiatura splits the main note in half", () => {
    const out = new Ornament({
        type: "grace_note", ...KEY,
        parameters: { graceNoteType: "appoggiatura", gracePitches: [62] },
    }).apply([note(60, 0, 4), note(64, 4)], 0);

    assert.deepEqual(out.slice(0, 2).map((n) => [n.pitch, n.duration, n.time]),
        [[62, 2, 0], [60, 2, 2]]);
});

/* --- reproducibility ------------------------------------------------------ */

test("a seeded Ornament picks the same grace pitch every time", () => {
    const build = () => new Ornament({
        type: "grace_note", ...KEY, seed: 7,
        parameters: { graceNoteType: "acciaccatura", gracePitches: [61, 62, 63, 64, 65] },
    }).apply([note(60, 0, 4), note(64, 4)], 0)[0].pitch;

    const first = build();
    for (let i = 0; i < 12; i++) {
        assert.equal(build(), first, "the same seed gave a different grace pitch");
    }
});

test("a seeded Ornament picks the same note when apply gets no index", () => {
    const melody = [note(60, 0), note(62, 1), note(64, 2), note(65, 3), note(67, 4)];
    const build = () => new Ornament({
        type: "mordent", ...KEY, seed: 42, parameters: { by: -1 },
    }).apply(melody.map((n) => ({ ...n })), null).map((n) => [n.pitch, n.time]);

    assert.deepEqual(build(), build());
});

test("different seeds are allowed to disagree", () => {
    const at = (seed) => new Ornament({
        type: "grace_note", ...KEY, seed,
        parameters: { graceNoteType: "acciaccatura", gracePitches: [61, 62, 63, 64, 65] },
    }).apply([note(60, 0, 4), note(64, 4)], 0)[0].pitch;

    const seen = new Set([...Array(24).keys()].map(at));
    assert.ok(seen.size > 1, "every seed produced the same pitch — the seed is ignored");
});

/* --- the notes it was not asked to touch ---------------------------------- */

test("Ornament leaves the surrounding notes exactly as they were", () => {
    const before = note(57, 0);
    const after = note(64, 5);
    const out = new Ornament({
        type: "turn", ...KEY, parameters: {},
    }).apply([before, note(60, 1, 4), after], 1);

    assert.deepEqual(out[0], before);
    assert.deepEqual(out[out.length - 1], after);
});
