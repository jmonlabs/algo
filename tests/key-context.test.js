/**
 * Tests for the Key context (jm.key) and Chain.line() convenience.
 *
 * These features collapse the repeated {tonic, mode} boilerplate
 * across harmony classes and remove the [branches]+null-padding shape
 * for single-line random walks.
 */

import { Key, key } from '../src/algorithms/theory/harmony/Key.js';
import { Voice } from '../src/algorithms/theory/harmony/Voice.js';
import { Ornament } from '../src/algorithms/theory/harmony/Ornament.js';
import { Chain } from '../src/algorithms/generative/walks/Chain.js';

let failures = 0;
function check(label, cond) {
    const mark = cond ? '✓' : '✗';
    if (!cond) failures++;
    console.log(`  ${mark} ${label}`);
}

console.log('=== Testing Key Context + Chain.line() ===\n');

// Test 1: key() factory shape
console.log('1. key() factory');
{
    const k = key('C', 'major');
    check('returns Key instance', k instanceof Key);
    check('tonic = C', k.tonic === 'C');
    check('mode = major', k.mode === 'major');

    const k2 = key({ tonic: 'D', mode: 'dorian' });
    check('options-object form: tonic = D', k2.tonic === 'D');
    check('options-object form: mode = dorian', k2.mode === 'dorian');

    const k3 = key({ key: 'F' });
    check("`key` alias for tonic", k3.tonic === 'F');
    check('default mode = major', k3.mode === 'major');
}
console.log('');

// Test 2: k.scale() / k.voice() / k.ornament() / k.progression()
console.log('2. Context-applied constructors');
{
    const k = key('C', 'major');
    const scale = k.scale().generate({ length: 8 });
    check('k.scale().generate() returns 8 notes', scale.length === 8);
    check('first note is C', scale[0] === 60);

    const v = k.voice({ measureLength: 4 });
    check('k.voice() carries tonic', v.tonic === 'C');
    check('k.voice() carries mode', v.mode === 'major');
    check('k.voice() respects per-call options', v.measureLength === 4);

    const orn = k.ornament({ type: 'trill', parameters: { by: 2 } });
    check('k.ornament() builds a scale', !!orn.scale && orn.scale.length > 0);

    const prog = k.progression().generate(['I', 'IV', 'V', 'I']);
    check('k.progression() returns 4 chords', prog.length === 4);
    check('first chord is C major triad', prog[0].join(',') === '60,64,67');
}
console.log('');

// Test 3: per-call override wins
console.log('3. Per-call overrides take precedence');
{
    const k = key('C', 'major');
    const dorianVoice = k.voice({ mode: 'dorian' });
    check('override mode = dorian', dorianVoice.mode === 'dorian');
    check('override keeps tonic = C', dorianVoice.tonic === 'C');
}
console.log('');

// Test 4: k.chord() / k.chords()
console.log('4. Chord helpers');
{
    const k = key('C', 'major');
    const chord = k.chord(60);
    check('k.chord(60) = [60,64,67]', chord.join(',') === '60,64,67');

    const chords = k.chords([60, 62, 64]);
    check('k.chords() returns 3 chords', chords.length === 3);
    check('first chord matches', chords[0].join(',') === '60,64,67');
}
console.log('');

// Test 5: Voice / Ornament accept a Key instance as `key` option
console.log('5. Voice/Ornament accept Key instance via options.key');
{
    const k = key('G', 'minor');

    const v = new Voice({ key: k, output: 'track' });
    check('Voice picks tonic from key', v.tonic === 'G');
    check('Voice picks mode from key', v.mode === 'minor');

    const orn = new Ornament({ key: k, type: 'turn' });
    check('Ornament builds scale from key context', !!orn.scale);
}
console.log('');

// Test 6: backward compat — old API still works
console.log('6. Backward compatibility');
{
    const v = new Voice({ tonic: 'D', mode: 'dorian' });
    check('Voice({tonic,mode}) still works', v.tonic === 'D' && v.mode === 'dorian');

    const vKey = new Voice({ key: 'F', mode: 'major' });
    check("Voice({key:'F', mode}) string-alias still works", vKey.tonic === 'F');

    const orn = new Ornament({ type: 'trill', tonic: 'C', mode: 'major', parameters: { by: 1 } });
    check('Ornament({type, tonic, mode}) still builds scale', !!orn.scale);

    const ornNoKey = new Ornament({ type: 'trill', parameters: { by: 1 } });
    check('Ornament with no tonic/mode has scale=null', ornNoKey.scale === null);
}
console.log('');

// Test 7: Chain.line() returns flat array, no nulls, no nesting
console.log('7. Chain.line() convenience');
{
    const chain = new Chain({
        walkRange: [0, 7],
        walkStart: 3,
        walkProbability: [-1, 0, 1],
        roundTo: 0
    });
    const walk = chain.line(16, 42);
    check('returns an Array', Array.isArray(walk));
    check('length matches request', walk.length === 16);
    check('no null values', !walk.includes(null));
    check('no nested arrays', walk.every(v => typeof v === 'number'));
    check('respects walkStart', walk[0] === 3);
    check('values within walkRange', walk.every(v => v >= 0 && v <= 7));
}
console.log('');

// Test 8: line() restores configured branching/merging
console.log('8. line() preserves instance state');
{
    const chain = new Chain({
        walkRange: [-5, 5],
        walkStart: 0,
        branchingProbability: 0.5,
        mergingProbability: 0.3
    });
    chain.line(10, 1);
    check('branchingProbability restored', chain.branchingProbability === 0.5);
    check('mergingProbability restored', chain.mergingProbability === 0.3);
}
console.log('');

// Test 9: line() is deterministic with seed
console.log('9. line() is reproducible');
{
    const opts = { walkRange: [0, 10], walkStart: 5, walkProbability: [-1, 0, 1], roundTo: 0 };
    const a = new Chain(opts).line(20, 99);
    const b = new Chain(opts).line(20, 99);
    check('same seed → same walk', a.join(',') === b.join(','));
}
console.log('');

console.log(`=== Key Context Tests ${failures ? 'FAILED' : 'Complete'} (${failures} failures) ===`);

if (failures > 0) {
    process.exitCode = 1;
}
