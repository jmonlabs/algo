// Import components
import { Rhythm } from './Rhythm.js';
import { isorhythm } from './isorhythm.js';
import { beatcycle } from './beatcycle.js';
import { euclid, euclidPattern } from './euclid.js';
import { clave, clavePattern, CLAVES, metricStrengths } from './clave.js';
import { onsets, fromOnsets, draw, parsePattern } from './pattern.js';

// Export individual components
export {
    Rhythm,
    isorhythm,
    beatcycle,
    euclid,
    euclidPattern,
    clave,
    clavePattern,
    CLAVES,
    metricStrengths,
    onsets,
    fromOnsets,
    draw,
    parsePattern,
};

// Export rhythm namespace
export default {
    // A rhythm, in both directions. `onsets` reads a grid off notes,
    // `fromOnsets` lays a grid out as notes, `draw` prints either. The three
    // generators below are this pair plus a pattern.
    onsets,
    fromOnsets,
    draw,
    parsePattern,
    Rhythm,
    isorhythm,
    beatcycle,
    euclid,
    euclidPattern,
    clave,
    clavePattern,
    CLAVES,
    metricStrengths,
};
