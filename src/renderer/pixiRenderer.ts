// src/renderer/pixiRenderer.ts
import * as PIXI from 'pixi.js';
import { renderAPI } from './renderAPI';
import { COLS, ROWS } from '../logic/constants';
import { GameEvent, Snapshot, GameStatus } from '../logic/types';
import { UIStateManager, UIState, VisualSettings } from '../ui/state';
import { AccessibilityManager } from '../ui/accessibility';
import { AudioEngine } from '../audio/AudioEngine';

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

const LINE_CLEAR_DELAY_TICKS = 28; // Must match engine value

export class PixiRenderer {
    public app: PIXI.Application;
    private boardContainer: PIXI.Container;
    private pieceOutlineContainer: PIXI.Graphics;
    private lineClearContainer: PIXI.Graphics;
    private boardBlocks: PIXI.Graphics[] = [];
    private patternSprites: PIXI.Sprite[] = [];
    private uiManager: UIStateManager;
    private accessibilityManager: AccessibilityManager;
    private audioEngine: AudioEngine; // Added AudioEngine
    private lastAnnouncedLevel: number = 1;
    private visualSettings: VisualSettings;
    private patternTextures: PIXI.Texture[] = [];
    private lastSnapshot: Snapshot | null = null;

    private constructor(uiManager: UIStateManager, accessibilityManager: AccessibilityManager, initialSettings: VisualSettings, audioEngine: AudioEngine) {
        this.app = new PIXI.Application();
        this.boardContainer = new PIXI.Container();
        this.pieceOutlineContainer = new PIXI.Graphics();
        this.lineClearContainer = new PIXI.Graphics();
        this.uiManager = uiManager;
        this.accessibilityManager = accessibilityManager;
        this.visualSettings = initialSettings;
        this.audioEngine = audioEngine; // Assign AudioEngine
    }

    public static async create(
        container: HTMLElement, 
        uiManager: UIStateManager, 
        accessibilityManager: AccessibilityManager,
        audioEngine: AudioEngine // Added AudioEngine to create method
    ): Promise<PixiRenderer> {
        const initialSettings = uiManager.getVisualSettings();
        const renderer = new PixiRenderer(uiManager, accessibilityManager, initialSettings, audioEngine);
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
            g.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE).fill({ color: 0xffffff, alpha: 0 });
            p(g);
            const texture = this.app.renderer.generateTexture(g);
            this.patternTextures.push(texture);
            g.destroy();
        });
    }

    private initBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const block = new PIXI.Graphics();
                block.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE);
                this.boardContainer.addChild(block);
                this.boardBlocks.push(block);

                const patternSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                patternSprite.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE);
                patternSprite.visible = false;
                this.boardContainer.addChild(patternSprite);
                this.patternSprites.push(patternSprite);
            }
        }
        this.boardContainer.addChild(this.pieceOutlineContainer);
        this.boardContainer.addChild(this.lineClearContainer);
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

            const scoreEl = document.getElementById('score-value');
            const levelEl = document.getElementById('level-value');
            const linesEl = document.getElementById('lines-value');

            if (scoreEl) scoreEl.textContent = snapshot.score.toString();
            if (levelEl) levelEl.textContent = snapshot.level.toString();
            if (linesEl) linesEl.textContent = snapshot.lines.toString();
            
            if (snapshot.status === GameStatus.GameOver) {
                this.uiManager.changeState(UIState.GameOver);
                const finalScoreEl = document.getElementById('final-score');
                if (finalScoreEl) {
                    finalScoreEl.textContent = snapshot.score.toString();
                }
                this.audioEngine.handleSnapshot(snapshot);
                this.app.ticker.stop();
                return;
            }

            this.drawBoard(snapshot);
            this.handleGameEvents(snapshot.events);
            this.audioEngine.handleSnapshot(snapshot);
        });

        renderAPI.on('log', (log) => {
            console.log(`[WORKER LOG ${log.level.toUpperCase()}]: ${log.msg}`);
        });

        renderAPI.on('fatal', (fatal) => {
            console.error(`[WORKER FATAL]: ${fatal.error}`);
            this.app.ticker.stop();
        });
    }

    private drawBlock(block: PIXI.Graphics, color: number, colorIndex: number, solid: boolean) {
        const { blockStyle, highContrast } = this.visualSettings;
        const strokeColor = highContrast ? 0xFFFFFF : 0x333333;

        block.clear();

        switch (blockStyle) {
            case 'classic':
                const darkColor = new PIXI.Color(color).multiply(0.6).toNumber();
                const lightColor = new PIXI.Color(color).multiply(1.4).toNumber();
                block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE).fill(color);
                block.moveTo(0, BLOCK_SIZE).lineTo(0, 0).lineTo(BLOCK_SIZE, 0).stroke({ width: 3, color: lightColor });
                block.moveTo(BLOCK_SIZE, 0).lineTo(BLOCK_SIZE, BLOCK_SIZE).lineTo(0, BLOCK_SIZE).stroke({ width: 3, color: darkColor });
                break;
            
            case 'nes':
                block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE).fill(color);
                if (colorIndex > 0) {
                    block.rect(4, 4, 6, 6).fill(0xFFFFFF);
                }
                block.stroke({ width: BORDER_WIDTH, color: 0x000000, alpha: 1 });
                break;

            case 'faceted-gem':
                if (colorIndex > 0) {
                    const r = (color >> 16) & 0xFF;
                    const g = (color >> 8) & 0xFF;
                    const b = color & 0xFF;
                    const clamp = (val: number) => Math.min(255, Math.floor(val));
                    const highlightColor = (clamp(r * 1.5) << 16) + (clamp(g * 1.5) << 8) + clamp(b * 1.5);
                    const lightColor = (clamp(r * 1.2) << 16) + (clamp(g * 1.2) << 8) + clamp(b * 1.2);
                    const midToneColor = (clamp(r * 0.9) << 16) + (clamp(g * 0.9) << 8) + clamp(b * 0.9);
                    const shadowColor = (clamp(r * 0.6) << 16) + (clamp(g * 0.6) << 8) + clamp(b * 0.6);
                    const borderColor = (clamp(r * 0.5) << 16) + (clamp(g * 0.5) << 8) + clamp(b * 0.5);
                    const center = BLOCK_SIZE / 2;
                    block.moveTo(0, 0).lineTo(center, center).lineTo(0, BLOCK_SIZE).closePath().fill(highlightColor);
                    block.moveTo(0, 0).lineTo(BLOCK_SIZE, 0).lineTo(center, center).closePath().fill(lightColor);
                    block.moveTo(BLOCK_SIZE, 0).lineTo(BLOCK_SIZE, BLOCK_SIZE).lineTo(center, center).closePath().fill(midToneColor);
                    block.moveTo(0, BLOCK_SIZE).lineTo(center, center).lineTo(BLOCK_SIZE, BLOCK_SIZE).closePath().fill(shadowColor);
                    block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE).stroke({ width: BORDER_WIDTH, color: borderColor, alpha: 1 });
                }
                break;

            case 'modern':
            default:
                block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
                block.fill(color);
                if (!solid || colorIndex === 0) {
                    block.stroke({ width: BORDER_WIDTH, color: strokeColor, alpha: 0.5 });
                }
                break;
        }
    }

    private drawBoard(snapshot: Snapshot) {
        if (!this.app.renderer) return;

        const { colorPalette, highContrast, distinctPatterns, pieceOutline, solidPieces, isGhostPieceEnabled } = this.visualSettings;
        const colors = THEMES[colorPalette] || THEMES.default;
        const bgColor = highContrast ? 0x000000 : colors[0];

        this.app.renderer.background.color = bgColor;
        this.pieceOutlineContainer.clear();
        this.lineClearContainer.clear();

        const board = new Uint8Array(snapshot.boardBuffer);

        // 1. Draw the entire board from the buffer, ensuring all blocks are visible initially.
        for (let i = 0; i < board.length; i++) {
            const colorIndex = board[i];
            const block = this.boardBlocks[i];
            const patternSprite = this.patternSprites[i];
            
            block.visible = true; // Ensure visibility before drawing
            this.drawBlock(block, colors[colorIndex], colorIndex, solidPieces);

            if (distinctPatterns && colorIndex > 0) {
                patternSprite.texture = this.patternTextures[colorIndex];
                patternSprite.visible = true;
            } else {
                patternSprite.visible = false;
            }
        }

        // 2. If in LineClearAnimation state, apply the "center-out" hiding effect.
        if (snapshot.status === GameStatus.LineClearAnimation && snapshot.clearedLines) {
            const progress = 1 - (snapshot.lineClearDelay / LINE_CLEAR_DELAY_TICKS); // Progress from 0 to 1
            const step = Math.floor(progress * (COLS / 2 + 1)); // Determine how many pairs of blocks to hide

            for (const row of snapshot.clearedLines) {
                for (let i = 0; i < COLS / 2; i++) {
                    if (i < step) {
                        // Calculate columns from the center outwards
                        const leftCol = Math.floor(COLS / 2) - 1 - i;
                        const rightCol = Math.ceil(COLS / 2) + i;

                        // Hide the blocks
                        const leftIndex = row * COLS + leftCol;
                        if (leftIndex >= 0 && leftIndex < this.boardBlocks.length) {
                            this.boardBlocks[leftIndex].visible = false;
                            this.patternSprites[leftIndex].visible = false;
                        }

                        const rightIndex = row * COLS + rightCol;
                        if (rightIndex >= 0 && rightIndex < this.boardBlocks.length) {
                            this.boardBlocks[rightIndex].visible = false;
                            this.patternSprites[rightIndex].visible = false;
                        }
                    }
                }
            }
        }

        // 3. Draw the current piece and ghost piece over the board state.
        if (snapshot.current) {
            const piece = snapshot.current;
            const matrix = new Uint8Array(piece.matrix);
            const shapeSize = Math.sqrt(matrix.length);

            // Draw Ghost Piece
            if (isGhostPieceEnabled && piece.ghostY !== undefined && piece.ghostY > piece.y) {
                for (let r = 0; r < shapeSize; r++) {
                    for (let c = 0; c < shapeSize; c++) {
                        if (matrix[r * shapeSize + c]) {
                            const boardX = piece.x + c;
                            const boardY = piece.ghostY + r;
                            const blockIndex = boardY * COLS + boardX;

                            if (blockIndex >= 0 && blockIndex < this.boardBlocks.length && this.boardBlocks[blockIndex].visible) {
                                const block = this.boardBlocks[blockIndex];
                                block.clear();
                                block.rect(0, 0, BLOCK_SIZE, BLOCK_SIZE);
                                block.fill({ color: colors[piece.colorIndex], alpha: 0.4 });
                                if (!solidPieces) {
                                    block.stroke({ width: BORDER_WIDTH, color: 0x333333, alpha: 0.2 });
                                }
                            }
                        }
                    }
                }
            }

            // Draw Current Piece
            for (let r = 0; r < shapeSize; r++) {
                for (let c = 0; c < shapeSize; c++) {
                    if (matrix[r * shapeSize + c]) {
                        const boardX = piece.x + c;
                        const boardY = piece.y + r;
                        const blockIndex = boardY * COLS + boardX;
                        
                        if (blockIndex >= 0 && blockIndex < this.boardBlocks.length) {
                            const block = this.boardBlocks[blockIndex];
                            const patternSprite = this.patternSprites[blockIndex];

                            block.visible = true;
                            this.drawBlock(block, colors[piece.colorIndex], piece.colorIndex, solidPieces);

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

            // Draw Piece Outline
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

                            // Draw lines on the outer edges of the piece
                            if (r === 0 || !matrix[(r - 1) * shapeSize + c]) { // Top edge
                                this.pieceOutlineContainer.moveTo(screenX, screenY).lineTo(screenX + BLOCK_SIZE, screenY);
                            }
                            if (r === shapeSize - 1 || !matrix[(r + 1) * shapeSize + c]) { // Bottom edge
                                this.pieceOutlineContainer.moveTo(screenX, screenY + BLOCK_SIZE).lineTo(screenX + BLOCK_SIZE, screenY + BLOCK_SIZE);
                            }
                            if (c === 0 || !matrix[r * shapeSize + (c - 1)]) { // Left edge
                                this.pieceOutlineContainer.moveTo(screenX, screenY).lineTo(screenX, screenY + BLOCK_SIZE);
                            }
                            if (c === shapeSize - 1 || !matrix[r * shapeSize + (c + 1)]) { // Right edge
                                this.pieceOutlineContainer.moveTo(screenX + BLOCK_SIZE, screenY).lineTo(screenX + BLOCK_SIZE, screenY + BLOCK_SIZE);
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
        const settings = this.uiManager.getVisualSettings();
        renderAPI.start(seed, settings);
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