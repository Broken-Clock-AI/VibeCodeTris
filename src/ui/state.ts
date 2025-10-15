// src/ui/state.ts

export enum UIState {
    MainMenu,
    InGame,
    Settings,
    GameOver,
}

export interface VisualSettings {
    colorPalette: 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    highContrast: boolean;
    distinctPatterns: boolean;
    pieceOutline: boolean;
}

export class UIStateManager {
    private currentState: UIState;
    private viewElements: Map<UIState, HTMLElement>;
    private visualSettings: VisualSettings = {
        colorPalette: 'default',
        highContrast: false,
        distinctPatterns: false,
        pieceOutline: false,
    };
    private subscribers: ((settings: VisualSettings) => void)[] = [];

    constructor() {
        this.currentState = UIState.MainMenu;
        this.viewElements = new Map();

        // Get all the view containers from the DOM
        const mainMenu = document.getElementById('main-menu');
        const inGame = document.getElementById('in-game');
        const settings = document.getElementById('settings-screen');
        const gameOver = document.getElementById('game-over-screen');

        if (!mainMenu || !inGame || !settings || !gameOver) {
            throw new Error('One or more UI view elements are missing from the DOM.');
        }

        this.viewElements.set(UIState.MainMenu, mainMenu);
        this.viewElements.set(UIState.InGame, inGame);
        this.viewElements.set(UIState.Settings, settings);
        this.viewElements.set(UIState.GameOver, gameOver);

        // Set the initial state visibility
        this.updateVisibility();
    }

    public changeState(newState: UIState): void {
        if (this.currentState === newState) {
            return; // No change
        }

        this.currentState = newState;
        this.updateVisibility();
    }

    public getCurrentState(): UIState {
        return this.currentState;
    }

    private updateVisibility(): void {
        for (const [state, element] of this.viewElements.entries()) {
            if (state === this.currentState) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    }

    public getVisualSettings(): VisualSettings {
        return this.visualSettings;
    }

    public updateVisualSettings(newSettings: Partial<VisualSettings>): void {
        this.visualSettings = { ...this.visualSettings, ...newSettings };
        this.subscribers.forEach(cb => cb(this.visualSettings));
    }

    public subscribeToVisualSettings(callback: (settings: VisualSettings) => void): void {
        this.subscribers.push(callback);
        callback(this.visualSettings); // Immediately notify with current state
    }
}
