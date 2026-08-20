import { 
  offsetToBarsBeatsTicks,
  notesToTrack,
  DEFAULT_TIMING_CONFIG 
} from '../../utils/jmon-timing.js';

/**
 * Phasor that rotates around a center point or another phasor
 * Represents a rotating vector (complex exponential) used in harmonic oscillation
 */
export class Phasor {
  distance;
  frequency;
  phase;
  subPhasors;
  center;

  /**
   * @param {Object} [options={}]
   * @param {number} [options.distance=1.0]
   * @param {number} [options.frequency=1.0]
   * @param {number} [options.phase=0]
   * @param {Array<Phasor>} [options.subPhasors=[]]
   */
  constructor(options = {}) {
    const { distance = 1.0, frequency = 1.0, phase = 0, subPhasors = [] } = options;
    this.distance = distance;
    this.frequency = frequency;
    this.phase = phase;
    this.subPhasors = subPhasors || [];
    this.center = { x: 0, y: 0 }; // Will be updated during simulation
  }

  /**
   * Add a sub-phasor to this phasor (like epicycles)
   */
  addSubPhasor(phasor) {
    this.subPhasors.push(phasor);
  }

  /**
   * Calculate position at given time
   */
  getPosition(time) {
    const angle = this.frequency * time + this.phase;
    const x = this.center.x + this.distance * Math.cos(angle);
    const y = this.center.y + this.distance * Math.sin(angle);
    
    return { x, y, angle, distance: this.distance };
  }

  /**
   * Calculate distance from origin
   */
  getDistanceFromOrigin(time) {
    const position = this.getPosition(time);
    return Math.sqrt(position.x * position.x + position.y * position.y);
  }

  /**
   * Calculate angle from origin in degrees
   */
  getAngleFromOrigin(time) {
    const position = this.getPosition(time);
    let angle = Math.atan2(position.y, position.x) * 180 / Math.PI;
    // Convert to 0-360 range
    if (angle < 0) angle += 360;
    return angle;
  }

  /**
   * Simulate this phasor and all its sub-phasors
   */
  simulate(timeArray, centerPosition = { x: 0, y: 0 }) {
    this.center = centerPosition;
    const results = [];

    for (const time of timeArray) {
      const position = this.getPosition(time);
      const distance = this.getDistanceFromOrigin(time);
      const angle = this.getAngleFromOrigin(time);
      
      results.push({
        time,
        position,
        distance,
        angle,
        phasor: this
      });

      // Simulate sub-phasors
      for (const subPhasor of this.subPhasors) {
        subPhasor.center = position;
        const subResults = subPhasor.simulate([time], position);
        results.push(...subResults);
      }
    }

    return results;
  }
}

/**
 * Phasor system containing multiple rotating vectors and their sub-phasors
 * Represents a sum of harmonic oscillators (like Fourier series components)
 */
export class PhasorSystem {
  phasors;
  timingConfig;

  constructor(timingConfig = DEFAULT_TIMING_CONFIG) {
    this.phasors = [];
    this.timingConfig = timingConfig;
  }

  /**
   * Add a phasor to the system
   */
  addPhasor(phasor) {
    this.phasors.push(phasor);
  }

  /**
   * Alias for addPhasor (for compatibility)
   */
  addPlanet(phasor) {
    return this.addPhasor(phasor);
  }

  /**
   * Simulate all phasors and sub-phasors in the system
   */
  simulate(timeArray) {
    const allResults = [];

    for (const phasor of this.phasors) {
      const phasorResults = phasor.simulate(timeArray);
      allResults.push(phasorResults);
    }

    return allResults;
  }

  /**
   * Get a flattened list of all phasors (primary + sub-phasors)
   */
  getAllPhasors() {
    const phasors = [];
    
    for (const phasor of this.phasors) {
      phasors.push(phasor);
      this.collectSubPhasors(phasor, phasors);
    }
    
    return phasors;
  }

  /**
   * Recursively collect all sub-phasors
   */
  collectSubPhasors(phasor, collection) {
    for (const subPhasor of phasor.subPhasors) {
      collection.push(subPhasor);
      this.collectSubPhasors(subPhasor, collection);
    }
  }

  /**
   * Map phasor motion to musical parameters
   */
  mapToMusic(timeArray, mappingOptions = {}) {
    const results = this.simulate(timeArray);
    const musicalTracks = [];

    for (let phasorIndex = 0; phasorIndex < results.length; phasorIndex++) {
      const phasorResults = results[phasorIndex];
      const track = this.createMusicalTrack(phasorResults, { ...mappingOptions, phasorIndex });
      musicalTracks.push(track);
    }

    return musicalTracks;
  }

  /**
   * Create a musical track from phasor motion
   * @param {Array} phasorResults
   * @param {Object} [options={}]
   * @param {number} [options.phasorIndex=0]
   * @param {Array<number>} [options.pitchRange=[40,80]]
   * @param {Array<number>} [options.durationRange=[0.25,2]]
   * @param {boolean} [options.useDistance=true]
   * @param {boolean} [options.useAngle=false]
   * @param {Array<number>|null} [options.quantizeToScale=null]
   * @param {Object} [options.timingConfig]
   * @param {boolean} [options.useStringTime=false]
   */
  createMusicalTrack(phasorResults, options = {}) {
    const {
      pitchRange = [40, 80],
      durationRange = [0.25, 2],
      useDistance = true,
      useAngle = false,
      quantizeToScale = null,
      timingConfig = this.timingConfig,
      useStringTime = false
    } = options;

    const notes = [];

    for (const result of phasorResults) {
      let pitch, duration;

      if (useDistance) {
        // Map distance to pitch
        const normalizedDistance = Math.max(0, Math.min(1, result.distance / 10)); // Assuming max distance ~10
        pitch = pitchRange[0] + normalizedDistance * (pitchRange[1] - pitchRange[0]);
      } else {
        // Map angle to pitch  
        pitch = pitchRange[0] + (result.angle / 360) * (pitchRange[1] - pitchRange[0]);
      }

      if (useAngle) {
        // Map angle to duration
        duration = durationRange[0] + (result.angle / 360) * (durationRange[1] - durationRange[0]);
      } else {
        // Map distance to duration (inverted - closer phasors play faster)
        const normalizedDistance = Math.max(0, Math.min(1, result.distance / 10));
        duration = durationRange[1] - normalizedDistance * (durationRange[1] - durationRange[0]);
      }

      // Quantize to scale if provided
      if (quantizeToScale) {
        const scaleIndex = Math.floor(((pitch - pitchRange[0]) / (pitchRange[1] - pitchRange[0])) * quantizeToScale.length);
        const clampedIndex = Math.max(0, Math.min(scaleIndex, quantizeToScale.length - 1));
        pitch = quantizeToScale[clampedIndex];
      } else {
        pitch = Math.round(pitch);
      }

      notes.push({
        pitch,
        duration,
        time: useStringTime ? offsetToBarsBeatsTicks(result.time, timingConfig) : result.time,
        phasorData: {
          distance: result.distance,
          angle: result.angle,
          position: result.position
        }
      });
    }

    return notes;
  }

  /**
   * Generate JMON tracks directly from phasor motion
   * @param {Array} timeArray
   * @param {Object} [options={}] - Combines what {@link PhasorSystem#createMusicalTrack}
   *   and {@link notesToTrack} each accept; keys are passed to both.
   */
  generateTracks(timeArray, options = {}) {
    const musicalTracks = this.mapToMusic(timeArray, options);
    const jmonTracks = [];

    musicalTracks.forEach((notes, index) => {
      const track = notesToTrack(notes, {
        label: `phasor-${index + 1}`,
        midiChannel: index % 16,
        synth: { type: 'Synth' },
        ...options
      });
      jmonTracks.push(track);
    });

    return jmonTracks;
  }

  /**
   * Create complex harmonic patterns with sub-phasors (epicycles)
   */
  static createComplexSystem() {
    const system = new PhasorSystem();
    
    // Create a phasor with multiple sub-phasors (epicycles)
    const subPhasor1 = new Phasor({ distance: 0.2, frequency: 5.0, phase: 0 });
    const subPhasor2 = new Phasor({ distance: 0.3, frequency: 3.0, phase: Math.PI / 2 });
    const subSubPhasor = new Phasor({ distance: 0.1, frequency: 8.0, phase: Math.PI });

    subPhasor1.addSubPhasor(subSubPhasor);

    const phasor1 = new Phasor({ distance: 2.0, frequency: 1.0, phase: 0, subPhasors: [subPhasor1, subPhasor2] });
    const phasor2 = new Phasor({ distance: 3.5, frequency: 0.6, phase: Math.PI / 3 });
    
    system.addPhasor(phasor1);
    system.addPhasor(phasor2);
    
    return system;
  }

  /**
   * Generate time array with linear spacing
   */
  static generateTimeArray({ start = 0, end = 10, steps = 100 } = {}) {
    const timeArray = [];
    const stepSize = (end - start) / (steps - 1);
    
    for (let i = 0; i < steps; i++) {
      timeArray.push(start + i * stepSize);
    }
    
    return timeArray;
  }
}
