/**
 * Comprehensive test suite for algo
 * Tests all major features to ensure everything works
 */

console.log('==========================================================');
console.log('  ALGO COMPREHENSIVE TEST SUITE');
console.log('==========================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

// ===== GENERATIVE ALGORITHMS =====
console.log('\n=== GENERATIVE ALGORITHMS ===\n');

// Cellular Automata
import { CellularAutomata } from '../src/algorithms/generative/cellular-automata/CellularAutomata.js';
test('Cellular Automata: Generate Rule 30', () => {
  const ca = new CellularAutomata({ rule: 30, width: 10, iterations: 5 });
  const sequence = ca.generate();
  if (!Array.isArray(sequence) || sequence.length === 0) throw new Error('Invalid sequence');
});

// Fractals
import { Mandelbrot } from '../src/algorithms/generative/fractals/Mandelbrot.js';
test('Mandelbrot: Generate fractal data', () => {
  const mandelbrot = new Mandelbrot({ width: 20, height: 20, maxIterations: 50 });
  const data = mandelbrot.generate();
  if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid data');
});

test('Mandelbrot: Extract spiral sequence', () => {
  const mandelbrot = new Mandelbrot({ width: 20, height: 20, maxIterations: 50 });
  mandelbrot.generate();
  const sequence = mandelbrot.extractSequence('spiral');
  if (!Array.isArray(sequence) || sequence.length === 0) throw new Error('Invalid sequence');
});

import { LogisticMap } from '../src/algorithms/generative/fractals/LogisticMap.js';
test('Logistic Map: Generate chaotic sequence', () => {
  const logistic = new LogisticMap({ r: 3.8, x0: 0.5, iterations: 50 });
  const sequence = logistic.generate();
  if (!Array.isArray(sequence) || sequence.length !== 50) throw new Error('Invalid sequence');
  if (!sequence.every(v => v >= 0 && v <= 1)) throw new Error('Values out of range');
});

// Minimalism
import { MinimalismProcess, Tintinnabuli } from '../src/algorithms/generative/minimalism/MinimalismProcess.js';
test('Minimalism: Additive forward process', () => {
  const process = new MinimalismProcess({ operation: 'additive', direction: 'forward', repetition: 1 });
  const input = [
    { pitch: 60, duration: 0.5, time: 0 },
    { pitch: 62, duration: 0.5, time: 0.5 }
  ];
  const output = process.generate(input);
  if (!Array.isArray(output) || output.length <= input.length) throw new Error('Process failed');
});

test('Minimalism: Subtractive inward process', () => {
  const process = new MinimalismProcess({ operation: 'subtractive', direction: 'inward', repetition: 0 });
  const input = [
    { pitch: 60, duration: 0.5, time: 0 },
    { pitch: 62, duration: 0.5, time: 0.5 },
    { pitch: 64, duration: 0.5, time: 1 },
    { pitch: 65, duration: 0.5, time: 1.5 }
  ];
  const output = process.generate(input);
  if (!Array.isArray(output)) throw new Error('Process failed');
});

test('Tintinnabuli: Generate T-voice', () => {
  const tChord = [60, 64, 67];
  const tintinnabuli = new Tintinnabuli({ tChord, direction: 'down', rank: 0 });
  const mVoice = [
    { pitch: 62, duration: 1, time: 0 },
    { pitch: 65, duration: 1, time: 1 }
  ];
  const tVoice = tintinnabuli.generate(mVoice);
  if (!Array.isArray(tVoice) || tVoice.length !== mVoice.length) throw new Error('Invalid T-voice');
  if (!tVoice.every(n => tChord.includes(n.pitch))) throw new Error('Pitches not in T-chord');
});

// Random Walks
import { RandomWalk } from '../src/algorithms/generative/walks/RandomWalk.js';
test('Random Walk: Generate walk', () => {
  const walk = new RandomWalk({ length: 20, dimensions: 1, stepSize: 2, bounds: [0, 100] });
  const data = walk.generate([50]);
  if (!Array.isArray(data) || data.length !== 20) throw new Error('Invalid walk');
});

test('Random Walk: Map to scale', () => {
  const walk = new RandomWalk({ length: 20, dimensions: 1, stepSize: 2, bounds: [0, 100] });
  walk.generate([50]);
  const pitches = walk.mapToScale(0, [0, 2, 4, 5, 7, 9, 11], 2);
  if (!Array.isArray(pitches) || pitches.length !== 20) throw new Error('Invalid mapping');
});

import { Chain } from '../src/algorithms/generative/walks/Chain.js';
test('Chain: Generate sequences', () => {
  const chain = new Chain({
    walkRange: [40, 80],
    walkStart: 60,
    walkProbability: [-2, -1, 0, 1, 2],
    branchingProbability: 0.1,
    mergingProbability: 0.05
  });
  const sequences = chain.generate(15);
  if (!Array.isArray(sequences) || sequences.length === 0) throw new Error('Invalid sequences');
});

import { Phasor, PhasorSystem } from '../src/algorithms/generative/walks/PhasorWalk.js';
test('Phasor: Simulate rotation', () => {
  const phasor = new Phasor(10, 1, 0);
  const timeArray = Array.from({ length: 20 }, (_, i) => i * 0.1);
  const results = phasor.simulate(timeArray);
  if (!Array.isArray(results) || results.length === 0) throw new Error('Invalid simulation');
});

test('Phasor System: Simulate multiple phasors', () => {
  const system = new PhasorSystem();
  system.addPlanet(new Phasor(10, 1, 0));
  system.addPlanet(new Phasor(20, 0.5, Math.PI / 2));
  const timeArray = Array.from({ length: 10 }, (_, i) => i);
  const results = system.simulate(timeArray);
  if (!Array.isArray(results) || results.length === 0) throw new Error('Invalid simulation');
});

// ===== MUSIC THEORY =====
console.log('\n=== MUSIC THEORY ===\n');

import { Scale } from '../src/algorithms/theory/harmony/Scale.js';
test('Scale: Generate C major', () => {
  const scale = new Scale({ tonic: 'C', mode: 'major' });
  const notes = scale.generate({ octave: 4 });
  if (!Array.isArray(notes) || !notes.includes(60)) throw new Error('Invalid scale');
});

test('Scale: Generate D dorian', () => {
  const scale = new Scale({ tonic: 'D', mode: 'dorian' });
  const notes = scale.generate({ octave: 4 });
  if (!Array.isArray(notes) || notes.length < 7) throw new Error('Invalid scale');
});

import { Progression } from '../src/algorithms/theory/harmony/Progression.js';
test('Progression: Generate I-IV-V-I', () => {
  const progression = new Progression('C', 'major');
  const chords = progression.generate(['I', 'IV', 'V', 'I']);
  if (!Array.isArray(chords) || chords.length !== 4) throw new Error('Invalid progression');
});

test('Progression: Circle of fifths', () => {
  const progression = new Progression('C', 'major');
  const circle = progression.circleOfFifths(4);
  if (!Array.isArray(circle) || circle.length !== 4) throw new Error('Invalid circle');
});

import { Voice } from '../src/algorithms/theory/harmony/Voice.js';
test('Voice: Lead between chords', () => {
  const voice = new Voice({ key: 'C', mode: 'major', voices: 4 });
  const chord1 = [60, 64, 67, 72];
  const chord2 = [65, 69, 72, 77];
  const led = voice.lead(chord1, chord2);
  if (!Array.isArray(led) || led.length !== chord2.length) throw new Error('Invalid voice leading');
});

import { Ornament } from '../src/algorithms/theory/harmony/Ornament.js';
test('Ornament: Parse duration (4n)', () => {
  const duration = Ornament.parseDuration('4n');
  if (duration !== 1) throw new Error('Invalid duration');
});

test('Ornament: Parse duration (8t)', () => {
  const duration = Ornament.parseDuration('8t');
  if (Math.abs(duration - 0.333) > 0.01) throw new Error('Invalid duration');
});

test('Ornament: Parse duration (4n.)', () => {
  const duration = Ornament.parseDuration('4n.');
  if (duration !== 1.5) throw new Error('Invalid duration');
});

test('Ornament: Validate trill on short note', () => {
  const result = Ornament.validateOrnament({ pitch: 60, duration: '16n', time: 0 }, 'trill', {});
  if (result.valid !== false) throw new Error('Should reject short note');
});

test('Ornament: Validate trill on long note', () => {
  const result = Ornament.validateOrnament({ pitch: 60, duration: '4n', time: 0 }, 'trill', {});
  if (result.valid !== true) throw new Error('Should accept long note');
});

test('Ornament: Apply grace note', () => {
  const ornament = new Ornament({ type: 'grace_note', parameters: { graceNoteType: 'acciaccatura' } });
  const notes = [{ pitch: 64, duration: 1, time: 0 }];
  const result = ornament.apply(notes, 0);
  if (!Array.isArray(result) || result.length <= notes.length) throw new Error('Grace note not applied');
});

test('Ornament: Apply trill', () => {
  const ornament = new Ornament({ type: 'trill', parameters: { by: 2, trillRate: 0.25 }, tonic: 'C', mode: 'major' });
  const notes = [{ pitch: 60, duration: 2, time: 0 }];
  const result = ornament.apply(notes, 0);
  if (!Array.isArray(result) || result.length <= 1) throw new Error('Trill not applied');
});

import { Articulation } from '../src/algorithms/theory/harmony/Articulation.js';
test('Articulation: Apply staccato', () => {
  const note = { pitch: 60, duration: 1, time: 0 };
  const result = Articulation.apply(note, 'staccato');
  if (!result.success || note.duration >= 1) throw new Error('Staccato not applied');
});

test('Articulation: Apply accent', () => {
  const note = { pitch: 60, duration: 1, time: 0, velocity: 0.8 };
  const result = Articulation.apply(note, 'accent');
  if (!result.success || note.velocity <= 0.8) throw new Error('Accent not applied');
});

import { isorhythm } from '../src/algorithms/theory/rhythm/isorhythm.js';
test('Isorhythm: Generate pattern', () => {
  const pitches = [60, 62, 64, 65, 67];
  const durations = [1, 0.5, 0.5, 1];
  const result = isorhythm(pitches, durations);
  if (!Array.isArray(result) || result.length !== 20) throw new Error('Invalid isorhythm');
});

import { beatcycle } from '../src/algorithms/theory/rhythm/beatcycle.js';
test('Beatcycle: Generate pattern', () => {
  const pitches = [60, 62, 64, 65];
  const durations = [1, 0.5, 0.5];
  const result = beatcycle(pitches, durations);
  if (!Array.isArray(result) || result.length !== 4) throw new Error('Invalid beatcycle');
  if (!result.every(n => typeof n.pitch === 'number' && typeof n.duration === 'number' && typeof n.time === 'number')) {
    throw new Error('Beatcycle should return JMON note objects');
  }
  const legacy = beatcycle(pitches, durations, { legacy: true });
  if (!Array.isArray(legacy) || !Array.isArray(legacy[0]) || legacy[0].length !== 3) {
    throw new Error('Legacy beatcycle output malformed');
  }
});

import { Rhythm } from '../src/algorithms/theory/rhythm/Rhythm.js';
test('Rhythm: Generate random rhythm', () => {
  const rhythm = new Rhythm(4, [0.25, 0.5, 1, 2]);
  const result = rhythm.random({ restProbability: 0.2 });
  if (!Array.isArray(result) || result.length === 0) throw new Error('Invalid rhythm');
  const total = result.reduce((sum, r) => sum + r.duration, 0);
  if (total > 4) throw new Error('Rhythm exceeds measure length');
  const legacy = rhythm.random(null, 0, 100, { legacy: true });
  if (!Array.isArray(legacy) || !Array.isArray(legacy[0])) throw new Error('Legacy rhythm output malformed');
});

// ===== ANALYSIS =====
console.log('\n=== ANALYSIS FUNCTIONS ===\n');

import { MusicalAnalysis } from '../src/algorithms/analysis/MusicalAnalysis.js';

test('Analysis: Gini coefficient', () => {
  const result = MusicalAnalysis.gini([1, 2, 3, 4, 5]);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid gini');
});

test('Analysis: Balance', () => {
  const result = MusicalAnalysis.balance([1, 2, 3, 2, 1]);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid balance');
});

test('Analysis: Autocorrelation', () => {
  const result = MusicalAnalysis.autocorrelation([1, 2, 3, 1, 2, 3], 3);
  if (!Array.isArray(result) || result.length === 0) throw new Error('Invalid autocorrelation');
});

test('Analysis: Motif detection', () => {
  const result = MusicalAnalysis.motif([1, 2, 3, 1, 2, 3], 3);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid motif');
});

test('Analysis: Dissonance', () => {
  const result = MusicalAnalysis.dissonance([60, 62, 64], [0, 2, 4, 5, 7, 9, 11]);
  if (typeof result !== 'number' || isNaN(result) || result < 0 || result > 1) throw new Error('Invalid dissonance');
});

test('Analysis: Rhythmic fit', () => {
  const result = MusicalAnalysis.rhythmic([0, 1, 2, 3], 16);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid rhythmic');
});

test('Analysis: Fibonacci index', () => {
  const result = MusicalAnalysis.fibonacciIndex([1, 1, 2, 3, 5, 8]);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid fibonacci');
});

test('Analysis: Syncopation', () => {
  const result = MusicalAnalysis.syncopation([0, 1, 2, 3], 4);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid syncopation');
});

test('Analysis: Contour entropy', () => {
  const result = MusicalAnalysis.contourEntropy([60, 62, 64, 62, 60]);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid contour entropy');
});

test('Analysis: Interval variance', () => {
  const result = MusicalAnalysis.intervalVariance([60, 62, 64, 66]);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid interval variance');
});

test('Analysis: Note density', () => {
  const notes = [
    { pitch: 60, duration: 1, time: 0 },
    { pitch: 62, duration: 1, time: 1 }
  ];
  const result = MusicalAnalysis.density(notes, 1);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid density');
});

test('Analysis: Gap variance', () => {
  const result = MusicalAnalysis.gapVariance([0, 1, 2, 3]);
  if (typeof result !== 'number' || isNaN(result)) throw new Error('Invalid gap variance');
});

test('Analysis: Comprehensive analyze', () => {
  const notes = [
    { pitch: 60, duration: 1, time: 0 },
    { pitch: 62, duration: 1, time: 1 },
    { pitch: 64, duration: 1, time: 2 }
  ];
  const result = MusicalAnalysis.analyze(notes, { scale: [0, 2, 4, 5, 7, 9, 11] });
  if (!result || typeof result !== 'object') throw new Error('Invalid analysis');
  const expectedMetrics = ['gini', 'balance', 'motif', 'dissonance', 'rhythmic', 'fibonacciIndex', 'syncopation', 'contourEntropy', 'intervalVariance', 'density', 'gapVariance'];
  for (const metric of expectedMetrics) {
    if (!(metric in result)) throw new Error(`Missing metric: ${metric}`);
  }
});

// ===== GAUSSIAN PROCESSES =====
console.log('\n=== GAUSSIAN PROCESSES ===\n');

import { GaussianProcessRegressor } from '../src/algorithms/generative/gaussian-processes/GaussianProcessRegressor.js';

test('GP: Fit with RBF kernel', () => {
  const gp = new GaussianProcessRegressor({ kernel: 'rbf', lengthScale: 1.0, variance: 1.0 });
  const X = [[0], [1], [2], [3]];
  const y = [0, 1, 4, 9];
  gp.fit(X, y);
  if (!gp.isFitted) throw new Error('GP not fitted');
});

test('GP: Predict', () => {
  const gp = new GaussianProcessRegressor({ kernel: 'rbf', lengthScale: 1.0, variance: 1.0 });
  const X = [[0], [1], [2], [3]];
  const y = [0, 1, 4, 9];
  gp.fit(X, y);
  const predictions = gp.predict([[0.5], [1.5]]);
  if (!Array.isArray(predictions) || predictions.length !== 2) throw new Error('Invalid predictions');
});

test('GP: Predict with uncertainty', () => {
  const gp = new GaussianProcessRegressor({ kernel: 'rbf', lengthScale: 1.0, variance: 1.0 });
  const X = [[0], [1], [2]];
  const y = [0, 1, 4];
  gp.fit(X, y);
  const result = gp.predictWithUncertainty([[0.5]]);
  if (!result.mean || !result.std) throw new Error('Invalid uncertainty prediction');
  if (!Array.isArray(result.std) || result.std[0] <= 0) throw new Error('No uncertainty estimates');
});

test('GP: Different kernels work', () => {
  const kernels = ['rbf', 'periodic', 'rational_quadratic'];
  for (const kernelName of kernels) {
    const gp = new GaussianProcessRegressor({ kernel: kernelName, lengthScale: 1.0, variance: 1.0 });
    const X = [[0], [1], [2]];
    const y = [0, 1, 4];
    gp.fit(X, y);
    gp.predict([[0.5]]);
  }
});

// ===== CONVERTERS =====
console.log('\n=== CONVERTERS ===\n');

import { MidiToJmon } from '../src/converters/midi-to-jmon.js';

test('MIDI Converter: Key signature conversion (C major)', () => {
  const converter = new MidiToJmon();
  const result = converter.midiKeySignatureToString(0, 0);
  if (result !== 'C') throw new Error('Invalid key signature');
});

test('MIDI Converter: Key signature conversion (G major)', () => {
  const converter = new MidiToJmon();
  const result = converter.midiKeySignatureToString(1, 'major');
  if (result !== 'G') throw new Error('Invalid key signature');
});

test('MIDI Converter: Key signature conversion (D minor)', () => {
  const converter = new MidiToJmon();
  const result = converter.midiKeySignatureToString(-1, 1);
  if (result !== 'Dm') throw new Error('Invalid key signature');
});

test('MIDI Converter: Extract key signature from header', () => {
  const converter = new MidiToJmon();
  const mockParsed = {
    header: { keySignatures: [{ key: 2, scale: 0 }] },
    tracks: []
  };
  const result = converter.extractKeySignature(mockParsed);
  if (result !== 'D') throw new Error('Invalid key extraction');
});

// ===== SUMMARY =====
console.log('\n==========================================================');
console.log('  TEST SUMMARY');
console.log('==========================================================');
console.log(`Total tests:  ${totalTests}`);
console.log(`Passed:       ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed:       ${failedTests}`);
console.log('==========================================================\n');

if (failedTests === 0) {
  console.log('✅ ALL TESTS PASSED!\n');
  Deno.exit(0);
} else {
  console.log(`❌ ${failedTests} test(s) failed\n`);
  Deno.exit(1);
}
