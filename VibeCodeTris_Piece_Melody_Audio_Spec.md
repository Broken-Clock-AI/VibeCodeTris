# VibeCodeTris - Piece Melody Audio System Specification

## 1. Executive Summary

This document details the "Piece Melody" audio system, a significant enhancement to VibeCodeTris's fully procedural audio. This system transforms each falling Tetrimino into a temporary musical instrument, where player actions (movement, rotation, drops) generate dynamic melodic and rhythmic feedback relative to the piece's initial spawned note. This moves beyond simple event-based sound effects to a more stateful, piece-centric audio experience, deeply integrating player input with the game's soundscape.

## 2. Core Concept: Piece-Centric Musical Interaction

Instead of generic sound effects, each Tetrimino will be assigned a **root musical note** upon spawning. This note will serve as the tonal center for all subsequent player interactions with that specific piece. As the player moves the piece horizontally, the pitch will shift up or down the musical scale. Vertical movement (soft drops, hard drops) will trigger descending melodic or rhythmic patterns. This creates a unique, short musical phrase for each piece, making player actions feel more expressive and musically integrated.

## 3. Proposed Audio Behavior per Action

| Action | Musical Behavior | Technical Implementation Notes |
| :--- | :--- | :--- |
| **Piece Spawn** | A root note is chosen from the game's active musical scale and played. This note is then stored as the "current piece note" for the active piece. | `AudioEngine` will store `currentPieceNote`. The `pieceSpawn` rule will set this. |
| **Move Left** | Play a note one step **down** the scale from the piece's root note (e.g., if root is G, play E). | New `pieceMoveLeft` event from `engine.ts`. `AudioEngine` calculates `currentPieceNote - 1` (or `currentPieceNote - 2` for larger steps) within the scale. |
| **Move Right** | Play a note one step **up** the scale from the piece's root note (e.g., if root is G, play A). | New `pieceMoveRight` event from `engine.ts`. `AudioEngine` calculates `currentPieceNote + 1` (or `currentPieceNote + 2` for larger steps) within the scale. |
| **Soft Drop** | For each grid unit the piece moves down, play a quiet, rapidly descending note from the piece's root note. | New `softDropTick` event from `engine.ts`. `AudioEngine` triggers a short, low-velocity note, potentially a step down the scale, for each tick. |
| **Hard Drop** | Trigger a fast, impactful **descending arpeggio** or chord based on the piece's root note. This should feel like a conclusive musical flourish. | New `hardDrop` event from `engine.ts`. `AudioEngine` triggers multiple notes (e.g., root, fifth, octave below) in quick succession. |
| **Piece Lock** | Play a final, slightly more percussive or definitive version of the piece's root note. The `currentPieceNote` state is then cleared. | Existing `pieceLock` event. `AudioEngine` uses `currentPieceNote` for the final sound and then resets it. |
| **Line Clear** | (Unchanged from current implementation) Plays a progressive chord based on the number of lines cleared, with a random root note. | This system will coexist with the existing line clear logic. |

## 4. Architectural Changes

### 4.1. Game Engine (`src/logic/engine.ts`)
The game engine needs to become more verbose about piece interactions.
*   **New Events:**
    *   `pieceMoveLeft`: Emitted when a piece successfully moves one unit left.
    *   `pieceMoveRight`: Emitted when a piece successfully moves one unit right.
    *   `softDropTick`: Emitted for each row the piece moves down during a soft drop.
    *   `hardDrop`: Emitted when a piece is hard-dropped.
*   **Event Data:** These events should include relevant data, such as the piece type and its current position, to allow for more nuanced audio responses if needed in the future.

### 4.2. Audio Engine (`src/audio/AudioEngine.ts`)
The `AudioEngine` will need to manage the state of the active piece's melody.
*   **State Management:**
    *   Introduce a private property: `private activePieceRootNote: number | null = null;` to store the base MIDI note of the currently falling piece.
    *   On `pieceSpawn` event: Calculate the initial root note (using the existing `mapPitch` logic, but perhaps with a `random` pitch source for the root) and assign it to `activePieceRootNote`.
    *   On `pieceLock` event: Use `activePieceRootNote` for the lock sound, then reset `activePieceRootNote = null;`.
*   **New Event Handlers:**
    *   Implement new `handleEvent` logic for `pieceMoveLeft`, `pieceMoveRight`, `softDropTick`, and `hardDrop` events.
    *   These handlers will use `activePieceRootNote` to derive the specific pitches for their respective actions, ensuring musical coherence.
*   **New Instrument:**
    *   A new `pieceMovementSynth` instrument (e.g., a short, percussive synth) will be defined in `src/main.ts`'s `audioConfig` to handle the movement and drop sounds.

## 5. Implementation Roadmap

This feature can be implemented iteratively:

*   **Step 1: Engine Event Emission:** Modify `src/logic/engine.ts` to emit the new `pieceMoveLeft`, `pieceMoveRight`, `softDropTick`, and `hardDrop` events.
*   **Step 2: Audio Engine State:** Add `activePieceRootNote` to `AudioEngine.ts` and update `pieceSpawn` and `pieceLock` event handlers to manage this state.
*   **Step 3: Movement Sounds:** Implement `pieceMoveLeft` and `pieceMoveRight` handlers in `AudioEngine.ts`, deriving pitches from `activePieceRootNote` and triggering a new `pieceMovementSynth`.
*   **Step 4: Soft Drop Sound:** Implement the `softDropTick` handler, triggering a descending sequence of notes.
*   **Step 5: Hard Drop Sound:** Implement the `hardDrop` handler, triggering an arpeggiated musical flourish.
*   **Step 6: Refinement:** Tune synth presets, note intervals, and velocities for all new sounds to ensure a pleasing and responsive musical experience.

## 6. Feasibility & Risk Assessment

*   **Technical Feasibility:** **High.** All proposed changes leverage existing Tone.js capabilities and fit within our current procedural audio architecture. The primary challenge is careful state management and event handling.
*   **Primary Risks:**
    1.  **Musical Coherence:** Ensuring the generated melodies for movement and drops sound consistently good with the background music and line clears will require careful tuning of scales, intervals, and synth parameters. **Mitigation:** Start with simple, well-understood musical intervals (e.g., diatonic steps) and iterate extensively through playtesting.
    2.  **Auditory Clutter:** Too many rapid sounds could become overwhelming. **Mitigation:** Use short durations, quick decays, and appropriate velocities for movement sounds. The `EventQuantizer` will help prevent sounds from overlapping awkwardly.
    3.  **Performance:** Rapidly triggering many synths (especially during soft drops) could impact performance. **Mitigation:** Optimize synth presets for efficiency, and consider limiting the polyphony of the `pieceMovementSynth` if necessary.
