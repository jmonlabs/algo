// Constants
import { MusicTheoryConstants, ARTICULATION_TYPES, ORNAMENT_TYPES, ConstantsAPI } from './constants/index.js';

// Theory imports
import harmony from './theory/harmony/index.js';
import rhythm from './theory/rhythm/index.js';
import { MotifBank } from './theory/motifs/index.js';

// Generative algorithm imports
import { CellularAutomata } from './generative/cellular-automata/index.js';
import { Loop } from './generative/loops/index.js';
import { Darwin } from './generative/genetic/index.js';
import { RandomWalk, Chain, Phasor, PhasorSystem } from './generative/walks/index.js';
import { Mandelbrot, Julia, BurningShip, Fractal, LogisticMap } from './generative/fractals/index.js';
import { MinimalismProcess, Tintinnabuli } from './generative/minimalism/index.js';
// GaussianProcessRegressor is NOT imported here to avoid @tangent.to/ds dependency
// Users who need it must import it directly:
// import { GaussianProcessRegressor } from './generative/gaussian-processes/index.js';

// Processor imports
import { Corruptor, corruptJmon } from './processors/Corruptor.js';

// Analysis imports
import * as analysisModule from './analysis/index.js';

// Visualization imports
import { CAVisualizer } from './visualization/cellular-automata/CAVisualizer.js';
import { FractalVisualizer } from './visualization/fractals/FractalVisualizer.js';
import { LoopVisualizer } from './visualization/loops/LoopVisualizer.js';
import { PlotRenderer } from './visualization/plots/PlotRenderer.js';

// Utils imports
import * as Utils from './utils.js';
import audioNS from './audio/index.js';

// Export namespaces
export const theory = {
    harmony,
    rhythm,
    motifs: {
        MotifBank
    }
};

export const constants = {
    theory: MusicTheoryConstants,
    articulations: ARTICULATION_TYPES,
    ornaments: ORNAMENT_TYPES,
    // Convenience methods from ConstantsAPI
    list: ConstantsAPI.list.bind(ConstantsAPI),
    get: ConstantsAPI.get.bind(ConstantsAPI),
    describe: ConstantsAPI.describe.bind(ConstantsAPI),
    search: ConstantsAPI.search.bind(ConstantsAPI),
    listArticulations: ConstantsAPI.listArticulations.bind(ConstantsAPI),
    listOrnaments: ConstantsAPI.listOrnaments.bind(ConstantsAPI),
    listScales: ConstantsAPI.listScales.bind(ConstantsAPI),
    listIntervals: ConstantsAPI.listIntervals.bind(ConstantsAPI)
};

export const generative = {
    automata: {
        Cellular: CellularAutomata
    },
    loops: { Loop },
    genetic: {
        Darwin: Darwin
    },
    walks: {
        Random: RandomWalk,
        Chain: Chain,
        Phasor: {
            Vector: Phasor,
            System: PhasorSystem
        }
    },
    fractals: {
        Mandelbrot,
        Julia,
        BurningShip,
        Fractal,
        LogisticMap
    },
    minimalism: {
        Process: MinimalismProcess,
        Tintinnabuli
    }
    // Note: GaussianProcessRegressor removed to avoid @tangent.to/ds dependency
    // Import it separately if needed: import { GaussianProcessRegressor } from './generative/gaussian-processes/index.js';
};

export const processors = {
    Corruptor,
    corruptJmon
};

export const analysis = {
    ...analysisModule
};

export const visualization = {
    CAVisualizer,
    FractalVisualizer,
    LoopVisualizer,
    PlotRenderer
};

export const utils = {
    ...Utils
};
export const audio = audioNS;

// Export everything as default
export default {
    theory,
    constants,
    generative,
    processors,
    analysis,
    visualization,
    audio,
    utils
};
