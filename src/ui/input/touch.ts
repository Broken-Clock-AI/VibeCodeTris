// src/ui/input/touch.ts
import { GameAction } from './actions';

/**
 * Sets up touch controls (both virtual buttons and gestures) and returns a
 * cleanup function to remove the event listeners.
 *
 * @param actionHandler - The callback function to be invoked when a game
 * action is triggered by a touch event.
 * @returns A cleanup function that removes all attached event listeners.
 */
export function setupTouchControls(actionHandler: (action: GameAction) => void): () => void {
    // --- 1. Virtual Button Logic ---
    const buttonToActionMap: { [key: string]: GameAction } = {
        'btn-rot-ccw': 'rotateCCW',
        'btn-rot-cw': 'rotateCW',
        'btn-move-left': 'moveLeft',
        'btn-move-right': 'moveRight',
        'btn-hard-drop': 'hardDrop',
        'btn-hold': 'hold',
    };

    const onButtonPress = (event: Event) => {
        event.preventDefault();
        const targetId = (event.currentTarget as HTMLElement).id;
        console.log(`Button pressed: ${targetId}`); // DEBUG LOG
        const action = buttonToActionMap[targetId];
        if (action) {
            actionHandler(action);
        }
    };

    const buttons = Object.keys(buttonToActionMap).map(id => document.getElementById(id));
    buttons.forEach(button => {
        if (button) {
            button.addEventListener('touchstart', onButtonPress, { passive: false });
        }
    });

    // --- 2. Swipe Gesture Logic ---
    const gameContainer = document.getElementById('game-container');
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThresholdX = 50; // Min horizontal distance for a swipe
    const swipeThresholdY = 40; // Min vertical distance for a soft drop

    const onTouchStart = (event: TouchEvent) => {
        console.log('Touch started on game container'); // DEBUG LOG
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    };

    const onTouchEnd = (event: TouchEvent) => {
        const touchEndX = event.changedTouches[0].screenX;
        const touchEndY = event.changedTouches[0].screenY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Prioritize horizontal movement
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > swipeThresholdX) {
                actionHandler('moveRight');
            } else if (deltaX < -swipeThresholdX) {
                actionHandler('moveLeft');
            }
        } else { // Vertical movement
            if (deltaY > swipeThresholdY) {
                actionHandler('softDrop');
            }
        }
    };

    if (gameContainer) {
        gameContainer.addEventListener('touchstart', onTouchStart, { passive: true });
        gameContainer.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    // --- 3. Cleanup Logic ---
    const cleanup = () => {
        buttons.forEach(button => {
            if (button) {
                button.removeEventListener('touchstart', onButtonPress);
            }
        });
        if (gameContainer) {
            gameContainer.removeEventListener('touchstart', onTouchStart);
            gameContainer.removeEventListener('touchend', onTouchEnd);
        }
        console.log("Touch controls disabled.");
    };

    console.log("Touch controls enabled.");
    return cleanup;
}
