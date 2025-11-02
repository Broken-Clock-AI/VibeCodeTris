# Mobile Layout Fix: Investigation and Action Plan

This document outlines the investigation into the mobile layout issues reported and the concrete plan to resolve them.

---

## 1. The Problem

The mobile layout suffers from severe scaling and alignment issues. The primary symptoms are:
- A small, distant game board with large empty vertical margins.
- A disconnected feeling between the playfield and the controls.
- Inconsistent UI element sizing and spacing.

The goal is to create a cohesive, mobile-first layout where the playfield is the primary focus and all UI elements are ergonomic and scale correctly.

---

## 2. Investigation & Discovery

A thorough review of `index.html` and `src/main.ts` was conducted to identify the root causes.

### A. CSS Analysis (`index.html`)

The core issue was traced to a single CSS rule applied to the `#in-game` container:

```css
#in-game {
    justify-content: space-between;
}
```

Because the `#in-game` container is a full-height flexbox column, `space-between` forces its direct children (the info panel, the game container, and the touch controls) to the absolute edges of the screen. This pushes the info panel to the top, the controls to the bottom, and leaves the game container isolated in the middle with large, undesirable gaps.

### B. JavaScript Analysis (`src/main.ts`)

The `handleResize` function is responsible for scaling the game canvas. The investigation revealed:
- The function correctly calculates the aspect ratio of the game board.
- However, it measures the available height of its parent, `#game-container`.
- Due to the CSS issue described above, the `#game-container` itself is vertically squashed, giving the `handleResize` function a much smaller height to work with than is actually available on the screen.

---

## 3. Root Cause Diagnosis

The layout problem is a feedback loop between the CSS and JavaScript:

1.  **The CSS** (`justify-content: space-between`) creates large empty spaces, which shrinks the vertical height available to the `#game-container`.
2.  **The JavaScript** (`handleResize`) then measures this artificially small container and correctly, but unfortunately, scales the game canvas to be tiny.

---

## 4. Action Plan

Based on this evidence, the following targeted changes will be made:

1.  **Fix the Vertical Layout (CSS):**
    - **Action:** In `index.html`, replace `justify-content: space-between` on `#in-game` with rules that create a compact, vertically centered layout (e.g., `justify-content: center`).
    - **Goal:** Eliminate the large vertical gaps and allow the `#game-container` to naturally occupy more screen height.

2.  **Adjust the Resize Logic (JavaScript):**
    - **Action:** In `src/main.ts`, modify the `handleResize` function to be more aware of the overall layout. It will calculate the available height by taking the total screen height and subtracting the height of the other UI elements (info panel, controls).
    - **Goal:** Ensure the game canvas is scaled based on the *true* available space, making it the dominant visual element.

3.  **Refine and Balance UI Elements (CSS):**
    - **Action:** After the primary layout is fixed, make minor adjustments to the margins, padding, and sizing of the `#in-game-info` and `#touch-controls` elements.
    - **Goal:** Ensure all components are well-proportioned, readable, and visually harmonious in the new mobile-first layout.
