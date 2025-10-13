// src/renderer/pixiRenderer.ts
import * as PIXI from 'pixi.js';
import { renderAPI } from './renderAPI';
import { COLS, ROWS } from '../logic/constants';
import { Snapshot } from '../logic/types';

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

    private constructor() {
        this.app = new PIXI.Application();
        this.boardContainer = new PIXI.Container();
    }

    public static async create(container: HTMLElement): Promise<PixiRenderer> {
        const renderer = new PixiRenderer();
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

    private setupSubscriptions() {
        renderAPI.on('snapshot', (snapshot) => {
            // console.log(`Received snapshot for tick: ${snapshot.tick}`);
            this.drawBoard(snapshot);
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
}