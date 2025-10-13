// src/ui/input/InputManager.ts
import { renderAPI } from '../../renderer/renderAPI';
import { GameAction } from './actions';
import { setupKeyboardControls } from './keyboard';

/**
 * Manages all user input sources (keyboard, gamepad, touch) and funnels
 * them into a single stream of actions for the game engine.
 */
export class InputManager {
    private cleanupKeyboard: () => void;
    // Future input method cleanup functions will be added here
    // private cleanupGamepad: () => void;
    // private cleanupTouch: () => void;

    constructor() {
        /**
         * The central handler that receives an action from any input source
         * and forwards it to the game engine via the renderAPI.
         */
        const actionHandler = (action: GameAction) => {
            renderAPI.sendInput(action);
        };

        // Initialize keyboard controls and store its cleanup function
        this.cleanupKeyboard = setupKeyboardControls(actionHandler);
        console.log("InputManager: Keyboard controls enabled.");

        // Future input methods will be initialized here
        // this.cleanupGamepad = setupGamepadControls(actionHandler);
        // this.cleanupTouch = setupTouchControls(actionHandler);
    }

    /**
     * Disables all active input listeners. This is useful for cleaning up
     * when the game is paused or over.
     */
    public disable() {
        this.cleanupKeyboard();
        // this.cleanupGamepad();
        // this.cleanupTouch();
        console.log("InputManager: All controls disabled.");
    }
}
