# VibeCodeTris: Master Project Specification

This document provides a comprehensive, high-level overview of the VibeCodeTris project. It is a distillation of all previous planning, proposal, and log files and serves as the single, authoritative source of truth for the project's architecture, features, and goals.

---

## 1. Project Purpose

To build a deterministic, worker-driven Tetris engine in TypeScript that emits compact snapshots to a renderer, with a focus on replayability, resilience, and a highly customizable, accessible user experience.

---

## 2. Core Architectural Principles

*   **Authoritative Logic Worker:** The game's core logic runs in a separate Web Worker, ensuring the main UI thread remains responsive. The worker is the single source of truth for all game state.
*   **Guaranteed Determinism:** Every game session is 100% replayable from a seed and an input log. This is achieved through a seedable integer-only PRNG and a tick-based simulation.
*   **Resilient Crash/Recovery Flow:** The engine is designed to handle worker crashes gracefully by recovering its state from the last known valid snapshot, ensuring a robust player experience.
*   **Snapshot-Based Communication:** The worker emits compact, versioned, and checksum-validated snapshots of the game state to the renderer, forming a clear and stable contract between the logic and presentation layers.
*   **Separation of Concerns:** A strict separation is maintained between the Logic Worker (rules), the Snapshot/Event Bus (communication), and the Renderer (visuals, audio, UI).
*   **Test-Driven & Verifiable:** The project relies on a comprehensive testing strategy, including unit tests for core logic, integration tests for the worker lifecycle, and "golden file" replay tests to verify long-term determinism.
*   **Git-Based Agentic Workflow:** Development follows a `branch -> implement -> commit -> merge` cycle. This isolates work-in-progress, maintains a stable `main` branch, and creates an atomic, reversible history of all changes.

---

## 3. High-Level Feature Summary

### Core Gameplay Mechanics
*   Standard Tetris gameplay with SRS rotation and a 7-bag piece randomizer.
*   Hold functionality and a multi-piece "next" queue for strategic planning.
*   User-configurable timings for DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate).
*   A complete scoring system including line clears, T-Spins, back-to-back bonuses, and combos.

### Visual & Rendering Features
*   Hardware-accelerated 2D rendering using PixiJS.
*   **Ghost Piece (Drop Preview):** A toggleable semi-transparent preview showing where the current piece will land.
*   **Custom Block Styles:** A feature allowing users to select different visual themes for the blocks, including 'Modern', 'Classic', 'NES-like', and 'Faceted Gem'.
*   **High-Contrast Piece Outline:** A continuous outline around the currently falling piece for enhanced visibility.
*   **Solid Piece Shapes:** An option to render pieces as solid colors without internal block borders.
*   **Planned:** Advanced visual effects using shaders and GSAP for animations (e.g., line clears, piece spawning, UI transitions).

### UI/UX Features
*   A responsive, multi-screen UI (Main Menu, Settings, Game Over) that adapts to both mobile and desktop displays.
*   An in-game HUD displaying the current score, level, and lines cleared.
*   Comprehensive input support for keyboard, gamepad, and touch controls.
*   **Planned:** A full settings menu for fine-grained audio, controls, and graphics customization.

### Accessibility Features
*   **Colorblind-Friendly Palettes:** Multiple preset color schemes tailored for deuteranopia, protanopia, and tritanopia.
*   **High-Contrast Mode:** An alternate theme with a dark background and bright outlines for maximum visual clarity.
*   **Distinct Piece Patterns:** Unique, high-contrast patterns overlaid on each piece, making them distinguishable by shape and pattern alone.
*   **Screen Reader Support:** Key game events (e.g., "Double line clear," "Game Over") are announced via ARIA live regions for blind and low-vision players.
*   **Planned:** A full suite of accessibility options, including full key remapping, UI scaling, a "Zen Mode" (no game over), and more comprehensive motor and cognitive features.

### Developer & Tooling Features
*   **Replay System:** A foundational feature that allows for perfect, deterministic replays of any game session from a seed and input log. This is used for player skill improvement, sharing, and critical developer debugging ("golden testing").

---

## 4. Technical Stack & Key Libraries

*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Rendering:** PixiJS
*   **Animation (Planned):** GSAP (GreenSock Animation Platform)
*   **Testing:** Jest / Vitest (or compatible)

---
