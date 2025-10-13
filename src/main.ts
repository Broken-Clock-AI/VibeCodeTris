// src/main.ts
import { PixiRenderer } from './renderer/pixiRenderer';
import { InputManager } from './ui/input/InputManager';
import { renderAPI } from './renderer/renderAPI';

// Main application entry point
async function main() {
    // 1. Create and initialize the renderer
    const container = document.getElementById('game-container');
    if (!container) {
        throw new Error('Game container not found');
    }
    const renderer = await PixiRenderer.create(container);

    // 2. Create and enable the input manager
    const inputManager = new InputManager();

    // 3. Start the renderer (which in turn starts the game)
    renderer.start();

    console.log('Application initialized.');

    // Note: To disable controls later, you would call inputManager.disable()
}

// Wait for the DOM to be fully loaded before starting the application
document.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error);
});
