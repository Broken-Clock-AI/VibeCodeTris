import { COLS, ROWS } from './constants';
import { Snapshot } from './types';

// --- SRS (Super Rotation System) Data ---

// Piece shapes for I, J, L, O, S, T, Z
const PIECE_SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
};

// Wall kick data for J, L, S, T, Z pieces
const WALL_KICK_DATA_JLSTZ = [
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 0 -> 1
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],   // 1 -> 0
  [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],   // 1 -> 2
  [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 2 -> 1
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],   // 2 -> 3
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // 3 -> 2
  [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], // 3 -> 0
  [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],   // 0 -> 3
];

// Wall kick data for I piece
const WALL_KICK_DATA_I = [
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],  // 0 -> 1
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],   // 1 -> 0
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],  // 1 -> 2
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],   // 2 -> 1
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],  // 2 -> 3
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],   // 3 -> 2
    [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],   // 3 -> 0
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],  // 0 -> 3
];


// --- Pure Game Logic Functions ---

/**
 * Checks if a piece at a given position is valid (not colliding with walls or other blocks).
 * @param matrix The piece's current rotation matrix.
 * @param x The x-coordinate of the piece.
 * @param y The y-coordinate of the piece.
 * @param board The game board.
 * @returns True if the position is valid, false otherwise.
 */
export function isValidPosition(matrix: number[][], x: number, y: number, board: Uint8Array): boolean {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const boardX = x + col;
        const boardY = y + row;
        if (
          boardX < 0 ||
          boardX >= COLS ||
          boardY >= ROWS ||
          (boardY >= 0 && board[boardY * COLS + boardX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Rotates a piece's matrix.
 * @param matrix The matrix to rotate.
 * @param direction 1 for clockwise, -1 for counter-clockwise.
 * @returns The new rotated matrix.
 */
export function rotateMatrix(matrix: number[][], direction: number): number[][] {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (direction === 1) { // Clockwise
                result[c][N - 1 - r] = matrix[r][c];
            } else { // Counter-clockwise
                result[N - 1 - c][r] = matrix[r][c];
            }
        }
    }
    return result;
}

// More functions for scoring, line clearing, etc. will be added here.
