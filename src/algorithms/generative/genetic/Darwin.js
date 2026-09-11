/**
 * Darwin - Genetic Algorithm for Musical Evolution
 * 
 * Evolves musical phrases through processes inspired by natural selection:
 * - Population initialization with mutations of initial phrases
 * - Fitness evaluation using musical analysis metrics
 * - Selection of fittest individuals
 * - Crossover (breeding) between selected parents
 * - Mutation to introduce genetic diversity
 * 
 * Phrases come in and go out as JMON notes. Inside, a phrase is a genome of
 * `[pitch, duration, time]` triples laid end to end, rests as `null` pitches;
 * `toGenome` and `fromGenome` convert, and `getBestGenome()` exposes the raw
 * form for the operators.
 */

import { MusicalIndex } from '../../analysis/MusicalIndex.js';

export class Darwin {
  /**
   * Initialize the Darwin genetic algorithm
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    const {
      initialPhrases = [],
      mutationRate = 0.05,
      populationSize = 50,
      mutationProbabilities = null,
      scale = null,
      measureLength = 4,
      timeResolution = null,
      weights = null,
      targets = null,
      seed = null,
      metrics = [],
      context = {},
      operators = [],
      operatorRate = 0.15,
      crossoverMode = 'index',
      period = null
    } = config;

    // Accept JMON notes or raw genomes; work on genomes.
    this.initialPhrases = initialPhrases.map((phrase) => Darwin.toGenome(phrase));
    this.mutationRate = mutationRate;
    this.populationSize = populationSize;
    this.scale = scale;
    this.measureLength = measureLength;
    // Shortest and longest durations a mutation may pick. When a `context.pulse`
    // is given the floor defaults to it, so evolved onsets stay on the grid the
    // rhythm metrics read; otherwise a 32nd note, as before.
    this.timeResolution = timeResolution ?? [context.pulse ?? 0.125, 4];

    // Pluggable fitness terms: `{ name, fn(phrase, ctx), target, weight }`.
    // The built-in metrics only see pitches, durations or offsets one at a
    // time; these see the whole phrase plus `context` (key, chords, profile,
    // pulse ...), which is what a clave fit or an emotional-map balance needs.
    this.metrics = metrics.map((m, i) => ({
      name: m.name ?? `metric${i}`,
      fn: m.fn,
      target: m.target ?? 1,
      weight: m.weight ?? 1,
    }));
    this.context = context;
    // Position-aware mutations `(phrase, rng, ctx) => phrase`, each applied
    // to a child with probability `operatorRate` (or its own `rate`).
    this.operators = operators;
    this.operatorRate = operatorRate;
    // 'index' cuts parents at a note index; 'time' cuts at a multiple of
    // `period` so a two-bar clave phase survives the splice.
    this.crossoverMode = crossoverMode;
    this.period = period;

    // Initialize random seed if provided
    if (seed !== null) {
      this.seed = seed;
      this.randomState = this.createSeededRandom(seed);
    } else {
      this.randomState = Math;
    }

    // Set up possible durations based on time resolution
    const allDurations = [0.125, 0.25, 0.5, 1, 2, 3, 4, 8];
    this.possibleDurations = allDurations.filter(d => 
      d >= this.timeResolution[0] && d <= Math.min(this.timeResolution[1], measureLength)
    );

    // Set up mutation probabilities
    this.mutationProbabilities = mutationProbabilities || {
      pitch: () => {
        // Pick from scale if available, otherwise Gaussian around middle C
        if (this.scale && this.scale.length > 0) {
          const idx = Math.floor(this.randomState.random() * this.scale.length);
          return Math.max(0, Math.min(127, this.scale[idx]));
        }
        return Math.max(0, Math.min(127, Math.floor(this.gaussianRandom(60, 5))));
      },
      duration: () => {
        // Exponential-like distribution favoring shorter durations
        const weights = this.possibleDurations.map((_, i) => Math.pow(2, -i));
        return this.weightedChoice(this.possibleDurations, weights);
      },
      rest: () => {
        // Small probability of introducing a rest
        return this.randomState.random() < 0.02 ? null : 1;
      }
    };

    // Weights and targets per metric of MusicalAnalysis, as [pitch, duration,
    // time] triples: the same metric can be scored on each of the three
    // series. The names are the ones MusicalAnalysis uses, so a target here
    // and a measurement there are the same number.
    this.weights = weights || {
      gini: [1.0, 1.0, 0.0],
      spread: [1.0, 1.0, 0.0],
      motifStrength: [10.0, 1.0, 0.0],
      dissonance: [1.0, 0.0, 0.0],
      measureFit: [0.0, 10.0, 0.0],
      rest: [1.0, 0.0, 0.0]
    };

    this.targets = targets || {
      gini: [0.05, 0.5, 0.0],
      spread: [0.1, 0.1, 0.0],
      motifStrength: [1.0, 1.0, 0.0],
      dissonance: [0.0, 0.0, 0.0],
      measureFit: [0.0, 1.0, 0.0],
      rest: [0.0, 0.0, 0.0]
    };

    // Initialize population
    this.population = this.initializePopulation();
    
    // Track evolution history
    this.bestIndividuals = [];
    this.bestScores = [];
    this.generationCount = 0;
  }

  /**
   * JMON notes to a genome: `[pitch, duration, time]` triples in time order,
   * with a `null`-pitch triple filling every gap so the triples tile. A
   * genome passed in comes back as is.
   * @param {Array} phrase - JMON notes, or triples
   * @returns {Array<Array>}
   */
  static toGenome(phrase) {
    if (!Array.isArray(phrase) || phrase.length === 0) return [];
    if (Array.isArray(phrase[0])) return phrase.map((t) => [...t]);
    const notes = phrase.map((n) => ({
      pitch: Array.isArray(n.pitch) ? n.pitch[0] : (n.pitch ?? null),
      duration: n.duration,
      time: typeof n.time === 'number' ? n.time : parseFloat(n.time) || 0,
    })).sort((a, b) => a.time - b.time);
    const genome = [];
    let cursor = notes[0].time;
    for (const n of notes) {
      if (n.time > cursor + 1e-9) genome.push([null, n.time - cursor, cursor]);
      const duration = Math.max(n.duration, 1e-6);
      genome.push([n.pitch, duration, n.time]);
      cursor = n.time + duration;
    }
    // triples must tile: trim any overlap left by the source notes
    let t = genome[0][2];
    return genome.map(([p, d]) => { const triple = [p, d, t]; t += d; return triple; });
  }

  /**
   * A genome back to JMON notes. Rests are dropped.
   * @param {Array<Array>} genome
   * @param {number} [velocity=0.8]
   * @returns {Array<Object>}
   */
  static fromGenome(genome, velocity = 0.8) {
    return genome
      .filter(([pitch]) => pitch !== null && pitch !== undefined)
      .map(([pitch, duration, time]) => ({ pitch, duration, time, velocity }));
  }

  /**
   * Create a seeded random number generator
   * @param {number} seed - Random seed
   * @returns {Object} Random number generator with seeded methods
   */
  createSeededRandom(seed) {
    let currentSeed = seed;
    
    const random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    return {
      random,
      choice: (array) => array[Math.floor(random() * array.length)],
      sample: (array, n) => {
        const result = [];
        const shuffled = [...array].sort(() => random() - 0.5);
        return shuffled.slice(0, n);
      }
    };
  }

  /**
   * Generate Gaussian random number using Box-Muller transform
   * @param {number} mean - Mean of distribution
   * @param {number} stdDev - Standard deviation
   * @returns {number} Gaussian random number
   */
  gaussianRandom(mean = 0, stdDev = 1) {
    if (this.gaussianSpare !== undefined) {
      const spare = this.gaussianSpare;
      this.gaussianSpare = undefined;
      return mean + stdDev * spare;
    }

    const u1 = this.randomState.random();
    const u2 = this.randomState.random();
    const mag = stdDev * Math.sqrt(-2.0 * Math.log(u1));
    this.gaussianSpare = mag * Math.cos(2.0 * Math.PI * u2);
    
    return mean + mag * Math.sin(2.0 * Math.PI * u2);
  }

  /**
   * Choose random element from array with weights
   * @param {Array} choices - Array of choices
   * @param {Array} weights - Array of weights
   * @returns {*} Weighted random choice
   */
  weightedChoice(choices, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.randomState.random() * totalWeight;
    
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }
    
    return choices[choices.length - 1];
  }

  /**
   * Initialize population by mutating initial phrases
   * @returns {Array} Initial population
   */
  initializePopulation() {
    const population = [];
    const phrasesPerInitial = Math.floor(this.populationSize / this.initialPhrases.length);
    
    for (const phrase of this.initialPhrases) {
      for (let i = 0; i < phrasesPerInitial; i++) {
        population.push(this.mutate(phrase, 0)); // Start with no mutations
      }
    }
    
    // Fill remaining slots
    while (population.length < this.populationSize) {
      const randomPhrase = this.initialPhrases[Math.floor(this.randomState.random() * this.initialPhrases.length)];
      population.push(this.mutate(randomPhrase, 0));
    }
    
    return population;
  }

  /**
   * Calculate fitness components for a musical phrase
   * @param {Array} phrase - Musical phrase as [pitch, duration, offset] tuples
   * @returns {Object} Fitness components
   */
  calculateFitnessComponents(phrase) {
    if (phrase.length === 0) return {};

    // Extract pitches, durations, and offsets
    const pitches = phrase.map(note => note[0]);
    const durations = phrase.map(note => note[1]);
    const offsets = phrase.map(note => note[2]);

    const fitnessComponents = {};

    // Calculate metrics for pitches
    if (pitches.length > 0) {
      const pitchIndex = new MusicalIndex(pitches);
      fitnessComponents.gini_pitch = pitchIndex.gini();
      fitnessComponents.spread_pitch = pitchIndex.spread();
      fitnessComponents.motifStrength_pitch = pitchIndex.motifStrength();
      if (this.scale) {
        fitnessComponents.dissonance_pitch = pitchIndex.dissonance(this.scale);
      }
    }

    // Calculate metrics for durations
    if (durations.length > 0) {
      const durationIndex = new MusicalIndex(durations);
      fitnessComponents.gini_duration = durationIndex.gini();
      fitnessComponents.spread_duration = durationIndex.spread();
      fitnessComponents.motifStrength_duration = durationIndex.motifStrength();
      fitnessComponents.measureFit_duration = durationIndex.measureFit(this.measureLength);
    }

    // Calculate metrics for offsets if needed
    if (offsets.length > 0) {
      const offsetIndex = new MusicalIndex(offsets);
      fitnessComponents.gini_offset = offsetIndex.gini();
      fitnessComponents.spread_offset = offsetIndex.spread();
      fitnessComponents.motifStrength_offset = offsetIndex.motifStrength();
    }

    // Calculate rest proportion
    const restProportion = pitches.filter(p => p === null || p === undefined).length / pitches.length;
    fitnessComponents.rest = restProportion;

    // Custom metrics see the whole phrase and the context
    for (const m of this.metrics) {
      const value = m.fn(phrase, this.context, this);
      fitnessComponents[m.name] = Number.isFinite(value) ? value : 0;
    }

    return fitnessComponents;
  }

  /**
   * Calculate fitness score for a musical phrase
   * @param {Array} phrase - Musical phrase
   * @returns {number} Fitness score
   */
  fitness(phrase) {
    const components = this.calculateFitnessComponents(phrase);
    let fitnessScore = 0;

    // Calculate weighted fitness based on similarity to targets
    for (const [metric, targets] of Object.entries(this.targets)) {
      const weights = this.weights[metric];
      
      for (let i = 0; i < 3; i++) { // pitch, duration, offset
        const componentKey = i === 0 ? `${metric}_pitch` : i === 1 ? `${metric}_duration` : `${metric}_offset`;
        const actualValue = components[componentKey] || 0;
        const targetValue = targets[i];
        const weight = weights[i];

        if (weight > 0 && targetValue !== undefined) {
          // Calculate similarity (1 - normalized difference)
          const maxVal = Math.max(Math.abs(targetValue), 1);
          const similarity = 1 - Math.abs(actualValue - targetValue) / maxVal;
          fitnessScore += Math.max(0, similarity) * weight;
        }
      }
    }

    // Handle special case for rest metric
    if (this.weights.rest[0] > 0) {
      const actualRest = components.rest || 0;
      const targetRest = this.targets.rest[0];
      const similarity = 1 - Math.abs(actualRest - targetRest) / Math.max(targetRest, 1);
      fitnessScore += Math.max(0, similarity) * this.weights.rest[0];
    }

    // Custom metrics: same similarity-to-target rule as the built-ins
    for (const m of this.metrics) {
      if (!(m.weight > 0)) continue;
      const actualValue = components[m.name] || 0;
      const maxVal = Math.max(Math.abs(m.target), 1);
      const similarity = 1 - Math.abs(actualValue - m.target) / maxVal;
      fitnessScore += Math.max(0, similarity) * m.weight;
    }

    return fitnessScore;
  }

  /**
   * Mutate a musical phrase
   * @param {Array} phrase - Original phrase
   * @param {number} rate - Mutation rate (null to use default)
   * @returns {Array} Mutated phrase
   */
  mutate(phrase, rate = null) {
    if (rate === null) rate = this.mutationRate;
    
    const newPhrase = [];
    let totalOffset = 0;

    for (const note of phrase) {
      let [pitch, duration, offset] = note;

      // Mutate pitch
      if (this.randomState.random() < rate) {
        pitch = this.mutationProbabilities.pitch();
      }

      // Mutate duration
      if (this.randomState.random() < rate) {
        duration = this.mutationProbabilities.duration();
      }

      // Mutate rest (pitch becomes null)
      if (this.randomState.random() < rate) {
        const restResult = this.mutationProbabilities.rest();
        if (restResult === null) {
          pitch = null;
        }
      }

      // Update offset based on sequential positioning
      const newOffset = totalOffset;
      totalOffset += duration;

      newPhrase.push([pitch, duration, newOffset]);
    }

    return newPhrase;
  }

  /**
   * Run each operator on the phrase with its probability. An operator is a
   * function `(phrase, rng, ctx) => phrase` or `{ fn, rate }`; `rng()` is the
   * seeded generator so runs stay reproducible.
   * @param {Array} phrase
   * @returns {Array}
   */
  applyOperators(phrase) {
    if (!this.operators || this.operators.length === 0) return phrase;
    const rng = () => this.randomState.random();
    let out = phrase;
    for (const op of this.operators) {
      const fn = typeof op === 'function' ? op : op.fn;
      const rate = typeof op === 'function' ? this.operatorRate : (op.rate ?? this.operatorRate);
      if (typeof fn !== 'function' || rng() >= rate) continue;
      const result = fn(out, rng, this.context, this);
      if (Array.isArray(result) && result.length > 0) out = result;
    }
    return out;
  }

  /**
   * Select top performers from population
   * @param {number} k - Number of individuals to select
   * @returns {Array} Selected phrases
   */
  select(k = 25) {
    // Calculate fitness for all individuals
    const fitnessScores = this.population.map(phrase => ({
      phrase,
      fitness: this.fitness(phrase)
    }));

    // Sort by fitness (descending)
    fitnessScores.sort((a, b) => b.fitness - a.fitness);

    // Return top k phrases
    return fitnessScores.slice(0, k).map(item => item.phrase);
  }

  /**
   * Crossover (breed) two parent phrases
   * @param {Array} parent1 - First parent phrase
   * @param {Array} parent2 - Second parent phrase
   * @returns {Array} Child phrase
   */
  crossover(parent1, parent2) {
    if (this.crossoverMode === 'time') return this.crossoverTime(parent1, parent2);
    return this.crossoverIndex(parent1, parent2);
  }

  /**
   * Cut both parents at the same moment — a multiple of `period` (default
   * `measureLength`) — and splice head to tail so the child keeps each
   * parent's bar phase. Falls back to an index cut when the parents are
   * shorter than one period.
   * @param {Array} parent1
   * @param {Array} parent2
   * @returns {Array} Child phrase with valid offsets
   */
  crossoverTime(parent1, parent2) {
    if (parent1.length === 0 || parent2.length === 0) {
      return parent1.length > 0 ? parent1.map(n => [...n]) : parent2.map(n => [...n]);
    }
    const period = this.period ?? this.measureLength;
    const end = (p) => p[p.length - 1][2] + p[p.length - 1][1];
    const cuts = Math.floor(Math.min(end(parent1), end(parent2)) / period);
    if (cuts < 1) return this.crossoverIndex(parent1, parent2);
    // Cut strictly inside the shorter parent when possible, so the tail is never empty
    const k = 1 + Math.floor(this.randomState.random() * Math.max(1, cuts - 1));
    const t = k * period;

    const i1 = parent1.findIndex(n => n[2] >= t - 1e-9);
    const head = (i1 === -1 ? parent1 : parent1.slice(0, i1)).map(n => [...n]);
    const i2 = parent2.findIndex(n => n[2] >= t - 1e-9);
    const tail = (i2 === -1 ? [] : parent2.slice(i2)).map(n => [...n]);

    // Head must end exactly where the tail begins
    const tailStart = tail.length > 0 ? tail[0][2] : t;
    if (head.length > 0) {
      const last = head[head.length - 1];
      last[1] = tailStart - last[2];
    } else if (tailStart > 0) {
      head.push([null, tailStart, 0]);
    }
    return [...head, ...tail];
  }

  /**
   * Cut both parents at the same note indices and splice.
   * @param {Array} parent1
   * @param {Array} parent2
   * @returns {Array} Child phrase with valid offsets
   */
  crossoverIndex(parent1, parent2) {
    if (parent1.length === 0 || parent2.length === 0) {
      return parent1.length > 0 ? [...parent1] : [...parent2];
    }

    // Determine crossover points
    const minLength = Math.min(parent1.length, parent2.length);
    const cut1 = Math.floor(this.randomState.random() * minLength);
    const cut2 = Math.floor(this.randomState.random() * minLength);
    const [start, end] = [Math.min(cut1, cut2), Math.max(cut1, cut2)];

    // Create child by combining parents
    const child = [];
    
    // Take beginning from parent1
    for (let i = 0; i < start; i++) {
      if (i < parent1.length) {
        child.push([...parent1[i]]);
      }
    }
    
    // Take middle from parent2
    for (let i = start; i < end; i++) {
      if (i < parent2.length) {
        child.push([...parent2[i]]);
      }
    }
    
    // Take end from parent1
    for (let i = end; i < Math.max(parent1.length, parent2.length); i++) {
      if (i < parent1.length) {
        child.push([...parent1[i]]);
      } else if (i < parent2.length) {
        child.push([...parent2[i]]);
      }
    }

    // Recalculate offsets to ensure sequential timing
    let totalOffset = 0;
    for (let i = 0; i < child.length; i++) {
      child[i][2] = totalOffset;
      totalOffset += child[i][1];
    }

    return child;
  }

  /**
   * Evolve the population for one generation
   * @param {number} [k=25] - Number of parents to select
   * @returns {Object} Evolution statistics
   */
  evolve(k = 25) {
    // Selection
    const selectedParents = this.select(k);
    
    // Store best individual and fitness
    const bestFitness = this.fitness(selectedParents[0]);
    this.bestIndividuals.push([...selectedParents[0]]);
    this.bestScores.push(bestFitness);
    
    // Create new generation through crossover and mutation
    const newPopulation = [];
    
    while (newPopulation.length < this.populationSize) {
      // Select two random parents
      const parent1 = selectedParents[Math.floor(this.randomState.random() * selectedParents.length)];
      const parent2 = selectedParents[Math.floor(this.randomState.random() * selectedParents.length)];
      
      // Create child through crossover
      const child = this.crossover([...parent1], [...parent2]);
      
      // Mutate child, then apply position-aware operators
      const mutatedChild = this.applyOperators(this.mutate(child));
      
      newPopulation.push(mutatedChild);
    }
    
    this.population = newPopulation;
    this.generationCount++;
    
    return {
      generation: this.generationCount,
      bestFitness: bestFitness,
      averageFitness: selectedParents.reduce((sum, phrase) => sum + this.fitness(phrase), 0) / selectedParents.length,
      populationSize: this.populationSize
    };
  }

  /**
   * Evolve for multiple generations
   * @param {Object} options - Configuration object
   * @param {number} options.generations - Number of generations to evolve
   * @param {number} [options.k=25] - Number of parents per generation
   * @param {Function} [options.callback=null] - Optional callback for progress updates
   * @returns {Array} Array of evolution statistics
   */
  evolveGenerations({ generations, k = 25, callback = null }) {
    const stats = [];

    for (let i = 0; i < generations; i++) {
      const generationStats = this.evolve(k);
      stats.push(generationStats);

      if (callback) {
        callback(generationStats, i, generations);
      }
    }

    return stats;
  }

  /**
   * The best phrase so far, as JMON notes.
   * @returns {Array<Object>|null}
   */
  getBestIndividual() {
    const genome = this.getBestGenome();
    return genome ? Darwin.fromGenome(genome) : null;
  }

  /**
   * The best phrase so far as a raw genome of `[pitch, duration, time]`
   * triples, rests included — what the operators and the metrics work on.
   * @returns {Array<Array>|null}
   */
  getBestGenome() {
    return this.bestIndividuals.length > 0
      ? this.bestIndividuals[this.bestIndividuals.length - 1].map((t) => [...t])
      : null;
  }

  /**
   * Get evolution history
   * @returns {Object} Evolution history with individuals and scores
   */
  getEvolutionHistory() {
    return {
      individuals: this.bestIndividuals.map(ind => [...ind]),
      scores: [...this.bestScores],
      generations: this.generationCount
    };
  }

  /**
   * Reset the evolution state
   */
  reset() {
    this.population = this.initializePopulation();
    this.bestIndividuals = [];
    this.bestScores = [];
    this.generationCount = 0;
  }

  /**
   * Get population statistics
   * @returns {Object} Population statistics
   */
  getPopulationStats() {
    const fitnessValues = this.population.map(phrase => this.fitness(phrase));
    const mean = fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length;
    const variance = fitnessValues.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / fitnessValues.length;
    
    return {
      populationSize: this.population.length,
      meanFitness: mean,
      standardDeviation: Math.sqrt(variance),
      minFitness: Math.min(...fitnessValues),
      maxFitness: Math.max(...fitnessValues),
      generation: this.generationCount
    };
  }
}
