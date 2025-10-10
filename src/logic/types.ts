// --- Core Data Structures ---

/**
 * Represents a complete, authoritative snapshot of the game state at a specific tick.
 * This object is designed to be compact and easily serializable for communication
 * between the worker and the main thread, and for saving replays.
 */
export type Snapshot = {
  // --- Metadata ---
  protocolVersion: number;
  engineVersion: string;
  snapshotSchemaVersion: number;
  snapshotId: number;           // Monotonically increasing ID for each snapshot
  tick: number;                 // The authoritative game tick
  authoritativeTimeMs: number;  // The calculated time (tick / TPS)
  
  // --- Deterministic State ---
  prngState: Uint32Array;       // The state of the deterministic PRNG
  bagState: { bag: Uint8Array, index: number }; // The state of the 7-bag piece generator
  
  // --- Input and Timing State ---
  inputQueueCursor: number;     // Cursor for processing the input queue
  lockCounter: number;          // Ticks remaining before a piece locks
  gravityCounter: number;       // Ticks remaining before gravity applies
  
  // --- Gameplay State ---
  backToBack: number;           // Back-to-back bonus counter
  combo: number;                // Combo counter
  
  // --- Board and Piece State ---
  rows: number;
  cols: number;
  boardBuffer: ArrayBuffer;     // The main game board (transferable)
  current: {
    type: string;
    matrix: Uint8Array;
    x: number;
    y: number;
    rotation: number;
    color: number;
  } | null;
  nextTypes: Uint8Array;        // The upcoming pieces in the queue
  holdType: number;             // The piece type in the hold slot (0 for none)
  
  // --- Scoring State ---
  score: number;
  level: number;
  lines: number;
  
  // --- Ephemeral Data ---
  events: GameEvent[];          // A list of events that occurred on this tick
  
  // --- Integrity ---
  checksum: number;             // A checksum (e.g., xxhash32) to verify integrity
};

/**
 * Represents a discrete event that occurred during a game tick.
 * Used by the renderer to trigger animations, sounds, and other effects.
 */
export type GameEvent = {
  type: 'spawn' | 'lock' | 'lineClear' | 'tSpin' | 'backToBack' | 'combo' | 'hold' | 'gameOver' | 'particleEmit' | 'scoreUpdate';
  tick: number;
  data?: any; // Optional payload with event-specific data (e.g., { rows: [18, 19], clearType: 'double' })
};
