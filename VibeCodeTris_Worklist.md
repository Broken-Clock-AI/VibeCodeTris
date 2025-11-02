# VibeCodeTris - In-Game UI/UX Implementation Worklist (Live)

This document outlines the prioritized tasks for building out the in-game user interface and experience, based on a forensic analysis of the current codebase.

**Legend:**
- `[✓]` - **Done:** Feature is fully implemented and functional.
- `[~]` - **Partial:** Feature is partially implemented or foundational work is complete.
- `[ ]` - **To Do:** Feature has not been started.

---

## Tier 1: Finish Core Gameplay Loop

These are the highest priority tasks to make the game fully playable and feel complete.

- [✓] **Implement Initial HUD:** The game engine tracks all the data, but no UI displays it live.
  - [✓] **Display Score:** Create the on-screen text element.
  - [✓] **Display Level:** Create the on-screen text element.
  - [✓] **Display Lines Cleared:** Create the on-screen text element.
- [✓] **Implement "Next Piece" Queue:** The engine knows the next 6 pieces, but they are not rendered.
- [ ] **Implement "Hold" Piece:**
  - [ ] **Finish Logic:** The `hold` input is currently a `// TODO` in `engine.ts`.
  - [ ] **Create UI:** Create the visual slot for the held piece.
- [ ] **Create Pause System & Overlay:** A critical missing QoL feature.
  - [ ] Bind `P` and `Esc` keys to pause/resume the game state.
  - [ ] Display a simple overlay with "Paused" text.
  - [ ] Add buttons for "Resume," "Restart," and "Quit to Menu."
- [ ] **Add Build Version to UI:** Display the `engineVersion` from the snapshot in a corner for debugging.

---

## Tier 2: Immediate Quality of Life

These tasks provide the most tangible value to the user experience after the core loop is finalized.

- [ ] **Implement Save System (Settings):** Persist the many existing visual settings in `localStorage` so they are not reset on every page load.
- [~] **Implement Basic Audio Feedback:** Audio provides critical sensory feedback and makes the game feel more responsive.
  - [~] Add SFX for piece lock, drop, and line clears.
  - [ ] Add a master mute toggle (`M` key).
- [ ] **Implement Basic Visual Feedback:**
  - [ ] Add a simple animation for line clears.
  - [ ] Add score pop-ups when points are awarded.
- [✓] **Implement Full Touch-Screen Controls:** The `touch.ts` file exists but is empty. This would complete the input trifecta.

---

## Tier 3: Full UX & Polish

With a comfortable experience established, this tier builds out the remaining features and adds "juice."

- [ ] **Develop Full Settings Menu:**
  - [ ] **Audio Settings:** Implement sliders for master, music, and SFX volume once audio is in.
  - [ ] **Controls Settings:** Create a UI for remapping keyboard controls.
- [ ] **Implement Save System (High Scores):** A core part of the arcade experience.
- [ ] **Enhance Visual Polish:**
  - [ ] Implement particle effects for line clears.
  - [ ] Add subtle screen shake for Tetris clears.
  - [ ] Create smooth fade-in/out transitions for menus and overlays.
- [ ] **Add On-Screen Controls Hint:** Display a small, unobtrusive text hint for the primary keyboard controls during gameplay.

---

## Tier 4: Completed Features

This section documents features that are already implemented and functional.

- [✓] **Create "Game Over" Screen:** `gameOver` state is implemented, the UI switches, and the final score is shown.
- [✓] **Add "Start Game" Prompt:** The main menu with a "Play" button serves this purpose.
- [✓] **Develop Settings Menu Foundation:** The menu exists and is functional.
- [✓] **Graphics/Visual Toggles:** Toggles for Ghost Piece, High-Contrast, Piece Outlines, and multiple block styles are fully implemented.
- [✓] **Implement Controller Support:** Gamepad input is fully mapped and functional.
- [✓] **Accessibility: Colorblind Palettes:** Deuteranopia, Protanopia, and Tritanopia themes are implemented and selectable.
- [~] **Accessibility: Keyboard Navigable Menus:** Menus are navigable via standard browser tabbing, but no explicit focus management exists.

---

## Asset and Infrastructure Checklist

This is a list of assets and foundational systems that need to be created to support the features above.

- [ ] **Asset Creation:**
  - [ ] **Fonts:** Finalize pixel font files.
  - [ ] **Icons:** Create icons for Hold, Next, Pause, Sound, Fullscreen, etc.
  - [ ] **UI Sprites:** Design and create nine-slice sprites for buttons and modal panels.
- [ ] **Audio Sourcing:**
  - [ ] **SFX:** Obtain sound effects for all game actions.
  - [ ] **Music:** Source background music loop(s).
- [ ] **Data Schema:**
  - [ ] Define and implement a JSON structure for saving settings and high scores.
