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

    // Lock the piece, which should trigger line clearing and scoring
    // @ts-ignore - Accessing private lockPiece method for test
    engine.lockPiece();

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
