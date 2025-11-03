import { COLS, DAS, GRAVITY_START_DELAY, LOCK_DELAY, ROWS, CURRENT_ENGINE_VERSION, PROTOCOL_VERSION, SNAPSHOT_SCHEMA_VERSION, ARR } from './constants';
import { PRNG } from './rng';
import { calculateScore, isValidPosition, rotateMatrix } from './rules';
import { GameEvent, Snapshot, GameStatus, PieceType } from './types';
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

const LINE_CLEAR_DELAY_TICKS = 28; // Approx 450ms at 60fps

export class TetrisEngine {
  // --- Core State ---
  private prng: PRNG;
  private board: Uint8Array;
  private tickCounter: number;
  private status: GameStatus;

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
  private lineClearDelay: number;
  
  // --- Gameplay State ---
  private score: number;
  private level: number;
  private lines: number;
  private backToBack: number;
  private combo: number;
  private clearedLines: number[];
  
  // --- Ephemeral State ---
  private events: GameEvent[];
  private isLineClearAnimationEnabled: boolean;

  constructor(seed: number, isLineClearAnimationEnabled: boolean = true) {
    this.prng = new PRNG(seed);
    this.board = new Uint8Array(ROWS * COLS).fill(0);
    this.tickCounter = 0;
    this.status = GameStatus.Playing;
    this.isLineClearAnimationEnabled = isLineClearAnimationEnabled;
    
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
    this.lineClearDelay = 0;

    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.backToBack = 0;
    this.combo = 0;
    this.clearedLines = [];

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
    engine.status = snapshot.status;
    engine.clearedLines = snapshot.clearedLines || [];
    
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
    if (this.status === GameStatus.GameOver) {
        return this.createSnapshot();
    }
    this.tickCounter++;

    if (this.status === GameStatus.LineClearAnimation) {
        this.lineClearDelay--;
        if (this.lineClearDelay <= 0) {
            this.finalizeLineClear();
        }
        return this.createSnapshot();
    }

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
    
    return this.createSnapshot();
  }

  /**
   * Processes a user input action.
   * @param action The input action to process (e.g., 'moveLeft', 'rotateCW').
   */
  public handleInput(action: string): void {
    if (!this.currentPiece || this.status !== GameStatus.Playing) return;

    let { x, y, matrix } = this.currentPiece;
    const originalX = x;
    const originalY = y;

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
            let distance = 0;
            while (isValidPosition(matrix, x, y + 1, this.board)) {
                y++;
                distance++;
            }
            this.events.push({ type: 'hardDrop', tick: this.tickCounter, data: { type: this.currentPiece.type, distance } });
            this.currentPiece.y = y;
            this.lockPiece();
            return;
        case 'rotateCW':
            matrix = rotateMatrix(matrix, 1);
            if (isValidPosition(matrix, x, y, this.board)) {
                this.currentPiece.matrix = matrix;
                this.events.push({ type: 'pieceMoveRight', tick: this.tickCounter, data: { type: this.currentPiece.type, x: this.currentPiece.x, y: this.currentPiece.y } });
            }
            break;
        case 'rotateCCW':
            matrix = rotateMatrix(matrix, -1);
            if (isValidPosition(matrix, x, y, this.board)) {
                this.currentPiece.matrix = matrix;
                this.events.push({ type: 'pieceMoveLeft', tick: this.tickCounter, data: { type: this.currentPiece.type, x: this.currentPiece.x, y: this.currentPiece.y } });
            }
            break;
        case 'hold':
            break;
    }

    if (isValidPosition(matrix, x, y, this.board)) {
        if (x < originalX) {
            this.events.push({ type: 'pieceMoveLeft', tick: this.tickCounter, data: { type: this.currentPiece.type, x, y } });
        } else if (x > originalX) {
            this.events.push({ type: 'pieceMoveRight', tick: this.tickCounter, data: { type: this.currentPiece.type, x, y } });
        }
        if (y > originalY) {
            this.events.push({ type: 'softDropTick', tick: this.tickCounter, data: { type: this.currentPiece.type, x, y } });
        }
        this.currentPiece.x = x;
        this.currentPiece.y = y;
        this.currentPiece.matrix = matrix;
    }
  }

  private updateMovement(): void {
    if (!this.currentPiece) return;

    if (this.isMoving.left) {
        this.dasCounter.left++;
        if (this.dasCounter.left > this.das) {
            if ((this.dasCounter.left - this.das) % this.arr === 0) {
                if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x - 1, this.currentPiece.y, this.board)) {
                    this.currentPiece.x--;
                    this.events.push({ type: 'pieceMoveLeft', tick: this.tickCounter, data: { type: this.currentPiece.type, x: this.currentPiece.x, y: this.currentPiece.y } });
                }
            }
        }
    }

    if (this.isMoving.right) {
        this.dasCounter.right++;
        if (this.dasCounter.right > this.das) {
            if ((this.dasCounter.right - this.das) % this.arr === 0) {
                if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x + 1, this.currentPiece.y, this.board)) {
                    this.currentPiece.x++;
                    this.events.push({ type: 'pieceMoveRight', tick: this.tickCounter, data: { type: this.currentPiece.type, x: this.currentPiece.x, y: this.currentPiece.y } });
                }
            }
        }
    }

    if (this.isMoving.down) {
        this.dasCounter.down++;
        if (this.dasCounter.down > this.das) {
            if ((this.dasCounter.down - this.das) % this.arr === 0) {
                if (isValidPosition(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1, this.board)) {
                    this.currentPiece.y++;
                    this.events.push({ type: 'softDropTick', tick: this.tickCounter, data: { type: this.currentPiece.type, x: this.currentPiece.x, y: this.currentPiece.y } });
                }
            }
        }
    }
  }

  private lockPiece(): void {
    if (!this.currentPiece) return;

    for (let r = 0; r < this.currentPiece.matrix.length; r++) {
        for (let c = 0; c < this.currentPiece.matrix[r].length; c++) {
            if (this.currentPiece.matrix[r][c]) {
                const boardX = this.currentPiece.x + c;
                const boardY = this.currentPiece.y + r;
                if (boardY < 0) {
                    this.status = GameStatus.GameOver;
                    this.events.push({ type: 'gameOver', tick: this.tickCounter });
                    this.currentPiece = null;
                    return;
                }
                this.board[boardY * COLS + boardX] = PIECE_TYPES.indexOf(this.currentPiece.type) + 1;
            }
        }
    }

    this.events.push({ type: 'pieceLock', tick: this.tickCounter, data: { type: this.currentPiece.type } });

    const clearedRows = this.findClearedLines();
    if (clearedRows.length > 0) {
        this.clearedLines = clearedRows;
        this.status = GameStatus.LineClearAnimation;
        this.lineClearDelay = LINE_CLEAR_DELAY_TICKS;
        
        // The actual line removal is now handled after the delay in the tick() function.
        // We just set the state here and the renderer will animate it.
        this.currentPiece = null; // Clear current piece to prevent it from being drawn during animation

    } else {
        this.combo = 0;
        this.currentPiece = null;
        this.lockCounter = 0;
        this.spawnPiece();
    }
  }

  private findClearedLines(): number[] {
    const clearedRows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
        const isLineFull = ![...this.board.slice(r * COLS, (r + 1) * COLS)].includes(0);
        if (isLineFull) {
            clearedRows.push(r);
        }
    }
    return clearedRows;
  }

  private finalizeLineClear(): void {
    const linesCleared = this.clearedLines.length;
    if (linesCleared === 0) return;

    const isTSpin = false;
    const isBackToBack = this.backToBack > 0 && (linesCleared === 4 || isTSpin);
    
    const scoreGained = calculateScore(linesCleared, this.level, isTSpin, isBackToBack);
    this.score += scoreGained;
    this.lines += linesCleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.combo++;

    this.events.push({ type: 'lineClear', tick: this.tickCounter, data: { rows: this.clearedLines, count: linesCleared } });
    this.events.push({ type: 'scoreUpdate', tick: this.tickCounter, data: { score: this.score, lines: this.lines, level: this.level } });

    if (linesCleared === 4 || isTSpin) {
        this.backToBack++;
    } else {
        this.backToBack = 0;
    }

    const newBoard = new Uint8Array(ROWS * COLS).fill(0);
    let newRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (!this.clearedLines.includes(r)) {
            for (let c = 0; c < COLS; c++) {
                newBoard[newRow * COLS + c] = this.board[r * COLS + c];
            }
            newRow--;
        }
    }
    this.board = newBoard;

    this.clearedLines = [];
    this.status = GameStatus.Playing;
    this.currentPiece = null;
    this.lockCounter = 0;
    this.spawnPiece();
  }

  private fillBag(): void {
    const pieces = [...PIECE_TYPES];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(this.prng.nextFloat() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag.push(...pieces);
    this.updateNextTypes();
  }

  private updateNextTypes(): void {
    for (let i = 0; i < this.nextTypes.length; i++) {
        this.nextTypes[i] = PIECE_TYPES.indexOf(this.bag[i]) + 1;
    }
  }

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
        this.status = GameStatus.GameOver;
        this.events.push({ type: 'gameOver', tick: this.tickCounter });
        this.currentPiece = null;
    }
  }

  private calculateGhostPosition(): number {
    if (!this.currentPiece) {
        return -1;
    }
    let ghostY = this.currentPiece.y;
    while (isValidPosition(this.currentPiece.matrix, this.currentPiece.x, ghostY + 1, this.board)) {
        ghostY++;
    }
    return ghostY;
  }

  private createSnapshot(): Snapshot {
    const bagUint8 = new Uint8Array(this.bag.length);
    for (let i = 0; i < this.bag.length; i++) {
        bagUint8[i] = PIECE_TYPES.indexOf(this.bag[i]) + 1;
    }

    const eventsForSnapshot = [...this.events];
    this.events = [];

    const sharedBoardBuffer = new SharedArrayBuffer(this.board.buffer.byteLength);
    new Uint8Array(sharedBoardBuffer).set(new Uint8Array(this.board.buffer));

    const snapshotData: Omit<Snapshot, 'checksum'> = {
        protocolVersion: PROTOCOL_VERSION,
        engineVersion: CURRENT_ENGINE_VERSION,
        snapshotSchemaVersion: SNAPSHOT_SCHEMA_VERSION,
        snapshotId: this.tickCounter,
        tick: this.tickCounter,
        authoritativeTimeMs: this.tickCounter * (1000 / 60),
        
        prngState: new Uint32Array([this.prng.getState()]),
        bagState: { bag: bagUint8, index: 0 },

        inputQueueCursor: 0,
        lockCounter: this.lockCounter,
        gravityCounter: this.gravityCounter,

        backToBack: this.backToBack,
        combo: this.combo,

        rows: ROWS,
        cols: COLS,
        boardBuffer: sharedBoardBuffer,
        
        current: this.currentPiece ? {
            ...this.currentPiece,
            type: this.currentPiece.type as PieceType,
            matrix: new Uint8Array(this.currentPiece.matrix.flat()),
            ghostY: this.calculateGhostPosition(),
        } : null,
        
        nextTypes: this.nextTypes,
        holdType: this.holdType,

        score: this.score,
        level: this.level,
        lines: this.lines,
        gameOver: this.status === GameStatus.GameOver,
        status: this.status,
        clearedLines: this.clearedLines,
        lineClearDelay: this.lineClearDelay,

        events: eventsForSnapshot,
    };

    const checksum = calculateChecksum(snapshotData);
    
    return {
        ...snapshotData,
        checksum,
    };
  }
}
