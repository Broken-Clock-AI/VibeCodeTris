# In-Game Score UI Implementation Plan

## 1. Objective

To enhance the user experience by displaying the player's current score directly on the game screen during gameplay. This is a fundamental feature that provides immediate feedback and is essential for player engagement.

## 2. High-Level Plan

### Step 1: Add a Score Display Element to the DOM

-   **File:** `index.html`
-   **Action:** Introduce a new `div` element within the main game container. This element will be dedicated to displaying the score.
-   **Details:**
    -   Assign a clear and specific ID (e.g., `score-display`) for easy selection from the JavaScript code.
    -   Position it logically within the UI, likely near the game board.

### Step 2: Update the Score in the UI

-   **File:** `src/main.ts`
-   **Action:** Modify the main game loop or state update handler to read the `score` property from the game state snapshot received from the worker.
-   **Details:**
    -   Cache a reference to the score display element on initialization.
    -   Update the `innerText` or `textContent` of the element with the formatted score whenever a new state snapshot is processed.

### Step 3: Style the Score Display

-   **File:** A new or existing CSS file (or a `<style>` tag in `index.html` for simplicity).
-   **Action:** Add CSS rules to style the score display for clarity, legibility, and aesthetic consistency with the rest of the game's UI.
-   **Details:**
    -   Set an appropriate font size, color, and weight.
    -   Ensure the styling is responsive and works well on both desktop and mobile layouts.
    -   Consider adding a label (e.g., "Score:") for context.
