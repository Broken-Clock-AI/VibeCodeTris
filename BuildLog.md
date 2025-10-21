# Build Log

This file tracks the build and development process.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-20
*   **Author:** Gemini
*   **Summary:** `fix(renderer): Correct and re-enable faceted gem style`
*   **Details:**
    *   **Faceted Gem Fix:** The "Faceted Gem" block style, which had been previously reverted, is now fixed and re-enabled.
    *   The original implementation's rendering bug (blocks appearing black) was traced to incorrect manual bitwise operations for color manipulation.
    *   The rendering logic was refactored to use the robust `PIXI.Color` class for calculating facet highlights and shadows. This resolved the color calculation errors and stabilized the feature.
    *   The feature is now fully functional and has been re-enabled in the UI.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-18
*   **Author:** Gemini
*   **Summary:** `fix(renderer): Fix solid pieces rendering and revert faceted gem style`
*   **Details:**
    *   **Solid Pieces Fix:** Diagnosed and fixed a rendering bug where the "Solid Pieces" setting incorrectly removed the background grid. The `drawBlock` method was updated to ensure it always renders a border for empty cells (`colorIndex === 0`), restoring the grid while keeping the pieces solid.
    *   **Faceted Gem Reversion:** The "Faceted Gem" block style, which was causing rendering issues (blocks appearing black) and eventual crashes, has been reverted.
    *   The initial implementation failed due to incorrect color calculations. A second attempt caused a fatal crash by assuming a non-existent `toHsv` method in the PIXI.js color library.
    *   To restore stability, all uncommitted changes related to this feature were discarded using `git checkout`. The option was removed from the UI (`index.html`) and the application state (`state.ts`).
    *   A new, more robust plan (`FacetedGemImplementationPlan.md`) has been created to guide a future implementation of this feature.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-17
*   **Author:** Gemini
*   **Summary:** `feat(renderer): Implement custom block styles and fix NES style bug`
*   **Details:**
    *   Implemented a new "Custom Block Style" feature to allow users to change the visual appearance of the pieces.
    *   Added a dropdown to the settings UI with three initial styles: 'Modern' (default), 'Classic' (a beveled look), and 'NES-like' (a retro theme).
    *   The feature was integrated end-to-end, modifying the UI, the state manager, and the PixiJS renderer.
    *   Fixed a critical rendering bug in the 'NES-like' style where the highlight glint was incorrectly drawn on empty board cells.
    *   The fix involved passing the `colorIndex` to the `drawBlock` method and adding a conditional check, ensuring the highlight only appears on actual pieces.
    *   The feature is now stable and fully functional.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-15
*   **Author:** Gemini
*   **Summary:** `fix(renderer): Resolve critical bug causing invisible falling pieces`
*   **Details:**
    *   Diagnosed and fixed a critical rendering bug where the falling piece was invisible across all color palettes except the default.
    *   The root cause was a data inconsistency: the `TetrisEngine` was sending a hardcoded hex color value for the current piece, while the `PixiRenderer` expected a `colorIndex` to use with its theming system.
    *   The fix involved refactoring the engine to send a `colorIndex` instead, making the current piece's data consistent with the locked pieces on the board.
    *   The shared `Snapshot` type in `types.ts` was updated to reflect this change.
    *   The color palettes and all related visual accessibility features now function correctly.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-13
*   **Author:** Gemini
*   **Summary:** `fix(layout): Implement fully responsive, fit-to-screen UI`
*   **Details:**
    *   Overhauled the application's CSS and resize logic to create a robust, responsive layout that works on both mobile and desktop.
    *   Fixed a critical bug where mobile browser UI would overlap and hide the game's touch controls. The layout now uses `window.innerHeight` to dynamically adapt to the true visible viewport.
    *   Fixed an issue where "black gutters" would appear around the game board. The game container is now resized via JavaScript to perfectly match the canvas aspect ratio.
    *   Implemented CSS media queries to ensure the on-screen touch controls are only visible on mobile/touch devices, providing a clean interface for desktop users.
    *   The application is now fully responsive and scales correctly on all target devices without scrolling.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-13
*   **Author:** Gemini
*   **Summary:** `feat(ui): Implement gamepad controls and accessibility HUD`
*   **Details:**
    *   **Gamepad Controls:** Created a new `gamepad.ts` module using the browser's Gamepad API to provide full controller support. The implementation uses a `requestAnimationFrame` polling loop for performance and correctly handles press/release events to support DAS/ARR. The module was integrated into the `InputManager`.
    *   **Accessibility HUD:** Created a new `accessibility.ts` module to provide screen reader support. It generates a visually hidden ARIA live region that announces key game events. The `AccessibilityManager` was integrated into `main.ts` and the `PixiRenderer` to announce UI state changes (e.g., "Game Over") and in-game events (e.g., "Double line clear," "Level up").

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-13
*   **Author:** Gemini
*   **Summary:** `fix(controls): Resolve critical bug in touch swipe gestures`
*   **Details:**
    *   Diagnosed and fixed a critical bug where swipe gestures for movement (`moveLeft`, `moveRight`, `softDrop`) would cause the piece to move perpetually.
    *   The root cause was the swipe handler only sending the initial press action (e.g., `moveLeft`) without the corresponding `moveLeft_release` action, causing the engine's auto-repeat to never terminate.
    *   The fix was implemented in `touch.ts` by adding logic to the `onTouchEnd` handler that immediately schedules the corresponding `_release` action after the initial action is sent.
    *   This ensures that a swipe behaves like a quick tap, resolving the bug and making touch controls fully playable.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-12
*   **Author:** Gemini
*   **Summary:** `fix(controls): Implement and debug keyboard and touch controls`
*   **Details:**
    *   Implemented a modular `InputManager` to handle all user input, including both keyboard and touch.
    *   Added a complete hybrid touch control system (`touch.ts`) with support for on-screen virtual buttons and swipe gestures.
    *   Traced a critical bug where controls were unresponsive back to the application's entry point.
    *   Corrected `index.html` to load the main application script (`main.ts`) instead of the renderer script directly.
    *   Fixed a `SyntaxError` by exporting the `PixiRenderer` class and removing duplicated startup logic from its file.
    *   Refactored the application startup in `main.ts` to be robust and wait for the DOM to be fully loaded.
    *   The keyboard and touch controls are now fully functional, and all 13 unit and integration tests are passing.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `fix(renderer): Correct critical rendering bugs and API usage`
*   **Details:**
    *   Fixed a critical rendering bug where falling pieces were invisible until they locked. The renderer was incorrectly using the piece's final color value as an index into the color palette.
    *   Resolved all PixiJS v8 deprecation warnings by updating the graphics drawing methods (`beginFill`, `lineStyle`, `drawRect`) to the modern API (`fill`, `stroke`, `rect`).
    *   Fixed a TypeScript error in the `destroy` method by removing an invalid `basePath` property from the options.
    *   The renderer is now stable, warning-free, and correctly displays all game elements.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(renderer): Implement visual renderer and fix critical bugs`
*   **Details:**
    *   Set up the frontend build system using Vite and installed PixiJS.
    *   Created the `RenderAPI` to act as a bridge between the UI and the logic worker.
    *   Implemented an MVP `PixiRenderer` that draws the game board and pieces based on snapshots from the worker.
    *   Fixed a critical bug related to incorrect asynchronous initialization in PixiJS v8.
    *   Refactored the logic worker to be fully browser-compatible by removing Node.js-specific APIs.
    *   Fixed a fatal "detached ArrayBuffer" crash by ensuring the engine sends a *copy* of the board state to the renderer.
    *   The result is a fully functional, end-to-end pipeline with a visible, running game.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(worker): Implement resilient worker and communication layer`
*   **Details:**
    *   Implemented a fully isomorphic message router in `worker.ts` to handle the engine lifecycle, user input, and crash recovery.
    *   Added robust snapshot validation in `recover.ts`, including checksum and version checks, to ensure data integrity.
    *   Updated the `TetrisEngine` to produce verifiable snapshots with checksums and to handle user input.
    *   Created a suite of integration tests (`worker.test.ts`) to verify the entire worker lifecycle, including start, recovery, and message sequencing.
    *   Fixed all related TypeScript and logic bugs, resulting in all 13 tests passing.
    *   This commit completes Phase 2 of the project plan.

**Commit: `ea07e22`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(engine): Implement line clearing and scoring logic`
*   **Details:**
    *   Aligned core data structures (`types.ts`) and engine snapshots with the refined project specification.
    *   Implemented line clearing and scoring logic in the engine.
    *   Added a unit test to verify the new gameplay mechanics.
    *   Scaffolded `worker.ts` and `recover.ts` for Phase 2.
    *   All tests are passing, marking the completion of Phase 1.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(engine): Implement gravity and piece locking`
*   **Details:**
    *   Implemented the core gravity loop in the engine's `tick()` method.
    *   Added piece locking and merging logic to the board.
    *   Added and refined unit tests for gravity and locking behavior.
    *   Diagnosed and fixed a critical bug in the `isValidPosition` function that was causing incorrect collision detection.
    *   All unit tests are now passing, confirming the core mechanics are working deterministically.

**Commit: `[Will be generated]`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(engine): Implement 7-bag and piece spawning`
*   **Details:**
    *   Implemented the deterministic 7-bag piece generator using the PRNG.
    *   Added piece spawning logic to the.
    *   Refactored the engine to spawn the first piece on the first tick, not in the constructor.
    *   Added and updated unit tests to verify the bag's determinism and correct piece spawning.
    *   All tests passed successfully.

**Commit: `cbd6bfa`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(logic): Implement Phase 1 core logic and tests`
*   **Details:**
    *   Added initial implementations for `rng.ts`, `rules.ts`, and `engine.ts`.
    *   Created unit tests for each of the core logic modules.
    *   Set up the TypeScript environment with `ts-node` and a `tsconfig.json`.
    *   Fixed a bug in the rotation test and verified all tests pass.
    *   This commit completes the initial scaffolding of the deterministic core engine as outlined in Phase 1 of the project plan.

**Commit: `72a2561`**
*   **Date:** 2025-10-10
*   **Author:** Gemini
*   **Summary:** `feat(logic): Scaffold core data structures and constants`
*   **Details:**
    *   Created `types.ts` with the fully-defined `Snapshot` and `GameEvent` schemas, establishing the core data contract for the.
    *   Created `constants.ts` to define game parameters like TPS, DAS, ARR, and board dimensions.
    *   These files align with the refined project specification and form the foundation for the deterministic engine.

**Commit: `6ee6387`**
*   **Date:** 2025-10-10
*   **Author:** Guy Incognito
*   **Summary:** `feat(project): Create build logs and archive superseded documents`
*   **Details:**
    *   Initial project setup.

**Commit: `fd5a8d1`**
*   **Date:** 2025-10-10
*   **Author:** Guy Incognito
*   **Summary:** `Initial commit: Project kickoff and planning documents`
*   **Details:**
    *   Initial commit of project planning documents.