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
    const gameContainer = document.getElementById('game-container');
    const appContainer = document.getElementById('app-container');

    if (!gameContainer || !appContainer) {
        throw new Error('Core container elements not found');
    }

    const handleResize = () => {
        // Fix mobile viewport height issue
        document.body.style.height = `${window.innerHeight}px`;

        if (!renderer) return;

        // Temporarily reset container size to measure available space
        gameContainer.style.width = '';
        gameContainer.style.height = '';
        
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;
        const aspectRatio = 1 / 2; // Width to Height

        let newWidth = containerWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        // Set container size to match canvas, eliminating gutters
        gameContainer.style.width = `${newWidth}px`;
        gameContainer.style.height = `${newHeight}px`;

        const scale = window.devicePixelRatio;
        
        renderer.resize(newWidth * scale, newHeight * scale);
        if (renderer.app.view.style) {
            renderer.app.view.style.width = `${newWidth}px`;
            renderer.app.view.style.height = `${newHeight}px`;
        }
    };

    const startGame = async () => {
        if (renderer) {
            renderer.destroy();
            renderer = null;
        }
        
        uiManager.changeState(UIState.InGame);
        
        while (gameContainer.firstChild) {
            gameContainer.removeChild(gameContainer.firstChild);
        }

        renderer = await PixiRenderer.create(gameContainer, uiManager, accessibilityManager);
        
        setTimeout(() => {
            handleResize();
            renderer.start();
            accessibilityManager.announce('Game started.');
            console.log('Game started.');
        }, 50);
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

    window.addEventListener('resize', handleResize);
    
    // Initial resize to set body height correctly
    handleResize();

    console.log('Application initialized.');
}

document.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error);
});

