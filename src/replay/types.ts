// src/replay/types.ts

import { GameInput } from '../logic/types';

/**
 * Defines the structure for a replay file.
 */
export interface ReplayData {
  // The initial seed used to start the game engine.
  initialSeed: number;

  // A chronological list of all inputs recorded during the game.
  inputs: GameInput[];

  // Optional metadata
  timestamp?: number;
  engineVersion?: string;
}
