# Faceted Gem Block Style: Elegant Implementation Plan

This document outlines a robust and straightforward approach to implementing the "Faceted Gem" custom block style, avoiding the complexities and library-specific issues encountered in previous attempts.

## Core Concept

The fundamental idea is to manually calculate the colors for the four triangular facets (highlight, light, mid-tone, shadow) of each block by directly manipulating the Red, Green, and Blue (RGB) components of the piece's base color. This method is self-contained, avoids problematic color library functions, and relies on simple, predictable math.

## High-Level Steps

The implementation will be a self-contained case within the `drawBlock` method in `src/renderer/pixiRenderer.ts`.

1.  **Receive Base Color:** The function will receive the numerical hex color for the current block (e.g., `0x00FFFF` for cyan).

2.  **Deconstruct to RGB:** The hex color will be broken down into its individual 8-bit Red, Green, and Blue components.
    *   Example: `0x00FFFF` -> `R: 0`, `G: 255`, `B: 255`

3.  **Calculate Facet Colors:** Four new colors will be calculated by multiplying each RGB component by a specific brightness factor. This creates the highlight and shadow effect.
    *   **Highlight (Brightest):** `R * 1.5`, `G * 1.5`, `B * 1.5`
    *   **Light (2nd Brightest):** `R * 1.2`, `G * 1.2`, `B * 1.2`
    *   **Mid-tone (Slight Shadow):** `R * 0.9`, `G * 0.9`, `B * 0.9`
    *   **Shadow (Darkest):** `R * 0.6`, `G * 0.6`, `B * 0.6`
    *   *(Note: Values will be clamped to the valid 0-255 range.)*

4.  **Reconstruct to Hex:** The newly calculated RGB values for each of the four facets will be recombined back into a numerical hex format that the renderer can use.

5.  **Draw the Four Triangles:** The `PIXI.Graphics` object for the block will be used to draw the four triangles, each filled with its corresponding calculated color, forming the final faceted gem appearance. A simple black border will be drawn around the block to ensure definition.

This approach is elegant because it is deterministic, has no external dependencies, and is easy to debug and fine-tune by simply adjusting the multiplication factors.