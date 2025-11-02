> **Note:** This document is deprecated and is no longer being updated. Please refer to the live worklist: `VibeCodeTris_Worklist.md`.

# In-Game UI/UX Implementation Worklist

This document outlines the prioritized tasks for building out the in-game user interface and experience, based on the provided forensic analysis.

## Priority 1: Core Gameplay Essentials

These tasks are the absolute minimum required for a functional and playable game loop.

- [ ] **Implement Initial HUD:** Create the basic on-screen display for:
  - [ ] Score
  - [ ] Level
  - [ ] Lines Cleared
- [ ] **Implement "Next Piece" Queue:** Display the next 3 upcoming tetrominoes.
- [ ] **Implement "Hold" Piece UI:** Create the visual slot for the held piece.
- [ ] **Create Pause System & Overlay:**
  - [ ] Bind `P` and `Esc` keys to pause the game state.
  - [ ] Display a simple overlay with "Paused" text.
  - [ ] Add buttons for "Resume," "Restart," and "Quit to Menu."
- [ ] **Create "Game Over" Screen:**
  - [ ] Display a modal upon game over.
  - [ ] Show the final score.
  - [ ] Add buttons for "Retry" and "Quit to Menu."
- [ ] **Add "Start Game" Prompt:** On the main menu or initial game screen, display a "Press any key to start" message.
- [ ] **Add Build Version:** Display the current build version in a corner for debugging and QA.

## Priority 2: Core User Experience Enhancements

These tasks build upon the essentials to create a more complete and user-friendly experience.

- [ ] **Develop Full Settings Menu:**
  - [ ] Create the main settings screen, accessible from the main menu and pause menu.
  - [ ] **Audio Settings:** Implement sliders for master, music, and SFX volume.
  - [ ] **Controls Settings:** Create a UI for remapping keyboard controls.
  - [ ] **Graphics/Visual Toggles:** Add toggles for features already implemented (e.g., Ghost Piece, High-Contrast Outlines).
- [ ] **Implement Basic Audio Feedback:**
  - [ ] Add SFX for piece lock, drop, and line clears.
  - [ ] Add a master mute toggle (`M` key).
- [ ] **Implement Basic Visual Feedback:**
  - [ ] Add a simple animation for line clears.
  - [ ] Add score pop-ups when points are awarded.
- [ ] **Add On-Screen Controls Hint:** Display a small, unobtrusive text hint for the primary keyboard controls during gameplay.
- [ ] **Implement Controller Support:** Map primary game actions (move, rotate, drop, hold, pause) to a standard gamepad.

## Priority 3: Polish and Accessibility

These tasks focus on visual "juice," advanced features, and making the game accessible to a wider audience.

- [ ] **Implement Accessibility Features:**
  - [ ] Add colorblind-friendly palettes (Deuteranopia, Protanopia, Tritanopia).
  - [ ] Add a UI Scale slider (e.g., 80%–150%).
  - [ ] Ensure all menus are navigable using only the keyboard.
- [ ] **Enhance Visual Polish:**
  - [ ] Implement particle effects for line clears.
  - [ ] Add subtle screen shake for Tetris clears.
  - [ ] Create smooth fade-in/out transitions for menus and overlays.
- [ ] **Implement Save System:**
  - [ ] Persist user settings (audio, controls, visuals) between sessions.
  - [ ] Save high scores locally.
- [ ] **Implement Full Touch-Screen Controls:** Design and implement a complete UI for mobile play (joystick, buttons, etc.).

## Priority 4: Asset and Infrastructure Checklist

This is a list of assets and foundational systems that need to be created to support the features above. This is not a sequential priority but should be referenced as features are implemented.

- [ ] **Asset Creation:**
  - [ ] **Fonts:** Finalize pixel font files.
  - [ ] **Icons:** Create icons for Hold, Next, Pause, Sound, Fullscreen, etc.
  - [ ] **UI Sprites:** Design and create nine-slice sprites for buttons and modal panels.
  - [ ] **Piece Sprites:** Create sprite sheets for all piece variants (solid, outline, patterns).
- [ ] **Audio Sourcing:**
  - [ ] **SFX:** Obtain sound effects for all game actions (rotate, lock, clear, level-up, game-over).
  - [ ] **Music:** Source background music loop(s).
- [ ] **Data Schema:**
  - [ ] Define and implement a JSON structure for saving settings and high scores.
