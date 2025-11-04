## Line Clear Animation Improvements: Options for Dynamic Visual Effects

It's a great idea to think about adding more "juice" to the game. A satisfying line clear is a core part of the Tetris experience. The current center-out wipe is a good, clean starting point, but we can definitely explore more dynamic and visually interesting options.

Here are a few potential directions we could take:

### 1. Programmatic Fades & Dissolves (Shader-Based)

This is the most powerful and flexible approach. We could write a custom PIXI.js filter (a "shader") that applies a visual effect to the cleared lines as they disappear.

*   **Noise Dissolve:** Imagine the blocks dissolving like sand or television static. We could use a noise texture and gradually "eat away" at the blocks based on the noise pattern. This creates a very organic, spreading fade effect that can be tuned to look like anything from burning embers to digital disintegration.
*   **Pixel Shatter:** We could make the blocks on the cleared line appear to shatter into smaller pixel fragments that then fall away or fade out. This would be a very dramatic and impactful effect.
*   **Scanline Wipe:** A glowing horizontal line could sweep across the cleared rows, causing the blocks behind it to fade or distort before disappearing. This would have a cool, retro-tech feel.

### 2. Particle Effects

This is a classic game development technique for adding energy and impact. When a line is cleared, we could spawn a number of small, independent sprites ("particles").

*   **Block Explosion:** Each block in the cleared line could burst into a small shower of particles. These particles could be tiny squares of the block's color that fly outwards, fade, and are affected by gravity. It's a very satisfying, "punchy" effect.
*   **Energy Absorption:** Instead of exploding outwards, particles could be "sucked" from the cleared line towards the score display or the edges of the screen, visually reinforcing the idea that you're "collecting" points or energy.

### 3. Advanced Sprite/Texture Animations

This approach builds on what we have now but makes it more visually rich, directly addressing your idea of superimposing textures.

*   **Flicker & Fade:** This is the simplest improvement. Before the blocks disappear, we could make them flicker brightly (by tinting them white) and rapidly fade their transparency for a few frames. It's a small change that adds a lot of perceived impact.
*   **Animated Sprites:** We could create a short, pre-designed animation of a block shattering or dissolving. When a line is cleared, we'd replace the static block graphics with these animated sprites. This gives us maximum artistic control but is less procedurally dynamic than a shader.

All of these are great options. The shader-based effects are probably the most modern and flexible, while particle effects are a tried-and-true way to make games feel more alive. When you're ready to revisit this, we can pick a direction and I can create a detailed implementation plan.