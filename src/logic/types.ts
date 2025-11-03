// src/logic/types.ts

/**
 * Represents a single, atomic event that occurred within the game engine
 * at a specific tick.
 */
export type GameEvent = {
  type: 'lineClear' | 'tSpin' | 'backToBack' | 'combo' | 'pieceSpawn' | 'pieceLock' | 'hold' | 'gameOver' | 'scoreUpdate' | 'hardDrop' | 'pieceMoveRight' | 'pieceMoveLeft' | 'softDropTick';
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
export interface GameState {
    boardBuffer: SharedArrayBuffer;
    rows: number;
    cols: number;
    current: Piece | null;
    score: number;
    level: number;
    lines: number;
    gameOver: boolean;
    events: GameEvent[];
    nextPieces: PieceType[];
    heldPiece: PieceType | null;
    canHold: boolean;
    status: GameStatus;
    clearedLines?: number[];
}

export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export interface Piece {
    type: PieceType;
    // The matrix is flattened for the snapshot
    matrix: Uint8Array;
    x: number;
    y: number;
    rotation: number;
    colorIndex: number;
    ghostY: number;
}

export interface Snapshot {
    // Metadata
    protocolVersion: number;
    engineVersion: string;
    snapshotSchemaVersion: number;
    snapshotId: number;
    tick: number;
    authoritativeTimeMs: number;
    checksum: number;

    // Core State
    prngState: Uint32Array;
    bagState: { bag: Uint8Array; index: number };
    boardBuffer: SharedArrayBuffer;
    rows: number;
    cols: number;
    current: Piece | null;
    
    // Gameplay State
    score: number;
    level: number;
    lines: number;
    gameOver: boolean;
    status: GameStatus;
    clearedLines?: number[];
    lineClearDelay?: number;
    
    // Timing and Input
    lockCounter: number;
    gravityCounter: number;
    inputQueueCursor: number;
    
    // Piece State
    nextTypes: Uint8Array;
    holdType: number;
    
    // Scoring State
    backToBack: number;
    combo: number;

    // Ephemeral Data
    events: GameEvent[];
}

export enum GameStatus {
    Playing,
    LineClearAnimation,
    GameOver,
}


