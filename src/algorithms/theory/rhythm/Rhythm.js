import { beatsToTime } from '../../../utils/jmon-utils.js';

/**
 * Mulberry32 — small deterministic PRNG. Same seed always produces the
 * same sequence. `Math.seedrandom` is not a real global (this package
 * imports nothing), so a seeded `Math.random()` call was silently
 * non-deterministic; this replaces it everywhere below.
 * @private
 */
function _mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * A class used to represent a Rhythm generator with various algorithmic methods
 */
export class Rhythm {
    /**
     * Constructs a Rhythm. Takes either the positional
     * `(measureLength, durations)` form or a single options object.
     *
     * @param {number|Object} measureLength - Measure length, or `{ measureLength, durations }`
     * @param {Array<number>} [durations] - Durations, when using the positional form
     */
    constructor(measureLength, durations) {
        if (typeof measureLength === 'object' && measureLength !== null) {
            const config = measureLength;
            this.measureLength = config.measureLength;
            this.durations = config.durations;
        } else {
            this.measureLength = measureLength;
            this.durations = durations;
        }

        if (typeof this.measureLength !== 'number' || this.measureLength <= 0) {
            throw new Error('Rhythm requires a positive measureLength');
        }
        if (!Array.isArray(this.durations) || this.durations.length === 0) {
            throw new Error('Rhythm requires a non-empty durations array');
        }
    }

    /**
     * Generate a random rhythm that fills one measure.
     *
     * @param {number|Object|null} seedOrOptions - Seed, or an options object
     *   `{ seed, restProbability, maxIter, useStringTime }`
     * @param {number} [restProbability=0] - Chance of skipping a slot, positional form
     * @param {number} [maxIter=100] - Iteration cap, positional form
     * @param {Object} [options={}] - Extra options when using the positional form
     * @param {boolean} [options.useStringTime=false] - Emit bars:beats:ticks time strings
     * @returns {Array<Object>} Rhythm events `{ duration, time }`
     */
    random(seedOrOptions = null, restProbability = 0, maxIter = 100, options = {}) {
        let seed = seedOrOptions;
        let restProb = restProbability;
        let maxIterations = maxIter;
        let useStringTime = false;

        if (typeof seedOrOptions === 'object' && seedOrOptions !== null && !Array.isArray(seedOrOptions)) {
            const config = seedOrOptions;
            seed = config.seed ?? null;
            restProb = config.restProbability ?? 0;
            maxIterations = config.maxIter ?? config.maxIterations ?? 100;
            useStringTime = !!config.useStringTime;
        } else if (options && typeof options === 'object') {
            useStringTime = !!options.useStringTime;
        }

        const rng = seed !== null ? _mulberry32(seed) : Math.random;

        const rhythm = [];
        let totalLength = 0;
        let nIter = 0;

        while (totalLength < this.measureLength && nIter < maxIterations) {
            const duration = this.durations[Math.floor(rng() * this.durations.length)];

            if (totalLength + duration > this.measureLength) {
                nIter++;
                continue;
            }

            if (rng() < restProb) {
                nIter++;
                continue;
            }
            
            rhythm.push([duration, totalLength]);
            totalLength += duration;
            nIter++;
        }
        
        if (nIter >= maxIterations) {
            console.warn('Max iterations reached. The sum of the durations may not equal the measure length.');
        }
        
        return rhythm.map(([duration, offset]) => ({
            duration,
            time: useStringTime ? beatsToTime(offset) : offset
        }));
    }

    /**
     * Evolve a rhythm with a small genetic algorithm.
     *
     * Takes either positional arguments or a single options object, the same
     * way {@link Rhythm#random} does.
     *
     * @param {number|Object|null} seedOrOptions - Seed, or an options object
     *   `{ seed, populationSize, maxGenerations, mutationRate, useStringTime }`
     * @param {number} [populationSize=10]
     * @param {number} [maxGenerations=50]
     * @param {number} [mutationRate=0.1]
     * @param {Object} [options={}] - Extra options when using the positional form
     * @param {boolean} [options.useStringTime=false] - Emit bars:beats:ticks time strings
     * @returns {Array<Object>} Rhythm events `{ duration, time }`
     */
    darwin(seedOrOptions = null, populationSize = 10, maxGenerations = 50, mutationRate = 0.1, options = {}) {
        let seed = seedOrOptions;
        let popSize = populationSize;
        let generations = maxGenerations;
        let mutRate = mutationRate;
        let useStringTime = false;

        if (typeof seedOrOptions === 'object' && seedOrOptions !== null && !Array.isArray(seedOrOptions)) {
            const config = seedOrOptions;
            seed = config.seed ?? null;
            popSize = config.populationSize ?? config.population ?? 10;
            generations = config.maxGenerations ?? config.generations ?? 50;
            mutRate = config.mutationRate ?? 0.1;
            useStringTime = !!config.useStringTime;
        } else if (options && typeof options === 'object') {
            useStringTime = !!options.useStringTime;
        }

        const ga = new GeneticRhythm(
            seed,
            popSize,
            this.measureLength,
            generations,
            mutRate,
            this.durations
        );
        return ga.generate().map(([duration, offset]) => ({
            duration,
            time: useStringTime ? beatsToTime(offset) : offset
        }));
    }
}

/**
 * Genetic Algorithm for rhythm generation
 */
class GeneticRhythm {
    constructor(seed, populationSize, measureLength, maxGenerations, mutationRate, durations) {
        this._rng = seed !== null ? _mulberry32(seed) : Math.random;

        this.populationSize = populationSize;
        this.measureLength = measureLength;
        this.maxGenerations = maxGenerations;
        this.mutationRate = mutationRate;
        this.durations = durations;
        this.population = this.initializePopulation();
    }

    /**
     * Initialize a population of random rhythms
     */
    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push(this.createRandomRhythm());
        }
        return population;
    }

    /**
     * Create a random rhythm ensuring it respects the measure length
     * @returns {Array} Array of [duration, offset] tuples
     */
    createRandomRhythm() {
        const rhythm = [];
        let totalLength = 0;
        
        while (totalLength < this.measureLength) {
            const remaining = this.measureLength - totalLength;
            const noteLength = this.durations[Math.floor(this._rng() * this.durations.length)];
            
            if (noteLength <= remaining) {
                rhythm.push([noteLength, totalLength]);
                totalLength += noteLength;
            } else {
                break;
            }
        }
        
        return rhythm;
    }

    /**
     * Evaluate the fitness of a rhythm
     * @param {Array} rhythm - The rhythm to evaluate
     * @returns {number} Fitness score (lower is better)
     */
    evaluateFitness(rhythm) {
        const totalLength = rhythm.reduce((sum, note) => sum + note[0], 0);
        return Math.abs(this.measureLength - totalLength);
    }

    /**
     * Select a parent using simple random selection with fitness bias
     * @returns {Array} Selected parent rhythm
     */
    selectParent() {
        const parent1 = this.population[Math.floor(this._rng() * this.population.length)];
        const parent2 = this.population[Math.floor(this._rng() * this.population.length)];
        
        return this.evaluateFitness(parent1) < this.evaluateFitness(parent2) ? parent1 : parent2;
    }

    /**
     * Perform crossover between two parents
     * @param {Array} parent1 - First parent rhythm
     * @param {Array} parent2 - Second parent rhythm
     * @returns {Array} Child rhythm
     */
    crossover(parent1, parent2) {
        if (parent1.length === 0 || parent2.length === 0) {
            return parent1.length > 0 ? [...parent1] : [...parent2];
        }
        
        const crossoverPoint = Math.floor(this._rng() * (parent1.length - 1)) + 1;
        const child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
        
        return this.ensureMeasureLength(child);
    }

    /**
     * Rewrite every offset from the durations that precede it.
     *
     * The genome stores `[duration, offset]`, but only the durations are
     * heritable — an offset is a consequence of them. Crossover splices in a
     * tail carrying the *other* parent's offsets, and mutation changes a
     * duration without shifting what follows, so both leave the offsets
     * describing a rhythm that overlaps itself. Rebuilding them here is what
     * keeps the invariant "offsets are the running sum of durations" true at
     * every stage.
     *
     * @param {Array} rhythm - Array of [duration, offset] tuples
     * @returns {Array} New array with coherent, ascending offsets
     */
    relayout(rhythm) {
        let offset = 0;
        return rhythm.map(([duration]) => {
            const note = [duration, offset];
            offset += duration;
            return note;
        });
    }

    /**
     * Trim a rhythm back inside the measure, then relayout it.
     * @param {Array} rhythm - The rhythm to adjust
     * @returns {Array} Adjusted rhythm with coherent offsets
     */
    ensureMeasureLength(rhythm) {
        const trimmed = [...rhythm];
        let totalLength = trimmed.reduce((sum, note) => sum + note[0], 0);

        // Drop from the end until it fits. A single pop is not enough: a
        // crossover can splice together two long tails at once.
        while (totalLength > this.measureLength && trimmed.length > 0) {
            totalLength -= trimmed.pop()[0];
        }

        return this.relayout(trimmed);
    }

    /**
     * Mutate a rhythm with certain probability
     * @param {Array} rhythm - The rhythm to mutate
     * @returns {Array} Mutated rhythm
     */
    mutate(rhythm) {
        if (this._rng() >= this.mutationRate || rhythm.length === 0) {
            return rhythm;
        }

        // Every slot is mutable, including the last — the old bound excluded
        // it, so the final note of a rhythm could never change.
        const index = Math.floor(this._rng() * rhythm.length);
        const mutated = [...rhythm];
        mutated[index] = [
            this.durations[Math.floor(this._rng() * this.durations.length)],
            rhythm[index][1]
        ];

        // A new duration shifts everything after it, so trim and relayout
        // rather than constraining the choice to the neighbouring gap.
        return this.ensureMeasureLength(mutated);
    }

    /**
     * Execute the genetic algorithm.
     * @returns {Array} Best rhythm found, as gap-free ascending [duration, offset]
     */
    generate() {
        for (let generation = 0; generation < this.maxGenerations; generation++) {
            const newPopulation = [];

            for (let i = 0; i < this.populationSize; i++) {
                const parent1 = this.selectParent();
                const parent2 = this.selectParent();
                const child = this.mutate(this.crossover(parent1, parent2));
                // No sort needed: crossover and mutate both relayout, so
                // offsets are already ascending by construction.
                newPopulation.push(child);
            }

            this.population = newPopulation;
        }

        const bestRhythm = this.population.reduce((best, current) =>
            this.evaluateFitness(current) < this.evaluateFitness(best) ? current : best
        );

        return this.relayout(bestRhythm);
    }
}
