### **Project Plan: Deterministic Tetris Engine**

This plan outlines the development in logical phases, ensuring foundational components are built and tested before dependent systems are implemented.

#### **Phase 1: The Deterministic Core Engine**

**Goal:** Create a standalone, fully deterministic game engine that can be tested in isolation without any UI or worker dependencies.
**Rationale:** This is the foundational logic. By building and verifying it first, we ensure the core gameplay is solid before adding complexity.

*   **Modules & Files to be Generated:**
    *   `src/logic/constants.ts`: Will contain all game constants (DAS/ARR defaults, gravity, TPS, feature flags). Establishes configurable game parameters.
    *   `src/logic/types.ts`: Will define all shared TypeScript interfaces, primarily the canonical `Snapshot` and `Event` schemas. This is the central "contract" for the entire application.
    *   `src/logic/rng.ts`: The seedable, integer-only pseudo-random number generator with serialization. This is the heart of the game's determinism.
    *   `src/logic/rules.ts`: A pure module for game logic, including SRS rotation tables, wall-kick logic, scoring algorithms (T-Spins, back-to-back, combos), and lock semantics.
    *   `src/logic/engine.ts`: The main engine file. It will contain the deterministic `tick()` loop, manage the game state (board, pieces), integrate the `rng` and `rules` modules, and be responsible for emitting the authoritative `Snapshot` on each tick.
*   **Verification:**
    *   `src/tests/unit/`: A suite of unit tests will be created to validate each module in isolation (`rng.test.ts`, `rules.test.ts`, `engine.test.ts`).

#### **Phase 2: The Worker & Communication Layer**

**Goal:** Encapsulate the core engine within a Web Worker and establish a resilient communication channel with the main thread.
**Rationale:** This isolates the game logic from the UI, preventing the main thread from blocking and enabling robust crash/recovery.

*   **Modules & Files to be Generated:**
    *   `src/logic/recover.ts`: Will implement the snapshot validation logic, including checksum and version checks, to ensure data integrity during recovery.
    *   `src/logic/worker.ts`: The entry point for the Web Worker. It will act as the message router, handling incoming messages (`start`, `input`, `recover`), managing message sequencing (`seq`), and passing data to the `engine`. It will also contain the master try/catch for crash handling.
*   **Verification:**
    *   `src/tests/integration/worker.test.ts`: Integration tests to simulate the full crash-and-recover flow and test for message reordering or corruption.

#### **Phase 3: The Renderer & User Interface**

**Goal:** Create the visual and interactive layer that consumes data from the worker.
**Rationale:** With a stable data source from the worker, we can now focus on presentation and user input.

*   **Modules & Files to be Generated:**
    *   `src/renderer/renderAPI.ts`: A critical adapter that subscribes to messages from the worker, manages the snapshot buffer (for interpolation), and provides a clean API for the renderer to get the latest game state.
    *   `src/renderer/pixiRenderer.ts`: The main rendering logic using PixiJS. It will draw the board, ghost piece, HUD, and interpolate piece movements between snapshots for smoothness.
    *   `src/ui/controls.tsx`: Will handle all user input (keyboard and touch), mapping raw browser events to game actions and posting them to the worker.
    *   `src/ui/settings.tsx`: (As specified in docs) A component for user-configurable settings (e.g., controls, audio levels).
    *   `src/ui/accessibility.ts`: Will manage ARIA attributes for the HUD and provide screen-reader-friendly summaries of the game state.
    *   `index.html`: The main entry point for the application.
    *   `vite.config.ts`: The build configuration for the project.
*   **Verification:**
    *   Manual testing of the UI and rendering. Unit tests for input handling logic.

#### **Phase 4: Verification, Tooling & Polish**

**Goal:** Implement the final layer of testing and provide tools for debugging and verification.
**Rationale:** This phase ensures the entire system is behaving deterministically from end-to-end and provides the means to prove it.

*   **Modules & Files to be Generated:**
    *   `src/tools/replayPlayer.ts`: A tool to load a seed and an input log to deterministically replay a full game session.
    *   `src/tests/integration/replay.test.ts`: The "golden file" testing suite. It will use the `replayPlayer` to run predefined game sessions and assert that the final board state matches a known-good "golden" hash.
*   **Post-MVP Polish (Optional, as per feature flags):**
    *   `src/renderer/shaders/`: Directory for optional GLSL shaders for the "Visualizer" mode.

---

### **Exhaustive File Manifest Forecast**

This is the complete list of all files that will be generated to deliver the project as specified.

`
.
├── index.html
├── vite.config.ts
└── src
    ├── logic
    │   ├── constants.ts
    │   ├── engine.ts
    │   ├── recover.ts
    │   ├── rng.ts
    │   ├── rules.ts
    │   ├── types.ts
    │   └── worker.ts
    ├── renderer
    │   ├── pixiRenderer.ts
    │   ├── renderAPI.ts
    │   └── shaders/
    │       └── (Optional post-MVP files like bloom.glsl)
    ├── tests
    │   ├── integration
    │   │   ├── replay.test.ts
    │   │   └── worker.test.ts
    │   └── unit
    │       ├── engine.test.ts
    │       ├── recover.test.ts
    │       ├── rng.test.ts
    │       └── rules.test.ts
    ├── tools
    │   └── replayPlayer.ts
    └── ui
        ├── accessibility.ts
        ├── controls.tsx
        └── settings.tsx
`
