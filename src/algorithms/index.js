// Theory imports
import harmony from './theory/harmony/index.js';
import * as rhythm from '../rhythm/index.js';
import profile from '../rhythm/profile/index.js';

// Generative algorithm imports
import { CellularAutomata } from './generative/cellular-automata/index.js';
import { Darwin, operators as geneticOperators, metrics as geneticMetrics, metric as geneticMetric, phraseToNotes as geneticPhraseToNotes } from './generative/genetic/index.js';
import { RandomWalk, Chain, Phasor, PhasorSystem } from './generative/walks/index.js';
import { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap } from './generative/fractals/index.js';
import { Tintinnabuli } from './generative/minimalism/index.js';
import { drummer, presets as drummerPresets } from './generative/drummer/index.js';
// GaussianProcessRegressor is NOT imported here to avoid @tangent.to/ds dependency
// Users who need it must import it directly:
// import { GaussianProcessRegressor } from './generative/gaussian-processes/index.js';

// Processor imports
import { Corruptor, corruptJmon } from './processors/Corruptor.js';
import { groove, anticipate, applySteps, STEPS as GROOVE_STEPS } from './processors/Groove.js';

// Utils imports
import * as Utils from './utils.js';

// Export namespaces
export const theory = {
    harmony,
    // theory.rhythm and theory.profile are jm.rhythm now; src/index.js keeps
    // the old names of both here for one release.
    rhythm,
    profile
};


// src/generative/index.js is jm.generative now; this stays for the package's
// own use for one release.
export const generative = {
    automata: { CellularAutomata },
    genetic: {
        Darwin,
        // Position-aware mutations and fitness terms for Darwin
        operators: geneticOperators,
        metrics: geneticMetrics,
        metric: geneticMetric,
        phraseToNotes: geneticPhraseToNotes
    },
    walks: { RandomWalk, Chain, Phasor, PhasorSystem },
    fractals: { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap },
    minimalism: { Tintinnabuli },
    drummer: Object.assign(drummer, { presets: drummerPresets })
    // GaussianProcessRegressor is not exported here: it depends on @tangent.to/ds.
    // import { GaussianProcessRegressor } from './generative/gaussian-processes/index.js';
};

export const processors = {
    Corruptor,
    corruptJmon,
    // Move onsets to better places on a rhythm profile
    groove,
    anticipate,
    applySteps,
    GROOVE_STEPS
};


// algorithms/utils.js is internal helpers now; gcd and lcm are all jm.utils
// still shows of it, for one release.
export const utils = {
    gcd: Utils.gcd,
    lcm: Utils.lcm,
};

// Export everything as default
export default {
    theory,
    generative,
    processors,
    utils
};
