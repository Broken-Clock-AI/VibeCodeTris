# Development Roadmap: Pivoting to UI Scaffolding

**Date:** 2025-10-13

## Strategic Pivot

The project has reached a critical inflection point. The core deterministic engine and the input control systems (keyboard and touch) are robust and complete. However, many of the remaining high-priority tasks in both the `ToDoList.md` and `Accessibility.md` plan require a user interface (UI) to host them (e.g., a settings menu, a game over screen).

The current codebase lacks this foundational UI "shell." To unblock all future UI-related development, we are temporarily pivoting from implementing in-game features to building the necessary application-level UI structure.

This document outlines the new, sequential development priorities.

---

## The Unblocked Development Path

### Step 1: Implement "Game Over" Logic (Engine Task)

*   **What:** Add the core logic to `engine.ts` to detect a "game over" condition. This occurs when a new piece cannot be spawned in the starting position without an immediate collision. The engine must stop its game loop and report a `gameOver` state in its snapshot or via a dedicated event.
*   **Why:** This is the final critical piece of the core game loop. The UI needs to be aware of this state to transition to a "Game Over" screen.

### Step 2: Create a Basic UI State Manager

*   **What:** Implement a simple state management system on the main thread (`main.ts` or a new `ui/state.ts`). This system will be responsible for switching between different application views, such as `MainMenu`, `InGame`, `Settings`, and `GameOver`. The initial implementation can manage the visibility of different `<div>` containers in `index.html`.
*   **Why:** This provides the foundational scaffolding for all subsequent UI work. It is the most important blocker to clear.

### Step 3: Build the "Game Over" and Settings Menu UI

*   **What:** Create the basic HTML and CSS for a "Game Over" screen and a "Settings" screen. The "Game Over" screen should include the final score and a "Play Again" button. The "Settings" screen will be a placeholder container for future options. Wire these views into the state manager from Step 2.
*   **Why:** This creates the physical locations required to display game results and add the accessibility toggles planned in the accessibility roadmap.

### Step 4: Implement the First "Tier 1" Accessibility Option

*   **What:** With the settings menu in place, implement the first high-impact accessibility feature. The top candidate is adding UI controls (e.g., sliders or input fields) to modify the **Adjustable DAS/ARR** values. This will involve:
    1.  Adding the controls to the Settings UI.
    2.  Sending the updated values to the engine.
    3.  Ensuring the engine correctly applies the new timings.
*   **Why:** This delivers the first feature from our accessibility plan and validates the entire UI-to-engine pipeline, proving that our new UI structure is working correctly.

---

This roadmap will be followed to ensure that we build the necessary foundations before proceeding with more granular feature implementation.
