/**
 * COMPREHENSIVE TEST SUITE FOR JMON-ALGO
 * Tests all major features with correct API usage
 */

console.log('==========================================================');
console.log('  JMON-ALGO COMPREHENSIVE TEST SUITE');
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

// =====================================================
// GENERATIVE ALGORITHMS
// =====================================================
console.log('\n=== GENERATIVE ALGORITHMS ===\n');

import { CellularAutomata } from '../src/algorithms/generative/cellular-automata/CellularAutomata.js';
test('Cellular Automata: Generate Rule 30', () => {
  const ca = new CellularAutomata({ rule: 30, width: 10, iterations: 5 });
  const sequence = ca.generate();
  if (!Array.isArray(sequence) || sequence.length === 0) throw new Error('Invalid sequence');
});

import { Mandelbrot } from '../src/algorithms/generative/fractals/Mandelbrot.js';
test('Mandelbrot: Generate and extract', () => {
  const mandelbrot = new Mandelbrot({ width: 20, height: 20, maxIterations: 50 });
  mandelbrot.generate();
  const sequence = mandelbrot.extractSequence('spiral');
  if (!Array.isArray(sequence) || sequence.length === 0) throw new Error('Invalid sequence');
});

import { LogisticMap } from '../src/algorithms/generative/fractals/LogisticMap.js';
test('Logistic Map: Generate chaotic sequence', () => {
  const logistic = new LogisticMap({ r: 3.8, x0: 0.5, iterations: 50 });
  const sequence = logistic.generate();
  if (!Array.isArray(sequence) || sequence.length !== 50) throw new Error('Invalid length');
  if (!sequence.every(v => v >= 0 && v <= 1)) throw new Error('Values out of range');
});

import { MinimalismProcess, Tintinnabuli } from '../src/algorithms/generative/minimalism/MinimalismProcess.js';
test('Minimalism: Additive forward', () => {
  const process = new MinimalismProcess({ operation: 'additive', direction: 'forward', repetition: 1 });
  const input = [
    { pitch: 60, duration: 0.5, time: 0 },
    { pitch: 62, duration: 0.5, time: 0.5 }
  ];
  const output = process.generate(input);
  if (!Array.isArray(output) || output.length <= input.length) throw new Error('Process failed');
});

test('Minimalism: Subtractive inward', () => {
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
});

import { RandomWalk } from '../src/algorithms/generative/walks/RandomWalk.js';
test('Random Walk: Generate and map to scale', () => {
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
  system.addPhasor(new Phasor(10, 1, 0));
  system.addPhasor(new Phasor(20, 0.5, Math.PI / 2));
  const timeArray = Array.from({ length: 10 }, (_, i) => i);
  const results = system.simulate(timeArray);
  if (!Array.isArray(results) || results.length === 0) throw new Error('Invalid simulation');
});

// =====================================================
// MUSIC THEORY
// =====================================================
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
test('Progression: Generate chords', () => {
  const progression = new Progression('C4', 'P5', 'chords');
  const chords = progression.generate(4);
  if (!Array.isArray(chords) || chords.length !== 4) throw new Error('Invalid progression');
});

import { Voice } from '../src/algorithms/theory/harmony/Voice.js';
test('Voice: Generate chords from track', () => {
  const voice = new Voice({ tonic: 'C', mode: 'major', degrees: [0, 2, 4], extractRoots: false });
  const track = [{ pitch: 60, duration: 4, time: 0 }];
  const chords = voice.generate(track);
  if (!Array.isArray(chords) || chords.length === 0) throw new Error('Invalid chords');
});

import { Ornament } from '../src/algorithms/theory/harmony/Ornament.js';
test('Ornament: Parse duration formats', () => {
  if (Ornament.parseDuration('4n') !== 1) throw new Error('4n failed');
  if (Math.abs(Ornament.parseDuration('8t') - 0.333) > 0.01) throw new Error('8t failed');
  if (Ornament.parseDuration('4n.') !== 1.5) throw new Error('4n. failed');
});

test('Ornament: Validate duration requirements', () => {
  const short = Ornament.validateOrnament({ pitch: 60, duration: '16n', time: 0 }, 'trill', {});
  if (short.valid !== false) throw new Error('Should reject short note');

  const long = Ornament.validateOrnament({ pitch: 60, duration: '4n', time: 0 }, 'trill', {});
  if (long.valid !== true) throw new Error('Should accept long note');
});

test('Ornament: Apply grace note', () => {
  const ornament = new Ornament({ type: 'grace_note', parameters: { graceNoteType: 'acciaccatura' } });
  const notes = [{ pitch: 64, duration: 1, time: 0 }];
  const result = ornament.apply(notes, 0);
  if (!Array.isArray(result) || result.length <= notes.length) throw new Error('Not applied');
});

test('Ornament: Apply trill', () => {
  const ornament = new Ornament({ type: 'trill', parameters: { by: 2, trillRate: 0.25 }, tonic: 'C', mode: 'major' });
  const notes = [{ pitch: 60, duration: 2, time: 0 }];
  const result = ornament.apply(notes, 0);
  if (!Array.isArray(result) || result.length <= 1) throw new Error('Not applied');
});

import { Articulation } from '../src/algorithms/theory/harmony/Articulation.js';
test('Articulation: Apply staccato', () => {
  const sequence = [{ pitch: 60, duration: 1, time: 0 }];
  const result = Articulation.addArticulation(sequence, 'staccato', 0);
  if (!result.success) throw new Error('Not applied');
  if (sequence[0].duration >= 1) throw new Error('Duration not shortened');
});

test('Articulation: Apply accent', () => {
  const sequence = [{ pitch: 60, duration: 1, time: 0, velocity: 0.8 }];
  const result = Articulation.addArticulation(sequence, 'accent', 0);
  if (!result.success) throw new Error('Not applied');
  if (sequence[0].velocity <= 0.8) throw new Error('Velocity not increased');
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
  if (!result.every(n => typeof n.pitch === 'number' && typeof n.time === 'number')) {
    throw new Error('Beatcycle should return note objects');
  }
});

import { Rhythm } from '../src/algorithms/theory/rhythm/Rhythm.js';
test('Rhythm: Generate random rhythm', () => {
  const rhythm = new Rhythm(4, [0.25, 0.5, 1, 2]);
  const result = rhythm.random({ restProbability: 0.2 });
  if (!Array.isArray(result)) throw new Error('Invalid rhythm');
  const total = result.reduce((sum, r) => sum + r.duration, 0);
  if (total > 4) throw new Error('Exceeds measure');
});

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================
console.log('\n=== ANALYSIS FUNCTIONS ===\n');

import { MusicalAnalysis } from '../src/algorithms/analysis/MusicalAnalysis.js';

test('Analysis: All 11 metrics work individually', () => {
  const metrics = [
    ['gini', () => MusicalAnalysis.gini([1, 2, 3, 4, 5])],
    ['balance', () => MusicalAnalysis.balance([1, 2, 3, 2, 1])],
    ['autocorrelation', () => MusicalAnalysis.autocorrelation([1, 2, 3], 2)],
    ['motif', () => MusicalAnalysis.motif([1, 2, 3, 1, 2, 3], 3)],
    ['dissonance', () => MusicalAnalysis.dissonance([60, 62], [0, 2, 4, 5, 7, 9, 11])],
    ['rhythmic', () => MusicalAnalysis.rhythmic([0, 1, 2, 3], 16)],
    ['fibonacciIndex', () => MusicalAnalysis.fibonacciIndex([1, 1, 2, 3, 5])],
    ['syncopation', () => MusicalAnalysis.syncopation([0, 1, 2], 4)],
    ['contourEntropy', () => MusicalAnalysis.contourEntropy([60, 62, 64])],
    ['intervalVariance', () => MusicalAnalysis.intervalVariance([60, 62, 64])],
    ['gapVariance', () => MusicalAnalysis.gapVariance([0, 1, 2, 3])]
  ];

  for (const [name, fn] of metrics) {
    const result = fn();
    if (typeof result !== 'number' && !Array.isArray(result)) {
      throw new Error(`${name} failed`);
    }
  }
});

test('Analysis: Comprehensive analyze', () => {
  const notes = [
    { pitch: 60, duration: 1, time: 0 },
    { pitch: 62, duration: 1, time: 1 },
    { pitch: 64, duration: 1, time: 2 }
  ];
  const result = MusicalAnalysis.analyze(notes, { scale: [0, 2, 4, 5, 7, 9, 11] });

  const expected = ['gini', 'balance', 'motif', 'dissonance', 'rhythmic', 'fibonacciIndex',
                   'syncopation', 'contourEntropy', 'intervalVariance', 'density', 'gapVariance'];
  for (const metric of expected) {
    if (!(metric in result)) throw new Error(`Missing ${metric}`);
  }
});

// =====================================================
// GAUSSIAN PROCESSES
// =====================================================
console.log('\n=== GAUSSIAN PROCESSES ===\n');

import { GaussianProcessRegressor } from '../src/algorithms/generative/gaussian-processes/GaussianProcessRegressor.js';

test('GP: Fit and predict with RBF kernel', () => {
  const gp = new GaussianProcessRegressor({ kernel: 'rbf', lengthScale: 1.0, variance: 1.0 });
  const X = [[0], [1], [2], [3]];
  const y = [0, 1, 4, 9];
  gp.fit(X, y);
  const predictions = gp.predict([[0.5], [1.5]]);
  if (!Array.isArray(predictions) || predictions.length !== 2) throw new Error('Prediction failed');
});

test('GP: Predict with uncertainty', () => {
  const gp = new GaussianProcessRegressor({ kernel: 'rbf', lengthScale: 1.0, variance: 1.0 });
  const X = [[0], [1], [2]];
  const y = [0, 1, 4];
  gp.fit(X, y);
  const result = gp.predictWithUncertainty([[0.5]]);
  if (!result.mean || !result.std) throw new Error('No uncertainty estimates');
});

// =====================================================
// CONVERTERS
// =====================================================
console.log('\n=== CONVERTERS ===\n');

import { MidiToJmon } from '../src/converters/midi-to-jmon.js';

test('MIDI: Key signature conversion', () => {
  const converter = new MidiToJmon();
  if (converter.midiKeySignatureToString(0, 0) !== 'C') throw new Error('C major failed');
  if (converter.midiKeySignatureToString(1, 'major') !== 'G') throw new Error('G major failed');
  if (converter.midiKeySignatureToString(-1, 1) !== 'Dm') throw new Error('D minor failed');
  if (converter.midiKeySignatureToString(2, 0) !== 'D') throw new Error('D major failed');
  if (converter.midiKeySignatureToString(-2, 'minor') !== 'Gm') throw new Error('G minor failed');
});

test('MIDI: Extract key signature from parsed data', () => {
  const converter = new MidiToJmon();
  const mockParsed = {
    header: { keySignatures: [{ key: 2, scale: 0 }] },
    tracks: []
  };
  const result = converter.extractKeySignature(mockParsed);
  if (result !== 'D') throw new Error('Extraction failed');
});

// =====================================================
// SUMMARY
// =====================================================
console.log('\n==========================================================');
console.log('  TEST SUMMARY');
console.log('==========================================================');
console.log(`Total tests:  ${totalTests}`);
console.log(`Passed:       ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed:       ${failedTests}`);
console.log('==========================================================\n');

if (failedTests === 0) {
  console.log('✅ ALL TESTS PASSED!\n');
  process.exit(0);
} else {
  console.log(`❌ ${failedTests} test(s) failed\n`);
  process.exit(1);
}
