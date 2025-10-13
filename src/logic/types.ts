// src/logic/types.ts

/**
 * Represents a single, atomic event that occurred within the game engine
 * at a specific tick.
 */
export type GameEvent = {
  type: 'lineClear' | 'tSpin' | 'backToBack' | 'combo' | 'spawn' | 'lock' | 'hold' | 'gameOver' | 'scoreUpdate';
  tick: number;
  data?: any;
};

/**
 * Represents a user input action to be processed by the engine.
 */
export type GameInput = {
    tick: number;
    action: 'moveLeft' | 'moveRight' | 'softDrop' | 'hardDrop' | 'rotateCW' | 'rotateCCW' | 'hold';
    source?: 'keyboard' | 'touch' | 'replay';
};

/**
 * A complete, self-contained snapshot of the entire game state at a
 * specific moment in time. Designed for replay, recovery, and rendering.
 */
export type Snapshot = {
  // --- Metadata ---
  protocolVersion: number;
  engineVersion: string;
  snapshotSchemaVersion: number;
  snapshotId: number;
  tick: number;
  authoritativeTimeMs: number;

  // --- Deterministic State ---
  prngState: Uint32Array;
  bagState: { bag: Uint8Array; index: number };
  inputQueueCursor: number;

  // --- Game State ---
  lockCounter: number;
  gravityCounter: number;
  backToBack: number;
  combo: number;
  rows: number;
  cols: number;
  boardBuffer: ArrayBuffer;
  current: {
    type: string;
    matrix: Uint8Array;
    x: number;
    y: number;
    rotation: number;
    color: number;
  } | null;
  nextTypes: Uint8Array;
  holdType: number;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;

  // --- Ephemeral State ---
  events: GameEvent[];
  checksum: number;
};

