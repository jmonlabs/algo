/**
 * Steve Reich-style phase shifting.
 *
 * Two voices play the same pattern. Each cycle, voice2 shifts ahead in
 * time by `shiftPerCycle` beats — the pattern slowly drifts out of
 * alignment, producing the interference textures of works like
 * "Piano Phase" and "Clapping Music".
 *
 * @example
 * const cell = [
 *   { pitch: 60, duration: 0.5, time: 0 },
 *   { pitch: 64, duration: 0.5, time: 0.5 },
 *   { pitch: 67, duration: 0.5, time: 1 },
 *   { pitch: 72, duration: 0.5, time: 1.5 },
 * ];
 * const { voice1, voice2 } = phaseShift(cell, { cycles: 8, shift: 0.125 });
 * // voice1 plays the pattern 8 times in place;
 * // voice2 plays it 8 times, drifting +0.125 beats per cycle.
 *
 * @param {Array} pattern - JMON notes forming one cycle (numeric `time`)
 * @param {Object} options
 * @param {number} options.cycles - Number of cycles to repeat
 * @param {number} [options.shift=0.125] - Per-cycle drift of the second voice, in beats
 * @returns {{voice1: Array, voice2: Array}} Two phased voice streams
 */
export function phaseShift(pattern, { cycles, shift: shiftPerCycle = 0.125 } = {}) {
  if (!Number.isInteger(cycles) || cycles <= 0) throw new Error('phaseShift: cycles must be a positive integer');
  const cycleDur = pattern.reduce(
    (m, n) => Math.max(m, n.time + n.duration),
    0,
  );
  const voice1 = [];
  const voice2 = [];
  for (let i = 0; i < cycles; i++) {
    for (const n of pattern) {
      voice1.push({ ...n, time: n.time + i * cycleDur });
      voice2.push({ ...n, time: n.time + i * cycleDur + i * shiftPerCycle });
    }
  }
  return { voice1, voice2 };
}
