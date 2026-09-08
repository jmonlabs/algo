export { MusicalAnalysis } from './MusicalAnalysis.js';
export { MusicalIndex } from './MusicalIndex.js';

// Bodzsar-derived analyses. `rhythm` reads a track as an onset grid (stops,
// anticipations, clave fit); `melody` places notes on the Emotional Map;
// `salience` decides which notes either one looks at.
import rhythmCode from './RhythmCode.js';
import emotionalMap from './EmotionalMap.js';
import * as salienceModule from './salience.js';

export const rhythm = rhythmCode;
export const melody = emotionalMap;
export const salience = salienceModule;
// Types are documented as JSDoc in MusicalAnalysis.js
