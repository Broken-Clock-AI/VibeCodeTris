# GSAP Integration Plan

This document outlines the research, consideration, and potential implementation path for integrating the GreenSock Animation Platform (GSAP) into the project to enrich the user experience.

## How GSAP Fits In

First, it's important to understand that **GSAP is not a renderer**. It doesn't draw anything. It is a high-performance "tweening" engine. Its job is to very efficiently calculate the state of a property (like position, scale, rotation, or color) at any point in time during an animation.

Our `PixiRenderer` is the renderer. The magic happens when you tell GSAP to animate the properties of our PixiJS objects. GSAP has a dedicated PixiPlugin that makes this seamless.

## Potential Applications for This Project

There are two main areas where GSAP would be a game-changer:

### 1. UI and Scene Transitions (The "Shell")

This is the most straightforward and highest-impact place to start. Right now, when the UI state changes (e.g., from Main Menu to In-Game, or from In-Game to Game Over), the screens just appear and disappear instantly. GSAP can make these transitions smooth and professional.

*   **Screen Fades & Slides:** When starting a game, the main menu could fade out while the game board fades in or slides into view.
*   **Animating UI Elements:** When the score updates, instead of the number just changing, we could make it quickly "count up" or pop in size. The same goes for the level and lines cleared.
*   **Settings Menu:** The settings panel could slide in from the side of the screen instead of just appearing.
*   **Button Interactivity:** Add subtle scaling or color animations to buttons on hover and click to make them feel more responsive.

### 2. In-Game Animations (The "Core Gameplay")

This is where we can add a layer of polish that makes the game feel incredibly satisfying to play. These animations would be choreographed by GSAP but rendered by PixiJS.

*   **Line Clear Animation:** This is the perfect use case. When a line is cleared, instead of the blocks just vanishing, we could use GSAP's `stagger` feature to:
    *   Make each block in the line quickly flash white.
    *   Then, have them shrink to nothingness one after the other in a rapid sequence.
    *   Or, have them fly off to the side of the screen.
*   **Piece Spawning:** A new piece could subtly scale up or "pop" into existence at the top of the board, rather than just appearing.
*   **Hard Drop Impact:** When a piece hard drops, we could add a very quick "squash and stretch" animation to the piece and maybe even a subtle screen shake to give it a feeling of weight and impact.
*   **Level Up Transition:** A full-screen flash of color or a text element that animates in and out to announce the new level.
*   **Game Over Sequence:** Instead of just showing the "Game Over" screen, we could animate the board turning grayscale and then have the "Game Over" text animate in, letter by letter.

## How It Complements Shaders

It's important to note that **GSAP and shaders are not mutually exclusive; they work together beautifully.**

*   **GSAP choreographs *what* happens over *time*.** (e.g., "Move this block from A to B in 0.5 seconds.")
*   **Shaders control *how* something is drawn at the pixel level.** (e.g., "Apply a bloom effect or a distortion wave to this block.")

**Example Synergy:** For a line clear, you could use **GSAP** to animate the `scale` and `alpha` of the blocks to make them shrink and fade, while simultaneously using a PixiJS filter (which uses a shader) to apply a bright **glow/bloom** effect that intensifies as the blocks fade out.

## Recommendation

Using GSAP is an excellent direction to take. It's the industry standard for this kind of work for a reason.

When the time comes, the following implementation path is recommended:
1.  **Start with the UI:** Begin by animating the screen transitions. This is low-risk, high-reward, and will let us integrate GSAP into the project smoothly.
2.  **Move to In-Game Effects:** Once the UI is polished, we can tackle the more integrated in-game animations, starting with the most impactful one: the line clear sequence.

This approach will allow us to add a huge amount of visual flair and a professional feel to the application.
