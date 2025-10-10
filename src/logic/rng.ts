/**
 * A simple, seedable pseudo-random number generator (PRNG).
 * This uses the Mulberry32 algorithm, which is fast, simple, and produces high-quality 32-bit integers.
 * Its state is a single 32-bit integer, making it easy to serialize and deserialize for replays.
 */
export class PRNG {
  private state: number;

  /**
   * Creates a new PRNG instance.
   * @param seed The initial seed value.
   */
  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns the next pseudo-random 32-bit integer in the sequence.
   * This is the core of the Mulberry32 algorithm.
   */
  public nextInt(): number {
    let z = (this.state += 0x6d2b79f5);
    z = (z ^ (z >>> 15)) * (z | 1);
    z ^= z + (z ^ (z >>> 7)) * (z | 61);
    return (z ^ (z >>> 14)) >>> 0;
  }

  /**
   * Returns the next pseudo-random floating-point number between 0 (inclusive) and 1 (exclusive).
   * This is useful for tasks like shuffling.
   */
  public nextFloat(): number {
    return this.nextInt() / 4294967296;
  }

  /**
   * Returns the current state of the generator.
   * This is essential for saving the game state for replays or recovery.
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Sets the current state of the generator.
   * This is essential for restoring the game state for replays or recovery.
   * @param state The state to restore.
   */
  public setState(state: number): void {
    this.state = state;
  }
}
