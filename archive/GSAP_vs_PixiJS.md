# GSAP vs. PixiJS: A Breakdown of Roles

This document clarifies the distinct roles of PixiJS and the GreenSock Animation Platform (GSAP) in this project, explaining where the line is drawn between their responsibilities.

## The Analogy: A Theatre Production

A helpful way to think about the relationship is to imagine a theatre production:

*   **PixiJS is the Actor, the Scenery, and the Stage.**
*   **GSAP is the Choreographer and the Director.**

---

## PixiJS's Job: The Visual Elements (The "Nouns")

Think of PixiJS as being responsible for everything that is **static** or **exists visually** at any single moment in time. It handles the "what" and "where" of the visual presentation *right now*.

**PixiJS is responsible for:**

1.  **Creating the Stage:** It creates the `<canvas>` element and manages the entire rendering area.
2.  **Creating the Actors and Scenery:** It creates all the visual objects. In our project, these are the `PIXI.Graphics` objects for the blocks, the `PIXI.Sprite` objects for the patterns, and any `PIXI.Text` objects for the score or level.
3.  **Positioning and Styling (at a single point in time):** It sets the initial properties of these objects. For example: `block.x = 100`, `block.y = 200`, `block.tint = 0xFF0000`. It knows *how* to draw a block at a specific coordinate with a specific color.
4.  **The Render Loop (The "Curtain"):** PixiJS runs a `ticker` (a `requestAnimationFrame` loop) that redraws the entire stage 60 times per second. On every single frame, it looks at every object and draws it based on its *current* properties.
5.  **Special Effects:** It handles the visual effects applied to an object, like filters and shaders (e.g., applying a "glow" or "blur" filter).

**In short: If you can see it on the screen, PixiJS is the one who drew it there.**

---

## GSAP's Job: The Motion and Change (The "Verbs")

GSAP is responsible for **change over time**. It doesn't know how to draw anything. It is a master of numbers and timing. Its entire job is to smoothly transition a property from a start value to an end value over a set duration.

**GSAP is responsible for:**

1.  **Choreographing the Movement:** It tells the "actors" (the PixiJS objects) how to change their properties over time.
2.  **Controlling the Timing:** It defines the `duration` of an animation (e.g., "fade this out over 0.5 seconds").
3.  **Defining the "Feel" (Easing):** It controls the *acceleration and deceleration* of the animation. Should the block start fast and end slow (`ease: "power2.out"`)? Should it have a little bounce at the end (`ease: "back.out(1.7)"`)?
4.  **Sequencing Complex Scenes (Timelines):** This is GSAP's superpower. It can create complex, multi-step animation sequences. For example: "First, flash the blocks white for 0.1s, *then* 0.2s later, start shrinking them, and at the same time, fade them out."
5.  **Managing the Animation State:** It provides the controls to `play()`, `pause()`, `reverse()`, or `seek()` through these complex timelines.

**In short: If you see a smooth transition or a timed sequence of visual changes, GSAP is the one conducting it behind the scenes.**

---

## The "Line" and How They Interact: A Concrete Example

Let's revisit the **Line Clear Animation**.

1.  **The Scene:** PixiJS has already drawn the 10 blocks of the completed line on the screen. They are just sitting there, static. Each is a `PIXI.Graphics` object with properties like `x`, `y`, `scale: 1`, and `alpha: 1`.

2.  **The Command:** Our game logic detects the line clear and calls a function. Inside that function, we give a command to **GSAP**:
    ```javascript
    // This is a command for GSAP, the choreographer.
    gsap.to(blocks, { // 'blocks' is an array of PIXI.Graphics objects
        duration: 0.5,
        scale: 0,      // End value for the 'scale' property
        alpha: 0,      // End value for the 'alpha' property
        stagger: 0.05, // Add a small delay between each block's animation
        ease: 'power2.in',
        onComplete: () => {
            // Tell PixiJS to clean up the actors when the show is over
            blocks.forEach(block => block.destroy()); 
        }
    });
    ```

3.  **The Performance (The Interaction):**
    *   GSAP's internal ticker starts.
    *   **Frame 1 (0.016s):** GSAP calculates that the blocks' `scale` should now be `0.95` and their `alpha` should be `0.9`. It directly changes the properties on the PixiJS objects: `block.scale = 0.95`, `block.alpha = 0.9`.
    *   **PixiJS's render loop runs.** It looks at the blocks and sees their new properties. It draws them on the canvas at 95% size and 90% opacity.
    *   **Frame 2 (0.032s):** GSAP calculates the new values (`scale: 0.88`, `alpha: 0.75`). It updates the PixiJS objects.
    *   **PixiJS's render loop runs.** It draws the blocks at their new, smaller, more transparent state.
    *   ...This continues for 0.5 seconds...
    *   **Final Frame:** GSAP sets the `scale` and `alpha` to `0`. PixiJS draws them as invisible. GSAP then calls the `onComplete` function, and we tell PixiJS to remove the now-invisible objects permanently.

**The line is the object's properties (`.x`, `.y`, `.scale`, `.alpha`).** PixiJS **reads** these properties to draw. GSAP **writes** to these properties over time to animate.
