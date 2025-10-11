// src/ui/controls.ts
import { renderAPI } from '../renderer/renderAPI';

const KEY_MAP: { [key: string]: string } = {
    'ArrowLeft': 'moveLeft',
    'ArrowRight': 'moveRight',
    'ArrowDown': 'softDrop',
    ' ': 'hardDrop', // Space bar
    'z': 'rotateCCW',
    'x': 'rotateCW',
    'c': 'hold',
    'ArrowUp': 'rotateCW', // Alternative rotation
};

export class Controls {
    private handleKeyDown: (e: KeyboardEvent) => void;

    constructor() {
        this.handleKeyDown = (e: KeyboardEvent) => {
            const action = KEY_MAP[e.key];
            if (action) {
                e.preventDefault(); // Prevent default browser actions (e.g., scrolling)
                renderAPI.sendInput(action);
            }
        };
    }

    public enable() {
        console.log("Enabling keyboard controls.");
        document.addEventListener('keydown', this.handleKeyDown);
    }

    public disable() {
        console.log("Disabling keyboard controls.");
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}
