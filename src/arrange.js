/**
 * jmon/arrange — the montage of a piece.
 *
 * @license GPL-3.0-or-later
 */

import { place } from "./notes/index.js";

/**
 * The montage of a piece: sections put end to end, each lasting its own
 * `length`, and their tracks gathered by `label` into one track each for the
 * whole piece. The result is the piece, ready for `play`.
 *
 * A section is `{ length, tracks }`, where `tracks` are JMON tracks,
 * `{ label, synth, notes }`, written from the section's own beat 0. The same
 * section may appear several times. A track keeps the `synth` (and any other
 * field) of its first appearance; the same label with another synth is an
 * error. A section's length is its own, whatever its notes do: notes that end
 * early leave a silence, notes that run over are heard under the next
 * section.
 *
 * @example
 * const pad = { label: "Pad", synth: 48 };
 * const bass = { label: "Bass", synth: 33 };
 * const intro = { length: 16, tracks: [{ ...pad, notes: introPad }] };
 * const verse = { length: 16, tracks: [{ ...pad, notes: versePad }, { ...bass, notes: verseBass }] };
 * const piece = jm.arrange([intro, verse, verse], { tempo: 96, title: "sketch" });
 *
 * @param {Array<{length: number, tracks: Array<Object>}>} sections - In the order they are heard
 * @param {Object} [piece] - The piece's own fields: tempo, title, audioGraph…
 * @returns {Object} A JMON piece: `{ ...piece, tracks }`, tracks in order of first appearance
 */
export function arrange(sections, piece = {}) {
  if (!Array.isArray(sections)) throw new Error("arrange: give a list of sections, { length, tracks }");
  const byLabel = new Map();
  let start = 0;
  sections.forEach((section, index) => {
    if (!section || !(section.length > 0)) {
      throw new Error(`arrange: section ${index} needs a length, in beats`);
    }
    for (const track of section.tracks ?? []) {
      if (typeof track.label !== "string") {
        throw new Error(`arrange: a track of section ${index} has no label`);
      }
      const { notes = [], ...fields } = track;
      if (!byLabel.has(track.label)) {
        byLabel.set(track.label, { ...fields, notes: [] });
      }
      const merged = byLabel.get(track.label);
      if (JSON.stringify(merged.synth) !== JSON.stringify(fields.synth)) {
        throw new Error(`arrange: track "${track.label}" has two synths, ${JSON.stringify(merged.synth)} and ${JSON.stringify(fields.synth)}`);
      }
      merged.notes.push(...place(notes, { time: start }));
    }
    start += section.length;
  });
  return { ...piece, tracks: [...byLabel.values()] };
}
