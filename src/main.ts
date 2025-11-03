// src/main.ts
import { PixiRenderer } from './renderer/pixiRenderer';
import { InputManager } from './ui/input/InputManager';
import { UIStateManager, UIState, VisualSettings } from './ui/state';
import { AccessibilityManager } from './ui/accessibility';
import { AudioEngine } from './audio/AudioEngine';
import { AudioConfig } from './audio/types';

async function main() {
    const uiManager = new UIStateManager();
    const inputManager = new InputManager();
    const accessibilityManager = new AccessibilityManager(document.body);

    // Placeholder Audio Configuration (from VibeCodeTris_Procedural_Audio_Spec.md)
    const audioConfig: AudioConfig = {
        meta: { name: "VibeCodeTris_Audio", tempo: 100, timeSignature: "4/4" as any },
        scales: {
            default: { root: 60, pattern: "majorPent" }, // C3 Major Pentatonic
        },
        instruments: [
            { id: "pieceSpawnSynth", type: "synth", preset: { harmonicity: 1.5, oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } } as any, maxVoices: 6, gain: 0.6 },
            { id: "pieceLockSynth", type: "synth", preset: { pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } } as any, maxVoices: 6, gain: 0.7 },
            { id: "lineClearSynth", type: "synth", preset: { harmonicity: 1.2, modulationIndex: 10, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.8 } } as any, maxVoices: 4, gain: 0.8, effects: { sendReverb: 0.4 } },
            { id: "gameOverSynth", type: "synth", preset: { oscillator: { type: "sawtooth" }, envelope: { attack: 0.1, decay: 1, sustain: 0.5, release: 1 } } as any, maxVoices: 1, gain: 0.5 },
            // New synth for the Piece Melody system, designed for a short, percussive "pluck" sound.
            { id: "pieceMovementSynth", type: "synth", preset: { oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 } } as any, maxVoices: 8, gain: 0.5 },
        ],
        rules: {
            pieceSpawn: {
                id: "pieceSpawn",
                instrumentId: "pieceSpawnSynth",
                description: "Plays when a new piece spawns",
                pitchSource: { type: "mapIndex", mapKey: "type" },
                rhythm: { mode: "onEvent" },
                probability: 1,
                velocity: { min: 0.6, max: 0.9 },
                duration: "16n",
            },
            pieceLock: {
                id: "pieceLock",
                instrumentId: "pieceLockSynth",
                description: "Plays when a piece locks",
                pitchSource: { type: "random", maxIndex: 3 },
                rhythm: { mode: "onEvent" },
                probability: 1,
                velocity: { min: 0.7, max: 1.0 },
                duration: "8n",
            },
            lineClear: {
                id: "lineClear",
                instrumentId: "lineClearSynth",
                description: "Plays when lines are cleared",
                pitchSource: { type: "random", maxIndex: 5 }, 
                rhythm: { mode: "onEvent" },
                probability: 1,
                velocity: { min: 0.8, max: 1.0 },
                duration: "4n",
            },
            gameOver: {
                id: "gameOver",
                instrumentId: "gameOverSynth",
                description: "Plays when game is over",
                pitchSource: { type: "mapIndex", mapKey: "level" },
                rhythm: { mode: "onEvent" },
                probability: 1,
                velocity: { min: 0.9, max: 1.0 },
                duration: "1n",
            },
        },
    };

    const gameSeed = Math.floor(Math.random() * 1_000_000_000); // Use a consistent seed for audio
    const audioEngine = new AudioEngine(gameSeed, audioConfig);
    let renderer: PixiRenderer | null = null;
    const gameContainer = document.getElementById('game-container');
    const appContainer = document.getElementById('app-container');
    const infoPanel = document.getElementById('in-game-info');
    const touchControls = document.getElementById('touch-controls');

    if (!gameContainer || !appContainer || !infoPanel || !touchControls) {
        throw new Error('Core container elements not found');
    }

    const handleResize = () => {
        // Fix mobile viewport height issue
        document.body.style.height = `${window.innerHeight}px`;

        if (!renderer) return;

        // Calculate available height by subtracting info and controls heights
        const totalHeight = appContainer.clientHeight;
        const infoHeight = infoPanel.offsetHeight;
        
        // Check if touch controls are displayed before getting their height
        const touchControlsVisible = getComputedStyle(touchControls).display !== 'none';
        const controlsHeight = touchControlsVisible ? touchControls.offsetHeight : 0;
        
        // A small buffer to prevent the game from touching the other UI elements
        const verticalMargin = 20; 

        const availableHeight = totalHeight - infoHeight - controlsHeight - verticalMargin;
        
        // Use the parent of the game container for width calculation, which is #in-game
        const availableWidth = gameContainer.parentElement?.clientWidth ?? 0;

        const aspectRatio = 1 / 2; // Game board is 10 blocks wide, 20 blocks high

        let newWidth = availableWidth;
        let newHeight = newWidth / aspectRatio;

        if (newHeight > availableHeight) {
            newHeight = availableHeight;
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
        await audioEngine.initializeAudioContext();
        if (renderer) {
            renderer.destroy();
            renderer = null;
        }
        
        uiManager.changeState(UIState.InGame);
        
        while (gameContainer.firstChild) {
            gameContainer.removeChild(gameContainer.firstChild);
        }

        renderer = await PixiRenderer.create(gameContainer, uiManager, accessibilityManager, audioEngine);
        
        setTimeout(() => {
            handleResize();
            if (renderer) {
                renderer.start();
            }
            accessibilityManager.announce('Game started.');
            console.log('Game started.');
        }, 50);
    };

    // --- Get UI Elements ---
    const playButton = document.getElementById('play-button');
    const settingsButton = document.getElementById('settings-button');
    const soundboardButton = document.getElementById('soundboard-button');
    const backButtonSettings = document.getElementById('back-button-settings');
    const backButtonSoundboard = document.getElementById('back-button-soundboard');
    const playAgainButton = document.getElementById('play-again-button');
    const mainMenuButton = document.getElementById('main-menu-button');
    const dasSlider = document.getElementById('das-slider') as HTMLInputElement;
    const arrSlider = document.getElementById('arr-slider') as HTMLInputElement;
    const dasValue = document.getElementById('das-value');
    const arrValue = document.getElementById('arr-value');
    const colorPaletteSelect = document.getElementById('color-palette-select') as HTMLSelectElement;
    const blockStyleSelect = document.getElementById('block-style-select') as HTMLSelectElement;
    const highContrastCheckbox = document.getElementById('high-contrast-checkbox') as HTMLInputElement;
    const distinctPatternsCheckbox = document.getElementById('distinct-patterns-checkbox') as HTMLInputElement;
    const pieceOutlineCheckbox = document.getElementById('piece-outline-checkbox') as HTMLInputElement;
    const solidPiecesCheckbox = document.getElementById('solid-pieces-checkbox') as HTMLInputElement;
    const ghostPieceCheckbox = document.getElementById('ghost-piece-checkbox') as HTMLInputElement;

    // Soundboard buttons
    const testSpawnSynthButton = document.getElementById('test-spawn-synth');
    const testLockSynthButton = document.getElementById('test-lock-synth');
    const testClearSynthButton = document.getElementById('test-clear-synth');
    const testMovementSynthButton = document.getElementById('test-movement-synth');
    const testGameOverSynthButton = document.getElementById('test-gameover-synth');


    if (!playButton || !settingsButton || !soundboardButton || !backButtonSettings || !backButtonSoundboard || !playAgainButton || !mainMenuButton || !dasSlider || !arrSlider || !dasValue || !arrValue || !colorPaletteSelect || !blockStyleSelect || !highContrastCheckbox || !distinctPatternsCheckbox || !pieceOutlineCheckbox || !solidPiecesCheckbox || !ghostPieceCheckbox || !testSpawnSynthButton || !testLockSynthButton || !testClearSynthButton || !testMovementSynthButton || !testGameOverSynthButton) {
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
    soundboardButton.addEventListener('click', () => {
        uiManager.changeState(UIState.Soundboard);
        accessibilityManager.announce('Soundboard menu.');
    });
    backButtonSettings.addEventListener('click', () => {
        uiManager.changeState(UIState.MainMenu);
        accessibilityManager.announce('Main menu.');
    });
    backButtonSoundboard.addEventListener('click', () => {
        uiManager.changeState(UIState.MainMenu);
        accessibilityManager.announce('Main menu.');
    });

    // Soundboard listeners
    testSpawnSynthButton.addEventListener('click', async () => {
        await audioEngine.initializeAudioContext();
        audioEngine.playSpawnSound();
    });
    testLockSynthButton.addEventListener('click', async () => {
        await audioEngine.initializeAudioContext();
        audioEngine.playLockSound();
    });
    testClearSynthButton.addEventListener('click', async () => {
        await audioEngine.initializeAudioContext();
        audioEngine.playClearSound();
    });
    testMovementSynthButton.addEventListener('click', async () => {
        await audioEngine.initializeAudioContext();
        audioEngine.playMovementSound();
    });
    testGameOverSynthButton.addEventListener('click', async () => {
        await audioEngine.initializeAudioContext();
        audioEngine.playGameOverSound();
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

    colorPaletteSelect.addEventListener('change', () => {
        uiManager.updateVisualSettings({ colorPalette: colorPaletteSelect.value as VisualSettings['colorPalette'] });
    });

    blockStyleSelect.addEventListener('change', () => {
        uiManager.updateVisualSettings({ blockStyle: blockStyleSelect.value as VisualSettings['blockStyle'] });
    });

    highContrastCheckbox.addEventListener('change', () => {
        uiManager.updateVisualSettings({ highContrast: highContrastCheckbox.checked });
    });

    distinctPatternsCheckbox.addEventListener('change', () => {
        uiManager.updateVisualSettings({ distinctPatterns: distinctPatternsCheckbox.checked });
    });

    pieceOutlineCheckbox.addEventListener('change', () => {
        uiManager.updateVisualSettings({ pieceOutline: pieceOutlineCheckbox.checked });
    });

    solidPiecesCheckbox.addEventListener('change', () => {
        uiManager.updateVisualSettings({ solidPieces: solidPiecesCheckbox.checked });
    });

    ghostPieceCheckbox.addEventListener('change', () => {
        uiManager.updateVisualSettings({ isGhostPieceEnabled: ghostPieceCheckbox.checked });
    });

    window.addEventListener('resize', handleResize);
    
    // Initial resize to set body height correctly
    handleResize();

    console.log('Application initialized.');
}

document.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error);
});

