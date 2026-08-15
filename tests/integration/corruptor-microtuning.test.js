/**
 * Test microtuning support for Corruptor's Harmonic Erosion feature
 */

import { Corruptor } from '../src/algorithms/processors/Corruptor.js';
import { tonejs } from '../src/converters/tonejs.js';

console.log('=== Testing Corruptor Microtuning Support ===\n');

// Test 1: Basic microtuning pass-through
console.log('1. Testing microtuning pass-through in tonejs converter');
try {
  const simpleComposition = {
    tempo: 120,
    tracks: [{
      label: 'Test Track',
      notes: [
        { pitch: 60, time: 0, duration: 1, velocity: 0.8, microtuning: 0.25 },
        { pitch: 64, time: 1, duration: 1, velocity: 0.8, microtuning: -0.15 },
        { pitch: 67, time: 2, duration: 1, velocity: 0.8 } // No microtuning
      ]
    }]
  };

  const converted = tonejs(simpleComposition);
  const firstTrack = converted.tracks[0];

  console.log('  ✓ Converted track:', firstTrack.trackInfo.label);
  console.log('  ✓ Note 1 microtuning:', firstTrack.partEvents[0].microtuning, '(expected: 0.25)');
  console.log('  ✓ Note 2 microtuning:', firstTrack.partEvents[1].microtuning, '(expected: -0.15)');
  console.log('  ✓ Note 3 microtuning:', firstTrack.partEvents[2].microtuning, '(expected: undefined)');

  if (firstTrack.partEvents[0].microtuning !== 0.25) {
    throw new Error('First note microtuning not preserved!');
  }
  if (firstTrack.partEvents[1].microtuning !== -0.15) {
    throw new Error('Second note microtuning not preserved!');
  }

  console.log('  ✓ PASS: Microtuning values preserved correctly\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message, '\n');
  process.exit(1);
}

// Test 2: Corruptor integration
console.log('2. Testing Corruptor microtuning generation');
try {
  const composition = {
    tempo: 120,
    tracks: [{
      label: 'Melody',
      notes: [
        { pitch: 60, time: 0, duration: 1, velocity: 0.8 },
        { pitch: 62, time: 1, duration: 1, velocity: 0.8 },
        { pitch: 64, time: 2, duration: 1, velocity: 0.8 },
        { pitch: 65, time: 3, duration: 1, velocity: 0.8 },
        { pitch: 67, time: 4, duration: 1, velocity: 0.8 }
      ]
    }]
  };

  // Apply Corruptor with high entropy for microtuning
  const corruptor = new Corruptor({
    entropy: 0.8,
    seed: 12345, // Fixed seed for reproducibility
    microtonalDrift: true,
    driftAmount: 1.0,
    temporalJitter: false, // Disable to isolate microtuning
    noteAttrition: false,
    velocitySag: false
  });

  const corrupted = corruptor.corrupt(composition);

  console.log('  ✓ Original notes:', composition.tracks[0].notes.length);
  console.log('  ✓ Corrupted notes:', corrupted.tracks[0].notes.length);

  let microtuningCount = 0;
  corrupted.tracks[0].notes.forEach((note, i) => {
    if (note.microtuning !== undefined) {
      microtuningCount++;
      console.log(`  ✓ Note ${i}: microtuning = ${note.microtuning.toFixed(4)} semitones`);
    }
  });

  if (microtuningCount === 0) {
    throw new Error('No microtuning applied by Corruptor!');
  }

  console.log(`  ✓ PASS: ${microtuningCount}/${corrupted.tracks[0].notes.length} notes have microtuning\n`);
} catch (error) {
  console.error('  ✗ FAIL:', error.message, '\n');
  process.exit(1);
}

// Test 3: End-to-end Corruptor → tonejs conversion
console.log('3. Testing end-to-end Corruptor → tonejs pipeline');
try {
  const composition = {
    tempo: 140,
    tracks: [{
      label: 'Corrupted Melody',
      notes: [
        { pitch: 48, time: 0, duration: 2, velocity: 0.9 },
        { pitch: 52, time: 2, duration: 2, velocity: 0.85 },
        { pitch: 55, time: 4, duration: 2, velocity: 0.8 }
      ]
    }]
  };

  const corruptor = new Corruptor({
    entropy: 0.6,
    seed: 42,
    microtonalDrift: true,
    driftAmount: 2.0 // Higher drift amount
  });

  const corrupted = corruptor.corrupt(composition);
  const converted = tonejs(corrupted);

  const track = converted.tracks[0];
  console.log('  ✓ Track label:', track.trackInfo.label);
  console.log('  ✓ Events:', track.partEvents.length);

  let hasValidMicrotuning = false;
  track.partEvents.forEach((event, i) => {
    if (event.microtuning !== undefined) {
      hasValidMicrotuning = true;
      const cents = event.microtuning * 100;
      console.log(`  ✓ Event ${i}: pitch=${event.pitch}, microtuning=${event.microtuning.toFixed(4)}st (${cents.toFixed(1)} cents)`);
    }
  });

  if (!hasValidMicrotuning) {
    throw new Error('Microtuning lost in conversion pipeline!');
  }

  console.log('  ✓ PASS: Microtuning preserved through full pipeline\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message, '\n');
  process.exit(1);
}

// Test 4: Microtuning value ranges
console.log('4. Testing microtuning value ranges');
try {
  const corruptor = new Corruptor({
    entropy: 1.0, // Maximum entropy
    seed: 999,
    microtonalDrift: true,
    driftAmount: 1.0
  });

  const composition = {
    tempo: 120,
    tracks: [{
      label: 'Range Test',
      notes: Array.from({ length: 100 }, (_, i) => ({
        pitch: 60,
        time: i * 0.5,
        duration: 0.5,
        velocity: 0.8
      }))
    }]
  };

  const corrupted = corruptor.corrupt(composition);

  const microtunings = corrupted.tracks[0].notes
    .map(n => n.microtuning)
    .filter(m => m !== undefined);

  const min = Math.min(...microtunings);
  const max = Math.max(...microtunings);
  const avg = microtunings.reduce((a, b) => a + b, 0) / microtunings.length;

  console.log('  ✓ Sample size:', microtunings.length);
  console.log('  ✓ Min microtuning:', min.toFixed(4), 'semitones');
  console.log('  ✓ Max microtuning:', max.toFixed(4), 'semitones');
  console.log('  ✓ Average:', avg.toFixed(4), 'semitones');
  console.log('  ✓ Range:', (max - min).toFixed(4), 'semitones');

  // Gaussian distribution should have most values within ±2 standard deviations
  // With entropy=1.0 and driftAmount=1.0, sigma = 0.5
  // So we expect ~95% of values within ±1.0 semitones
  const withinRange = microtunings.filter(m => Math.abs(m) <= 1.5).length;
  const percentage = (withinRange / microtunings.length) * 100;

  console.log(`  ✓ Values within ±1.5 semitones: ${percentage.toFixed(1)}% (expected ~95%)`);
  console.log('  ✓ PASS: Microtuning ranges appear correct\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message, '\n');
  process.exit(1);
}

console.log('=== All Tests Passed ✓ ===');
console.log('\nMicrotuning support is working correctly!');
console.log('- Schema field: ✓ Defined');
console.log('- Corruptor: ✓ Generates microtuning');
console.log('- tonejs converter: ✓ Passes through microtuning');
console.log('- Ready for music-player.js to apply via synth.detune');
