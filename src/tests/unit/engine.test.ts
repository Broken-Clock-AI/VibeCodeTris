// src/tests/unit/engine.test.ts
import { TetrisEngine } from '../../logic/engine';
import { COLS, ROWS } from '../../logic/constants';

describe('TetrisEngine: Line Clearing and Scoring', () => {
  let engine: TetrisEngine;

  beforeEach(() => {
    // Use a fixed seed for deterministic tests
    engine = new TetrisEngine(12345);
  });

  test('should clear a single line and update score', () => {
    // Manually set up the board to have a nearly complete line
    const board = new Uint8Array(ROWS * COLS).fill(0);
    for (let i = 0; i < COLS - 1; i++) {
      board[(ROWS - 1) * COLS + i] = 1; // Fill all but one cell in the last row
    }
    
    // @ts-ignore - Accessing private board for test setup
    engine.board = board;

    // Manually create a piece that will complete the line
    const piece = {
      type: 'I',
      matrix: [[1]],
      x: COLS - 1,
      y: ROWS - 1,
      rotation: 0,
      color: 0,
    };

    // @ts-ignore - Accessing private currentPiece for test setup
    engine.currentPiece = piece;

    // @ts-ignore - Accessing private lockPiece method for test
    engine.lockPiece();

    // We need to tick the engine forward enough times to get past the line clear delay
    // @ts-ignore - Accessing private lineClearDelay for test
    const delay = engine.lineClearDelay;
    for (let i = 0; i < delay; i++) {
      engine.tick();
    }

    // The final tick will execute finalizeLineClear and create the snapshot we need
    const snapshot = engine.tick();

    // --- Assertions ---
    // 1. The line should be cleared (top row should be all zeros)
    const boardView = new Uint8Array(snapshot.boardBuffer);
    const topRow = boardView.slice(0, COLS);
    expect(topRow.every(cell => cell === 0)).toBe(true);

    // 2. The score should be updated for a single line clear at level 1
    // Base score for 1 line is 100, level is 1.
    expect(snapshot.score).toBe(100);

    // 3. The line count should be 1
    expect(snapshot.lines).toBe(1);
  });
});

describe('TetrisEngine: Game Over', () => {
    let engine: TetrisEngine;
  
    beforeEach(() => {
      engine = new TetrisEngine(54321);
    });
  
    test('should set gameOver to true when a new piece cannot be spawned', () => {
      // Manually set up the board so the spawn area is blocked
      const board = new Uint8Array(ROWS * COLS).fill(0);
      // Block the middle of the top row where pieces spawn
      board[Math.floor(COLS / 2)] = 1; 
      board[Math.floor(COLS / 2) - 1] = 1;
      board[Math.floor(COLS / 2) + 1] = 1;
  
      // @ts-ignore - Accessing private board for test setup
      engine.board = board;
  
      // The next tick will attempt to spawn a piece, which should fail
      const snapshot = engine.tick();
  
      // --- Assertions ---
      // 1. The gameOver flag should be true in the snapshot
      expect(snapshot.gameOver).toBe(true);
  
      // 2. A 'gameOver' event should have been dispatched
      const gameOverEvent = snapshot.events.find(e => e.type === 'gameOver');
      expect(gameOverEvent).toBeDefined();
  
      // 3. The tick counter should not advance further
      const nextSnapshot = engine.tick();
      expect(nextSnapshot.tick).toBe(snapshot.tick);
    });
  });
  
