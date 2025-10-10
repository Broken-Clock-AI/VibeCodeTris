import { isValidPosition, rotateMatrix } from '../../logic/rules';
import { COLS, ROWS } from '../../logic/constants';

describe('Game Rules', () => {

  describe('rotateMatrix', () => {
    it('should rotate a T-piece matrix clockwise', () => {
      const matrix = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ];

      const rotated = rotateMatrix(matrix, 1);
      expect(rotated).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0]
      ]);
    });

    it('should rotate a matrix back to its original state when rotated counter-clockwise', () => {
      const originalMatrix = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
      ];
      
      const rotatedOnce = rotateMatrix(originalMatrix, 1);
      const rotatedBack = rotateMatrix(rotatedOnce, -1);

      expect(rotatedBack).toEqual(originalMatrix);
    });
  });

  describe('isValidPosition', () => {
    let board: Uint8Array;
    const pieceMatrix = [[1, 1], [1, 1]]; // O-piece

    beforeEach(() => {
      board = new Uint8Array(COLS * ROWS).fill(0);
      // Add a wall at the bottom
      for (let i = 0; i < COLS; i++) {
        board[(ROWS - 1) * COLS + i] = 1;
      }
      // Add a block in the middle
      board[10 * COLS + 5] = 1;
    });

    it('should return true for a valid position', () => {
      expect(isValidPosition(pieceMatrix, 0, 0, board)).toBe(true);
    });

    it('should return false for a position colliding with the left wall', () => {
      expect(isValidPosition(pieceMatrix, -1, 0, board)).toBe(false);
    });

    it('should return false for a position colliding with the right wall', () => {
      expect(isValidPosition(pieceMatrix, COLS - 1, 0, board)).toBe(false);
    });

    it('should return false for a position colliding with the bottom wall', () => {
      expect(isValidPosition(pieceMatrix, 0, ROWS - 2, board)).toBe(false);
    });

    it('should return false for a position colliding with an existing block', () => {
      expect(isValidPosition(pieceMatrix, 4, 9, board)).toBe(false);
    });
  });

});