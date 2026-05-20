/**
 * Corruptor - Post-processing middleware for JMON objects
 *
 * The Corruptor takes a "perfect" JMON object and applies non-linear degradation layers
 * to create haunting, unstable, and organic-sounding music inspired by NIN,
 * Hildur Guðnadóttir, Jóhann Jóhannsson, and late-stage Nirvana.
 *
 * @author JMON Contributors
 */

/**
 * Perlin-like noise generator for smooth random values
 */
class PerlinNoise {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.permutation = this.generatePermutation();
  }

  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    // Shuffle using seed
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
  }

  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x) {
    const h = hash & 15;
    const grad = 1 + (h & 7);
    return (h & 8 ? -grad : grad) * x;
  }

  noise(x) {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);

    const a = this.permutation[X];
    const b = this.permutation[X + 1];

    return this.lerp(u, this.grad(a, x), this.grad(b, x - 1));
  }
}

/**
 * Brownian Bridge generator for temporal instability
 */
class BrownianBridge {
  constructor(start = 0, end = 0, steps = 100, volatility = 1.0) {
    this.start = start;
    this.end = end;
    this.steps = steps;
    this.volatility = volatility;
  }

  generate() {
    const path = [this.start];
    let current = this.start;

    for (let i = 1; i < this.steps; i++) {
      const timeRemaining = this.steps - i;
      const drift = (this.end - current) / timeRemaining;
      const diffusion = this.volatility * this.gaussianRandom();

      current += drift + diffusion;
      path.push(current);
    }

    path.push(this.end);
    return path;
  }

  gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }
}

/**
 * Main Corruptor class
 */
export class Corruptor {
  constructor(options = {}) {
    this.options = {
      entropy: options.entropy || 0.5, // 0.0 to 1.0
      seed: options.seed || Math.random(),

      // Temporal Instability
      temporalJitter: options.temporalJitter !== undefined ? options.temporalJitter : true,
      jitterMethod: options.jitterMethod || 'perlin', // 'perlin' or 'brownian'

      // Harmonic Erosion
      microtonalDrift: options.microtonalDrift !== undefined ? options.microtonalDrift : true,
      driftAmount: options.driftAmount || 1.0, // Multiplier for microtonal drift

      // Structural Decay
      noteAttrition: options.noteAttrition !== undefined ? options.noteAttrition : true,
      velocitySag: options.velocitySag !== undefined ? options.velocitySag : true,

      // Spectral Corruption
      spectralCorruption: options.spectralCorruption !== undefined ? options.spectralCorruption : false,

      // Semantic Ghosting
      ghostTrack: options.ghostTrack !== undefined ? options.ghostTrack : false,
      ghostOctaveShift: options.ghostOctaveShift || -2,
      ghostDurationMultiplier: options.ghostDurationMultiplier || 4,
      ghostVelocityMultiplier: options.ghostVelocityMultiplier || 0.3,
      ghostDelay: options.ghostDelay !== undefined ? options.ghostDelay : 1.0, // beats of delay before ghost enters
      ghostDrift: options.ghostDrift !== undefined ? options.ghostDrift : 0.3 // temporal smearing amount
    };

    this.perlin = new PerlinNoise(this.options.seed);
    this.randomSeed = this.options.seed;
  }

  /**
   * Seeded random number generator
   */
  seededRandom() {
    const x = Math.sin(this.randomSeed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Gaussian random with seed
   */
  gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - this.seededRandom();
    const v = this.seededRandom();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }

  /**
   * Main corruption function
   * @param {Object} jmonObject - The JMON object to corrupt
   * @param {Number} entropy - Entropy level (0.0 to 1.0), overrides constructor value if provided
   * @returns {Object} Corrupted JMON object
   */
  corrupt(jmonObject, entropy = null) {
    // Use provided entropy or default
    const entropyLevel = entropy !== null ? entropy : this.options.entropy;

    // Deep clone the JMON object to avoid modifying the original
    const corrupted = JSON.parse(JSON.stringify(jmonObject));

    // Apply corruption to each track
    if (corrupted.tracks && Array.isArray(corrupted.tracks)) {
      corrupted.tracks = corrupted.tracks.map(track => this.corruptTrack(track, entropyLevel));

      // Apply ghost track if enabled
      if (this.options.ghostTrack && corrupted.tracks.length > 0) {
        const ghostTracks = this.generateGhostTracks(corrupted.tracks, entropyLevel);
        corrupted.tracks.push(...ghostTracks);
      }
    }

    // Apply spectral corruption to global audioGraph if present
    if (this.options.spectralCorruption && corrupted.audioGraph) {
      corrupted.audioGraph = this.corruptAudioGraph(corrupted.audioGraph, entropyLevel);
    }

    return corrupted;
  }

  /**
   * Corrupt a single track
   * @param {Object} track - JMON track object
   * @param {Number} entropy - Entropy level
   * @returns {Object} Corrupted track
   */
  corruptTrack(track, entropy) {
    const corruptedTrack = { ...track };

    if (!corruptedTrack.notes || !Array.isArray(corruptedTrack.notes)) {
      return corruptedTrack;
    }

    // Generate temporal jitter sequence if enabled
    let jitterSequence = null;
    if (this.options.temporalJitter) {
      jitterSequence = this.generateJitterSequence(corruptedTrack.notes.length, entropy);
    }

    // Apply corruption to each note
    corruptedTrack.notes = corruptedTrack.notes
      .map((note, index) => this.corruptNote(note, index, entropy, jitterSequence))
      .filter(note => note !== null); // Remove dropped notes

    // Apply velocity sag if enabled
    if (this.options.velocitySag && corruptedTrack.notes.length > 0) {
      corruptedTrack.notes = this.applyVelocitySag(corruptedTrack.notes, entropy);
    }

    return corruptedTrack;
  }

  /**
   * Generate jitter sequence for temporal instability
   * @param {Number} length - Number of notes
   * @param {Number} entropy - Entropy level
   * @returns {Array} Jitter values
   */
  generateJitterSequence(length, entropy) {
    if (this.options.jitterMethod === 'brownian') {
      const bridge = new BrownianBridge(0, 0, length, entropy * 0.5);
      return bridge.generate();
    } else {
      // Perlin noise
      const jitter = [];
      for (let i = 0; i < length; i++) {
        const noiseValue = this.perlin.noise(i * 0.1);
        jitter.push(noiseValue * entropy);
      }
      return jitter;
    }
  }

  /**
   * Corrupt a single note
   * @param {Object} note - JMON note object
   * @param {Number} index - Note index in sequence
   * @param {Number} entropy - Entropy level
   * @param {Array} jitterSequence - Pre-generated jitter values
   * @returns {Object|null} Corrupted note or null if dropped
   */
  corruptNote(note, index, entropy, jitterSequence) {
    // Note attrition - probabilistic note removal
    if (this.options.noteAttrition && entropy > 0.7) {
      const dropProbability = (entropy - 0.7) * 0.5; // 0 at 0.7, 0.15 at 1.0
      if (this.seededRandom() < dropProbability) {
        return null; // Drop this note
      }
    }

    const corruptedNote = { ...note };

    // Temporal Instability - Apply jitter to time
    if (this.options.temporalJitter && jitterSequence) {
      const jitter = jitterSequence[index] || 0;
      const maxJitter = 0.25; // Maximum jitter of a quarter note
      const deltaT = jitter * maxJitter * entropy;

      if (typeof corruptedNote.time === 'number') {
        corruptedNote.time = Math.max(0, corruptedNote.time + deltaT);
      }

      // Also add slight duration jitter
      if (typeof corruptedNote.duration === 'number') {
        const durationJitter = this.gaussianRandom(0, 0.1 * entropy);
        corruptedNote.duration = Math.max(0.1, corruptedNote.duration * (1 + durationJitter));
      }
    }

    // Harmonic Erosion - Microtonal drift
    if (this.options.microtonalDrift) {
      const sigma = entropy * 0.5 * this.options.driftAmount; // Standard deviation
      const microtuning = this.gaussianRandom(0, sigma);

      if (!corruptedNote.microtuning) {
        corruptedNote.microtuning = microtuning;
      } else {
        corruptedNote.microtuning += microtuning;
      }
    }

    return corruptedNote;
  }

  /**
   * Apply velocity sag over time (energy loss)
   * @param {Array} notes - Array of JMON notes
   * @param {Number} entropy - Entropy level
   * @returns {Array} Notes with velocity sag applied
   */
  applyVelocitySag(notes, entropy) {
    if (notes.length === 0) return notes;

    return notes.map((note, index) => {
      const sagAmount = entropy * 0.4; // Max 40% reduction at full entropy
      const progress = index / notes.length;
      const sagFactor = 1 - (sagAmount * progress);

      const velocity = note.velocity !== undefined ? note.velocity : 0.8;
      const saggedVelocity = Math.max(0.1, velocity * sagFactor);

      return {
        ...note,
        velocity: saggedVelocity
      };
    });
  }

  /**
   * Generate ghost tracks (semantic ghosting)
   *
   * Ghost tracks are delayed, blurred shadow layers — not parallel voicing.
   * They enter after the melody, use fewer anchor points, drift in time,
   * and sustain long notes that follow the melody's contour from a distance.
   *
   * @param {Array} tracks - Original JMON tracks
   * @param {Number} entropy - Entropy level
   * @returns {Array} Ghost tracks
   */
  generateGhostTracks(tracks, entropy) {
    const ghostTracks = [];
    const mult = this.options.ghostDurationMultiplier;
    const delay = this.options.ghostDelay;
    const drift = this.options.ghostDrift;

    for (const track of tracks) {
      if (!track.notes || track.notes.length === 0) continue;

      // Only ghost melodic tracks (tracks with pitch variation)
      const pitches = track.notes.map(n => typeof n.pitch === 'number' ? n.pitch : 60);
      const uniquePitches = new Set(pitches);
      if (uniquePitches.size <= 3) continue;

      // Track boundaries
      const trackEnd = Math.max(...track.notes.map(n => (n.time || 0) + (n.duration || 0)));

      // Build sparse, delayed ghost notes
      const ghostNotes = [];
      let nextAvailable = -Infinity;

      for (let i = 0; i < track.notes.length; i++) {
        const note = track.notes[i];
        const noteTime = note.time || 0;

        // Ghost onset = melody time + fixed delay + Perlin drift
        const driftOffset = this.perlin.noise(i * 0.15) * drift * entropy;
        const ghostTime = noteTime + delay + driftOffset;

        if (ghostTime < nextAvailable) continue; // skip overlapping
        if (ghostTime >= trackEnd) continue; // past end

        const originalPitch = typeof note.pitch === 'number' ? note.pitch : 60;
        const ghostPitch = originalPitch + (this.options.ghostOctaveShift * 12);
        const ghostDur = Math.min(note.duration * mult, trackEnd - ghostTime);

        if (ghostDur <= 0) continue;

        ghostNotes.push({
          pitch: ghostPitch,
          duration: ghostDur,
          time: ghostTime,
          velocity: (note.velocity || 0.8) * this.options.ghostVelocityMultiplier
        });

        nextAvailable = ghostTime + ghostDur;
      }

      if (ghostNotes.length === 0) continue;

      const ghostTrack = {
        label: `${track.label || 'Track'} (Ghost)`,
        notes: ghostNotes,
        midiChannel: track.midiChannel || 0,
        synth: 'Synth' // sustaining oscillator, not the melody's percussive synth
      };
      if (track.midiProgram !== undefined) ghostTrack.midiProgram = track.midiProgram;
      if (track.pan !== undefined) ghostTrack.pan = track.pan;
      ghostTracks.push(ghostTrack);
    }

    return ghostTracks;
  }

  /**
   * Corrupt audio graph (spectral corruption)
   * @param {Object} audioGraph - JMON audioGraph object
   * @param {Number} entropy - Entropy level
   * @returns {Object} Corrupted audioGraph
   */
  corruptAudioGraph(audioGraph, entropy) {
    const corrupted = JSON.parse(JSON.stringify(audioGraph));

    // Find effect nodes to corrupt
    if (corrupted.nodes) {
      corrupted.nodes = corrupted.nodes.map(node => {
        if (node.type === 'Distortion' || node.type === 'BitCrusher') {
          // Add or modify automation
          if (!node.automation) {
            node.automation = {};
          }

          // Add wet parameter automation
          if (node.type === 'Distortion') {
            node.automation.wet = this.generateAutomationCurve(entropy, 0.0, entropy);
          }

          if (node.type === 'BitCrusher') {
            // Reduce bit depth as entropy increases
            const minBits = Math.max(1, Math.floor(16 - (entropy * 12)));
            node.automation.bits = this.generateAutomationCurve(entropy, 16, minBits);
          }
        }

        return node;
      });
    }

    return corrupted;
  }

  /**
   * Generate automation curve
   * @param {Number} entropy - Entropy level
   * @param {Number} startValue - Starting value
   * @param {Number} endValue - Ending value
   * @returns {Array} Automation anchor points
   */
  generateAutomationCurve(entropy, startValue, endValue) {
    const points = [];
    const numPoints = Math.floor(4 + entropy * 8); // 4-12 points

    for (let i = 0; i <= numPoints; i++) {
      const time = (i / numPoints);
      const progress = Math.pow(time, 1 + entropy); // Exponential curve influenced by entropy
      const value = startValue + (endValue - startValue) * progress;

      points.push({
        time: time.toFixed(3),
        value: value
      });
    }

    return points;
  }

  /**
   * Apply all corruption functions to a JMON object
   * Alias for corrupt()
   */
  process(jmonObject, entropy = null) {
    return this.corrupt(jmonObject, entropy);
  }

  /**
   * Set entropy level
   * @param {Number} entropy - New entropy level (0.0 to 1.0)
   */
  setEntropy(entropy) {
    this.options.entropy = Math.max(0, Math.min(1, entropy));
  }

  /**
   * Get current entropy level
   * @returns {Number} Current entropy level
   */
  getEntropy() {
    return this.options.entropy;
  }

  /**
   * Reset random seed
   * @param {Number} seed - New seed value
   */
  setSeed(seed) {
    this.options.seed = seed;
    this.randomSeed = seed;
    this.perlin = new PerlinNoise(seed);
  }
}

/**
 * Convenience function to corrupt a JMON object
 * @param {Object} jmonObject - JMON object to corrupt
 * @param {Number} entropy - Entropy level (0.0 to 1.0)
 * @param {Object} options - Corruptor options
 * @returns {Object} Corrupted JMON object
 */
export function corruptJmon(jmonObject, entropy = 0.5, options = {}) {
  const corruptor = new Corruptor({ ...options, entropy });
  return corruptor.corrupt(jmonObject);
}

export default Corruptor;
