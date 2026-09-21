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

      // Per-dimension intensities, 0 to 1. Leave one undefined and it follows
      // `entropy`, which is how a single knob drove everything before 3.1. Set
      // one and that dimension stops listening to entropy — so you can wreck
      // the timing and leave the pitches alone, or the reverse.
      drift: options.drift,
      jitter: options.jitter,
      attrition: options.attrition,
      sag: options.sag,
      // What an intensity of 1 means, in absolute terms.
      jitterBeats: options.jitterBeats !== undefined ? options.jitterBeats : 0.25,
      attritionMax: options.attritionMax !== undefined ? options.attritionMax : 0.4,
      sagMax: options.sagMax !== undefined ? options.sagMax : 0.4,

      // ── The violence family ──────────────────────────────────────────
      // The four dimensions above model WEAR: they remove notes, blur the
      // timing and let the velocities fall away. Together they sound like a
      // player who is missing notes and losing the tempo, because that is
      // what wear is. They cannot sound wild, at any setting.
      //
      // These sound wild, and they work the opposite way: they ADD and they
      // DECIDE. Each gesture is exact and lands on the grid — the violence
      // comes from the precision, not from the disorder. Each is an intensity
      // from 0 to 1, it is the odds of the gesture being applied, and none of
      // them follows `entropy`: wear and violence are not the same axis, so
      // turning up the entropy of a piece must never start smashing it.
      // All default to 0, so a Corruptor that does not ask for them behaves
      // exactly as it did before.

      // Retrigger a note as a burst of fast repeats, velocity climbing.
      stutter: options.stutter || 0,
      stutterCount: options.stutterCount || 4,
      stutterSubdivision: options.stutterSubdivision || 0.125,
      // Replace a whole bar with its lowest pitch, hammered.
      wall: options.wall || 0,
      wallBar: options.wallBar || 4,
      wallSubdivision: options.wallSubdivision || 0.25,
      // Play a window backwards — a true retrograde, durations kept.
      reverse: options.reverse || 0,
      reverseWindow: options.reverseWindow || 4,
      // Throw a note into another octave.
      slam: options.slam || 0,
      slamOctaves: options.slamOctaves || [-2, -1, 1],
      // Push a note off the scale. `scale` is a list of pitch classes (0 = C);
      // without one, the note simply moves by a semitone.
      offScale: options.offScale || 0,
      scale: options.scale || null,
      // Detune by a stated interval, not a sprinkle: 50 cents is a quarter
      // tone, and it is meant to be heard as wrong, unlike `drift`.
      detune: options.detune || 0,
      detuneCents: options.detuneCents !== undefined ? options.detuneCents : 50,
      // Cut a note down to a stab, leaving a hole where it used to ring.
      chop: options.chop || 0,
      chopGrid: options.chopGrid || 0.125,

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
   * Intensity of one dimension: its own option when set, `entropy` otherwise.
   * @param {string} name - 'drift', 'jitter', 'attrition' or 'sag'
   * @param {Number} entropy - The fallback
   * @returns {Number} 0 to 1
   */
  amount(name, entropy) {
    const own = this.options[name];
    const value = own === undefined || own === null ? entropy : own;
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Odds of a violence gesture, 0 to 1. Unlike the wear dimensions these never
   * fall back to `entropy` — they are off unless asked for.
   * @param {string} name
   * @returns {Number}
   */
  violence(name) {
    return Math.max(0, Math.min(1, this.options[name] || 0));
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
      jitterSequence = this.generateJitterSequence(corruptedTrack.notes.length, this.amount('jitter', entropy));
    }

    // Apply corruption to each note
    corruptedTrack.notes = corruptedTrack.notes
      .map((note, index) => this.corruptNote(note, index, entropy, jitterSequence))
      .filter(note => note !== null); // Remove dropped notes

    // Apply velocity sag if enabled
    if (this.options.velocitySag && corruptedTrack.notes.length > 0) {
      corruptedTrack.notes = this.applyVelocitySag(corruptedTrack.notes, entropy);
    }

    // Then the violence, in a fixed order: restructure, then replace, then
    // multiply, then displace, then shorten. Each is a no-op at intensity 0.
    corruptedTrack.notes = this.applyViolence(corruptedTrack.notes);

    return corruptedTrack;
  }

  /**
   * Run the violence family over one track's notes.
   * @param {Array} notes - JMON notes
   * @returns {Array} JMON notes, in time order
   */
  applyViolence(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return notes;

    let out = notes;
    out = this.applyReverse(out);
    out = this.applyWall(out);
    out = this.applyStutter(out);
    out = this.applySlam(out);
    out = this.applyOffScale(out);
    out = this.applyDetune(out);
    out = this.applyChop(out);

    return out === notes ? out : out.sort((a, b) => (a.time || 0) - (b.time || 0));
  }

  /**
   * Span of a note list, in beats.
   * @param {Array} notes
   * @returns {Number}
   */
  span(notes) {
    return notes.reduce((end, n) => Math.max(end, (n.time || 0) + (n.duration || 0)), 0);
  }

  /**
   * Play whole windows backwards. A true retrograde: the onsets mirror inside
   * the window and the durations are kept, so the material is the same and the
   * order of events is reversed.
   */
  applyReverse(notes) {
    const amount = this.violence('reverse');
    if (!(amount > 0)) return notes;

    const width = this.options.reverseWindow;
    const windows = Math.floor(this.span(notes) / width) + 1;
    const flipped = [];
    for (let i = 0; i < windows; i++) flipped.push(this.seededRandom() < amount);

    return notes.map((note) => {
      const index = Math.floor((note.time || 0) / width);
      if (!flipped[index]) return note;
      const start = index * width;
      const mirrored = start + width - ((note.time || 0) - start) - (note.duration || 0);
      return { ...note, time: Math.max(start, mirrored) };
    });
  }

  /**
   * Replace a bar with its lowest pitch, hammered in even strokes with the
   * velocity climbing. The bar stops being music and becomes a hit.
   */
  applyWall(notes) {
    const amount = this.violence('wall');
    if (!(amount > 0)) return notes;

    const width = this.options.wallBar;
    const step = this.options.wallSubdivision;
    const bars = Math.floor(this.span(notes) / width) + 1;
    const out = [];

    for (let i = 0; i < bars; i++) {
      const start = i * width;
      const inside = notes.filter((n) => (n.time || 0) >= start && (n.time || 0) < start + width);
      if (inside.length === 0) continue;

      const pitches = inside.map((n) => n.pitch).filter((p) => typeof p === 'number');
      if (pitches.length === 0 || this.seededRandom() >= amount) {
        out.push(...inside);
        continue;
      }

      const pitch = Math.min(...pitches);
      const peak = Math.max(...inside.map((n) => (n.velocity === undefined ? 0.8 : n.velocity)));
      const strokes = Math.max(1, Math.round(width / step));
      for (let k = 0; k < strokes; k++) {
        const rise = strokes === 1 ? 1 : k / (strokes - 1);
        out.push({
          pitch,
          duration: step * 0.9,
          time: start + k * step,
          velocity: Math.min(1, peak * (0.55 + 0.45 * rise)),
        });
      }
    }

    return out;
  }

  /**
   * Retrigger a note as a burst of fast repeats, velocity climbing — the
   * gesture that says machine rather than player.
   */
  applyStutter(notes) {
    const amount = this.violence('stutter');
    if (!(amount > 0)) return notes;

    const count = Math.max(2, Math.round(this.options.stutterCount));
    const step = this.options.stutterSubdivision;
    const out = [];

    for (const note of notes) {
      if (typeof note.pitch !== 'number' || this.seededRandom() >= amount) {
        out.push(note);
        continue;
      }
      const base = note.velocity === undefined ? 0.8 : note.velocity;
      for (let k = 0; k < count; k++) {
        out.push({
          ...note,
          time: (note.time || 0) + k * step,
          duration: Math.min(note.duration || step, step * 0.9),
          velocity: Math.min(1, base * (0.5 + 0.5 * (k / (count - 1)))),
        });
      }
    }

    return out;
  }

  /**
   * Throw a note into another octave, whole and exact.
   */
  applySlam(notes) {
    const amount = this.violence('slam');
    if (!(amount > 0)) return notes;

    const octaves = this.options.slamOctaves;
    return notes.map((note) => {
      if (typeof note.pitch !== 'number' || this.seededRandom() >= amount) return note;
      const pick = octaves[Math.floor(this.seededRandom() * octaves.length) % octaves.length];
      const pitch = note.pitch + pick * 12;
      return pitch >= 0 && pitch <= 127 ? { ...note, pitch } : note;
    });
  }

  /**
   * Push a note off the scale. With a `scale` given as pitch classes, the note
   * moves to the nearest pitch that is not in it; without one, by a semitone.
   */
  applyOffScale(notes) {
    const amount = this.violence('offScale');
    if (!(amount > 0)) return notes;

    const scale = this.options.scale;
    const inScale = (pitch) => scale.includes(((pitch % 12) + 12) % 12);

    return notes.map((note) => {
      if (typeof note.pitch !== 'number' || this.seededRandom() >= amount) return note;
      const order = this.seededRandom() < 0.5 ? [1, -1, 2, -2] : [-1, 1, -2, 2];
      const candidates = order.map((step) => note.pitch + step).filter((p) => p >= 0 && p <= 127);
      const pitch = Array.isArray(scale) && scale.length > 0
        ? candidates.find((p) => !inScale(p))
        : candidates[0];
      return pitch === undefined ? note : { ...note, pitch };
    });
  }

  /**
   * Detune by a stated interval — a quarter tone by default. Unlike `drift`,
   * which sprinkles a few cents everywhere, this is meant to be heard.
   */
  applyDetune(notes) {
    const amount = this.violence('detune');
    if (!(amount > 0)) return notes;

    const semitones = this.options.detuneCents / 100;
    return notes.map((note) => {
      if (typeof note.pitch !== 'number' || this.seededRandom() >= amount) return note;
      const direction = this.seededRandom() < 0.5 ? -1 : 1;
      return { ...note, microtuning: (note.microtuning || 0) + direction * semitones };
    });
  }

  /**
   * Cut a note down to a stab, leaving a hole where it used to ring.
   */
  applyChop(notes) {
    const amount = this.violence('chop');
    if (!(amount > 0)) return notes;

    const grid = this.options.chopGrid;
    return notes.map((note) => {
      if (this.seededRandom() >= amount) return note;
      const duration = Math.min(note.duration || grid, grid);
      return duration > 0 ? { ...note, duration } : note;
    });
  }

  /**
   * Generate jitter sequence for temporal instability
   * @param {Number} length - Number of notes
   * @param {Number} entropy - Entropy level
   * @returns {Array} Jitter values
   */
  generateJitterSequence(length, amount) {
    if (this.options.jitterMethod === 'brownian') {
      const bridge = new BrownianBridge(0, 0, length, amount * 0.5);
      return bridge.generate();
    } else {
      // Perlin noise
      const jitter = [];
      for (let i = 0; i < length; i++) {
        const noiseValue = this.perlin.noise(i * 0.1);
        jitter.push(noiseValue * amount);
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
    // Note attrition - probabilistic note removal, over the whole range of the
    // control rather than the top third of it: `attrition` 0.5 drops about a
    // fifth of the notes. The first note is never dropped, so a phrase that is
    // corrupted still starts where it started.
    if (this.options.noteAttrition && index > 0) {
      const dropProbability = this.amount('attrition', entropy) * this.options.attritionMax;
      if (dropProbability > 0 && this.seededRandom() < dropProbability) {
        return null; // Drop this note
      }
    }

    const corruptedNote = { ...note };

    // Temporal Instability - Apply jitter to time
    if (this.options.temporalJitter && jitterSequence) {
      // The sequence already carries the intensity, so the displacement is
      // linear in it: `jitter` 1 reaches `jitterBeats` at the extremes of the
      // noise. It used to be squared, which made the control unreadable.
      const jitter = jitterSequence[index] || 0;
      const deltaT = jitter * this.options.jitterBeats;

      if (typeof corruptedNote.time === 'number') {
        corruptedNote.time = Math.max(0, corruptedNote.time + deltaT);
      }

      // Also add slight duration jitter
      if (typeof corruptedNote.duration === 'number') {
        const durationJitter = this.gaussianRandom(0, 0.1 * this.amount('jitter', entropy));
        corruptedNote.duration = Math.max(0.1, corruptedNote.duration * (1 + durationJitter));
      }
    }

    // Harmonic Erosion - Microtonal drift
    if (this.options.microtonalDrift) {
      const sigma = this.amount('drift', entropy) * 0.5 * this.options.driftAmount; // Standard deviation
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

    const sagAmount = this.amount('sag', entropy) * this.options.sagMax;

    return notes.map((note, index) => {
      // A note that carries no velocity is left without one: inventing a 0.8
      // here used to overwrite "unspecified" with a value the piece never set.
      if (note.velocity === undefined) return note;

      const progress = index / notes.length;
      const sagFactor = 1 - (sagAmount * progress);

      return {
        ...note,
        velocity: Math.max(0.1, note.velocity * sagFactor)
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
