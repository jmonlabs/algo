import { Arpeggiate } from './Arpeggiate.js';

/**
 * Strum - Guitar strumming simulator
 * A convenience wrapper around Arpeggiate with guitar-specific presets
 *
 * @example
 * ```js
 * // Strum downward
 * const strum = new Strum({ direction: 'down', speed: 0.1 });
 * const strummedTrack = strum.generate(chordTrack);
 *
 * // Strum with alternating pattern
 * const altStrum = new Strum({ pattern: [1, 0, 1, 0], speed: 0.08 });
 * const result = altStrum.generate(track);
 *
 * // Random strumming
 * const randomStrum = new Strum({ direction: 'random', speed: 0.12 });
 * ```
 */
export class Strum {
  /**
   * Creates a Strum instance
   * @param {Object} options - Configuration options
   * @param {string|Array<number>} [options.direction='down'] - Strum direction: 'down', 'up', 'alternate', 'random', or pattern array where each value determines direction for successive chords (0=down, 1=up). Example: [0,0,1,0] = down, down, up, down
   * @param {number} [options.speed=0.1] - Time delay between each note in the strum (in quarter notes)
   * @param {string} [options.output='track'] - Accepted for forward compatibility; generate() always returns JMON notes
   * @param {number} [options.velocity] - Base velocity for strummed notes (default: undefined - preserves original)
   * @param {number} [options.velocityVariation=0] - Random variation in velocity (+/- range)
   */
  constructor(options = {}) {
    const {
      direction = 'down',
      speed = 0.1,
      output = 'track',
      velocity = undefined,
      velocityVariation = 0
    } = options;

    this.direction = direction;
    this.speed = speed;
    this.output = output;
    this.velocity = velocity;
    this.velocityVariation = velocityVariation;
    this.alternateState = 0; // For alternate strumming
  }

  /**
   * Generate strummed notes from a track containing chords
   * @param {Array<Object>} track - Array of JMON notes, where notes with array pitch are chords
   * @param {Object} [options={}] - Override options for this generation
   * @returns {Array<Object>} Array of JMON notes with strummed chords
   *
   * @example
   * ```js
   * const track = [
   *   { pitch: [60, 64, 67], duration: 2, time: 0 },  // C major chord
   *   { pitch: [62, 65, 69], duration: 2, time: 2 }   // D minor chord
   * ];
   * const strum = new Strum({ direction: 'down', speed: 0.08 });
   * const result = strum.generate(track);
   * ```
   */
  generate(track, options = {}) {
    const {
      direction = this.direction,
      speed = this.speed,
      velocity = this.velocity,
      velocityVariation = this.velocityVariation
    } = options;

    // If direction is a custom pattern (array), we need to handle each chord individually
    if (Array.isArray(direction)) {
      return this._generateWithPattern(track, direction, speed, velocity, velocityVariation);
    }

    // Convert strum direction to arpeggiate order
    const order = this._directionToOrder(direction, track);

    // Use Arpeggiate for the heavy lifting
    const arp = new Arpeggiate({
      order,
      delay: speed,
      velocityBase: velocity,
      output: this.output
    });

    const result = arp.generate(track);

    // Apply velocity variation if specified (only to notes that already have velocity)
    if (velocityVariation > 0) {
      result.forEach(note => {
        if (note.velocity !== undefined) {
          const variation = (Math.random() * 2 - 1) * velocityVariation;
          note.velocity = Math.max(0, Math.min(1, note.velocity + variation));
        }
      });
    }

    return result;
  }

  /**
   * Generate strummed notes with a custom pattern
   * Pattern determines strum direction for each successive chord
   * @private
   */
  _generateWithPattern(track, pattern, speed, velocity, velocityVariation) {
    const result = [];
    let chordIndex = 0; // Track which chord we're on for pattern cycling

    for (const note of track) {
      // If not a chord, just pass through
      if (!Array.isArray(note.pitch) || note.pitch.length <= 1) {
        result.push({ ...note });
        continue;
      }

      // This is a chord - apply pattern direction for this chord
      const chord = note.pitch;
      const baseTime = note.time || 0;
      const duration = note.duration || 1;

      // Get direction from pattern for this chord
      const patternValue = pattern[chordIndex % pattern.length];
      const direction = patternValue === 0 ? 'down' : 'up';

      // Build order based on direction
      const order = direction === 'down'
        ? Array.from({ length: chord.length }, (_, i) => i)  // low to high
        : Array.from({ length: chord.length }, (_, i) => chord.length - 1 - i);  // high to low

      // Create notes based on order
      for (let i = 0; i < order.length; i++) {
        const noteIndex = order[i];
        const pitch = chord[noteIndex];
        const time = baseTime + (i * speed);

        const newNote = {
          pitch,
          duration,
          time,
          ...(note.synth && { synth: note.synth })
        };

        // Apply velocity if needed
        if (note.velocity !== undefined) {
          let noteVelocity = note.velocity;
          if (velocityVariation > 0) {
            const variation = (Math.random() * 2 - 1) * velocityVariation;
            noteVelocity = Math.max(0, Math.min(1, noteVelocity + variation));
          }
          newNote.velocity = noteVelocity;
        } else if (velocity !== undefined) {
          newNote.velocity = velocity;
        }

        result.push(newNote);
      }

      chordIndex++; // Move to next chord for pattern
    }

    // Sort by time
    result.sort((a, b) => (a.time || 0) - (b.time || 0));

    return result;
  }

  /**
   * Convert strum direction to arpeggiate order
   * @private
   */
  _directionToOrder(direction, track) {
    // Handle custom pattern (array of 0s and 1s)
    if (Array.isArray(direction)) {
      // For custom patterns, we need to know chord length
      // We'll handle this per-chord in the generate method
      // For now, return the pattern as-is and let Arpeggiate interpret it
      return (chordLength) => {
        const indices = [];
        for (let i = 0; i < chordLength; i++) {
          const patternValue = direction[i % direction.length];
          if (patternValue === 0) {
            indices.push(i); // down
          } else {
            indices.push(chordLength - 1 - i); // up
          }
        }
        return indices;
      };
    }

    // String-based direction
    switch (direction) {
      case 'up':
        return 'down'; // In Arpeggiate, 'down' means high to low

      case 'down':
        return 'up'; // In Arpeggiate, 'up' means low to high

      case 'alternate': {
        const isDown = this.alternateState % 2 === 0;
        this.alternateState++;
        return isDown ? 'up' : 'down';
      }

      case 'random':
        return 'random';

      default:
        return 'up';
    }
  }

  /**
   * Static method to strum a single chord
   * @param {Array<number>} chord - Array of MIDI pitches
   * @param {Object} options - Strum options
   * @returns {Array<Object>} Array of individual notes
   *
   * @example
   * ```js
   * const notes = Strum.strumChord([60, 64, 67], {
   *   direction: 'down',
   *   speed: 0.1,
   *   duration: 2
   * });
   * ```
   */
  static strumChord(chord, options = {}) {
    const {
      direction = 'down',
      speed = 0.1,
      duration = 1,
      velocity = undefined,
      time = 0
    } = options;

    // Convert strum direction to arpeggiate order
    let order;
    switch (direction) {
      case 'up':
        order = 'down';
        break;
      case 'down':
        order = 'up';
        break;
      case 'random':
        order = 'random';
        break;
      default:
        order = 'up';
    }

    return Arpeggiate.arpeggiateChord(chord, {
      order,
      delay: speed,
      duration,
      velocity,
      time
    });
  }
}

/**
 * Convenience function to strum a track
 * @param {Array<Object>} track - Array of JMON notes
 * @param {Object} [options={}] - Strum options
 * @returns {Array<Object>} Strummed track
 *
 * @example
 * ```js
 * import { strum } from './Strum.js';
 *
 * const track = [{ pitch: [60, 64, 67], duration: 2, time: 0 }];
 * const result = strum(track, { direction: 'up', speed: 0.08 });
 * ```
 */
export function strum(track, options = {}) {
  const strummer = new Strum(options);
  return strummer.generate(track);
}
