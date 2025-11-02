# Piece Outline Implementation Plan

**Status: Implemented (2025-10-15)**

This feature has been successfully implemented. For details on the implementation and the debugging process (including the migration from Pixi.js v7 to v8 APIs), please see the `ProgressLog.md`.

---

This document outlines the technical plan for implementing a high-contrast, continuous outline around the currently falling tetromino.

## The Goal

The objective is to draw a single, continuous, high-contrast border around the *entire perimeter* of the currently falling piece, rather than around each of its individual blocks. This outline must update correctly with every movement and rotation.

---

## The Plan: A Step-by-Step Implementation

### Step 1: State Management & UI (The Foundation)

This part follows the established pattern for adding new visual settings.

1.  **Update State (`src/ui/state.ts`):** Add a new boolean property, `pieceOutline`, to the `VisualSettings` interface.
2.  **Update UI (`index.html`):** Add a new checkbox to the Settings screen, labeled "High-Contrast Piece Outline".
3.  **Connect UI (`src/main.ts`):** Add an event listener to the new checkbox that calls `uiManager.updateVisualSettings({ pieceOutline: checkbox.checked })`.

### Step 2: New Rendering Layer (The Canvas)

To avoid interfering with the existing block rendering, a new, dedicated layer will be created in the renderer specifically for the outline.

1.  In `src/renderer/pixiRenderer.ts`, a new class property will be added:
    ```typescript
    private pieceOutlineContainer: PIXI.Graphics;
    ```
2.  During initialization (`initBoard`), this object will be created and added to the main stage:
    ```typescript
    this.pieceOutlineContainer = new PIXI.Graphics();
    this.boardContainer.addChild(this.pieceOutlineContainer);
    ```
    This object will act as a transparent canvas that sits on top of the colored blocks, used only for drawing the outline.

### Step 3: The Outline Calculation Algorithm (The Core Logic)

This is the most critical part. Inside the `drawBoard` function, right after drawing the current piece's blocks, this algorithm will run if the `pieceOutline` setting is enabled.

1.  **Clear the Old Outline:** The first step is always to erase the previous frame's outline:
    ```typescript
    this.pieceOutlineContainer.clear();
    ```

2.  **Iterate Through Each Block of the Piece:** The logic will loop through the piece's 2D matrix (e.g., the 3x3 or 4x4 grid that defines its shape).

3.  **Check Neighbors:** For each block that is part of the piece (i.e., not an empty space in the matrix), the algorithm will check its four adjacent neighbors *within the piece's own matrix*.
    *   **Check Above:** Is the space directly above the current block empty? If **yes**, then the top edge of the current block is an exterior edge. A line will be drawn there.
    *   **Check Below:** Is the space below empty? If **yes**, draw the bottom edge.
    *   **Check Left:** Is the space to the left empty? If **yes**, draw the left edge.
    *   **Check Right:** Is the space to the right empty? If **yes**, draw the right edge.

4.  **Draw the Lines:** "Drawing an edge" means using the `PIXI.Graphics` commands. For example, to draw the top edge of a block at board position `(x, y)`:
    ```typescript
    // Set the line style (e.g., 2 pixels wide, bright white)
    this.pieceOutlineContainer.stroke({ width: 2, color: 0xFFFFFF });

    // Draw the line for the top edge
    const screenX = x * BLOCK_SIZE;
    const screenY = y * BLOCK_SIZE;
    this.pieceOutlineContainer.moveTo(screenX, screenY);
    this.pieceOutlineContainer.lineTo(screenX + BLOCK_SIZE, screenY);
    ```
    This process will be repeated for all identified exterior edges.

This algorithm guarantees that only the true perimeter of the shape is drawn, resulting in a single, clean outline, regardless of the piece's shape or rotation.
