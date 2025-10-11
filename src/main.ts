// src/main.ts
import { PixiRenderer } from './renderer/pixiRenderer';
import { Controls } from './ui/controls';
import { renderAPI } from './renderer/renderAPI';

// Main application entry point
async function main() {
    // 1. Create and initialize the renderer
    const container = document.getElementById('game-container');
    if (!container) {
        throw new Error('Game container not found');
    }
    const renderer = await PixiRenderer.create(container);

    // 2. Create and enable controls
    const controls = new Controls();
    controls.enable();

    // 3. Start the renderer (which in turn starts the game)
    renderer.start();

    console.log('Application initialized.');
}

main().catch(console.error);
