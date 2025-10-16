# Development Roadmap: Visual Accessibility Foundation

**Date:** 2025-10-14

## Strategic Initiative

With the core UI shell and engine complete, the project's primary focus is now on implementing high-impact visual accessibility features. This initiative will create a radically different and customizable user experience by adding blendable options for color palettes, high-contrast rendering, and distinct piece patterns.

This plan is derived from the detailed `VisualAccessibilityProposal.md` document.

---

## The Implementation Path

### Step 1: Extend the State Manager (`src/ui/state.ts`)

*   **What:** Architect a centralized place to store and manage visual settings. This involves creating a `VisualSettings` interface, adding it to the `UIStateManager`, and implementing a simple pub/sub system to notify other modules of changes.
*   **Why:** This is the most critical architectural change. It moves settings management out of direct DOM reads and into a clean, scalable state management pattern, which is essential for keeping the renderer and UI synchronized.

### Step 2: Update the UI (`index.html` and `main.ts`)

*   **What:** Add the new UI controls to the existing Settings screen. This includes a `<select>` dropdown for color palettes and two `<input type="checkbox">` elements for High-Contrast Mode and Distinct Piece Patterns. Event listeners will be added in `main.ts` to connect these controls to the `UIStateManager`.
*   **Why:** This provides the necessary user-facing controls and wires them into our new state management system.

### Step 3: Modify the PixiJS Renderer (`src/renderer/pixiRenderer.ts`)

*   **What:** Refactor the renderer to be driven by the new visual settings state. This involves:
    1.  Subscribing to state changes from the `UIStateManager`.
    2.  Replacing the hardcoded `COLORS` array with a dynamic theme manager.
    3.  Implementing a texture generation and caching system for the "Distinct Piece Patterns" feature.
    4.  Updating the `drawBoard` logic to conditionally apply the correct colors, textures, and contrast settings based on the current state.
*   **Why:** This is the final step where the visual changes are actually implemented, making the renderer a stateless slave to the central settings.

---
## Follow-Up Features

Subsequent to the main accessibility initiative, the following features were also implemented and are now complete:

*   **High-Contrast Piece Outline:** Provides a configurable, continuous outline around the falling piece for better visibility.
*   **Solid Piece Shapes:** An option to render pieces as solid colors without internal block borders for a cleaner aesthetic.
