# VibeCodeTris - Fully Procedural Audio System Specification

## 1. Executive Summary

This document outlines a revised, fully procedural audio system for VibeCodeTris, building upon the initial research from `tetris_effect_audio_investigation.md` but adapting it to prioritize dynamic, game-state-driven sound effects and code-generated background music. This approach explicitly deprecates the need for pre-composed, sampled audio stems, focusing instead on a system entirely built with Tone.js.

The core proposal is to leverage Tone.js for **all audio generation**, creating both reactive sound effects and simple, looping background music elements procedurally. This model offers maximum dynamic control, eliminates external asset dependencies, and allows for deep integration with gameplay state, albeit with a conscious trade-off in the "richness" typically associated with professionally produced, sampled music.

## 2. Core Architectural Decision: Embracing a Fully Procedural Model

Our project's priority is dynamic sound that responds directly to player input and game state, without the overhead of external music composition or asset management. A fully procedural model, while challenging to achieve the sonic complexity of sampled music, offers unparalleled flexibility and control within the codebase.

| Approach | Pros | Cons | Feasibility for VibeCodeTris |
| :--- | :--- | :--- | :--- |
| **Purely Procedural (Proposed)** | • **Highly reactive to gameplay**<br>• **Zero external audio assets**<br>• **Infinite dynamic variation**<br>• Small memory footprint<br>• Deep integration with game state | • Can sound "synthy" or less polished than sampled music<br>• Requires algorithmic composition skills<br>• High CPU cost for complex, layered sounds | **High.** Directly aligns with the updated project priorities: dynamic, code-driven audio without external composition. |
| **Hybrid (Previous Proposal)** | • Rich musical backing with reactive foreground sounds<br>• Clear separation of concerns<br>• More complex architecture<br>• **Requires external audio assets (MP3s/WAVs)**<br>• Asset loading/management overhead | **Low.** The requirement for external music assets and composition is no longer a priority. |

## 3. Proposed Fully Procedural Architecture

The system will be orchestrated by the main `AudioEngine`, which will delegate tasks to specialized controllers, all generating sound via Tone.js.

```
[Game Engine Events] -> [AudioEngine]
                          |
      +-------------------+-------------------+
      |                                       |
[EventQuantizer]                       [IntensityManager]
      |                                       |
      v                                       v
[SynthController] (Micro-Events)      [ProceduralMusicGenerator] (Background Music)
(pieceLock, rotate, spawn)            (Synths: pads, drums, melody)
      |                                       |
      +-------------------+-------------------+
                          |
                          v
                     [Tone.js Master Output]
```

### Key Component Deep Dive

#### `AudioEngine` (Refactored)
*   **Role:** The central orchestrator.
*   **Responsibilities:**
    *   Initializes `Tone.js` and the master `Transport`.
    *   Manages the master output gain and master effects (e.g., a final compressor or limiter).
    *   Receives all game events (from `handleSnapshot`) and routes them to the appropriate subsystems (`IntensityManager`, `EventQuantizer`).
    *   Manages the overall system state (e.g., `playing`, `paused`, `zone-mode`).

#### `ProceduralMusicGenerator` (New - Replaces `StemPlayer`)
*   **Role:** Generates simple, looping background music elements entirely using Tone.js synths.
*   **Responsibilities:**
    *   Uses `Tone.Synth`, `Tone.PolySynth`, `Tone.MembraneSynth`, `Tone.NoiseSynth`, etc., to create various musical layers (e.g., a simple drum beat, a sustained pad, a basic bassline).
    *   **Algorithmic Composition:** Implements `Tone.Sequence` or `Tone.Loop` to schedule notes and patterns for each musical layer.
    *   **Synchronization:** All generated loops will be synced to the master `Tone.Transport`.
    *   **Dynamic Mixing:** Exposes methods to control the volume and filter parameters of each procedural layer. The `IntensityManager` will use these to dynamically adjust the background music.

#### `SynthController` (Evolution of current system)
*   **Role:** Manages and triggers our existing procedural synths for micro-events.
*   **Responsibilities:**
    *   Maintains the pool of `Tone.Synth` and `Tone.PolySynth` instruments we already have (`pieceSpawnSynth`, `lineClearSynth`, etc.).
    *   Receives *quantized* trigger commands from the `EventQuantizer`.
    *   Continues to handle the procedural logic for generating notes and chords based on game events (e.g., the progressive chords for line clears).

#### `IntensityManager` (New)
*   **Role:** A dedicated module to calculate a single, normalized "intensity" value.
*   **Responsibilities:**
    *   Receives relevant game state data on each tick (e.g., board height, lines cleared per minute, current combo, score).
    *   Uses a weighted algorithm to combine these inputs into a single, smoothly changing value from `0.0` to `1.0`.
    *   On each update, it commands the `ProceduralMusicGenerator` to adjust the mix (e.g., fading in more complex drum patterns or brighter synth layers as intensity rises).

#### `EventQuantizer` (New)
*   **Role:** Ensures all procedural sounds are triggered perfectly on the musical grid.
*   **Responsibilities:**
    *   Receives high-frequency game events (e.g., `pieceMoved`, `pieceRotated`).
    *   Uses `Tone.Transport.scheduleOnce` to delay the trigger command to the nearest desired musical subdivision (e.g., `"16n"`).
    *   Sends the scheduled trigger command to the `SynthController`. This decouples raw game events from musical timing.

## 4. Implementation Roadmap

This refactor can be executed in phases to ensure stability.

**Phase 1 — Foundation & Refactoring**
*   [ ] Refactor `AudioEngine.ts` to act as an orchestrator, separating out existing synth logic into a new `SynthController.ts`.
*   [ ] Create the `IntensityManager.ts` module with a basic, placeholder algorithm (e.g., just using board height).
*   [ ] Create the `EventQuantizer.ts` and route all `SynthController` triggers through it.

**Phase 2 — Procedural Background Music**
*   [ ] Create the `ProceduralMusicGenerator.ts` class.
*   [ ] Implement basic looping patterns for simple drums (e.g., kick/snare on quarter notes) using `Tone.MembraneSynth` and `Tone.NoiseSynth`.
*   [ ] Implement a simple, sustained pad sound using `Tone.PolySynth` and `Tone.Sequence` for chord progressions.
*   [ ] Integrate the `ProceduralMusicGenerator` into the `AudioEngine` so the background music plays in sync with the game.

**Phase 3 — Dynamic Integration**
*   [ ] Connect the `IntensityManager` to the `ProceduralMusicGenerator`. The intensity value should now actively control the volume and complexity of the different procedural layers (e.g., fading in more complex drum patterns or brighter synth layers as intensity rises).
*   [ ] Add a master low-pass filter to the `ProceduralMusicGenerator`'s output and have the `IntensityManager` control its frequency.
*   [ ] Refine the `IntensityManager` algorithm to incorporate more gameplay variables (combo, lines/min) for a more nuanced feel.

**Phase 4 — Polish & Expansion**
*   [ ] Add more real-time effects (reverb, delay) that can be controlled by game state, applying them to both background music and SFX.
*   [ ] Balance the mix between the background procedural music and the foreground procedural synths.
*   [ ] Implement a "Zone Mode" state that temporarily overrides BPM and effects for a dramatic shift in the procedural music.
*   [ ] Explore more complex algorithmic composition techniques within the `ProceduralMusicGenerator` to enhance musical variety.

## 5. Feasibility & Risk Assessment

*   **Technical Feasibility:** **High.** This approach fully leverages Tone.js and aligns with web-native development. It's complex but entirely within our control.

*   **Primary Risks:**
    1.  **Sonic Quality:** Achieving a "rich" or "professionally composed" sound with purely procedural synths is inherently difficult. The background music may sound simpler or more "gamey" than sampled tracks. **Mitigation:** Focus on creating musically coherent, evolving patterns rather than trying to mimic complex orchestral sounds. Embrace the unique aesthetic of procedural synthesis.
    2.  **CPU Performance:** Generating all audio in real-time (multiple synths, sequences, and effects) can be CPU-intensive, especially on mobile or lower-end devices. **Mitigation:** Profile performance rigorously. Optimize synth presets, limit polyphony, and simplify complex sequences if necessary. Consider using simpler Tone.js instruments where appropriate.
    3.  **Algorithmic Composition:** Designing compelling, non-repetitive musical patterns in code requires a blend of programming and musical understanding. **Mitigation:** Start with simple, effective loops and iterate. Leverage musical theory concepts (scales, chords, rhythm) to guide the procedural generation.
