import { PRNG } from '../../logic/rng';
import * as assert from 'assert';

function testPRNGDeterminism() {
  const seed = 12345;
  const prng1 = new PRNG(seed);
  const prng2 = new PRNG(seed);

  // Generate a sequence of numbers from both PRNGs
  const sequence1 = Array.from({ length: 10 }, () => prng1.nextInt());
  const sequence2 = Array.from({ length: 10 }, () => prng2.nextInt());

  // The sequences should be identical
  assert.deepStrictEqual(sequence1, sequence2, 'PRNGs with the same seed should produce the same sequence of numbers.');
  console.log('testPRNGDeterminism passed.');
}

function testPRNGStateSerialization() {
    const seed = 54321;
    const prng1 = new PRNG(seed);
    
    // Advance prng1 a few times
    prng1.nextInt();
    prng1.nextInt();
    
    // Create prng2 with the same initial seed
    const prng2 = new PRNG(seed);
    
    // Get the state from prng1 and set it on prng2
    const state = prng1.getState();
    prng2.setState(state);

    // Now, both PRNGs should produce the exact same next number
    const next1 = prng1.nextInt();
    const next2 = prng2.nextInt();

    assert.strictEqual(next1, next2, 'PRNG state serialization and deserialization should result in identical sequences.');
    console.log('testPRNGStateSerialization passed.');
}


// Run all tests
try {
    testPRNGDeterminism();
    testPRNGStateSerialization();
    console.log('All PRNG tests passed!');
} catch (error) {
    console.error('PRNG tests failed:', error);
}
