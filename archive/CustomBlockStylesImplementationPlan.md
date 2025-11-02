# Custom Block Style Feature: Implementation Plan

This document outlines the strategy to implement a "Custom Block Style" feature, allowing users to change the visual appearance of the Tetris pieces (minos).

### **High-Level Goal**

The primary objective is to introduce a new dropdown menu in the settings that allows users to select a "block style." This selection will change the visual appearance of the Tetris pieces during gameplay, enabling styles that pay tribute to classic versions of the game.

---

### **Detailed Implementation Plan**

The plan will be executed in four distinct phases to ensure a clean and robust implementation.

#### **Phase 1: Update the User Interface (`index.html`)**

This phase focuses on creating the UI element for user interaction.

1.  **Locate Settings Panel:** Find the `<div id="settings-screen">` section in `index.html`.
2.  **Insert New Setting:** Add a new `<div class="setting">` immediately after the "Color Palette" dropdown.
3.  **Create Dropdown:** Inside this new container, create:
    *   A `<label>` with the text "Custom Block Style".
    *   A `<select>` element with the ID `block-style-select`.
4.  **Add Style Options:** Populate the dropdown with the following options:
    *   `<option value="modern">Modern</option>` (The current default look)
    *   `<option value="classic">Classic</option>` (A style with a simple inner bevel)
    *   `<option value="nes">NES-like</option>` (A style mimicking original NES Tetris blocks)

---

#### **Phase 2: Update the State Manager (`src/ui/state.ts`)**

This phase makes the application's state management system aware of the new setting.

1.  **Extend `VisualSettings` Interface:** Add a new property `blockStyle` to the `VisualSettings` interface. Its type will be `'modern' | 'classic' | 'nes'`.
2.  **Set Default Value:** In the `UIStateManager` class, update the initial `visualSettings` object to include `blockStyle: 'modern'` as the default.

---

#### **Phase 3: Connect UI to State (`src/main.ts`)**

This phase wires the new dropdown to the state manager.

1.  **Get Element:** Get a reference to the `<select>` element using `document.getElementById('block-style-select')`.
2.  **Add Event Listener:** Attach a `'change'` event listener to the element.
3.  **Update State on Change:** The listener's callback will call `uiManager.updateVisualSettings()` with the new style value (e.g., `{ blockStyle: 'classic' }`), which will automatically notify the renderer of the change.

---

#### **Phase 4: Implement Rendering Logic (`src/renderer/pixiRenderer.ts`)**

This is the final phase, where the visual changes are implemented.

1.  **Modify `drawBoard` Method:** Locate the `drawBoard` method, which is responsible for drawing all blocks.
2.  **Conditional Drawing Logic:** Inside the loop that draws each block, add a `switch` statement based on the value of `this.visualSettings.blockStyle`.
3.  **Implement Each Style:**
    *   **`case 'modern':`** This will contain the existing drawing code (a filled rectangle with a simple border).
    *   **`case 'classic':`** Use `PIXI.Graphics` to draw a beveled effect. This involves drawing a base color, then thin, lighter-colored lines on the top/left inner edges and darker lines on the bottom/right inner edges to create a subtle 3D look.
    *   **`case 'nes':`** Draw the solid base color of the block, then draw a small, white `4x4` pixel square on top, offset from the top-left corner, to mimic the "glint" from the original NES game.
