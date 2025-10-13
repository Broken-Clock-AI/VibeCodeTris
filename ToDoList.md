# Project To-Do List

This to-do list is generated from the `Tasklist.csv` and tracks the development plan.

## Phase 1: The Deterministic Core Engine

### Epic: Engine Core
- [x] **Task:** Implement deterministic engine tick loop (`engine.ts`)
- [x] **Task:** Implement piece spawn logic (`engine.ts`)
- [x] **Task:** Implement lock and merge logic (`engine.ts`)
- [x] **Task:** Integrate PRNG/bag (`engine.ts`)

### Epic: Rules
- [x] **Task:** Implement SRS rotation and wall kicks (`rules.ts`)
- [x] **Task:** Implement scoring logic (`rules.ts`)

### Epic: PRNG/Bag
- [x] **Task:** Seedable integer-only PRNG (`rng.ts`)

### Epic: Constants
- [x] **Task:** Define config and defaults (`constants.ts`)

### Epic: Tests (Phase 1)
- [x] **Task:** Unit tests for engine core (`/tests/unit`)

## Phase 2: The Worker & Communication Layer

### Epic: Worker
- [x] **Task:** Implement message routing (`worker.ts`)
- [x] **Task:** Implement recover handler (`worker.ts`)

### Epic: Recover
- [x] **Task:** Implement snapshot validation (`recover.ts`)
- [x] **Task:** Implement snapshot bootstrap (`recover.ts`)

### Epic: Tests (Phase 2)
- [x] **Task:** Integration/golden tests for crash/recover (`/tests/integration`)

## Phase 3: The Renderer & User Interface

### Epic: Renderer
- [x] **Task:** Implement MVP PixiJS renderer (`pixiRenderer.ts`)

### Epic: Renderer Adapter
- [x] **Task:** Implement snapshot subscription (`renderAPI.ts`)

### Epic: UI
- [x] **Task:** Implement keyboard controls (`controls.tsx`)
- [x] **Task:** Implement touch controls (Button-First Hybrid)
    - [x] **Sub-task:** Add on-screen virtual buttons for all primary actions (Move, Rotate, Hard Drop, Hold).
    - [x] **Sub-task:** Implement optional swipe gestures for movement and soft drop.

### Epic: Accessibility
- [ ] **Task:** Implement HUD for screen readers (`accessibility.ts`)

## Phase 4: Verification, Tooling & Polish

### Epic: Replay Tool
- [ ] **Task:** Implement replay player (`replayPlayer.ts`)

### Epic: Tests (Phase 4)
- [ ] **Task:** Integration/golden tests for replay (`/tests/integration`)
- [ ] **Task:** Add UI customization for touch controls.

## Post-MVP (Optional)

### Epic: Optional
- [ ] **Task:** Visualizer shaders and bloom (`shaders/`)
- [ ] **Task:** Particles and advanced events (Renderer)
- [ ] **Task:** Audio sync and WebAudio (Renderer)
