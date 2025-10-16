// src/renderer/pixiRenderer.ts
import * as PIXI from 'pixi.js';
import { renderAPI } from './renderAPI';
import { COLS, ROWS } from '../logic/constants';
import { GameEvent, Snapshot } from '../logic/types';
import { UIStateManager, UIState, VisualSettings } from '../ui/state';
import { AccessibilityManager } from '../ui/accessibility';

const BLOCK_SIZE = 30;
const BORDER_WIDTH = 2;
const BOARD_WIDTH = COLS * BLOCK_SIZE;
const BOARD_HEIGHT = ROWS * BLOCK_SIZE;

const THEMES = {
    default: [
        0x1a1a1a, 0x00FFFF, 0x0000FF, 0xFFA500, 0xFFFF00, 0x00FF00, 0x800080, 0xFF0000,
    ],
    // Paul Tol's vibrant color scheme
    deuteranopia: [
        0x1a1a1a, 0x4477AA, 0xEE6677, 0x228833, 0xCCBB44, 0x66CCEE, 0xAA3377, 0xBBBBBB,
    ],
    protanopia: [
        0x1a1a1a, 0x4477AA, 0xEE6677, 0x228833, 0xCCBB44, 0x66CCEE, 0xAA3377, 0xBBBBBB,
    ],
    // Okabe-Ito color scheme
    tritanopia: [
        0x1a1a1a, 0x0072B2, 0xD55E00, 0x009E73, 0xF0E442, 0x56B4E9, 0xE69F00, 0xCC79A7,
    ],
};

export class PixiRenderer {
    public app: PIXI.Application;
    private boardContainer: PIXI.Container;
    private pieceOutlineContainer: PIXI.Graphics;
    private boardBlocks: PIXI.Graphics[] = [];
    private patternSprites: PIXI.Sprite[] = [];
    private uiManager: UIStateManager;
    private accessibilityManager: AccessibilityManager;
    private lastAnnouncedLevel: number = 1;
    private visualSettings: VisualSettings;
    private patternTextures: PIXI.Texture[] = [];
    private lastSnapshot: Snapshot | null = null;

    private constructor(uiManager: UIStateManager, accessibilityManager: AccessibilityManager, initialSettings: VisualSettings) {
        this.app = new PIXI.Application();
        this.boardContainer = new PIXI.Container();
        this.uiManager = uiManager;
        this.accessibilityManager = accessibilityManager;
        this.visualSettings = initialSettings;
    }

    public static async create(
        container: HTMLElement, 
        uiManager: UIStateManager, 
        accessibilityManager: AccessibilityManager
    ): Promise<PixiRenderer> {
        const initialSettings = uiManager.getVisualSettings();
        const renderer = new PixiRenderer(uiManager, accessibilityManager, initialSettings);
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
        
        // Subscribe to visual settings changes
        uiManager.subscribeToVisualSettings(settings => {
            renderer.onVisualSettingsChanged(settings);
        });
        
        return renderer;
    }

    private onVisualSettingsChanged(settings: VisualSettings) {
        const shouldGenerateTextures = settings.distinctPatterns && this.patternTextures.length === 0;
        this.visualSettings = settings;
        
        if (shouldGenerateTextures) {
            this.generatePatternTextures();
        }
        
        // Force a redraw with the latest snapshot if available
        if (this.lastSnapshot) {
            this.drawBoard(this.lastSnapshot);
        }
    }

    private generatePatternTextures() {
        this.patternTextures = []; // Clear existing textures
        const patterns = [
            null, // 0: Background
            (g: PIXI.Graphics) => { // I: Hollow Square
                g.rect(5, 5, BLOCK_SIZE - 10, BLOCK_SIZE - 10).stroke({ width: 3, color: 0xffffff });
            },
            (g: PIXI.Graphics) => { // J: Large Circle
                g.circle(BLOCK_SIZE / 2, BLOCK_SIZE / 2, BLOCK_SIZE / 3).fill(0xffffff);
            },
            (g: PIXI.Graphics) => { // L: Upward Triangle
                const size = BLOCK_SIZE * 0.6;
                const x = BLOCK_SIZE / 2;
                const y = BLOCK_SIZE / 2;
                g.moveTo(x, y - size / 2)
                 .lineTo(x + size / 2, y + size / 2)
                 .lineTo(x - size / 2, y + size / 2)
                 .closePath()
                 .fill(0xffffff);
            },
            (g: PIXI.Graphics) => { // O: Plus Sign
                const barWidth = BLOCK_SIZE * 0.15;
                const barLength = BLOCK_SIZE * 0.7;
                const offset = (BLOCK_SIZE - barLength) / 2;
                g.rect(offset, (BLOCK_SIZE - barWidth) / 2, barLength, barWidth).fill(0xffffff);
                g.rect((BLOCK_SIZE - barWidth) / 2, offset, barWidth, barLength).fill(0xffffff);
            },
            (g: PIXI.Graphics) => { // S: Two Horizontal Circles
                const radius = BLOCK_SIZE / 6;
                g.circle(BLOCK_SIZE / 3, BLOCK_SIZE / 2, radius).fill(0xffffff);
                g.circle(BLOCK_SIZE * 2 / 3, BLOCK_SIZE / 2, radius).fill(0xffffff);
            },
            (g: PIXI.Graphics) => { // T: Hollow Diamond
                const size = BLOCK_SIZE / 2;
                const center = BLOCK_SIZE / 2;
                g.moveTo(center, center - size / 2)
                 .lineTo(center + size / 2, center)
                 .lineTo(center, center + size / 2)
                 .lineTo(center - size / 2, center)
                 .closePath()
                 .stroke({ width: 3, color: 0xffffff });
            },
            (g: PIXI.Graphics) => { // Z: Two Vertical Circles
                const radius = BLOCK_SIZE / 6;
                g.circle(BLOCK_SIZE / 2, BLOCK_SIZE / 3, radius).fill(0xffffff);
                g.circle(BLOCK_SIZE / 2, BLOCK_SIZE * 2 / 3, radius).fill(0xffffff);
            },
        ];

        patterns.forEach((p, index) => {
            if (index === 0 || !p) {
                this.patternTextures.push(PIXI.Texture.EMPTY);
                return;
            }
            const g = new PIXI.Graphics();
            // Set the bounds of the texture to the full block size by drawing a transparent rectangle.
            // This ensures the pattern is centered within the texture.
            g.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE).fill({ color: 0xffffff, alpha: 0 });
            p(g); // Now draw the actual pattern on top.
            const texture = this.app.renderer.generateTexture(g);
            this.patternTextures.push(texture);
            g.destroy();
        });
    }

    private initBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                // Base color block
                const block = new PIXI.Graphics();
                block.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE);
                this.boardContainer.addChild(block);
                this.boardBlocks.push(block);

                // Pattern sprite (overlay)
                const patternSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                patternSprite.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE);
                patternSprite.visible = false;
                this.boardContainer.addChild(patternSprite);
                this.patternSprites.push(patternSprite);
            }
        }
        this.pieceOutlineContainer = new PIXI.Graphics();
        this.boardContainer.addChild(this.pieceOutlineContainer);
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
            }
        }
    }

    private setupSubscriptions() {
        renderAPI.on('snapshot', (snapshot) => {
            this.lastSnapshot = snapshot;
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
        if (!this.app.renderer) return; // Guard against calls before renderer is ready

        const { colorPalette, highContrast, distinctPatterns, pieceOutline, solidPieces } = this.visualSettings;
        console.log('drawBoard pieceOutline:', pieceOutline);
        const colors = THEMES[colorPalette] || THEMES.default;
        const bgColor = highContrast ? 0x000000 : colors[0];
        const strokeColor = highContrast ? 0xFFFFFF : 0x333333;

        this.app.renderer.background.color = bgColor;
        this.pieceOutlineContainer.clear();

        const board = new Uint8Array(snapshot.boardBuffer);
        for (let i = 0; i < board.length; i++) {
            const colorIndex = board[i];
            const block = this.boardBlocks[i];
            const patternSprite = this.patternSprites[i];
            
            block.clear();
            block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
            block.fill(colors[colorIndex]);
            block.stroke({ width: BORDER_WIDTH, color: strokeColor, alpha: 0.5 });

            if (distinctPatterns && colorIndex > 0) {
                patternSprite.texture = this.patternTextures[colorIndex];
                patternSprite.visible = true;
            } else {
                patternSprite.visible = false;
            }
        }

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
                            const patternSprite = this.patternSprites[blockIndex];

                            block.clear();
                            block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
                            block.fill(colors[piece.colorIndex]);
                            if (!solidPieces) {
                                block.stroke({ width: BORDER_WIDTH, color: strokeColor, alpha: 0.5 });
                            }

                            if (distinctPatterns && piece.colorIndex > 0) {
                                patternSprite.texture = this.patternTextures[piece.colorIndex];
                                patternSprite.visible = true;
                            } else {
                                patternSprite.visible = false;
                            }
                        }
                    }
                }
            }

            if (pieceOutline) {
                this.pieceOutlineContainer.clear();
                this.pieceOutlineContainer.setStrokeStyle({ width: 3, color: 0xFFFFFF, alpha: 1 });

                for (let r = 0; r < shapeSize; r++) {
                    for (let c = 0; c < shapeSize; c++) {
                        if (matrix[r * shapeSize + c]) {
                            const boardX = piece.x + c;
                            const boardY = piece.y + r;
                            const screenX = boardX * BLOCK_SIZE;
                            const screenY = boardY * BLOCK_SIZE;

                            // Check top
                            if (r === 0 || !matrix[(r - 1) * shapeSize + c]) {
                                this.pieceOutlineContainer.moveTo(screenX, screenY);
                                this.pieceOutlineContainer.lineTo(screenX + BLOCK_SIZE, screenY);
                            }
                            // Check bottom
                            if (r === shapeSize - 1 || !matrix[(r + 1) * shapeSize + c]) {
                                this.pieceOutlineContainer.moveTo(screenX, screenY + BLOCK_SIZE);
                                this.pieceOutlineContainer.lineTo(screenX + BLOCK_SIZE, screenY + BLOCK_SIZE);
                            }
                            // Check left
                            if (c === 0 || !matrix[r * shapeSize + (c - 1)]) {
                                this.pieceOutlineContainer.moveTo(screenX, screenY);
                                this.pieceOutlineContainer.lineTo(screenX, screenY + BLOCK_SIZE);
                            }
                            // Check right
                            if (c === shapeSize - 1 || !matrix[r * shapeSize + (c + 1)]) {
                                this.pieceOutlineContainer.moveTo(screenX + BLOCK_SIZE, screenY);
                                this.pieceOutlineContainer.lineTo(screenX + BLOCK_SIZE, screenY + BLOCK_SIZE);
                            }
                        }
                    }
                }
                this.pieceOutlineContainer.stroke();
            } else {
                this.pieceOutlineContainer.clear();
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