import { beatsToTime } from '../../../utils/jmon-utils.js';

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

        if (seed !== null && typeof Math.seedrandom === 'function') {
            Math.seedrandom(seed);
        }
        
        const rhythm = [];
        let totalLength = 0;
        let nIter = 0;
        
        while (totalLength < this.measureLength && nIter < maxIterations) {
            const duration = this.durations[Math.floor(Math.random() * this.durations.length)];
            
            if (totalLength + duration > this.measureLength) {
                nIter++;
                continue;
            }
            
            if (Math.random() < restProb) {
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
        if (seed !== null && typeof Math.seedrandom === 'function') {
            Math.seedrandom(seed);
        }
        
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
            const noteLength = this.durations[Math.floor(Math.random() * this.durations.length)];
            
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
        const parent1 = this.population[Math.floor(Math.random() * this.population.length)];
        const parent2 = this.population[Math.floor(Math.random() * this.population.length)];
        
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
        
        const crossoverPoint = Math.floor(Math.random() * (parent1.length - 1)) + 1;
        const child = [...parent1.slice(0, crossoverPoint), ...parent2.slice(crossoverPoint)];
        
        return this.ensureMeasureLength(child);
    }

    /**
     * Ensure rhythm respects measure length
     * @param {Array} rhythm - The rhythm to adjust
     * @returns {Array} Adjusted rhythm
     */
    ensureMeasureLength(rhythm) {
        const totalLength = rhythm.reduce((sum, note) => sum + note[0], 0);
        
        if (totalLength > this.measureLength && rhythm.length > 0) {
            rhythm.pop(); // Remove last note if exceeds measure length
        }
        
        return rhythm;
    }

    /**
     * Mutate a rhythm with certain probability
     * @param {Array} rhythm - The rhythm to mutate
     * @returns {Array} Mutated rhythm
     */
    mutate(rhythm) {
        if (Math.random() < this.mutationRate && rhythm.length > 1) {
            const index = Math.floor(Math.random() * (rhythm.length - 1));
                const [duration, offset] = rhythm[index];
            const nextOffset = index === rhythm.length - 1 ? 
                this.measureLength : rhythm[index + 1][1];
            const maxNewDuration = nextOffset - offset;
            const validDurations = this.durations.filter(d => d <= maxNewDuration);
            
            if (validDurations.length > 0) {
                const newDuration = validDurations[Math.floor(Math.random() * validDurations.length)];
                rhythm[index] = [newDuration, offset];
            }
        }
        
        return rhythm;
    }

    /**
     * Execute the genetic algorithm
     * @returns {Array} Best rhythm found, sorted by offset
     */
    generate() {
        for (let generation = 0; generation < this.maxGenerations; generation++) {
            const newPopulation = [];
            
            for (let i = 0; i < this.populationSize; i++) {
                const parent1 = this.selectParent();
                const parent2 = this.selectParent();
                let child = this.crossover(parent1, parent2);
                child = this.mutate(child);
                
                // Sort child by offset
                child.sort((a, b) => a[1] - b[1]);
                newPopulation.push(child);
            }
            
            this.population = newPopulation;
        }

        // Return best rhythm sorted by offset
        const bestRhythm = this.population.reduce((best, current) => 
            this.evaluateFitness(current) < this.evaluateFitness(best) ? current : best
        );
        
        return bestRhythm.sort((a, b) => a[1] - b[1]);
    }
}
