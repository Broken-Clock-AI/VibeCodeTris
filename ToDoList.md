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

## Phase 4: Visual Accessibility Polish
- [x] **Task:** Implement High-Contrast Piece Outline.
- [x] **Task:** Implement Solid Piece Shapes option.

## Phase 4: Quality of Life Features
- [x] **Task:** Implement Ghost Piece (Drop Preview).

### Epic: Visual Customization
- [x] **Task:** Implement Custom Block Styles (Modern, Classic, NES).
- [x] **Task:** Implement "Faceted Gem" Block Style.

## Phase 4: Verification, Tooling & Polish

### Epic: Replay Tool
- [x] **Task:** Implement replay player (`replayPlayer.ts`)

### Epic: Tests (Phase 4)
- [x] **Task:** Integration/golden tests for replay (`/tests/integration`)
- [ ] **Task:** Add UI customization for touch controls.

## Phase 5: Procedural Audio Enhancements

**This is the current, active development phase.** For a detailed breakdown, see `VibeCodeTris_Fully_Procedural_Audio_Spec.md` and `VibeCodeTris_Piece_Melody_Audio_Spec.md`.

- [x] **Task:** Implement core procedural audio engine with Tone.js.
- [x] **Task:** Fix audio crash and refine synth presets for better sound quality.
- [x] **Task:** Implement progressive, chord-based sounds for line clears.
- [ ] **Task:** Implement "Piece Melody" System:
    - [ ] **Sub-task:** Emit new `pieceMove`, `softDrop`, and `hardDrop` events from the game engine.
    - [ ] **Sub-task:** Implement stateful `activePieceRootNote` in the `AudioEngine`.
    - [ ] **Sub-task:** Create new synth and rules for melodic movement and drop sounds.

## Post-MVP (Optional)

### Epic: Optional
- [ ] **Task:** Visualizer shaders and bloom (`shaders/`)
- [ ] **Task:** Particles and advanced events (Renderer)
- [x] **Task:** Audio sync and WebAudio (Renderer)

---

The project is now fully prepared for migration. Your next steps are:   

   1. Go to Netlify (https://app.netlify.com/signup) and sign up for a fre
      account using your GitHub account.
   2. Click "Add new site" -> "Import an existing project".
   3. Select the Broken-Clock-AI/VibeCodeTris repository.
   4. Netlify will automatically detect and use the settings from
      netlify.toml. You shouldn't need to change any build settings.      
   5. Click "Deploy site".

  Netlify will then build and deploy your project, and the
  SharedArrayBuffer error will be resolved.


# Migration Plan: Moving from GitHub Pages

This document outlines the justification and plan for migrating VibeCodeTris from GitHub Pages to a hosting provider that supports modern web standards.

## 1. Justification

The core issue is that the game crashes on the live GitHub Pages site with the error `ReferenceError: SharedArrayBuffer is not defined`.

This happens because `SharedArrayBuffer`, a browser feature used for high-performance multi-threading (essential for our game's engine running in a web worker), requires the server to send specific HTTP headers for security reasons. These headers are:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Our local development server works perfectly because Vite automatically includes these headers. However, **GitHub Pages does not support custom HTTP headers.** Despite multiple attempts to configure them via workflow actions and `_headers` files, the platform ignores them.

This limitation makes GitHub Pages unsuitable for hosting modern, high-performance web applications that rely on features like `SharedArrayBuffer`. Continuing to use it would force a significant and detrimental refactor of the game's core logic, sacrificing performance and future capabilities.

## 2. Proposed Next Step: Migrate to a New Host

The most effective, lowest-effort, and future-proof solution is to migrate to a hosting provider that fully supports custom headers and is designed for modern web applications.

Our proposed host is **Netlify**, due to its generous free tier and simple configuration.

The migration process is straightforward:
1.  Create a free account on Netlify and connect it to the GitHub repository.
2.  Configure the project's build settings (the command and publish directory).
3.  Add a `netlify.toml` configuration file to the repository to define the required headers.
4.  The new site will be deployed automatically on every push to the `main` branch.

This one-time setup will resolve the current issue and prevent similar platform-limitation problems in the future.

## 3. Free Hosting Resources

All of the following providers offer robust free tiers suitable for this project and support custom headers.

*   **Netlify:** [https://www.netlify.com/pricing/](https://www.netlify.com/pricing/)
    *   *Configuration via a `netlify.toml` file.*
*   **Vercel:** [https://vercel.com/pricing](https://vercel.com/pricing)
    *   *Configuration via a `vercel.json` file.*
*   **Cloudflare Pages:** [https://pages.cloudflare.com/](https://pages.cloudflare.com/)
    *   *Configuration via a `_headers` file.*