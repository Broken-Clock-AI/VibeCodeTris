## Line Clear Text Integration Plan

This document outlines the plan to integrate dynamic text (e.g., "Single", "Double", "Tetris") superimposed over cleared lines during the line clear animation in VibeCodeTris.

### 1. Technical Approach & Integration:

*   **Rendering Engine:** Utilize PixiJS's `PIXI.Text` capabilities for rendering the text elements.
*   **Trigger Point:** The logic will be triggered within `src/renderer/pixiRenderer.ts`, specifically when the line clear event is received from the game engine.
*   **Positioning:** The text will be positioned dynamically based on the cleared row indices, centered horizontally on the game board and vertically on each cleared line.
*   **Animation:** A flashing effect will be implemented by animating the `alpha` (opacity) of the `PIXI.Text` object from 0 to 1 and back to 0. The timing will be synchronized with the existing line clear animation.

### 2. Implementation Steps:

1.  **Identify the Line Clear Hook:**
    *   Examine `src/renderer/pixiRenderer.ts` to locate the function responsible for initiating the line clear animation (e.g., `animateLineClear`). This function will be the entry point for triggering the text display.

2.  **Create a Text Manager/Helper Function:**
    *   Add a new private method to the `PixiRenderer` class, for example, `_showLineClearText(clearedLineCount: number, clearedRowIndices: number[]): void`.
    *   This method will be called from the line clear hook.

3.  **Generate & Style Text:**
    *   Inside `_showLineClearText`:
        *   Map `clearedLineCount` to the appropriate string: "Single" (1), "Double" (2), "Triple" (3), "Tetris" (4).
        *   For each `clearedRowIndex` in `clearedRowIndices`:
            *   Create a new `PIXI.Text` object with the determined string.
            *   Apply styling: font family (`Press Start 2P`), size (responsive, e.g., `3vmin` or `2rem`), color (e.g., `white` or a contrasting color), and alignment (`center`).
            *   Calculate the `x` and `y` coordinates to center the text over the cleared line. This will involve using the game board's dimensions and the block size.
            *   Add the `PIXI.Text` object to the PixiJS stage (e.g., `this.app.stage.addChild(textObject)`).

4.  **Animate the Text:**
    *   Integrate the text animation with the existing `AnimationManager`.
    *   Create a new animation class, e.g., `TextFlashAnimation`, that extends a base animation class or implements a specific animation interface.
    *   This `TextFlashAnimation` will manage the `alpha` property of the `PIXI.Text` object, fading it in and out over a duration that complements the line clear animation.
    *   The animation should also handle the removal of the `PIXI.Text` object from the stage once its animation is complete to prevent memory leaks and clutter.

### 3. Considerations:

*   **Setting Dependency:** The line clear text animation should only trigger if the `animatedLineClear` setting is enabled in the game's settings. This ensures consistency with user preferences for visual effects.
*   **Performance:** Ensure that creating and animating multiple text objects doesn't negatively impact performance, especially during multi-line clears. Optimize text object creation and destruction.
*   **Readability:** Choose appropriate font sizes and colors to ensure the text is clearly visible against the game background and other animations.
*   **Timing:** Synchronize the text animation with the existing line clear animation for a seamless visual experience.
*   **Accessibility:** Consider options for users who might find flashing text distracting (though this is a visual enhancement, not a core UI element).

This plan provides a structured approach to implementing the line clear text feature, ensuring it integrates well with the existing codebase and enhances the user experience.