import { COLS, DAS, GRAVITY_START_DELAY, LOCK_DELAY, ROWS } from './constants';
import { PRNG } from './rng';
import { calculateScore, isValidPosition, rotateMatrix } from './rules';
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

    // --- Gravity ---
    if (this.currentPiece) {
        this.gravityCounter++;
        // TODO: Replace with dynamic gravity based on level
        const currentGravity = GRAVITY_START_DELAY; 

        if (this.gravityCounter >= currentGravity) {
            this.gravityCounter = 0;
            
            const newY = this.currentPiece.y + 1;
            if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x, newY, this.board)) {
                this.currentPiece.y = newY;
            } else {
                // Piece has landed, handle locking
                this.lockPiece();
            }
        }
    }
    
    // ... game logic will go here ...

    return this.createSnapshot();
  }

  /**
   * Locks the current piece to the board and spawns a new one.
   */
  private lockPiece(): void {
    if (!this.currentPiece) return;

    // Add piece to board
    for (let r = 0; r < this.currentPiece.matrix.length; r++) {
        for (let c = 0; c < this.currentPiece.matrix[r].length; c++) {
            if (this.currentPiece.matrix[r][c]) {
                const boardX = this.currentPiece.x + c;
                const boardY = this.currentPiece.y + r;
                this.board[boardY * COLS + boardX] = PIECE_TYPES.indexOf(this.currentPiece.type) + 1;
            }
        }
    }

    // --- Line Clearing & Scoring ---
    let linesCleared = 0;
    const clearedRows: number[] = [];
    for (let r = ROWS - 1; r >= 0; r--) {
        const isLineFull = ![...this.board.slice(r * COLS, (r + 1) * COLS)].includes(0);
        if (isLineFull) {
            linesCleared++;
            clearedRows.push(r);
            // Shift all rows above down
            for (let y = r; y > 0; y--) {
                for (let x = 0; x < COLS; x++) {
                    this.board[y * COLS + x] = this.board[(y - 1) * COLS + x];
                }
            }
            // Clear the top row
            for (let x = 0; x < COLS; x++) {
                this.board[x] = 0;
            }
            // Since we shifted down, we need to check the same row again
            r++; 
        }
    }

    if (linesCleared > 0) {
        this.combo++;
        // TODO: T-Spin detection
        const isTSpin = false; 
        const isBackToBack = this.backToBack > 0 && (linesCleared === 4 || isTSpin);
        
        const scoreGained = calculateScore(linesCleared, this.level, isTSpin, isBackToBack);
        this.score += scoreGained;
        this.lines += linesCleared;
        this.level = Math.floor(this.lines / 10) + 1;

        this.events.push({ type: 'lineClear', tick: this.tickCounter, data: { rows: clearedRows, count: linesCleared } });
        this.events.push({ type: 'scoreUpdate', tick: this.tickCounter, data: { score: this.score, lines: this.lines, level: this.level } });

        if (linesCleared === 4 || isTSpin) {
            this.backToBack++;
        } else {
            this.backToBack = 0;
        }
    } else {
        this.combo = 0;
    }

    // Reset for next piece
    this.currentPiece = null;
    this.lockCounter = 0;
    this.spawnPiece();
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
    const bagUint8 = new Uint8Array(this.bag.length);
    for (let i = 0; i < this.bag.length; i++) {
        bagUint8[i] = PIECE_TYPES.indexOf(this.bag[i]) + 1;
    }

    return {
        protocolVersion: 1,
        engineVersion: "0.1.0",
        snapshotSchemaVersion: 1,
        snapshotId: this.tickCounter,
        tick: this.tickCounter,
        authoritativeTimeMs: this.tickCounter * (1000 / 60), // Assuming 60 TPS for now
        
        prngState: new Uint32Array([this.prng.getState()]),
        bagState: { bag: bagUint8, index: 0 }, // Index is 0 as we shift from the bag

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
