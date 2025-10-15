# Project To-Do List

---
### **High Priority Issues**
- [x] **Task:** Fix responsive layout for mobile and desktop.
- [x] **Task:** Fix unresponsive player controls.
- [x] **Task:** Fix critical bug in touch controls causing perpetual movement.
---

This to-do list is generated from the `Tasklist.csv` and tracks the development plan.

## Phase 1: The Deterministic Core Engine
- [x] **Task:** Implement deterministic engine tick loop (`engine.ts`)
- [x] **Task:** Implement piece spawn logic (`engine.ts`)
- [x] **Task:** Implement lock and merge logic (`engine.ts`)
- [x] **Task:** Integrate PRNG/bag (`engine.ts`)
- [x] **Task:** Implement SRS rotation and wall kicks (`rules.ts`)
- [x] **Task:** Implement scoring logic (`rules.ts`)
- [x] **Task:** Seedable integer-only PRNG (`rng.ts`)
- [x] **Task:** Define config and defaults (`constants.ts`)
- [x] **Task:** Unit tests for engine core (`/tests/unit`)

## Phase 2: The Worker & Communication Layer
- [x] **Task:** Implement message routing (`worker.ts`)
- [x] **Task:** Implement recover handler (`worker.ts`)
- [x] **Task:** Implement snapshot validation (`recover.ts`)
- [x] **Task:** Implement snapshot bootstrap (`recover.ts`)
- [x] **Task:** Integration/golden tests for crash/recover (`/tests/integration`)

---

## Strategic Pivot: UI Scaffolding First

**As of 2025-10-13, we are temporarily pivoting our focus to building the foundational UI shell for the application.**

**Reasoning:** Many of the remaining tasks (including accessibility options and replay tools) require a user interface (like a settings menu or a game over screen) to be hosted in. The core engine is stable, but it currently lacks this application layer. By building the UI scaffolding first, we will unblock all future feature development.

For a detailed breakdown of this new plan, please see `DevelopmentRoadmap.md`.

The following tasks are now the **immediate priority**:

---

### **Phase 2.5: UI Foundation**

- [x] **Task:** Implement Game Over logic in the engine (`engine.ts`).
- [x] **Task:** Create a basic UI State Manager (`main.ts` or `ui/state.ts`).
- [x] **Task:** Build placeholder UI for Game Over and Settings screens.
- [x] **Task:** Implement the first Tier 1 accessibility option (e.g., Adjustable DAS/ARR) to validate the new UI pipeline.

---

### **Phase 3.5: Visual Accessibility Foundation**

**This is the current, active development phase.** For a detailed breakdown, see `VisualAccessibilityProposal.md`.

- [x] **Task:** Extend the `UIStateManager` to manage detailed visual settings.
- [x] **Task:** Add UI controls (checkboxes, dropdown) for new visual options to `index.html`.
- [x] **Task:** Connect new UI controls to the `UIStateManager` in `main.ts`.
- [x] **Task:** Refactor the `PixiRenderer` to be driven by the new visual settings state.
- [x] **Task:** Implement dynamic color palette switching in the renderer.
- [x] **Task:** Implement texture generation for distinct piece patterns in the renderer.
- [x] **Task:** Implement high-contrast mode in the renderer.

---

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
- [x] **Task:** Implement gamepad controls (`gamepad.ts`)

### Epic: Accessibility
- [x] **Task:** Implement HUD for screen readers (`accessibility.ts`)

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
