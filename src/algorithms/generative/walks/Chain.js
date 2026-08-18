import { 
  offsetToBarsBeatsTicks, 
  barsBeatsTicksToOffset,
  notesToTrack,
  DEFAULT_TIMING_CONFIG 
} from '../../utils/jmon-timing.js';

/**
 * Chain class for random walks with branching and merging
 * Based on the Python djalgo Chain class
 * Provides JMON-native output with proper timing integration
 */
export class Chain {
  walkRange;
  walkStart;
  walkProbability;
  roundTo;
  branchingProbability;
  mergingProbability;
  timingConfig;

  constructor(options = {}) {
    this.walkRange = options.walkRange || null;
    this.walkStart = options.walkStart !== undefined ? options.walkStart : 
      (this.walkRange ? Math.floor((this.walkRange[1] - this.walkRange[0]) / 2) + this.walkRange[0] : 0);
    this.walkProbability = options.walkProbability || [-1, 0, 1]; // Default to discrete steps like Python
    this.roundTo = options.roundTo !== undefined ? options.roundTo : null;
    this.branchingProbability = options.branchingProbability || 0.0;
    this.mergingProbability = options.mergingProbability || 0.0;
    this.timingConfig = options.timingConfig || DEFAULT_TIMING_CONFIG;
  }

  /**
   * Generate random walk sequence(s) with branching and merging
   * @param {number} length - Length of the walk
   * @param {number} seed - Random seed for reproducibility
   * @returns {Array<Array>} Array of walk sequences (branches)
   */
  generate(length, seed) {
    // Use a simple seeded random if seed is provided
    let randomFunc = Math.random;
    if (seed !== undefined) {
      randomFunc = this.createSeededRandom(seed);
    }

    // Initialize first walker
    const walks = [this.initializeWalk(length)];
    let currentPositions = [this.walkStart];

    for (let step = 1; step < length; step++) {
      const newPositions = [...currentPositions]; // Start with current positions
      const newWalks = [];

      for (let walkIndex = 0; walkIndex < currentPositions.length; walkIndex++) {
        const walk = walks[walkIndex];
        const currentPosition = currentPositions[walkIndex];

        if (currentPosition === null) {
          // This walk has ended due to merging
          if (walk) walk[step] = null;
          continue;
        }

        // Generate next step
        const stepSize = this.generateStep(randomFunc);
        let nextPosition = currentPosition + stepSize;
        
        // Check for NaN and handle it
        if (isNaN(nextPosition)) {
          nextPosition = currentPosition; // Fallback to current position
        }

        // Apply bounds (only if walkRange is specified)
        if (this.walkRange !== null) {
          if (nextPosition < this.walkRange[0]) {
            nextPosition = this.walkRange[0];
          } else if (nextPosition > this.walkRange[1]) {
            nextPosition = this.walkRange[1];
          }
        }
        
        // Final NaN check
        if (isNaN(nextPosition)) {
          nextPosition = this.walkStart; // Ultimate fallback
        }

        if (walk) {
          walk[step] = nextPosition;
        }
        newPositions[walkIndex] = nextPosition;

        // Check for branching
        if (randomFunc() < this.branchingProbability) {
          const newWalk = this.createBranch(walks[walkIndex], step);
          const branchStepSize = this.generateStep(randomFunc);
          let branchPosition = currentPosition + branchStepSize;
          
          // Check for NaN in branch
          if (isNaN(branchPosition)) {
            branchPosition = currentPosition;
          }

          // Apply bounds to branch (only if walkRange is specified)
          if (this.walkRange !== null) {
            if (branchPosition < this.walkRange[0]) {
              branchPosition = this.walkRange[0];
            } else if (branchPosition > this.walkRange[1]) {
              branchPosition = this.walkRange[1];
            }
          }
          
          // Final NaN check for branch
          if (isNaN(branchPosition)) {
            branchPosition = this.walkStart;
          }

          newWalk[step] = branchPosition;
          newWalks.push(newWalk);
          newPositions.push(branchPosition);
        }
      }

      // Add new branches
      walks.push(...newWalks);
      currentPositions = newPositions;

      // Handle merging
      currentPositions = this.handleMerging(walks, currentPositions, step, randomFunc);
    }

    return walks;
  }

  /**
   * Generate a single clean walk — no branching, no merging, no null
   * padding. Convenience for the common case where you just want one
   * melodic line and don't want to deal with the `[branches]` shape or
   * filter out nulls.
   *
   * Equivalent to forcing `branchingProbability = 0` and
   * `mergingProbability = 0` for this call only; the configured
   * probabilities on the instance are restored afterwards.
   *
   * @param {number} length - Length of the walk
   * @param {number} [seed] - Random seed for reproducibility
   * @returns {Array<number>} A flat array of walk values
   *
   * @example
   * ```js
   * const chain = new jm.generative.walks.Chain({
   *   walkRange: [0, 7],
   *   walkStart: 3,
   *   walkProbability: [-1, 0, 1],
   *   roundTo: 0
   * });
   * const walk = chain.line(16, 42);  // [3, 4, 5, 5, 5, 6, 7, 7, ...]
   * ```
   */
  line(length, seed) {
    const prevBranch = this.branchingProbability;
    const prevMerge = this.mergingProbability;
    this.branchingProbability = 0;
    this.mergingProbability = 0;
    try {
      const walks = this.generate(length, seed);
      return (walks[0] || []).filter(v => v !== null);
    } finally {
      this.branchingProbability = prevBranch;
      this.mergingProbability = prevMerge;
    }
  }

  /**
   * Generate a single step according to the probability distribution
   */
  generateStep(randomFunc = Math.random) {
    if (Array.isArray(this.walkProbability)) {
      // Discrete step choices (like Python default [-1, 0, 1])
      return this.walkProbability[Math.floor(randomFunc() * this.walkProbability.length)];
    }
    
    if (typeof this.walkProbability === 'object' && this.walkProbability.mean !== undefined && this.walkProbability.std !== undefined) {
      // Normal distribution object with mean and std
      let step = this.generateNormal(this.walkProbability.mean, this.walkProbability.std, randomFunc);
      
      // Apply rounding to step (like Python: round(step, round_to))
      if (this.roundTo !== null) {
        step = parseFloat(step.toFixed(this.roundTo));
      }
      
      return step;
    }
    
    // Default to discrete steps [-1, 0, 1]
    return [-1, 0, 1][Math.floor(randomFunc() * 3)];
  }

  /**
   * Generate a sample from normal distribution
   */
  generateNormal(mean, std, randomFunc = Math.random) {
    // Box-Muller transformation with edge case handling
    let u1;
    do {
      u1 = randomFunc();
    } while (u1 === 0); // Avoid log(0)

    const u2 = randomFunc();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const result = mean + std * z;
    
    // Check for NaN and return fallback
    if (isNaN(result)) {
      return mean; // Fallback to mean if calculation fails
    }
    
    return result;
  }

  /**
   * Initialize a new walk with null values
   */
  initializeWalk(length) {
    const walk = new Array(length);
    walk[0] = this.walkStart;
    for (let i = 1; i < length; i++) {
      walk[i] = null;
    }
    return walk;
  }

  /**
   * Create a branch from an existing walk
   */
  createBranch(parentWalk, branchStep) {
    const branch = new Array(parentWalk.length);
    
    // Fill with null values before the branch point
    for (let i = 0; i < branchStep; i++) {
      branch[i] = null;
    }
    
    // Fill remaining with null (will be filled as walk continues)
    for (let i = branchStep; i < branch.length; i++) {
      branch[i] = null;
    }
    
    return branch;
  }

  /**
   * Handle merging of walks that collide
   */
  handleMerging(walks, positions, step, randomFunc = Math.random) {
    const newPositions = [...positions];
    
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] === null) continue;
      
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[j] === null) continue;
        
        // Check if positions are close enough to merge  
        const tolerance = this.roundTo !== null ? this.roundTo : 0.001;
        if (Math.abs(positions[i] - positions[j]) <= tolerance && randomFunc() < this.mergingProbability) {
          // Merge walk j into walk i
          newPositions[j] = null;
          
          // Fill remaining steps of walk j with null
          if (walks[j]) {
            for (let k = step; k < walks[j].length; k++) {
              walks[j][k] = null;
            }
          }
        }
      }
    }
    
    return newPositions;
  }

  /**
   * Convert walk sequences to JMON notes
   * @param {Array<Array>} walks - Walk sequences
   * @param {Array} durations - Duration sequence to map to
   * @param {Object} options - Conversion options
   * @returns {Array} JMON note objects
   */
  toJmonNotes(walks, durations = [1], options = {}) {
    const useStringTime = options.useStringTime || false;
    const notes = [];
    let currentTime = 0;
    let durationIndex = 0;

    const maxLength = Math.max(...walks.map(w => w.length));
    
    for (let step = 0; step < maxLength; step++) {
      const activePitches = walks
        .map(walk => walk[step])
        .filter(pitch => pitch !== null);

      if (activePitches.length > 0) {
        const duration = durations[durationIndex % durations.length];
        
        // Create chord if multiple active pitches, single note otherwise
        const pitch = activePitches.length === 1 ? activePitches[0] : activePitches;
        
        notes.push({
          pitch,
          duration,
          time: useStringTime ? offsetToBarsBeatsTicks(currentTime, this.timingConfig) : currentTime
        });

        currentTime += duration;
        durationIndex++;
      }
    }

    return notes;
  }

  /**
   * Generate a JMON track directly from walk
   * @param {number} length - Walk length
   * @param {Array} durations - Duration sequence
   * @param {Object} trackOptions - Track options
   * @returns {Object} JMON track
   */
  generateTrack(length, durations = [1], trackOptions = {}) {
    const walks = this.generate(length, trackOptions.seed);
    const notes = this.toJmonNotes(walks, durations, trackOptions);
    
    return notesToTrack(notes, {
      label: 'random-walk',
      midiChannel: 0,
      synth: { type: 'Synth' },
      ...trackOptions
    });
  }

  /**
   * Map walk values to a musical scale
   * @param {Array<Array>} walks - Walk sequences  
   * @param {Array} scale - Scale to map to
   * @returns {Array<Array>} Walks mapped to scale
   */
  mapToScale(walks, scale = [60, 62, 64, 65, 67, 69, 71]) {
    return walks.map(walk => {
      return walk.map(value => {
        if (value === null) return null;
        
        // Normalize to scale range
        const minVal = this.walkRange[0];
        const maxVal = this.walkRange[1];
        const range = maxVal - minVal;
        const normalized = (value - minVal) / range;
        const scaleIndex = Math.floor(normalized * scale.length);
        const clampedIndex = Math.max(0, Math.min(scaleIndex, scale.length - 1));
        
        return scale[clampedIndex];
      });
    });
  }

  /**
   * Create a seeded random number generator
   */
  createSeededRandom(seed) {
    let currentSeed = Math.abs(seed) || 1; // Ensure positive non-zero seed
    return function() {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const result = currentSeed / 233280;
      // Ensure result is in (0,1) range, never exactly 0 or 1
      return Math.max(0.0000001, Math.min(0.9999999, result));
    };
  }
}
