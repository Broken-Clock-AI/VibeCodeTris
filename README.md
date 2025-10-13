# VibeCodeTris: A Deterministic Tetris Engine

This repository contains the source code for a fully deterministic, worker-authoritative Tetris engine built with TypeScript. The project prioritizes determinism, replayability, and a clean separation between game logic and rendering.

---
## Current Status (As of October 2025)

The project is currently in the middle of **Phase 3**.

*   ✅ **Phase 1: Core Engine** - Complete. The deterministic logic is fully implemented and unit-tested.
*   ✅ **Phase 2: Worker Layer** - Complete. The engine runs successfully in a resilient web worker.
*   🚧 **Phase 3: Renderer & UI** - In Progress. A functional PixiJS renderer is implemented, along with complete keyboard and touch controls.
*   ⏳ **Phase 4: Tooling & Polish** - Not Started.

The application is in a stable, playable state. See the `ToDoList.md` for a detailed breakdown of pending tasks.

---
## Project Purpose

To build a fully deterministic, worker-authoritative Tetris engine (TypeScript) with:

*   Complete **replayability** (seed + input log + PRNG/bag state),
*   **Compact, validated snapshots** + event stream,
*   **Resilient crash/recover** flow,
*   **Tested and performance-aware** minimal PixiJS renderer (MVP) with optional Visualizer mode,
*   **Accessibility and fallback support** (Canvas2D, screen-readers, touch).

---

## Core Features

*   **Authoritative Logic Worker**: The game's core logic runs in a separate Web Worker, ensuring the main UI thread remains responsive. The worker is the single source of truth.
*   **Guaranteed Determinism**: Using a seedable integer-only PRNG and a tick-based simulation, every game session is 100% replayable from a seed and an input log.
*   **Resilient Architecture**: The engine is designed to handle worker crashes gracefully. It can recover its state from the last known snapshot, ensuring a robust user experience.
*   **Snapshot-Based Communication**: The worker emits compact, versioned, and checksum-validated snapshots of the game state, which the renderer consumes. This decouples the logic from the presentation layer.
*   **Test-Driven Development**: The project includes a comprehensive testing strategy with unit tests for core logic, and integration tests for replay validation and crash recovery.
*   **Modern Tech Stack**: Built with TypeScript, Vite for fast development, PixiJS for hardware-accelerated rendering, and Vitest for testing.

---

## Architecture Overview

The architecture is fundamentally based on a separation of concerns between the **Logic Worker** and the **Renderer**.

1.  **Logic Worker (`/src/logic`)**: A self-contained module running in a Web Worker. It handles all game mechanics: piece movement, rotation (SRS), scoring, PRNG, and the tick loop. It is the sole authority on the game's state.
2.  **Snapshot/Event Bus**: The worker communicates with the main thread by posting versioned and checksummed `Snapshot` objects at a regular interval (e.g., 60 TPS). It also emits `Event` objects for discrete occurrences (e.g., `lineClear`, `tSpin`).
3.  **Renderer (`/src/renderer`)**: A passive rendering layer running on the main thread. It subscribes to the snapshot stream, interpolates between states for smooth visuals, and renders the game using PixiJS. It also handles user input, which it forwards to the worker.

This design ensures that the game logic is never blocked by rendering or other main-thread tasks, leading to a stable and performant experience.

---

## Project Structure

This is the complete forecast of all files that will be generated to deliver the project.

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

---

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    `git clone <repository-url>`
2.  Navigate to the project directory:
    `cd VibeCodeTris`
3.  Install dependencies:
    `npm install`

### Running the Development Server

To start the Vite development server:

`npm run dev`

This will open the application in your default browser.

---

## Testing

The project uses Vitest for unit and integration testing. To run the test suite:

`npm test`

---

## Project Roadmap

Development will proceed in the following phases:

*   **Phase 1: The Deterministic Core Engine**: Build and test the standalone game logic, including the engine, rules, and PRNG.
*   **Phase 2: The Worker & Communication Layer**: Encapsulate the engine in a Web Worker and establish the resilient snapshot-based communication.
*   **Phase 3: The Renderer & User Interface**: Develop the PixiJS renderer and UI components to visualize the game state and handle user input.
*   **Phase 4: Verification, Tooling & Polish**: Implement the replay player and golden-file integration tests to guarantee end-to-end determinism.
