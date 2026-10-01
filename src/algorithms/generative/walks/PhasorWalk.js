/**
 * A phasor: a point turning around a centre at a steady rate. Its
 * sub-phasors turn around it (epicycles), and theirs around them.
 *
 * @example
 * const moon = new Phasor({ distance: 0.3, frequency: 5 });
 * const planet = new Phasor({ distance: 2, frequency: 1, subPhasors: [moon] });
 * planet.simulate(PhasorSystem.times({ start: 0, end: 10, steps: 100 }));
 */
export class Phasor {
  /**
   * @param {Object} [options]
   * @param {number} [options.distance=1] - Radius, from its centre
   * @param {number} [options.frequency=1] - Radians per unit of time
   * @param {number} [options.phase=0] - Angle at time 0, in radians
   * @param {Array<Phasor>} [options.subPhasors=[]] - Phasors turning around this one
   */
  constructor({ distance = 1.0, frequency = 1.0, phase = 0, subPhasors = [] } = {}) {
    this.distance = distance;
    this.frequency = frequency;
    this.phase = phase;
    this.subPhasors = subPhasors;
  }

  /**
   * Where the phasor is at `time`, around a centre.
   * @param {number} time
   * @param {{x: number, y: number}} [center]
   * @returns {{x: number, y: number, angle: number}}
   */
  position(time, center = { x: 0, y: 0 }) {
    const angle = this.frequency * time + this.phase;
    return { x: center.x + this.distance * Math.cos(angle), y: center.y + this.distance * Math.sin(angle), angle };
  }

  /**
   * The phasor and its sub-phasors over time: for each time, one entry per
   * phasor with its position, its distance from the origin and its angle
   * from the origin in degrees.
   * @param {Array<number>} times
   * @param {{x: number, y: number}} [center]
   * @returns {Array<{time: number, position: Object, distance: number, angle: number, phasor: Phasor}>}
   */
  simulate(times, center = { x: 0, y: 0 }) {
    const results = [];
    for (const time of times) {
      const position = this.position(time, center);
      const distance = Math.sqrt(position.x ** 2 + position.y ** 2);
      let angle = Math.atan2(position.y, position.x) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      results.push({ time, position, distance, angle, phasor: this });
      for (const sub of this.subPhasors) results.push(...sub.simulate([time], position));
    }
    return results;
  }
}

/**
 * Several phasors around one origin, and their reading as notes.
 */
export class PhasorSystem {
  /**
   * @param {Object} [options]
   * @param {Array<Phasor>} [options.phasors=[]]
   */
  constructor({ phasors = [] } = {}) {
    this.phasors = phasors;
  }

  /**
   * Each phasor's `simulate`, in order.
   * @param {Array<number>} times
   * @returns {Array<Array<Object>>}
   */
  simulate(times) {
    return this.phasors.map((p) => p.simulate(times));
  }

  /**
   * The phasors as notes, one list per phasor: at each time a note whose
   * pitch follows the distance from the origin (or the angle) and whose
   * duration follows the other.
   * @param {Array<number>} times
   * @param {Object} [options]
   * @param {Array<number>} [options.pitchRange=[40, 80]]
   * @param {Array<number>} [options.durationRange=[0.25, 2]]
   * @param {'distance'|'angle'} [options.pitchBy='distance'] - What the pitch follows; the duration follows the other
   * @param {Array<number>} [options.pitches] - Snap the pitch to these
   * @param {number} [options.reach=10] - The distance read as the top of the range
   * @returns {Array<Array<Object>>} JMON notes per phasor, each with `phasorData`
   */
  notes(times, { pitchRange = [40, 80], durationRange = [0.25, 2], pitchBy = 'distance', pitches = null, reach = 10 } = {}) {
    return this.simulate(times).map((results) => results.map((r) => {
      const near = Math.max(0, Math.min(1, r.distance / reach));
      const turn = r.angle / 360;
      const byDistance = pitchBy === 'distance';
      let pitch = pitchRange[0] + (byDistance ? near : turn) * (pitchRange[1] - pitchRange[0]);
      const duration = byDistance
        ? durationRange[1] - near * (durationRange[1] - durationRange[0])
        : durationRange[0] + turn * (durationRange[1] - durationRange[0]);
      if (pitches) {
        const i = Math.floor(((pitch - pitchRange[0]) / (pitchRange[1] - pitchRange[0])) * pitches.length);
        pitch = pitches[Math.max(0, Math.min(i, pitches.length - 1))];
      } else {
        pitch = Math.round(pitch);
      }
      return { pitch, duration, time: r.time, phasorData: { distance: r.distance, angle: r.angle, position: r.position } };
    }));
  }

  /**
   * Evenly spaced times.
   * @param {Object} [options]
   * @param {number} [options.start=0]
   * @param {number} [options.end=10]
   * @param {number} [options.steps=100]
   * @returns {Array<number>}
   */
  static times({ start = 0, end = 10, steps = 100 } = {}) {
    const step = (end - start) / (steps - 1);
    return Array.from({ length: steps }, (_, i) => start + i * step);
  }
}
