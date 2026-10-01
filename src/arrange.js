/**
 * jmon/arrange — the montage of a piece.
 *
 * @license GPL-3.0-or-later
 */

import { place } from "./notes/index.js";

/**
 * The montage of a piece: sections put end to end, in the order of `form`,
 * each lasting its own `length` and playing some of the parts. The result is
 * the piece, ready for `play`: one track per part, and whatever else is given
 * beside `sections` and `parts` (tempo, title, audioGraph…).
 *
 * A part is a track written from its own beat 0: `{ label, synth, notes }`.
 * A section names the parts it plays, as a list, or as an object whose values
 * are `place` options, to set a part's velocity, octave or offset in that
 * section only. A section's length is its own, whatever its notes do: a part
 * that ends early leaves a silence, one that runs over is heard under the
 * next section.
 *
 * @example
 * const parts = {
 *   pad: { label: "Pad", synth: 48, notes: pad },
 *   melody: { label: "Melody", synth: 69, notes: melody },
 * };
 * const sections = {
 *   intro: { length: 16, parts: ["pad"] },
 *   verse: { length: 16, parts: { pad: { velocity: 0.4 }, melody: { time: 2 } } },
 *   chorus: { length: 16, parts: { pad: {}, melody: { octave: 1, velocity: 0.8 } } },
 * };
 * const piece = jm.arrange(["intro", "verse", "chorus", "verse"], { sections, parts, tempo: 96 });
 *
 * @param {Array<string>} form - Section names, in the order they are heard
 * @param {Object} options
 * @param {Object<string, {length: number, parts: Array<string>|Object<string, Object>}>} options.sections
 * @param {Object<string, {notes: Array}>} options.parts - Tracks, by name
 * @returns {Object} A JMON piece: `{ ...rest, tracks }`, tracks in the order of `parts`
 */
export function arrange(form, { sections, parts, ...rest } = {}) {
  if (!sections || !parts) throw new Error('arrange: give { sections, parts }');
  const filled = {};
  let start = 0;
  for (const name of form) {
    const section = sections[name];
    if (!section) throw new Error(`arrange: no section "${name}" (${Object.keys(sections).join(', ')})`);
    if (!(section.length > 0)) throw new Error(`arrange: section "${name}" needs a length, in beats`);
    const used = Array.isArray(section.parts)
      ? section.parts.map((partName) => [partName, {}])
      : Object.entries(section.parts ?? {});
    for (const [partName, options] of used) {
      const part = parts[partName];
      if (!part) throw new Error(`arrange: section "${name}" plays "${partName}", which is not a part (${Object.keys(parts).join(', ')})`);
      if (!filled[partName]) {
        const { notes, ...rest } = part;
        filled[partName] = { ...rest, notes: [] };
      }
      const { time = 0, ...placement } = options ?? {};
      filled[partName].notes.push(...place(part.notes, { ...placement, time: start + time }));
    }
    start += section.length;
  }
  const tracks = Object.keys(parts).filter((partName) => filled[partName]).map((partName) => filled[partName]);
  return { ...rest, tracks };
}

