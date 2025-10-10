import { COLS, DAS, GRAVITY_START_DELAY, LOCK_DELAY, ROWS } from './constants';
import { PRNG } from './rng';
import { isValidPosition, rotateMatrix } from './rules';
import { GameEvent, Snapshot } from './types';

// --- Piece Definitions ---
const PIECE_TYPES = 'IJLOSTZ';
const PIECE_SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
};
const PIECE_COLORS = {
    I: 0x00FFFF, // Cyan
    J: 0x0000FF, // Blue
    L: 0xFFA500, // Orange
    O: 0xFFFF00, // Yellow
    S: 0x00FF00, // Green
    T: 0x800080, // Purple
    Z: 0xFF0000, // Red
};


export class TetrisEngine {
  // --- Core State ---
  private prng: PRNG;
  private board: Uint8Array;
  private tickCounter: number;

  // --- Piece and Bag State ---
  private bag: string[];
  private currentPiece: { type: string; matrix: number[][]; x: number; y: number; rotation: number; color: number; } | null;
  private holdType: number;
  private nextTypes: Uint8Array;

  // --- Timing and Input State ---
  private lockCounter: number;
  private gravityCounter: number;
  
  // --- Gameplay State ---
  private score: number;
  private level: number;
  private lines: number;
  private backToBack: number;
  private combo: number;
  
  // --- Ephemeral State ---
  private events: GameEvent[];

  constructor(seed: number) {
    this.prng = new PRNG(seed);
    this.board = new Uint8Array(ROWS * COLS).fill(0);
    this.tickCounter = 0;
    
    this.bag = [];
    this.nextTypes = new Uint8Array(6); // Show 6 next pieces
    this.fillBag(); // Initial fill
    this.fillBag(); // Fill again to populate `nextTypes`
    
    this.currentPiece = null;
    this.holdType = 0;

    this.lockCounter = 0;
    this.gravityCounter = 0;

    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.backToBack = 0;
    this.combo = 0;

    this.events = [];
  }

  /**
   * The main deterministic game loop.
   */
  public tick(input?: any): Snapshot {
    this.tickCounter++;
    this.events = []; // Clear events for the new tick

    if (!this.currentPiece) {
        this.spawnPiece();
    }
    
    // ... game logic will go here ...

    return this.createSnapshot();
  }

  /**
   * Fills the piece bag with a new shuffled set of 7 pieces.
   */
  private fillBag(): void {
    const pieces = [...PIECE_TYPES];
    // Fisher-Yates shuffle
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.prng.nextFloat() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
    this.updateNextTypes();
  }

  /**
   * Updates the public-facing `nextTypes` array.
   */
  private updateNextTypes(): void {
    for (let i = 0; i < this.nextTypes.length; i++) {
        this.nextTypes[i] = PIECE_TYPES.indexOf(this.bag[i]) + 1;
    }
  }

  /**
   * Spawns a new piece from the bag.
   */
  private spawnPiece(): void {
    if (this.bag.length <= 7) {
        this.fillBag();
    }
    const type = this.bag.shift()!;
    this.updateNextTypes();

    const matrix = PIECE_SHAPES[type as keyof typeof PIECE_SHAPES];
    const color = PIECE_COLORS[type as keyof typeof PIECE_COLORS];
    
    this.currentPiece = {
        type,
        matrix,
        x: Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2),
        y: 0,
        rotation: 0,
        color,
    };

    // TODO: Handle game over if spawn position is invalid
  }

  /**
   * Creates a snapshot of the current game state.
   */
  private createSnapshot(): Snapshot {
    // TODO: This needs a proper implementation for PRNG state, checksum, etc.
    return {
        protocolVersion: 1,
        engineVersion: "0.1.0",
        snapshotSchemaVersion: 1,
        snapshotId: this.tickCounter,
        tick: this.tickCounter,
        authoritativeTimeMs: this.tickCounter * (1000 / 60), // Assuming 60 TPS for now
        
        prngState: new Uint32Array(), // Placeholder
        bagState: { bag: new Uint8Array(), index: 0 }, // Placeholder

        inputQueueCursor: 0, // Placeholder
        lockCounter: this.lockCounter,
        gravityCounter: this.gravityCounter,

        backToBack: this.backToBack,
        combo: this.combo,

        rows: ROWS,
        cols: COLS,
        boardBuffer: this.board.buffer,
        
        current: this.currentPiece ? {
            ...this.currentPiece,
            matrix: new Uint8Array(this.currentPiece.matrix.flat()),
        } : null,
        
        nextTypes: this.nextTypes,
        holdType: this.holdType,

        score: this.score,
        level: this.level,
        lines: this.lines,

        events: this.events,
        checksum: 0, // Placeholder
    };
  }
}
