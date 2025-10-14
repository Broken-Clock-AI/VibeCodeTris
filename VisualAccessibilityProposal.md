# Visual Accessibility Modes: Implementation Proposal

This document outlines the plan to implement high-impact, blendable visual accessibility features. The goal is to create a radically different and customizable user experience by adding options for colorblind-friendly palettes, high-contrast rendering, and distinct piece patterns.

### **Analysis of Current State**

1.  **UI Structure (`index.html`):**
    *   The UI is static HTML with CSS.
    *   Application screens (Main Menu, Settings, etc.) are `<div>` elements toggled with a `.hidden` class.
    *   A basic settings screen (`#settings-screen`) already exists, providing a natural home for the new options.

2.  **Application Logic (`main.ts`):**
    *   This is the central hub that initializes all managers and handles DOM interactions.
    *   It is responsible for creating/destroying the renderer and managing the responsive layout.

3.  **State Management (`src/ui/state.ts`):**
    *   The `UIStateManager` currently only manages which top-level screen is visible.
    *   It does not handle fine-grained settings; these are read directly from the DOM in `main.ts`. This is a key area for improvement.

4.  **Rendering (`src/renderer/pixiRenderer.ts`):**
    *   The renderer uses PixiJS to draw the game board and pieces onto a `<canvas>`.
    *   **Colors are hardcoded** in a `COLORS` array, which is a primary target for modification.
    *   Blocks are drawn as simple `PIXI.Graphics` rectangles; there is **no current concept of textures or patterns**.

### **Proposed Plan: High-Level**

We will add three new, blendable visual customization options to the existing Settings screen:

1.  **Colorblind Palette:** A dropdown to switch between the default color scheme and several colorblind-friendly alternatives.
2.  **High-Contrast Mode:** A checkbox to toggle a high-contrast theme (e.g., darker background, brighter outlines).
3.  **Distinct Piece Patterns:** A checkbox to add unique patterns (dots, stripes) to the pieces, making them identifiable by shape alone.

### **Proposed Plan: Technical Implementation**

**Step 1: Extend the State Manager (`src/ui/state.ts`)**

This is the most important architectural change. We will create a centralized place to store and manage visual settings, moving away from direct DOM reads.

*   Create a new `VisualSettings` interface to define the shape of our settings.
*   Add an instance of this interface to the `UIStateManager`.
*   Add a new method, `updateVisualSettings(newSettings: Partial<VisualSettings>)`, to modify the settings.
*   Implement a simple pub/sub mechanism so the `PixiRenderer` can be notified of changes.

```typescript
// In src/ui/state.ts (Proposed)

export interface VisualSettings {
    colorPalette: 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    highContrast: boolean;
    distinctPatterns: boolean;
}

export class UIStateManager {
    // ... existing code ...
    private visualSettings: VisualSettings = {
        colorPalette: 'default',
        highContrast: false,
        distinctPatterns: false,
    };
    private subscribers: ((settings: VisualSettings) => void)[] = [];

    // ... existing code ...

    public updateVisualSettings(newSettings: Partial<VisualSettings>): void {
        this.visualSettings = { ...this.visualSettings, ...newSettings };
        this.subscribers.forEach(cb => cb(this.visualSettings));
    }

    public subscribeToVisualSettings(callback: (settings: VisualSettings) => void): void {
        this.subscribers.push(callback);
        callback(this.visualSettings); // Immediately notify with current state
    }
}
```

**Step 2: Update the UI (`index.html` and `main.ts`)**

*   In `index.html`, add the new controls to the `#settings-screen` div:
    *   A `<select>` dropdown for color palettes.
    *   Two `<input type="checkbox">` elements for High-Contrast Mode and Distinct Patterns.
*   In `main.ts`, add event listeners to these new elements. When they change, they will call the new `uiManager.updateVisualSettings()` method.

**Step 3: Modify the PixiJS Renderer (`src/renderer/pixiRenderer.ts`)**

The renderer will become stateless and be driven entirely by the settings in the `UIStateManager`.

*   **Subscribe to State:** The renderer will subscribe to visual settings updates from the `UIStateManager`.
    ```typescript
    // In PixiRenderer.create()
    uiManager.subscribeToVisualSettings(settings => {
        this.onVisualSettingsChanged(settings);
    });
    ```
*   **Dynamic Colors:** The hardcoded `COLORS` array will be replaced with a theme manager object that holds multiple palettes. The `onVisualSettingsChanged` method will set the active theme based on the settings.
*   **Pattern Generation:** A new private method, `generatePatternTexture(patternType: number): PIXI.Texture`, will be created. This method will:
    1.  Draw a pattern (e.g., circles, stripes) onto a small, off-screen `PIXI.Graphics` object.
    2.  Use `app.renderer.generateTexture()` to convert the drawing into a reusable `PIXI.Texture`.
    3.  Cache these textures for performance.
*   **Update `drawBoard`:** The `drawBoard` method will be updated to:
    1.  Use the currently active color palette.
    2.  If `distinctPatterns` is true, apply the appropriate cached texture to the piece's `PIXI.Graphics` object using `block.texture()` instead of `block.fill()`.
    3.  If `highContrast` is true, use a different background color and brighter stroke colors.
