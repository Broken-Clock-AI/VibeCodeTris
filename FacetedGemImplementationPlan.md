# Faceted Gem Block Style: Analysis & Implementation Plan

This document outlines the analysis and high-level implementation strategy for the "Faceted Gem" custom block style, based on the detailed visual description provided.

### **Analysis & Interpretation**

The core goal is to create a visually complex block that simulates a 3D, faceted, gem-like surface. The aesthetic is achieved through a combination of geometric structure and a clever, consistent lighting model.

My interpretation is broken down into four key components:

1.  **Core Structure: The Pyramid:** Each block is not a flat square, but a pyramid viewed from above. This is achieved by dividing the square into four triangles whose vertices all meet at the exact center.

2.  **Lighting Model: Upper-Left Source:** A simulated light source is assumed to be in the upper-left. This dictates the color of each of the four triangular facets, creating a convincing 3D illusion:
    *   **Left Facet:** The brightest, receiving the most direct light (`highlightColor`).
    *   **Top Facet:** The second brightest (`lightColor`).
    *   **Right Facet:** A mid-tone, beginning to fall into shadow (`midToneColor`).
    *   **Bottom Facet:** The darkest, representing the core shadow (`shadowColor`).

3.  **Color Palette Derivation:** To ensure the style works with all themes, the four shades for the facets will be programmatically generated from the piece's single base color. For example, the `highlightColor` will be a brightened version of the base color, while the `shadowColor` will be a darkened version.

4.  **Separation & Definition:** A thin, solid black border will be drawn around the entire block. This corresponds to the "black negative space" in the description and is crucial for making each "gem" feel like a distinct, interlocking object.

### **High-Level Implementation Plan**

The feature will be implemented in three distinct phases, modifying the UI, state, and renderer separately for a clean integration.

#### **Phase 1: Update the UI (`index.html`)**
*   A new option, `<option value="faceted-gem">Faceted Gem</option>`, will be added to the "Custom Block Style" dropdown menu in the settings panel.

#### **Phase 2: Update the State Manager (`src/ui/state.ts`)**
*   The `VisualSettings` interface will be extended to accept `'faceted-gem'` as a valid string literal for the `blockStyle` property, making the state manager aware of the new option.

#### **Phase 3: Implement the Rendering Logic (`src/renderer/pixiRenderer.ts`)**
*   The core logic will be implemented within the `drawBlock` method by adding a new `case 'faceted-gem':`.
*   The rendering steps for each block will be:
    1.  **Calculate Shades:** Programmatically generate the four required color shades from the piece's base color.
    2.  **Draw Facets:** Draw four distinct, filled triangles using the calculated shades to create the pyramid structure.
    3.  **Draw Border:** Draw a thin, black stroke around the block's outer perimeter to ensure sharp definition.
