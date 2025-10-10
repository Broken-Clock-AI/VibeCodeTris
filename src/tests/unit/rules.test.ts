import { isValidPosition, rotateMatrix } from '../../logic/rules';
import * as assert from 'assert';

// A simple mock board for testing collisions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

function createTestBoard(): Uint8Array {
    const board = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT).fill(0);
    // Add a wall at the bottom
    for (let i = 0; i < BOARD_WIDTH; i++) {
        board[(BOARD_HEIGHT - 1) * BOARD_WIDTH + i] = 1;
    }
    // Add a block in the middle
    board[10 * BOARD_WIDTH + 5] = 1;
    return board;
}

function testRotation() {
    const matrix = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ]; // T-piece

    // Clockwise rotation
    const rotated_cw = rotateMatrix(matrix, 1);
    assert.deepStrictEqual(rotated_cw, [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0]
    ], 'Clockwise rotation failed.');

    // Rotate it back counter-clockwise
    const rotated_ccw = rotateMatrix(rotated_cw, -1);
    assert.deepStrictEqual(rotated_ccw, matrix, 'Counter-clockwise rotation should bring it back to original.');

    console.log('testRotation passed.');
}

function testValidPosition() {
    const board = createTestBoard();
    const pieceMatrix = [[1, 1], [1, 1]]; // O-piece

    // Valid position
    assert.strictEqual(isValidPosition(pieceMatrix, 0, 0, board), true, 'Should be a valid position.');

    // Collision with left wall
    assert.strictEqual(isValidPosition(pieceMatrix, -1, 0, board), false, 'Should collide with left wall.');

    // Collision with right wall
    assert.strictEqual(isValidPosition(pieceMatrix, BOARD_WIDTH - 1, 0, board), false, 'Should collide with right wall.');
    
    // Collision with bottom wall
    assert.strictEqual(isValidPosition(pieceMatrix, 0, BOARD_HEIGHT - 2, board), false, 'Should collide with bottom wall.');

    // Collision with existing block
    assert.strictEqual(isValidPosition(pieceMatrix, 4, 9, board), false, 'Should collide with existing block.');

    console.log('testValidPosition passed.');
}


// Run all tests
try {
    testRotation();
    testValidPosition();
    console.log('All rules tests passed!');
} catch (error) {
    console.error('Rules tests failed:', error);
}
