// src/main.ts
import { PixiRenderer } from './renderer/pixiRenderer';
import { InputManager } from './ui/input/InputManager';
import { UIStateManager, UIState } from './ui/state';
import { AccessibilityManager } from './ui/accessibility';

async function main() {
    const uiManager = new UIStateManager();
    const inputManager = new InputManager();
    const accessibilityManager = new AccessibilityManager(document.body);
    let renderer: PixiRenderer | null = null;

    const startGame = async () => {
        if (renderer) {
            renderer.destroy();
            renderer = null;
        }
        
        uiManager.changeState(UIState.InGame);
        const container = document.getElementById('game-container');
        if (!container) throw new Error('Game container not found');
        
        // Clear any previous canvas
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        renderer = await PixiRenderer.create(container, uiManager, accessibilityManager);
        renderer.start();
        accessibilityManager.announce('Game started.');
        console.log('Game started.');
    };

    // --- Get UI Elements ---
    const playButton = document.getElementById('play-button');
    const settingsButton = document.getElementById('settings-button');
    const backButton = document.getElementById('back-button-settings');
    const playAgainButton = document.getElementById('play-again-button');
    const mainMenuButton = document.getElementById('main-menu-button');
    const dasSlider = document.getElementById('das-slider') as HTMLInputElement;
    const arrSlider = document.getElementById('arr-slider') as HTMLInputElement;
    const dasValue = document.getElementById('das-value');
    const arrValue = document.getElementById('arr-value');

    if (!playButton || !settingsButton || !backButton || !playAgainButton || !mainMenuButton || !dasSlider || !arrSlider || !dasValue || !arrValue) {
        throw new Error('One or more UI elements not found');
    }

    // --- Event Listeners ---
    playButton.addEventListener('click', startGame);
    playAgainButton.addEventListener('click', startGame);

    mainMenuButton.addEventListener('click', () => {
        if (renderer) {
            renderer.destroy();
            renderer = null;
        }
        uiManager.changeState(UIState.MainMenu);
        accessibilityManager.announce('Game over. Main menu.');
    });

    settingsButton.addEventListener('click', () => {
        uiManager.changeState(UIState.Settings);
        accessibilityManager.announce('Settings menu.');
    });

    backButton.addEventListener('click', () => {
        uiManager.changeState(UIState.MainMenu);
        accessibilityManager.announce('Main menu.');
    });

    const updateTimings = () => {
        const das = parseInt(dasSlider.value, 10);
        const arr = parseInt(arrSlider.value, 10);
        dasValue.textContent = das.toString();
        arrValue.textContent = arr.toString();
        inputManager.updateTimings(das, arr); 
    };

    dasSlider.addEventListener('input', updateTimings);
    arrSlider.addEventListener('input', updateTimings);

    console.log('Application initialized.');
}

document.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error);
});

