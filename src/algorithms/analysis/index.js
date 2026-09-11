export { MusicalAnalysis } from './MusicalAnalysis.js';
export { MusicalIndex } from './MusicalIndex.js';

// `rhythm` reads a track as an onset grid (stops, anticipations, profile fit);
// `melody` places notes against the key and the chords; `salience` decides
// which notes either one looks at.
export { default as rhythm } from './RhythmCode.js';
export { default as melody } from './EmotionalMap.js';
export * as salience from './salience.js';
