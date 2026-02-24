/**
 * Represents a collection of loops for rhythm and melody pattern generation
 *
 * @example Observable
 * ```js
 * jm = await import("https://esm.sh/jsr/@jmon/algo")
 *
 * // Create a simple melody loop
 * melody = [
 *   {pitch: 60, duration: 0.5, time: 0},
 *   {pitch: 62, duration: 0.5, time: 0.5},
 *   {pitch: 64, duration: 1, time: 1}
 * ]
 *
 * loop = new jm.generative.loops.Loop({ loops: melody })
 * sequences = loop.toJMonSequences()
 *
 * // Or use the static Euclidean rhythm helper
 * euclidean = jm.generative.loops.Loop.euclidean({ beats: 16, pulses: 5 })
 * ```
 *
 * @example Node.js
 * ```js
 * import { jm } from '@jmon/algo'
 *
 * const loop = jm.generative.loops.Loop.fromTrack({
 *   notes: [{pitch: 60, duration: 1, time: 0}]
 * })
 * const result = loop.toJMonSequences()
 * ```
 */
export class Loop {
  /**
   * Initializes a Loop object.
   *
   * @param {Object} options - Configuration options
   * @param {Object|Array} options.loops - Dictionary or array of JMON tracks. Each track has notes: [{pitch, duration, time, velocity}, ...]
   * @param {number} [options.measureLength=4] - The length of a measure in beats
   * @param {boolean} [options.insertRests=true] - Whether to insert rests
   */
  constructor(options = {}) {
    const {
      loops,
      measureLength = 4,
      insertRests = true
    } = options;
    
    // Input validation
    if (!loops) {
      throw new Error('loops is required');
    }
    
    if (typeof measureLength !== 'number' || measureLength <= 0) {
      throw new Error('measureLength must be a positive number');
    }
    
    if (typeof insertRests !== 'boolean') {
      throw new Error('insertRests must be a boolean');
    }

    this.measureLength = measureLength;
    
    // Convert array to object if needed
    let loopsObj = loops;
    if (Array.isArray(loops)) {
      if (loops.length === 0) {
        throw new Error('Loops array cannot be empty');
      }
      loopsObj = {};
      loops.forEach((loop, i) => {
        const label = loop?.label || `Loop ${i + 1}`;
        loopsObj[label] = loop;
      });
    }
    
    // Validate that loops object is not empty
    if (typeof loopsObj !== 'object' || Object.keys(loopsObj).length === 0) {
      throw new Error('Loops must be a non-empty object or array');
    }
    
    // Store loops as JMON tracks
    this.loops = {};
    for (const [name, loopData] of Object.entries(loopsObj)) {
      // Validate loop data
      if (!loopData) {
        throw new Error(`Loop data for "${name}" is null or undefined`);
      }
      
      // Extract notes and validate them
      const notes = Array.isArray(loopData) ? loopData : (loopData.notes || []);
      
      if (!Array.isArray(notes)) {
        throw new Error(`Notes for loop "${name}" must be an array`);
      }
      
      // Validate each note has required JMON properties
      const validatedNotes = notes.map((note, index) => {
        if (!note || typeof note !== 'object') {
          throw new Error(`Note ${index} in loop "${name}" must be an object`);
        }
        
        if (note.pitch !== null && (typeof note.pitch !== 'number' || note.pitch < 0 || note.pitch > 127)) {
          throw new Error(`Note ${index} in loop "${name}" has invalid pitch: ${note.pitch}`);
        }
        
        if (typeof note.time !== 'number' || note.time < 0) {
          throw new Error(`Note ${index} in loop "${name}" has invalid time: ${note.time}`);
        }
        
        if (typeof note.duration !== 'number' || note.duration <= 0) {
          throw new Error(`Note ${index} in loop "${name}" has invalid duration: ${note.duration}`);
        }
        
        return {
          pitch: note.pitch,
          time: note.time,
          duration: note.duration,
          velocity: typeof note.velocity === 'number' ? Math.max(0, Math.min(1, note.velocity)) : 0.8
        };
      });
      
      this.loops[name] = {
        label: loopData.label || name,
        notes: insertRests ? this.fillGapsWithRests(validatedNotes) : validatedNotes,
        synth: loopData.synth || {
          type: 'Synth',
          options: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
          }
        }
      };
    }
  }

  /**
   * Fill gaps between notes with rests (JMON format)
   */
  fillGapsWithRests(notes) {
    if (notes.length === 0) return notes;
    
    const result = [];
    let currentTime = 0;
    
    // Sort by time
    const sortedNotes = [...notes].sort((a, b) => a.time - b.time);
    
    for (const note of sortedNotes) {
      // Add rest if there's a gap
      if (note.time > currentTime) {
        result.push({
          pitch: null, // null indicates rest
          duration: note.time - currentTime,
          time: currentTime,
          velocity: 0
        });
      }
      
      // Add the note
      result.push({
        pitch: note.pitch,
        duration: note.duration,
        time: note.time,
        velocity: note.velocity || 0.8
      });
      currentTime = note.time + note.duration;
    }
    
    return result;
  }

  /**
   * Create a loop from a single JMON track
   */
  static fromTrack(track, measureLength = 4) {
    const notes = track.notes || [];
    if (notes.length === 0) {
      throw new Error('Track must have notes to create loop');
    }

    return new Loop({ loops: { [track.label || 'Track']: track }, measureLength });
  }

  /**
   * Create a loop from simple pitch/duration arrays
   * @param {Array} pitches - Array of MIDI pitches (or null for rests)
   * @param {Array} durations - Array of durations in beats
   * @param {Object} options - Optional configuration (iterations, transpose, offset, label)
   * @returns {Loop} A new Loop instance
   */
  static fromPattern(pitches, durations, options = {}) {
    if (!Array.isArray(pitches) || !Array.isArray(durations)) {
      throw new Error('pitches and durations must be arrays');
    }

    if (pitches.length === 0 || durations.length === 0) {
      throw new Error('pitches and durations arrays cannot be empty');
    }

    // Calculate total duration of one pattern iteration
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const iterations = options.iterations || 1;
    const transpose = options.transpose || 0;
    const offset = options.offset || 0;
    const label = options.label || 'Pattern';

    // Generate notes for all iterations
    const notes = [];
    let currentTime = offset;

    for (let iter = 0; iter < iterations; iter++) {
      const transposition = transpose * iter;

      for (let i = 0; i < pitches.length; i++) {
        const pitch = pitches[i];
        const duration = durations[i % durations.length];

        notes.push({
          pitch: pitch === null ? null : pitch + transposition,
          duration,
          time: currentTime,
          velocity: 0.8
        });

        currentTime += duration;
      }
    }

    // Create the loop with proper JMON format
    return new Loop({
      loops: { [label]: { notes } },
      measureLength: options.measureLength || 4
    });
  }

  /**
   * Create loop from Euclidean rhythm (JMON format)
   * @param {number} beats - Total number of beats
   * @param {number} pulses - Number of active pulses to distribute
   * @param {Array} [pitches=[60]] - Array of MIDI pitches to cycle through
   * @param {string} [label] - Label for the loop
   * @returns {Loop} A new Loop instance
   */
  static euclidean(beats, pulses, pitches = [60], label) {
    
    // Input validation
    if (typeof beats !== 'number' || beats <= 0 || !Number.isInteger(beats)) {
      throw new Error('beats must be a positive integer');
    }
    
    if (typeof pulses !== 'number' || pulses < 0 || !Number.isInteger(pulses)) {
      throw new Error('pulses must be a non-negative integer');
    }
    
    if (pulses > beats) {
      throw new Error('pulses cannot be greater than beats');
    }
    
    if (!Array.isArray(pitches) || pitches.length === 0) {
      throw new Error('pitches must be a non-empty array');
    }

    const pattern = this.generateEuclideanRhythm(beats, pulses);
    const notes = [];
    const beatDuration = 1.0; // Each beat is 1 quarter note
    
    pattern.forEach((active, index) => {
      if (active) {
        const time = index * beatDuration;
        const pitch = pitches[index % pitches.length];
        notes.push({
          pitch,
          duration: beatDuration * 0.8,
          time,
          velocity: 0.8
        });
      }
    });

    const trackLabel = label || `Euclidean ${pulses}/${beats}`;
    const track = {
      label: trackLabel,
      notes,
      synth: {
        type: 'Synth',
        options: {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 }
        }
      }
    };

    return new Loop({ loops: { [trackLabel]: track }, measureLength: beats });
  }

  /**
   * Generate Euclidean rhythm pattern using Bjorklund algorithm
   * This creates the most even distribution of pulses across beats
   */
  static generateEuclideanRhythm(beats, pulses) {
    if (pulses === 0) {
      return Array(beats).fill(false);
    }
    
    if (pulses >= beats) {
      return Array(beats).fill(true);
    }
    
    // Bjorklund algorithm implementation
    const pattern = [];
    
    // Initialize with pulses and remaining beats
    let groups = [
      { pattern: [1], count: pulses },           // Groups with pulses
      { pattern: [0], count: beats - pulses }    // Groups without pulses
    ];
    
    // Apply Bjorklund algorithm
    while (groups.length > 1) {
      const [first, second] = groups;
      
      if (first.count <= second.count) {
        // Merge first group into second
        const newCount = first.count;
        const remaining = second.count - first.count;
        
        groups = [
          { pattern: [...second.pattern, ...first.pattern], count: newCount }
        ];
        
        if (remaining > 0) {
          groups.push({ pattern: second.pattern, count: remaining });
        }
      } else {
        // Merge second group into first
        const newCount = second.count;
        const remaining = first.count - second.count;
        
        groups = [
          { pattern: [...first.pattern, ...second.pattern], count: newCount }
        ];
        
        if (remaining > 0) {
          groups.push({ pattern: first.pattern, count: remaining });
        }
      }
    }
    
    // Flatten the final pattern
    const finalGroup = groups[0];
    const result = [];
    
    for (let i = 0; i < finalGroup.count; i++) {
      result.push(...finalGroup.pattern);
    }
    
    // Convert to boolean array
    return result.map(x => x === 1);
  }

  /**
   * Get loops as JMON tracks (already in JMON format)
   */
  toJMonSequences() {
    return Object.values(this.loops);
  }

  /**
   * Simple plotting method matching Python implementation
   */
  async plot(pulse = 1/4, colors = null, options = {}) {
    const { LoopVisualizer } = await import('../../visualization/loops/LoopVisualizer.js');
    return LoopVisualizer.plotLoops(
      this.loops, 
      this.measureLength,
      pulse,
      colors,
      options
    );
  }
}