# VibeCodeTris Feature List (as specified in documentation)

This document provides a comprehensive feature list synthesized from a thorough review of all project documentation, including planning, proposal, and log files. It covers implemented features, planned future work, and the project's core architectural principles.

---

### **Architectural & Core Principles**

*   **Authoritative Logic Worker:** The game's core logic runs in a separate Web Worker, ensuring the main UI thread remains responsive. The worker is the single source of truth.
*   **Guaranteed Determinism:** Every game session is 100% replayable from a seed and an input log, using a seedable integer-only PRNG and a tick-based simulation.
*   **Resilient Crash/Recovery Flow:** The engine is designed to handle worker crashes gracefully by recovering its state from the last known snapshot.
*   **Snapshot-Based Communication:** The worker emits compact, versioned, and checksum-validated snapshots of the game state to the renderer.
*   **Test-Driven Development:** A comprehensive testing strategy with unit tests, integration tests, and "golden file" replay tests.

---

### **Implemented Gameplay & UI Features**

*   **Core Tetris Mechanics:** Standard gameplay including SRS rotation, 7-bag piece randomizer, scoring, hold functionality, and a next-piece queue.
*   **Multi-Platform Controls:** Full support for keyboard, gamepad, and touch controls.
*   **Responsive UI:** A multi-screen UI (Main Menu, Settings, Game Over) that adapts to both mobile and desktop screens.
*   **Adjustable Timings:** User-configurable DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate).

---

### **Implemented Visual & Accessibility Features**

*   **Ghost Piece (Drop Preview):** A toggleable semi-transparent preview of where the current piece will land.
*   **Colorblind-Friendly Palettes:** Multiple preset color schemes for deuteranopia, protanopia, and tritanopia.
*   **High-Contrast Mode:** An alternate theme for maximum visual clarity.
*   **Distinct Piece Patterns:** Unique, high-contrast patterns on each piece to make them distinguishable without color.
*   **High-Contrast Piece Outline:** A continuous outline around the currently falling piece for better visibility.
*   **Solid Piece Shapes:** An option to render pieces as solid colors without internal block borders.
*   **Custom Block Styles:** A feature allowing users to select different visual themes for the blocks, including:
    *   **Modern:** The default style.
    *   **Classic:** A beveled, pseudo-3D style.
    *   **NES-like:** A retro style with a corner highlight.
*   **Screen Reader Support:** Key game events are announced via ARIA live regions for blind players.

---

### **Planned & Future Features**

*   **Advanced Visual Customization:**
    *   **"Faceted Gem" Block Style:** A complex, pyramid-like block style with detailed shading.
*   **Verification & Tooling:**
    *   **Replay Player:** A tool to load and watch previous game sessions, used for both player improvement and developer debugging.
    *   **UI Customization for Touch Controls:** Allow players to reposition and resize on-screen buttons.
*   **Post-MVP Polish (Optional):**
    *   **Advanced Visual Effects:** Visualizer shaders (e.g., bloom), particle effects for events.
    *   **Advanced Audio:** A dedicated audio system with WebAudio for synchronized sound effects.
*   **Expanded Accessibility Options (from `Accessibility.md`):**
    *   **Motor:** Full key remapping, one-handed layouts, and a one-button play mode.
    *   **Cognitive:** A "Zen Mode" with no game over, an increased next-piece preview, and an on-screen control reminder.
    *   **Auditory:** Visual cues for audio events and separate volume sliders.
