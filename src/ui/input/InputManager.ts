// src/ui/input/InputManager.ts
import { renderAPI } from '../../renderer/renderAPI';
import { GameAction } from './actions';
import { setupKeyboardControls } from './keyboard';
import { setupTouchControls } from './touch';
import { setupGamepadControls } from './gamepad';

/**
 * Manages all user input sources (keyboard, gamepad, touch) and funnels
 * them into a single stream of actions for the game engine.
 */
export class InputManager {
    private cleanupKeyboard: () => void;
    private cleanupTouch: () => void;
    private cleanupGamepad: () => void;

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

        // Initialize touch controls and store its cleanup function
        this.cleanupTouch = setupTouchControls(actionHandler);

        // Initialize gamepad controls and store its cleanup function
        this.cleanupGamepad = setupGamepadControls(actionHandler);
    }

    /**
     * Sends new timing values to the engine.
     * @param das The new Delayed Auto Shift value.
     * @param arr The new Auto Repeat Rate value.
     */
    public updateTimings(das: number, arr: number): void {
        renderAPI.sendInput({ type: 'setTimings', das, arr });
    }

    /**
     * Disables all active input listeners. This is useful for cleaning up
     * when the game is paused or over.
     */
    public disable() {
        this.cleanupKeyboard();
        this.cleanupTouch();
        this.cleanupGamepad();
        console.log("InputManager: All controls disabled.");
    }
}
