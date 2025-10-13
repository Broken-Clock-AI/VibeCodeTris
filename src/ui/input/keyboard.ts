// src/ui/input/keyboard.ts
import { GameAction } from './actions';

/**
 * Sets up keyboard event listeners and maps key presses to game actions.
 * @param onAction - A callback function to be invoked when a game action is triggered.
 * @returns A cleanup function that removes the event listener.
 */
export function setupKeyboardControls(onAction: (action: GameAction) => void): () => void {
    const KEY_MAP: { [key: string]: GameAction } = {
        'ArrowLeft': 'moveLeft',
        'ArrowRight': 'moveRight',
        'ArrowDown': 'softDrop',
        ' ': 'hardDrop', // Space bar
        'z': 'rotateCCW',
        'x': 'rotateCW',
        'c': 'hold',
        'ArrowUp': 'rotateCW', // Alternative rotation
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const action = KEY_MAP[e.key];
        if (action) {
            e.preventDefault(); // Prevent default browser actions (e.g., scrolling)
            onAction(action);
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Return a cleanup function to be called by the manager
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}
