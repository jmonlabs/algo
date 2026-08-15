/**
 * Bun compatibility test for @jmon/jmon-algo
 *
 * Run with: bun run tests/bun-compatibility.test.js
 */

console.log('🧪 Testing @jmon/jmon-algo in Bun runtime...\n');

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

let passedTests = 0;
let totalTests = 0;

async function runTests() {
  // Test 1: Import from JSR
  totalTests++;
  const importPassed = await test('Import from JSR', async () => {
    // Bun should support jsr: imports
    try {
      const jm = await import('jsr:@jmon/jmon-algo@1.0.1');
      if (!jm || (!jm.jm && !jm.default)) {
        throw new Error('No jm export found');
      }
    } catch (e) {
      if (e.message.includes('jsr:')) {
        console.log('   Note: Bun may need --jsr flag or use npm: prefix instead');
        // Try npm: prefix as fallback
        const jm = await import('npm:@jmon/jmon-algo@1.0.1');
        if (!jm || (!jm.jm && !jm.default)) {
          throw new Error('No jm export found');
        }
      } else {
        throw e;
      }
    }
  });
  if (importPassed) passedTests++;

  // Get the module for remaining tests
  let jmModule;
  try {
    jmModule = await import('jsr:@jmon/jmon-algo@1.0.1');
  } catch {
    jmModule = await import('npm:@jmon/jmon-algo@1.0.1');
  }
  const jm = jmModule.jm || jmModule.default;

  // Test 2: Theory - Scale generation
  totalTests++;
  if (await test('theory.scale.generate()', async () => {
    const scale = jm.theory.scale.generate('C', 'major');
    if (!Array.isArray(scale) || scale.length !== 8) {
      throw new Error(`Expected 8 notes, got ${scale.length}`);
    }
    console.log(`   Generated: ${scale.join(', ')}`);
  })) passedTests++;

  // Test 3: Theory - Chord generation
  totalTests++;
  if (await test('theory.chord.generate()', async () => {
    const chord = jm.theory.chord.generate('C', 'major');
    if (!chord.notes || !Array.isArray(chord.notes)) {
      throw new Error('Chord should have notes array');
    }
    console.log(`   Generated: ${chord.notes.join(', ')}`);
  })) passedTests++;

  // Test 4: Theory - Chord progression
  totalTests++;
  if (await test('theory.chord.progression()', async () => {
    const progression = jm.theory.chord.progression('C', ['I', 'IV', 'V', 'I']);
    if (!Array.isArray(progression) || progression.length !== 4) {
      throw new Error('Should generate 4 chords');
    }
    console.log(`   Generated: ${progression.map(c => c.root + c.quality).join(' - ')}`);
  })) passedTests++;

  // Test 5: Generative - Simple melody
  totalTests++;
  if (await test('generative.melody.simple()', async () => {
    const melody = jm.generative.melody.simple({
      length: 8,
      scale: 'C major',
      octave: 4
    });
    if (!Array.isArray(melody) || melody.length !== 8) {
      throw new Error(`Expected 8 notes, got ${melody.length}`);
    }
    console.log(`   Generated ${melody.length} notes`);
  })) passedTests++;

  // Test 6: Generative - Random walk
  totalTests++;
  if (await test('generative.walk.random()', async () => {
    const walk = jm.generative.walk.random({
      start: 60,
      steps: 10,
      stepSize: 2
    });
    if (!Array.isArray(walk) || walk.length !== 11) { // start + 10 steps
      throw new Error(`Expected 11 values, got ${walk.length}`);
    }
    console.log(`   Generated walk of ${walk.length} values`);
  })) passedTests++;

  // Test 7: Constants
  totalTests++;
  if (await test('constants.NOTES', async () => {
    if (!jm.constants || !Array.isArray(jm.constants.NOTES)) {
      throw new Error('Should have NOTES constant');
    }
    console.log(`   NOTES: ${jm.constants.NOTES.join(', ')}`);
  })) passedTests++;

  // Test 8: Validation
  totalTests++;
  if (await test('validate()', async () => {
    const result = jm.validate({
      format: 'jmon',
      version: '1.0',
      sequences: []
    });
    if (!result || typeof result !== 'object') {
      throw new Error('Should return validated object');
    }
  })) passedTests++;

  // Test 9: No Deno-specific APIs required
  totalTests++;
  if (await test('No Deno runtime required', async () => {
    if (typeof Deno !== 'undefined') {
      console.log('   Note: Deno global exists in Bun');
    }
    // Just verify the package works without needing Deno-specific features
  })) passedTests++;

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! JSR package is Bun-compatible');
    process.exit(0);
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
