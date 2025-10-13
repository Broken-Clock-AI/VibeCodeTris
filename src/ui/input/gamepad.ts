// src/ui/input/gamepad.ts
import { GameAction } from './actions';

// Standard Gamepad button mapping
const buttonMap: { [key: number]: GameAction } = {
    0: 'hardDrop',      // A / Cross
    1: 'rotateCW',      // B / Circle
    2: 'rotateCCW',     // X / Square
    3: 'hold',          // Y / Triangle
    12: 'softDrop',     // D-Pad Up
    13: 'softDrop',     // D-Pad Down
    14: 'moveLeft',     // D-Pad Left
    15: 'moveRight',    // D-Pad Right
};

let animationFrameId: number | null = null;
const previousButtonState: { [key: number]: boolean } = {};

/**
 * Polls for gamepad input and sends actions.
 */
function pollGamepads(actionHandler: (action: GameAction) => void) {
    const gamepads = navigator.getGamepads();
    if (gamepads.length === 0 || !gamepads[0]) {
        animationFrameId = requestAnimationFrame(() => pollGamepads(actionHandler));
        return;
    }

    const gamepad = gamepads[0]; // Use the first connected gamepad

    // --- Handle Buttons ---
    gamepad.buttons.forEach((button, index) => {
        const isPressed = button.pressed;
        const wasPressed = previousButtonState[index] || false;

        if (isPressed && !wasPressed) {
            // Button was just pressed
            const action = buttonMap[index];
            if (action) {
                actionHandler(action);
            }
        } else if (!isPressed && wasPressed) {
            // Button was just released
            const action = buttonMap[index];
            if (action && (action === 'moveLeft' || action === 'moveRight' || action === 'softDrop')) {
                actionHandler(`${action}_release` as GameAction);
            }
        }
        previousButtonState[index] = isPressed;
    });

    animationFrameId = requestAnimationFrame(() => pollGamepads(actionHandler));
}

/**
 * Sets up gamepad controls and returns a cleanup function.
 */
export function setupGamepadControls(actionHandler: (action: GameAction) => void): () => void {
    const onGamepadConnected = (e: GamepadEvent) => {
        console.log(
            "Gamepad connected at index %d: %s. %d buttons, %d axes.",
            e.gamepad.index,
            e.gamepad.id,
            e.gamepad.buttons.length,
            e.gamepad.axes.length
        );
        if (!animationFrameId) {
            pollGamepads(actionHandler);
        }
    };

    const onGamepadDisconnected = (e: GamepadEvent) => {
        console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };

    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);

    // Start polling if a gamepad is already connected
    if (navigator.getGamepads().some(g => g)) {
        pollGamepads(actionHandler);
    }

    const cleanup = () => {
        window.removeEventListener("gamepadconnected", onGamepadConnected);
        window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        console.log("Gamepad controls disabled.");
    };

    console.log("Gamepad controls enabled.");
    return cleanup;
}
