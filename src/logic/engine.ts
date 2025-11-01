import { COLS, DAS, GRAVITY_START_DELAY, LOCK_DELAY, ROWS, CURRENT_ENGINE_VERSION, PROTOCOL_VERSION, SNAPSHOT_SCHEMA_VERSION, ARR } from './constants';
import { PRNG } from './rng';
import { calculateScore, isValidPosition, rotateMatrix } from './rules';
import { GameEvent, Snapshot } from './types';
import { calculateChecksum } from './recover';

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


export class TetrisEngine {
  // --- Core State ---
  private prng: PRNG;
  private board: Uint8Array;
  private tickCounter: number;

  // --- Piece and Bag State ---
  private bag: string[];
  private currentPiece: { type: string; matrix: number[][]; x: number; y: number; rotation: number; colorIndex: number; } | null;
  private holdType: number;
  private nextTypes: Uint8Array;

  // --- Timing and Input State ---
  private lockCounter: number;
  private gravityCounter: number;
  private das: number;
  private arr: number;
  private dasCounter: { left: number; right: number; down: number };
  private isMoving: { left: boolean; right: boolean; down: boolean };
  
  // --- Gameplay State ---
  private score: number;
  private level: number;
  private lines: number;
  private backToBack: number;
  private combo: number;
  private gameOver: boolean;
  
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
    this.das = DAS;
    this.arr = ARR;
    this.dasCounter = { left: 0, right: 0, down: 0 };
    this.isMoving = { left: false, right: false, down: false };

    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.backToBack = 0;
    this.combo = 0;
    this.gameOver = false;

    this.events = [];
  }

  /**
   * Creates a new TetrisEngine instance from a snapshot.
   * @param snapshot The snapshot to restore from.
   * @returns A new TetrisEngine instance.
   */
  public static fromSnapshot(snapshot: Snapshot): TetrisEngine {
    // Note: We pass a dummy seed to the constructor because we're about to overwrite everything.
    const engine = new TetrisEngine(1);

    engine.tickCounter = snapshot.tick;
    engine.prng = new PRNG(snapshot.prngState[0]);
    
    engine.board = new Uint8Array(snapshot.boardBuffer);
    
    engine.bag = Array.from(snapshot.bagState.bag).map(typeId => PIECE_TYPES[typeId - 1]);
    engine.nextTypes = snapshot.nextTypes;
    engine.holdType = snapshot.holdType;

    if (snapshot.current) {
        const shape = PIECE_SHAPES[snapshot.current.type as keyof typeof PIECE_SHAPES];
        const matrix = [];
        for (let i = 0; i < shape.length; i++) {
            matrix.push(Array.from(snapshot.current.matrix.slice(i * shape[0].length, (i + 1) * shape[0].length)));
        }
        engine.currentPiece = {
            ...snapshot.current,
            matrix: matrix,
        };
    } else {
        engine.currentPiece = null;
    }

    engine.lockCounter = snapshot.lockCounter;
    engine.gravityCounter = snapshot.gravityCounter;
    engine.score = snapshot.score;
    engine.level = snapshot.level;
    engine.lines = snapshot.lines;
    engine.backToBack = snapshot.backToBack;
    engine.combo = snapshot.combo;
    
    engine.events = []; // Events are ephemeral and not restored

    return engine;
  }

  /**
   * Updates the engine's timing values.
   * @param das The new Delayed Auto Shift value.
   * @param arr The new Auto Repeat Rate value.
   */
  public setTimings(das: number, arr: number): void {
    this.das = das;
    this.arr = arr;
  }

  /**
   * The main deterministic game loop.
   */
  public tick(): Snapshot {
    if (this.gameOver) {
        return this.createSnapshot();
    }
    this.tickCounter++;

    if (!this.currentPiece) {
        this.spawnPiece();
    }

    // --- Handle continuous movement (DAS/ARR) ---
    this.updateMovement();

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
   * Processes a user input action.
   * @param action The input action to process (e.g., 'moveLeft', 'rotateCW').
   */
  public handleInput(action: string): void {
    if (!this.currentPiece || this.gameOver) return;

    let { x, y, matrix } = this.currentPiece;

    switch (action) {
        case 'moveLeft':
            this.isMoving.left = true;
            this.dasCounter.left = 0;
            x--;
            break;
        case 'moveLeft_release':
            this.isMoving.left = false;
            break;
        case 'moveRight':
            this.isMoving.right = true;
            this.dasCounter.right = 0;
            x++;
            break;
        case 'moveRight_release':
            this.isMoving.right = false;
            break;
        case 'softDrop':
            this.isMoving.down = true;
            this.dasCounter.down = 0;
            y++;
            break;
        case 'softDrop_release':
            this.isMoving.down = false;
            break;
        case 'hardDrop':
            // This will be handled by finding the final position and locking instantly
            while (isValidPosition(matrix, x, y + 1, this.board)) {
                y++;
            }
            this.currentPiece.y = y;
            this.lockPiece();
            return; // Exit early as lockPiece is called
        case 'rotateCW':
            matrix = rotateMatrix(matrix, 1);
            // TODO: Add wall kick logic here
            break;
        case 'rotateCCW':
            matrix = rotateMatrix(matrix, -1);
            // TODO: Add wall kick logic here
            break;
        case 'hold':
            // TODO: Implement hold logic
            break;
    }

    if (isValidPosition(matrix, x, y, this.board)) {
        this.currentPiece.x = x;
        this.currentPiece.y = y;
        this.currentPiece.matrix = matrix;
    }
  }

  /**
   * Handles the continuous movement logic for DAS and ARR.
   */
  private updateMovement(): void {
    if (!this.currentPiece) return;

    // --- Left Movement ---
    if (this.isMoving.left) {
        this.dasCounter.left++;
        if (this.dasCounter.left > this.das) {
            if ((this.dasCounter.left - this.das) % this.arr === 0) {
                if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x - 1, this.currentPiece.y, this.board)) {
                    this.currentPiece.x--;
                }
            }
        }
    }

    // --- Right Movement ---
    if (this.isMoving.right) {
        this.dasCounter.right++;
        if (this.dasCounter.right > this.das) {
            if ((this.dasCounter.right - this.das) % this.arr === 0) {
                if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x + 1, this.currentPiece.y, this.board)) {
                    this.currentPiece.x++;
                }
            }
        }
    }

    // --- Soft Drop Movement ---
    if (this.isMoving.down) {
        this.dasCounter.down++;
        if (this.dasCounter.down > this.das) {
            if ((this.dasCounter.down - this.das) % this.arr === 0) {
                if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1, this.board)) {
                    this.currentPiece.y++;
                }
            }
        }
    }
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
                // Game Over Check: Piece locked above the visible board
                if (boardY < 0) {
                    this.gameOver = true;
                    this.events.push({ type: 'gameOver', tick: this.tickCounter });
                    this.currentPiece = null;
                    return; // End the lock process immediately
                }
                this.board[boardY * COLS + boardX] = PIECE_TYPES.indexOf(this.currentPiece.type) + 1;
            }
        }
    }

    this.events.push({ type: 'pieceLock', tick: this.tickCounter, data: { type: this.currentPiece.type } });

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
    const colorIndex = PIECE_TYPES.indexOf(type) + 1;
    
    this.currentPiece = {
        type,
        matrix,
        x: Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2),
        y: 0,
        rotation: 0,
        colorIndex,
    };

    this.events.push({ type: 'pieceSpawn', tick: this.tickCounter, data: { type } });

    if (!isValidPosition(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y, this.board)) {
        this.gameOver = true;
        this.events.push({ type: 'gameOver', tick: this.tickCounter });
        this.currentPiece = null;
    }
  }

  /**
   * Calculates the final Y position of the current piece if it were dropped.
   * @returns The Y coordinate of the ghost piece's position.
   */
  private calculateGhostPosition(): number {
    if (!this.currentPiece) {
        return -1; // Should not happen if called correctly
    }
    let ghostY = this.currentPiece.y;
    while (isValidPosition(this.currentPiece.matrix, this.currentPiece.x, ghostY + 1, this.board)) {
        ghostY++;
    }
    return ghostY;
  }

  /**
   * Creates a snapshot of the current game state.
   */
  private createSnapshot(): Snapshot {
    const bagUint8 = new Uint8Array(this.bag.length);
    for (let i = 0; i < this.bag.length; i++) {
        bagUint8[i] = PIECE_TYPES.indexOf(this.bag[i]) + 1;
    }

    // Create a single copy of the board buffer to be used for both
    // the checksum and the transferable payload. The engine's internal
    // buffer must NOT be transferred.
    const boardBufferCopy = this.board.buffer.slice(0) as ArrayBuffer;
    
    const eventsForSnapshot = [...this.events];
    this.events = []; // Clear for the next tick

    const snapshotData: Omit<Snapshot, 'checksum'> = {
        protocolVersion: PROTOCOL_VERSION,
        engineVersion: CURRENT_ENGINE_VERSION,
        snapshotSchemaVersion: SNAPSHOT_SCHEMA_VERSION,
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
        boardBuffer: boardBufferCopy,
        
        current: this.currentPiece ? {
            ...this.currentPiece,
            matrix: new Uint8Array(this.currentPiece.matrix.flat()),
            ghostY: this.calculateGhostPosition(),
        } : null,
        
        nextTypes: this.nextTypes,
        holdType: this.holdType,

        score: this.score,
        level: this.level,
        lines: this.lines,
        gameOver: this.gameOver,

        events: eventsForSnapshot,
    };

    const checksum = calculateChecksum(snapshotData);
    
    return {
        ...snapshotData,
        checksum,
    };
  }
}
