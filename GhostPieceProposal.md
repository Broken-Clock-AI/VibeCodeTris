# Proposal: Ghost Piece (Drop Preview) Implementation

This document outlines the proposal and implementation plan for adding a "ghost piece" or "drop preview" feature to the game.

---

## 1. Feature Description

The "ghost piece" feature provides a real-time visual indicator of where the currently falling piece will land if it were to be hard-dropped. It renders a semi-transparent or stylized silhouette of the piece at the bottom of the playfield.

This feature will be enhanced with an optional "beam" effect—a subtle visual element that connects the active piece to its ghost, further clarifying its trajectory.

Both the ghost piece and the beam effect will be toggleable in the settings menu.

---

## 2. Justification for Immediate Integration

Integrating this feature now is highly strategic for several reasons:

1.  **Significant Quality-of-Life (QoL) Enhancement:** This is a standard feature in modern Tetris-like games for a reason. It dramatically reduces player error, increases gameplay speed, and lowers the cognitive load required to play effectively. It allows for more fluid and confident piece placement.

2.  **Direct Accessibility Improvement:** By providing a clear, unambiguous preview of the piece's destination, we make the game more accessible to a wider range of players, including those with cognitive or spatial reasoning challenges. This aligns perfectly with the project's recently completed accessibility initiatives.

3.  **Leverages Existing Architecture:** The timing is ideal. The rendering engine has just been refactored to be state-driven, and the game engine already possesses the core logic needed to calculate the final drop position. Implementing the ghost piece is a natural extension of the current, flexible architecture.

4.  **High Impact, Low Risk:** The logic for this feature is self-contained and has a low risk of introducing bugs into the core engine. The visual components can be added cleanly to the renderer without disrupting existing functionality.

---

## 3. High-Level Implementation Plan

The implementation can be broken down into three main parts:

### Part 1: Engine Logic (`engine.ts`)

1.  **Calculate Ghost Position:** Create a new function, `calculateGhostPosition()`, that takes the current piece and the board state as input.
2.  This function will simulate dropping the piece one row at a time until a collision is detected. The position just before the collision is the ghost's `y` coordinate.
3.  **Add to Game Snapshot:** The ghost piece's coordinates (`ghostY`) will be added to the game state snapshot that is sent to the renderer on every tick. This ensures the renderer always has the information it needs without duplicating logic.

### Part 2: Renderer (`pixiRenderer.ts`)

1.  **Render Ghost Piece:** In the main render loop, check the game snapshot for the `ghostY` coordinate.
2.  If it exists, draw the current piece's shape at the calculated `(x, ghostY)` position.
3.  The ghost piece will be rendered with a distinct style (e.g., 50% opacity or a unique fill) to differentiate it from the active piece. This style will be managed by the theme/palette system.
4.  **(Optional) Render Beam Effect:** If the feature is enabled, render a simple visual effect (e.g., two vertical lines) stretching from the bottom of the active piece to the top of the ghost piece.

### Part 3: UI and State Management (`main.ts`, `index.html`)

1.  **Add State Flags:** Add two new boolean flags to the `UIStateManager`: `isGhostPieceEnabled` and `isBeamEffectEnabled`.
2.  **Add UI Controls:** Add two new checkboxes to the settings panel in `index.html` to control these flags.
3.  **Connect Controls:** Wire up the new checkboxes in `main.ts` to update the `UIStateManager`.
4.  **Pass State to Renderer:** The renderer will already have access to the state manager, so it can dynamically show or hide the ghost piece and beam based on the user's settings.
