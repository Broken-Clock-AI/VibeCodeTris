// src/renderer/animations/types.ts
import { PixiRenderer } from '../pixiRenderer';

export interface LineClearAnimation {
    // A unique name for the animation, used for selection.
    name: string;
    
    /**
     * Called every frame during the line clear animation.
     * @param progress - A value from 0 to 1 indicating the animation's progress.
     * @param clearedLines - An array of the row indices that were cleared.
     * @param renderer - The main PixiRenderer instance, providing access to blocks, sprites, etc.
     */
    animate(progress: number, clearedLines: number[], renderer: PixiRenderer): void;

    /**
     * Called once before the animation sequence begins for a set of cleared lines.
     * Useful for setting up initial states.
     * @param clearedLines - An array of the row indices that were cleared.
     * @param renderer - The main PixiRenderer instance.
     */
    onStart?(clearedLines: number[], renderer: PixiRenderer): void;

    /**
     * Called once after the animation sequence ends.
     * Useful for cleanup.
     * @param clearedLines - An array of the row indices that were cleared.
     * @param renderer - The main PixiRenderer instance.
     */
    onEnd?(clearedLines: number[], renderer: PixiRenderer): void;
}
