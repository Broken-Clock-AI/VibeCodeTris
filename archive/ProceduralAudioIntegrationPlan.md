# Procedural Audio: Readiness & Integration Analysis

This analysis reviews the provided `procedural_audio_overview.md` spec and outlines a plan to adapt and integrate it into the existing VibeCodeTris architecture.

**Executive Summary:**
The specification is exceptionally well-structured, comprehensive, and technically sound. Its core principles (event-driven, deterministic, harmonically safe) are highly compatible with the VibeCodeTris project goals. The provided code examples for `Tone.js` serve as excellent boilerplate.

The primary challenge is not one of feasibility, but of **adaptation**. The spec is generic, using examples from simulation games like *Mini Metro*. My analysis focuses on mapping its concepts to the specific mechanics and architecture of VibeCodeTris.

---

### 1. Architectural Integration Plan

The VibeCodeTris engine is architecturally split between a **Logic Worker** and a **Main Thread (UI/Renderer)**. The audio system must respect this boundary.

*   **Placement:** The entire audio engine, including `Tone.js`, the transport, and the rules engine, will reside on the **main thread**. The Web Audio API, which `Tone.js` orchestrates, is a main-thread context and cannot be accessed from a worker.
*   **Communication:** The Logic Worker is the source of truth for all game events. The existing communication channel, where the worker `postMessage`s a `Snapshot` to the main thread 60 times per second, is the perfect vehicle for audio events.
*   **Data Flow:**
    1.  Game events (e.g., `lineClear`, `pieceLock`) occur within `engine.ts` in the worker.
    2.  These events are collected into an `events` array on the `Snapshot` object.
    3.  The worker posts the `Snapshot` to the main thread.
    4.  In `main.ts`, a new `AudioEngine` module will listen for incoming snapshots, iterate through the `events` array, and trigger the appropriate musical actions.

This approach requires **no changes** to the core worker architecture and leverages the existing, resilient communication pipeline.

---

### 2. Component Adaptation for VibeCodeTris

Several components from the spec need to be redefined for a Tetris context.

#### **A. Game Events**

The spec's `EventRule` descriptor uses IDs like `"station_spawn"`. We will replace these with the actual event types emitted by the VibeCodeTris engine. Based on the project's `src/logic/types.ts`, the key audible events are:

*   `hardDrop`
*   `lineClear`
*   `pieceLock`
*   `pieceSpawn`
*   `gameOver`
*   `levelUp`
*   `tSpin` (if implemented)

#### **B. Complexity Metric**

The spec's `computeComplexity` function is based on vehicles and wait times. A Tetris-equivalent metric should be based on game intensity.

**Proposed `computeComplexity` for VibeCodeTris:**

```typescript
function computeComplexity(snapshot) {
  // Normalize values to a 0-1 range
  const levelProgress = Math.min(snapshot.level / 20, 1); // Assumes level cap around 20 for max complexity
  const boardHeight = snapshot.stats.maxHeight / snapshot.options.height; // How full is the board?
  const gravity = Math.min(snapshot.gravity / 2, 1); // Normalize gravity, assuming max gravity is ~2 blocks/frame

  // Weighted average
  const weights = { level: 0.5, height: 0.3, gravity: 0.2 };
  const complexity = (levelProgress * weights.level) + (boardHeight * weights.height) + (gravity * weights.gravity);

  return complexity;
}
```

This metric will be used to dynamically adjust the mix, such as increasing the volume of a background drone or adding more reverb/delay as the game becomes more intense.

#### **C. Deterministic Randomness (PRNG)**

The project already has a deterministic, seeded PRNG in `src/logic/rng.ts`. To ensure replays are sonically identical to the original gameplay, the audio engine on the main thread will instantiate its own PRNG using the **same game seed** provided to the logic worker. This guarantees that any random musical variations (e.g., velocity changes, rhythmic fills) are perfectly reproducible.

---

### 3. Proposed Instrument & Rule Mapping

The following is an initial draft for mapping Tetris events to procedural sounds, following the pattern in the spec.

| Game Event | Suggested Synth (`Tone.js`) | Musical Role | Pitch/Parameter Mapping |
| :--- | :--- | :--- | :--- |
| `pieceSpawn` | `PluckSynth` | Light, high-pitched melodic blip. | Pitch mapped to the current piece type (e.g., I, J, L). |
| `pieceLock` | `MembraneSynth` | Solid, bassy, percussive hit. | Pitch mapped to the piece's final Y-position (lower is deeper). |
| `hardDrop` | `NoiseSynth` | A quick, descending "swoosh" sound. | The duration of the noise sweep is proportional to drop distance. |
| `lineClear` (1-3) | `FMSynth` | A rising arpeggio of 2-3 notes. | The number of notes matches the lines cleared. |
| `lineClear` (4) | `AMSynth` + `FMSynth` | A fuller, celebratory chord or arpeggio. | A distinct, major-key sound to signify a "Tetris". |
| `levelUp` | `Synth` | A sustained, uplifting pad sound. | A clear two-note motif (e.g., a perfect fifth). |
| `gameOver` | `Synth` | A low, dissonant, descending tone. | A minor-second interval that slowly fades out. |

**Example `EventRule` for a Line Clear:**

```json
{
  "id": "lineClear",
  "description": "When one or more lines are cleared",
  "instrumentId": "arpeggiatorSynth",
  "pitchSource": { "type": "mapIndex", "mapKey": "linesCleared" },
  "rhythm": { "mode": "onEvent" },
  "velocity": { "min": 0.8, "max": 1.0 },
  "duration": "4n"
}
```

---

### 4. Revised Implementation Plan

Based on this analysis, I propose the following concrete steps:

1.  **Dependency Installation:** Add `tone` to `package.json`.
2.  **Module Scaffolding:** Create a new directory `src/audio` to house all audio-related code.
3.  **AudioEngine Implementation:** Create a central `AudioEngine.ts` class on the main thread. This class will:
    *   Initialize `Tone.js` and the master audio context upon user interaction (e.g., a "Start Game" or "Enable Audio" button).
    *   Contain the `Transport`, `Instrument` manager, and `RulesEngine`.
    *   Expose a public method, `handleSnapshot(snapshot)`, to receive game state updates.
4.  **Integration with `main.ts`:**
    *   Instantiate the `AudioEngine` in `main.ts`.
    *   In the existing worker `onmessage` handler, pass every received snapshot to `audioEngine.handleSnapshot(snapshot)`.
5.  **Initial Sound Test:** Implement the rule for a single, high-impact event like `lineClear` to verify the entire pipeline is working.
6.  **UI Controls:** Add a master Mute button and a volume slider to the main UI.
