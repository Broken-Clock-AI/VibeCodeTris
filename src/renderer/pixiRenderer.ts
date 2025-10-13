// src/renderer/pixiRenderer.ts
import * as PIXI from 'pixi.js';
import { renderAPI } from './renderAPI';
import { COLS, ROWS } from '../logic/constants';
import { GameEvent, Snapshot } from '../logic/types';
import { UIStateManager, UIState } from '../ui/state';
import { AccessibilityManager } from '../ui/accessibility';

const BLOCK_SIZE = 30;
const BORDER_WIDTH = 2;
const BOARD_WIDTH = COLS * BLOCK_SIZE;
const BOARD_HEIGHT = ROWS * BLOCK_SIZE;

const COLORS = [
    0x1a1a1a, // 0: Background
    0x00FFFF, // 1: I (Cyan)
    0x0000FF, // 2: J (Blue)
    0xFFA500, // 3: L (Orange)
    0xFFFF00, // 4: O (Yellow)
    0x00FF00, // 5: S (Green)
    0x800080, // 6: T (Purple)
    0xFF0000, // 7: Z (Red)
];

export class PixiRenderer {
    private app: PIXI.Application;
    private boardContainer: PIXI.Container;
    private boardBlocks: PIXI.Graphics[] = [];
    private uiManager: UIStateManager;
    private accessibilityManager: AccessibilityManager;
    private lastAnnouncedLevel: number = 1;

    private constructor(uiManager: UIStateManager, accessibilityManager: AccessibilityManager) {
        this.app = new PIXI.Application();
        this.boardContainer = new PIXI.Container();
        this.uiManager = uiManager;
        this.accessibilityManager = accessibilityManager;
    }

    public static async create(
        container: HTMLElement, 
        uiManager: UIStateManager, 
        accessibilityManager: AccessibilityManager
    ): Promise<PixiRenderer> {
        const renderer = new PixiRenderer(uiManager, accessibilityManager);
        await renderer.app.init({
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
            backgroundColor: 0x000000,
            antialias: true,
        });
        container.appendChild(renderer.app.canvas);
        
        renderer.app.stage.addChild(renderer.boardContainer);
        renderer.initBoard();
        renderer.setupSubscriptions();
        
        return renderer;
    }

    private initBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const block = new PIXI.Graphics();
                block.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE);
                this.boardContainer.addChild(block);
                this.boardBlocks.push(block);
            }
        }
    }

    private handleGameEvents(events: GameEvent[]) {
        for (const event of events) {
            switch (event.type) {
                case 'lineClear':
                    const count = event.data.count;
                    if (count === 1) this.accessibilityManager.announce('Single line clear.');
                    else if (count === 2) this.accessibilityManager.announce('Double line clear.');
                    else if (count === 3) this.accessibilityManager.announce('Triple line clear.');
                    else if (count >= 4) this.accessibilityManager.announce('Tetris!');
                    break;
                case 'scoreUpdate':
                    if (event.data.level > this.lastAnnouncedLevel) {
                        this.lastAnnouncedLevel = event.data.level;
                        this.accessibilityManager.announce(`Level up to level ${this.lastAnnouncedLevel}.`);
                    }
                    break;
                // Other event announcements can be added here
            }
        }
    }

    private setupSubscriptions() {
        renderAPI.on('snapshot', (snapshot) => {
            if (snapshot.gameOver) {
                this.uiManager.changeState(UIState.GameOver);
                const finalScoreEl = document.getElementById('final-score');
                if (finalScoreEl) {
                    finalScoreEl.textContent = snapshot.score.toString();
                }
                this.app.ticker.stop();
                return;
            }
            this.drawBoard(snapshot);
            this.handleGameEvents(snapshot.events);
        });

        renderAPI.on('log', (log) => {
            console.log(`[WORKER LOG ${log.level.toUpperCase()}]: ${log.msg}`);
        });

        renderAPI.on('fatal', (fatal) => {
            console.error(`[WORKER FATAL]: ${fatal.error}`);
            this.app.ticker.stop();
        });
    }

    private drawBoard(snapshot: Snapshot) {
        const board = new Uint8Array(snapshot.boardBuffer);
        for (let i = 0; i < board.length; i++) {
            const colorIndex = board[i];
            const block = this.boardBlocks[i];
            
            block.clear();
            block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
            block.fill(COLORS[colorIndex]);
            block.stroke({ width: BORDER_WIDTH, color: 0x333333, alpha: 0.5 });
        }

        // Draw the current piece
        if (snapshot.current) {
            const piece = snapshot.current;
            const matrix = new Uint8Array(piece.matrix);
            const shapeSize = Math.sqrt(matrix.length);

            for (let r = 0; r < shapeSize; r++) {
                for (let c = 0; c < shapeSize; c++) {
                    if (matrix[r * shapeSize + c]) {
                        const boardX = piece.x + c;
                        const boardY = piece.y + r;
                        const blockIndex = boardY * COLS + boardX;
                        
                        if (blockIndex >= 0 && blockIndex < this.boardBlocks.length) {
                            const block = this.boardBlocks[blockIndex];
                            block.clear();
                            block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
                            block.fill(piece.color); // Use the direct color value
                            block.stroke({ width: BORDER_WIDTH, color: 0x333333, alpha: 0.5 });
                        }
                    }
                }
            }
        }
    }

    public start() {
        const seed = Math.floor(Math.random() * 1_000_000_000);
        renderAPI.start(seed);
        console.log(`Renderer started. Requesting engine start with seed: ${seed}`);
    }

    public destroy() {
        renderAPI.destroy();
        this.app.destroy(true, { children: true, texture: true });
    }

    public resize(width: number, height: number) {
        this.app.renderer.resize(width, height);
        
        const scaleX = width / BOARD_WIDTH;
        const scaleY = height / BOARD_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        this.boardContainer.scale.set(scale);
    }
}