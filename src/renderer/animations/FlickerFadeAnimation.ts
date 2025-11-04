// src/renderer/animations/FlickerFadeAnimation.ts
import { LineClearAnimation } from './types';
import { PixiRenderer } from '../pixiRenderer';
import { COLS } from '../../logic/constants';

export class FlickerFadeAnimation implements LineClearAnimation {
    name = 'Flicker & Fade';

    animate(progress: number, clearedLines: number[], renderer: PixiRenderer): void {
        // Flash white for the first part of the animation
        const isFlashing = progress < 0.6 && Math.floor(progress * 20) % 2 === 0;
        const alpha = 1 - progress; // Fade out over the duration

        for (const row of clearedLines) {
            for (let col = 0; col < COLS; col++) {
                const index = row * COLS + col;
                const block = renderer.boardBlocks[index];
                const sprite = renderer.patternSprites[index];

                if (block) {
                    block.alpha = alpha;
                    if (isFlashing) {
                        block.tint = 0xFFFFFF;
                    }
                }
                if (sprite) {
                    sprite.alpha = alpha;
                     if (isFlashing) {
                        sprite.tint = 0xFFFFFF;
                    }
                }
            }
        }
    }

    onStart(clearedLines: number[], renderer: PixiRenderer): void {
        // Ensure blocks are fully visible and untinted at the start
        this.resetBlocks(clearedLines, renderer);
    }

    onEnd(clearedLines: number[], renderer: PixiRenderer): void {
        // Reset alpha and tint so they don't affect future blocks in these positions
        this.resetBlocks(clearedLines, renderer);
    }

    private resetBlocks(clearedLines: number[], renderer: PixiRenderer): void {
        for (const row of clearedLines) {
            for (let col = 0; col < COLS; col++) {
                const index = row * COLS + col;
                const block = renderer.boardBlocks[index];
                const sprite = renderer.patternSprites[index];

                if (block) {
                    block.alpha = 1;
                    block.tint = 0xFFFFFF; // Reset tint
                }
                if (sprite) {
                    sprite.alpha = 1;
                    sprite.tint = 0xFFFFFF;
                }
            }
        }
    }
}
