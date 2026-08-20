
import { 
  offsetToBarsBeatsTicks,
  notesToTrack,
  DEFAULT_TIMING_CONFIG 
} from '../../utils/jmon-timing.js';

/**
 * Multi-dimensional random walk generator with branching and merging
 * Based on the Python djalgo walk module (Chain class)
 * Enhanced with JMON integration
 */
export class RandomWalk {
  options;
  walkers;
  history;

  constructor(options = {}) {
    this.options = {
      length: options.length || 100,
      dimensions: options.dimensions || 1,
      stepSize: options.stepSize || 1,
      bounds: options.bounds || [-100, 100],
      branchProbability: options.branchProbability || 0.05,
      mergeProbability: options.mergeProbability || 0.02,
      attractorStrength: options.attractorStrength || 0,
      attractorPosition: options.attractorPosition || Array(options.dimensions || 1).fill(0)
    };

    this.walkers = [];
    this.history = [];
  }

  /**
   * Generate random walk sequence
   */
  generate(startPosition) {
    this.initialize(startPosition);
    this.history = [];

    for (let step = 0; step < this.options.length; step++) {
      this.updateWalkers();
      this.recordState();
      this.handleBranching();
      this.handleMerging();
    }

    return this.history;
  }

  /**
   * Initialize walker(s)
   */
  initialize(startPosition) {
    const initialPosition = startPosition || Array(this.options.dimensions).fill(0);
    
    this.walkers = [{
      position: [...initialPosition],
      velocity: Array(this.options.dimensions).fill(0),
      branches: [],
      age: 0,
      active: true
    }];
  }

  /**
   * Update all active walkers
   */
  updateWalkers() {
    for (const walker of this.walkers) {
      if (!walker.active) continue;

      // Random step in each dimension
      for (let dim = 0; dim < this.options.dimensions; dim++) {
        const randomStep = (Math.random() - 0.5) * 2 * this.options.stepSize;
        
        // Apply attractor force if enabled
        let attractorForce = 0;
        if (this.options.attractorStrength > 0) {
          const distance = walker.position[dim] - this.options.attractorPosition[dim];
          attractorForce = -this.options.attractorStrength * distance;
        }
        
        // Update velocity and position
        walker.velocity[dim] = walker.velocity[dim] * 0.9 + randomStep + attractorForce;
        walker.position[dim] += walker.velocity[dim];
        
        // Apply bounds
        if (walker.position[dim] < this.options.bounds[0]) {
          walker.position[dim] = this.options.bounds[0];
          walker.velocity[dim] *= -0.5; // Bounce with damping
        } else if (walker.position[dim] > this.options.bounds[1]) {
          walker.position[dim] = this.options.bounds[1];
          walker.velocity[dim] *= -0.5;
        }
      }

      walker.age++;
    }
  }

  /**
   * Record current state of all walkers
   */
  recordState() {
    const activeWalkers = this.walkers.filter(w => w.active);
    
    if (activeWalkers.length > 0) {
      // Average position if multiple walkers, or just use the primary walker
      const avgPosition = Array(this.options.dimensions).fill(0);
      
      for (const walker of activeWalkers) {
        for (let dim = 0; dim < this.options.dimensions; dim++) {
          avgPosition[dim] += walker.position[dim];
        }
      }
      
      for (let dim = 0; dim < this.options.dimensions; dim++) {
        avgPosition[dim] /= activeWalkers.length;
      }
      
      this.history.push([...avgPosition]);
    }
  }

  /**
   * Handle branching (walker splitting)
   */
  handleBranching() {
    const newBranches = [];
    
    for (const walker of this.walkers) {
      if (!walker.active) continue;
      
      if (Math.random() < this.options.branchProbability) {
        // Create a new branch
        const branch = {
          position: [...walker.position],
          velocity: walker.velocity.map(v => v + (Math.random() - 0.5) * this.options.stepSize),
          branches: [],
          age: 0,
          active: true
        };
        
        newBranches.push(branch);
        walker.branches.push(branch);
      }
    }
    
    this.walkers.push(...newBranches);
  }

  /**
   * Handle merging (walker combining)
   */
  handleMerging() {
    if (this.walkers.length <= 1) return;
    
    const activeWalkers = this.walkers.filter(w => w.active);
    const mergeThreshold = this.options.stepSize * 2;
    
    for (let i = 0; i < activeWalkers.length; i++) {
      for (let j = i + 1; j < activeWalkers.length; j++) {
        if (Math.random() < this.options.mergeProbability) {
          const distance = this.calculateDistance(activeWalkers[i].position, activeWalkers[j].position);
          
          if (distance < mergeThreshold) {
            // Merge walkers - average their properties
            for (let dim = 0; dim < this.options.dimensions; dim++) {
              activeWalkers[i].position[dim] = (activeWalkers[i].position[dim] + activeWalkers[j].position[dim]) / 2;
              activeWalkers[i].velocity[dim] = (activeWalkers[i].velocity[dim] + activeWalkers[j].velocity[dim]) / 2;
            }
            
            activeWalkers[j].active = false;
          }
        }
      }
    }
    
    // Remove inactive walkers
    this.walkers = this.walkers.filter(w => w.active);
  }

  /**
   * Calculate Euclidean distance between two positions
   */
  calculateDistance(pos1, pos2) {
    let sum = 0;
    for (let i = 0; i < pos1.length; i++) {
      sum += Math.pow(pos1[i] - pos2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Get 1D projection of multi-dimensional walk
   */
  getProjection(dimension = 0) {
    return this.history.map(state => state[dimension] || 0);
  }

  /**
   * Map walk to musical scale
   */
  mapToScale({ dimension = 0, scale = [0, 2, 4, 5, 7, 9, 11], octaveRange = 3 } = {}) {
    const projection = this.getProjection(dimension);
    if (projection.length === 0) return [];
    
    const minVal = Math.min(...projection);
    const maxVal = Math.max(...projection);
    const range = maxVal - minVal || 1;
    
    return projection.map(value => {
      const normalized = (value - minVal) / range;
      const scaleIndex = Math.floor(normalized * scale.length * octaveRange);
      const octave = Math.floor(scaleIndex / scale.length);
      const noteIndex = scaleIndex % scale.length;
      
      return 60 + octave * 12 + scale[noteIndex];
    });
  }

  /**
   * Map walk to rhythmic durations
   */
  mapToRhythm({ dimension = 0, durations = [0.25, 0.5, 1, 2] } = {}) {
    const projection = this.getProjection(dimension);
    if (projection.length === 0) return [];
    
    const minVal = Math.min(...projection);
    const maxVal = Math.max(...projection);
    const range = maxVal - minVal || 1;
    
    return projection.map(value => {
      const normalized = (value - minVal) / range;
      const durationIndex = Math.floor(normalized * durations.length);
      const clampedIndex = Math.max(0, Math.min(durationIndex, durations.length - 1));
      return durations[clampedIndex];
    });
  }

  /**
   * Map walk to velocities
   */
  mapToVelocity({ dimension = 0, minVel = 0.3, maxVel = 1.0 } = {}) {
    const projection = this.getProjection(dimension);
    if (projection.length === 0) return [];
    
    const minVal = Math.min(...projection);
    const maxVal = Math.max(...projection);
    const range = maxVal - minVal || 1;
    
    return projection.map(value => {
      const normalized = (value - minVal) / range;
      return minVel + normalized * (maxVel - minVel);
    });
  }

  /**
   * Generate correlated walk (walk that follows another walk with some correlation)
   */
  generateCorrelated(targetWalk, { correlation = 0.5, dimension = 0 } = {}) {
    if (targetWalk.length === 0) return [];
    
    const correlatedWalk = [];
    let position = 0;
    
    for (let i = 0; i < targetWalk.length; i++) {
      const randomStep = (Math.random() - 0.5) * 2 * this.options.stepSize;
      const correlatedStep = correlation * (targetWalk[i] - position);
      
      position += randomStep + correlatedStep;
      
      // Apply bounds
      position = Math.max(this.options.bounds[0], Math.min(this.options.bounds[1], position));
      
      correlatedWalk.push(position);
    }
    
    return correlatedWalk;
  }

  /**
   * Analyze walk properties
   */
  analyze() {
    if (this.history.length < 2) {
      return {
        meanDisplacement: 0,
        meanSquaredDisplacement: 0,
        totalDistance: 0,
        fractalDimension: 0
      };
    }
    
    const projection = this.getProjection(0);
    const startPos = projection[0];
    const endPos = projection[projection.length - 1];
    
    // Mean displacement
    const meanDisplacement = Math.abs(endPos - startPos);
    
    // Mean squared displacement
    const squaredDisplacements = projection.map(pos => Math.pow(pos - startPos, 2));
    const meanSquaredDisplacement = squaredDisplacements.reduce((sum, sq) => sum + sq, 0) / squaredDisplacements.length;
    
    // Total distance traveled
    let totalDistance = 0;
    for (let i = 1; i < projection.length; i++) {
      totalDistance += Math.abs(projection[i] - projection[i - 1]);
    }
    
    // Rough fractal dimension estimate (box-counting approximation)
    const fractalDimension = totalDistance > 0 ? Math.log(totalDistance) / Math.log(projection.length) : 0;
    
    return {
      meanDisplacement,
      meanSquaredDisplacement,
      totalDistance,
      fractalDimension
    };
  }

  /**
   * Get current walker states
   */
  getWalkerStates() {
    return this.walkers.map(walker => ({ ...walker }));
  }

  /**
   * Reset the walk generator
   */
  reset() {
    this.walkers = [];
    this.history = [];
  }
  
  /**
   * Convert walk to JMON notes
   * @param {Object} [options={}]
   * @param {Array} [options.durations=[1]] - Duration sequence
   * @param {boolean} [options.useStringTime=false]
   * @param {Object} [options.timingConfig]
   * @param {number} [options.dimension=0]
   * @param {Array<number>|null} [options.mapToScale=null]
   * @param {Array<number>} [options.scaleRange=[60,72]]
   * @returns {Array} JMON note objects
   */
  toJmonNotes(options = {}) {
    const {
      durations = [1],
      useStringTime = false,
      timingConfig = DEFAULT_TIMING_CONFIG,
      dimension = 0,
      mapToScale = null,
      scaleRange = [60, 72]
    } = options;

    const projection = this.getProjection(dimension);
    const notes = [];
    let currentTime = 0;
    
    for (let i = 0; i < projection.length; i++) {
      const duration = durations[i % durations.length];
      let pitch = projection[i];
      
      // Map to scale or pitch range
      if (mapToScale) {
        const minVal = Math.min(...projection);
        const maxVal = Math.max(...projection);
        const range = maxVal - minVal || 1;
        const normalized = (pitch - minVal) / range;
        const scaleIndex = Math.floor(normalized * mapToScale.length);
        const clampedIndex = Math.max(0, Math.min(scaleIndex, mapToScale.length - 1));
        pitch = mapToScale[clampedIndex];
      } else {
        // Use existing mapToScale method
        const scaledWalk = this.mapToScale({ dimension: [projection], scale: mapToScale || [60, 62, 64, 65, 67, 69, 71] });
        pitch = scaledWalk[0][i];
      }
      
      notes.push({
        pitch,
        duration,
        time: useStringTime ? offsetToBarsBeatsTicks(currentTime, timingConfig) : currentTime
      });
      
      currentTime += duration;
    }
    
    return notes;
  }
  
  /**
   * Generate JMON track directly from walk
   * @param {Object} [options={}] - Combines what {@link RandomWalk#generate},
   *   {@link RandomWalk#toJmonNotes} and {@link notesToTrack} each accept;
   *   keys are passed to all three.
   * @param {Array} [options.startPosition] - Starting position
   * @returns {Object} JMON track
   */
  generateTrack(options = {}) {
    this.generate(options.startPosition);
    const notes = this.toJmonNotes(options);

    return notesToTrack(notes, {
      label: 'random-walk',
      midiChannel: 0,
      synth: { type: 'Synth' },
      ...options
    });
  }
}
