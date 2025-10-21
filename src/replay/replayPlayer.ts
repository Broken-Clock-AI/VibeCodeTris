// src/replay/replayPlayer.ts

import { TetrisEngine } from '../logic/engine';
import { GameInput, Snapshot } from '../logic/types';
import { ReplayData } from './types';

/**
 * The ReplayPlayer class is responsible for playing back a recorded game session.
 * It uses a deterministic TetrisEngine instance and a list of recorded inputs
 * to recreate the game tick by tick.
 */
export class ReplayPlayer {
  private engine: TetrisEngine;
  private inputs: GameInput[];
  private tickCounter: number;
  private isPlaying: boolean;
  private animationFrameId: number | null = null;

  // Callback to be invoked with a new snapshot on each tick.
  private onSnapshot: ((snapshot: Snapshot) => void) | null = null;

  /**
   * Initializes a new ReplayPlayer instance.
   * @param replayData The replay data object containing the seed and inputs.
   */
  constructor(replayData: ReplayData) {
    this.engine = new TetrisEngine(replayData.initialSeed);
    
    // Clone and sort inputs by tick to ensure correct playback order.
    this.inputs = [...replayData.inputs].sort((a, b) => a.tick - b.tick);
    
    this.tickCounter = 0;
    this.isPlaying = false;
  }

  /**
   * Starts or resumes playback of the replay.
   */
  public play(): void {
    if (this.isPlaying) {
      return;
    }
    this.isPlaying = true;
    this.gameLoop();
  }

  /**
   * Pauses playback of the replay.
   */
  public pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Subscribes a listener function to receive game snapshots on each tick.
   * @param callback The function to call with the latest snapshot.
   */
  public subscribe(callback: (snapshot: Snapshot) => void): void {
    this.onSnapshot = callback;
  }

  /**
   * The main loop that drives the replay playback.
   */
  private gameLoop = (): void => {
    if (!this.isPlaying) {
      return;
    }

    this.tick();

    // Request the next frame to continue the loop.
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * Advances the replay by a single tick.
   */
  private tick(): void {
    // Apply all inputs scheduled for the current tick.
    while (this.inputs.length > 0 && this.inputs[0].tick === this.tickCounter) {
      const input = this.inputs.shift();
      if (input) {
        this.engine.handleInput(input.action);
      }
    }

    this.tickCounter++;
    const snapshot = this.engine.tick();

    if (this.onSnapshot) {
      this.onSnapshot(snapshot);
    }

    // If the game is over, automatically pause the playback.
    if (snapshot.gameOver) {
      this.pause();
    }
  }
}