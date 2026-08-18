/**
 * Arpeggiate - General purpose arpeggiator for breaking chords into sequences
 * More flexible than Strum - supports custom orderings, delays, and transformations
 *
 * @example
 * ```js
 * // Basic arpeggio
 * const arp = new Arpeggiate({ order: [0, 1, 2], delay: 0.1 });
 * const result = arp.generate(chordTrack);
 *
 * // Custom ordering
 * const arp2 = new Arpeggiate({ order: [0, 2, 1, 0], delay: 0.08 });
 *
 * // With velocity ramping
 * const arp3 = new Arpeggiate({
 *   order: [0, 1, 2, 1],
 *   delay: 0.1,
 *   velocityCurve: [0.6, 0.8, 0.9, 0.8]
 * });
 * ```
 */
export class Arpeggiate {
  /**
   * Creates an Arpeggiate instance
   * @param {Object} options - Configuration options
   * @param {Array<number>|string} [options.order=[0, 1, 2]] - Note ordering: array of indices or preset ('up', 'down', 'updown', 'downup', 'random')
   * @param {number} [options.delay=0.1] - Time delay between each note (in quarter notes)
   * @param {Array<number>} [options.velocityCurve] - Optional velocity values for each position in the pattern (0.0-1.0)
   * @param {number} [options.velocityBase] - Base velocity if not specified in note or curve (0.0-1.0, default: undefined - preserves original)
   * @param {boolean} [options.loop=false] - Whether to loop the order pattern for chords longer than the pattern
   * @param {string} [options.output='track'] - Accepted for forward compatibility; `generate()` always returns JMON notes
   */
  constructor(options = {}) {
    const {
      order = [0, 1, 2],
      delay = 0.1,
      velocityCurve = null,
      velocityBase = undefined,
      loop = false,
      output = 'track'
    } = options;

    this.order = order;
    this.delay = delay;
    this.velocityCurve = velocityCurve;
    this.velocityBase = velocityBase;
    this.loop = loop;
    this.output = output;
  }

  /**
   * Generate arpeggiated notes from a track containing chords
   * @param {Array<Object>} track - Array of JMON notes
   * @param {Object} [options={}] - Override options
   * @returns {Array<Object>} Arpeggiated track
   *
   * @example
   * ```js
   * const track = [
   *   { pitch: [60, 64, 67], duration: 2, time: 0 }
   * ];
   * const arp = new Arpeggiate({ order: [0, 1, 2, 1], delay: 0.1 });
   * const result = arp.generate(track);
   * // => [
   * //   { pitch: 60, duration: 2, time: 0 },
   * //   { pitch: 64, duration: 2, time: 0.1 },
   * //   { pitch: 67, duration: 2, time: 0.2 },
   * //   { pitch: 64, duration: 2, time: 0.3 }
   * // ]
   * ```
   */
  generate(track, options = {}) {
    const {
      order = this.order,
      delay = this.delay,
      velocityCurve = this.velocityCurve,
      velocityBase = this.velocityBase,
      loop = this.loop
    } = options;

    const result = [];

    for (const note of track) {
      // If not a chord, just pass through
      if (!Array.isArray(note.pitch) || note.pitch.length <= 1) {
        result.push({ ...note });
        continue;
      }

      // This is a chord - arpeggiate it
      const chord = note.pitch;
      const baseTime = note.time || 0;
      const duration = note.duration || 1;

      // Resolve order pattern
      const indices = this._resolveOrder(order, chord.length, loop);

      // Create individual notes
      for (let i = 0; i < indices.length; i++) {
        const chordIndex = indices[i];

        // Skip invalid indices
        if (chordIndex < 0 || chordIndex >= chord.length) {
          continue;
        }

        const pitch = chord[chordIndex];
        const time = baseTime + (i * delay);

        // Calculate velocity - only add if original note has velocity or if curve is specified
        let noteVelocity = undefined;
        if (velocityCurve && i < velocityCurve.length) {
          noteVelocity = velocityCurve[i];
        } else if (note.velocity !== undefined) {
          noteVelocity = note.velocity;
        } else if (velocityBase !== undefined) {
          noteVelocity = velocityBase;
        }

        const newNote = {
          pitch,
          duration,
          time,
          ...(note.synth && { synth: note.synth })
        };

        // Only add velocity if we calculated one (keep as 0.0-1.0 range for JMON)
        if (noteVelocity !== undefined) {
          newNote.velocity = noteVelocity;
        }

        result.push(newNote);
      }
    }

    // Sort by time
    result.sort((a, b) => (a.time || 0) - (b.time || 0));

    return result;
  }

  /**
   * Resolve order pattern to array of indices
   * @private
   */
  _resolveOrder(order, chordLength, loop) {
    // If already an array, use it
    if (Array.isArray(order)) {
      if (loop && order.length < chordLength) {
        // Loop the pattern to match chord length
        const looped = [];
        for (let i = 0; i < chordLength; i++) {
          looped.push(order[i % order.length]);
        }
        return looped;
      }
      return order;
    }

    // String presets
    switch (order) {
      case 'up':
        return Array.from({ length: chordLength }, (_, i) => i);

      case 'down':
        return Array.from({ length: chordLength }, (_, i) => chordLength - 1 - i);

      case 'updown': {
        // Up then down
        const up = Array.from({ length: chordLength }, (_, i) => i);
        const down = Array.from({ length: chordLength - 1 }, (_, i) => chordLength - 2 - i);
        return [...up, ...down];
      }

      case 'downup': {
        // Down then up
        const down2 = Array.from({ length: chordLength }, (_, i) => chordLength - 1 - i);
        const up2 = Array.from({ length: chordLength - 1 }, (_, i) => i + 1);
        return [...down2, ...up2];
      }

      case 'random': {
        // Random order
        const shuffled = Array.from({ length: chordLength }, (_, i) => i);
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }

      case 'random-walk': {
        // Random walk through indices
        const walk = [Math.floor(Math.random() * chordLength)];
        for (let i = 1; i < chordLength; i++) {
          const prev = walk[walk.length - 1];
          const step = Math.random() > 0.5 ? 1 : -1;
          const next = (prev + step + chordLength) % chordLength;
          walk.push(next);
        }
        return walk;
      }

      default:
        // Default: up
        return Array.from({ length: chordLength }, (_, i) => i);
    }
  }

  /**
   * Static method to arpeggiate a single chord
   * @param {Array<number>} chord - Array of MIDI pitches
   * @param {Object} options - Arpeggiate options
   * @returns {Array<Object>} Array of individual notes
   *
   * @example
   * ```js
   * const notes = Arpeggiate.arpeggiateChord([60, 64, 67], {
   *   order: [0, 1, 2, 1],
   *   delay: 0.1,
   *   duration: 2,
   *   velocity: 0.7
   * });
   * ```
   */
  static arpeggiateChord(chord, options = {}) {
    const {
      order = [0, 1, 2],
      delay = 0.1,
      duration = 1,
      velocity = undefined,
      time = 0
    } = options;

    const arp = new Arpeggiate({ order, delay, velocityBase: velocity });
    const note = { pitch: chord, duration, time };
    return arp.generate([note]);
  }
}

/**
 * Convenience function to arpeggiate a track
 * @param {Array<Object>} track - Array of JMON notes
 * @param {Object} [options={}] - Arpeggiate options
 * @returns {Array<Object>} Arpeggiated track
 *
 * @example
 * ```js
 * import { arpeggiate } from './Arpeggiate.js';
 *
 * const track = [{ pitch: [60, 64, 67], duration: 2, time: 0 }];
 * const result = arpeggiate(track, { order: 'updown', delay: 0.08 });
 * ```
 */
export function arpeggiate(track, options = {}) {
  const arp = new Arpeggiate(options);
  return arp.generate(track);
}
