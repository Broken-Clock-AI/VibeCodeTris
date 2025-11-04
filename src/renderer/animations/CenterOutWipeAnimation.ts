// src/renderer/animations/CenterOutWipeAnimation.ts
import { LineClearAnimation } from './types';
import { PixiRenderer } from '../pixiRenderer';
import { COLS } from '../../logic/constants';

export class CenterOutWipeAnimation implements LineClearAnimation {
    name = 'Center-Out Wipe';

    animate(progress: number, clearedLines: number[], renderer: PixiRenderer): void {
        const step = Math.floor(progress * (COLS / 2 + 1));

        for (const row of clearedLines) {
            for (let i = 0; i < COLS / 2; i++) {
                if (i < step) {
                    // Calculate columns from the center outwards
                    const leftCol = Math.floor(COLS / 2) - 1 - i;
                    const rightCol = Math.ceil(COLS / 2) + i;

                    // Hide the blocks
                    const leftIndex = row * COLS + leftCol;
                    if (leftIndex >= 0 && leftIndex < renderer.boardBlocks.length) {
                        renderer.boardBlocks[leftIndex].visible = false;
                        renderer.patternSprites[leftIndex].visible = false;
                    }

                    const rightIndex = row * COLS + rightCol;
                    if (rightIndex >= 0 && rightIndex < renderer.boardBlocks.length) {
                        renderer.boardBlocks[rightIndex].visible = false;
                        renderer.patternSprites[rightIndex].visible = false;
                    }
                }
            }
        }
    }
}
