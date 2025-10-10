import { PRNG } from '../../logic/rng';

describe('PRNG', () => {

  it('should produce a deterministic sequence of numbers from the same seed', () => {
    const seed = 12345;
    const prng1 = new PRNG(seed);
    const prng2 = new PRNG(seed);

    const sequence1 = Array.from({ length: 10 }, () => prng1.nextInt());
    const sequence2 = Array.from({ length: 10 }, () => prng2.nextInt());

    expect(sequence1).toEqual(sequence2);
  });

  it('should produce identical sequences after state serialization and deserialization', () => {
    const seed = 54321;
    const prng1 = new PRNG(seed);
    
    // Advance prng1 a few times
    prng1.nextInt();
    prng1.nextInt();
    
    const prng2 = new PRNG(seed);
    
    // Get state from prng1 and set it on prng2
    const state = prng1.getState();
    prng2.setState(state);

    // Both PRNGs should now produce the exact same next number
    const next1 = prng1.nextInt();
    const next2 = prng2.nextInt();

    expect(next1).toBe(next2);

    // And the rest of the sequence should also be identical
    const sequence1 = Array.from({ length: 10 }, () => prng1.nextInt());
    const sequence2 = Array.from({ length: 10 }, () => prng2.nextInt());
    expect(sequence1).toEqual(sequence2);
  });

});