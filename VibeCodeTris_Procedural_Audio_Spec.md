# VibeCodeTris: Procedural & Adaptive Music System Specification

> **Purpose**: To implement a procedural, adaptive music system for VibeCodeTris. The system will generate harmonious, emergent music driven by game events, be deterministic for replayability, be low-bandwidth, and scale in density as game intensity increases. This document is the master specification, adapted from the original generic plan for direct integration into the VibeCodeTris architecture.

---

## 1 — High-level Design Goals
- **Event-driven:** Game events trigger musical output (notes, arpeggios, pulses, percussive clicks).
- **Harmonically safe:** Notes are constrained to a tonal palette (scale, mode, root) to guarantee consonance.
- **Clocked/quantized:** Musical events align to a stable transport/clock for rhythmic cohesion.
- **Low bandwidth:** Prioritize internal synths over samples to ensure instant playback with no downloads.
- **Adaptive density:** As the game state grows more intense, the audio mix will add layers and effects to match.
- **Deterministic randomness:** Use the game's master seed for the audio PRNG to ensure 100% reproducible audio for replays.
- **Voice limits & pooling:** Cap voices per instrument to avoid CPU overload and maintain performance.
- **Cross-browser friendly:** Respect browser autoplay policies.
- **Modular & testable:** Use data-driven mapping rules and JSON-configurable instruments.

---

## 2 — Architectural Integration Plan

The audio engine will be implemented entirely on the **main thread**, as the Web Audio API is not accessible from the Logic Worker. It will integrate with the existing worker-based architecture without modification to the core game loop.

*   **Data Flow:**
    1.  Game events (`lineClear`, `pieceLock`, etc.) occur within `engine.ts` in the Logic Worker.
    2.  These events are collected into an `events` array on the `Snapshot` object.
    3.  The worker posts the `Snapshot` to the main thread via `postMessage`.
    4.  A new `AudioEngine` module on the main thread receives the snapshot, iterates the `events` array, and triggers the corresponding musical actions.

*   **Core Components & Location:**
    1.  **Transport / Scheduler**: `Tone.js` transport, lives on the main thread.
    2.  **Sound Engine**: `Tone.js` synths and voice pools, lives on the main thread.
    3.  **Music Rules Engine**: Maps game events to musical actions, lives on the main thread.
    4.  **State Monitor / Complexity Metric**: Computes game intensity from the snapshot, lives on the main thread.
    5.  **Deterministic PRNG**: A second instance of the game's `rng.ts` class, seeded with the same master game seed, lives on the main thread.

---

## 3 — Data Models (JSON Schemas)

### Instrument Descriptor
```json
{
  "id": "string",
  "type": "synth",
  "preset": { "synthType": "sine|fm|pluck|membrane|..." },
  "envelope": { "attack": 0.01, "decay": 0.1, "sustain": 0.7, "release": 0.3 },
  "maxVoices": 8,
  "gain": 0.8,
  "effects": { "sendReverb": 0.2, "sendDelay": 0.05 }
}
```

### EventRule Descriptor (VibeCodeTris Example)
```json
{
  "id": "lineClear",
  "description": "When one or more lines are cleared",
  "instrumentId": "arpeggiatorSynth",
  "pitchSource": { "type": "mapIndex", "mapKey": "linesCleared" },
  "rhythm": { "mode": "onEvent" },
  "probability": 1.0,
  "velocity": { "min": 0.8, "max": 1.0 },
  "duration": "4n"
}
```

### System Config (Global)
```json
{
  "tempo": 100,
  "timeSignature": "4/4",
  "scale": { "root": "C3", "pattern": "MajorPentatonic" },
  "rhythmicSets": {
    "default": ["4n", "4n", "8n", "2n"],
    "busy": ["8n", "8n", "8n", "4n"]
  }
}
```

---

## 4 — VibeCodeTris Component Adaptation

### A. Game Events
The audio system will be driven by events from the `events` array in the game snapshot. Key audible events include:
*   `hardDrop`
*   `lineClear`
*   `pieceLock`
*   `pieceSpawn`
*   `gameOver`
*   `levelUp`
*   `tSpin` (if implemented)

### B. Complexity Metric
Game intensity will be calculated from the snapshot to adapt the audio mix.

**`computeComplexity` for VibeCodeTris:**
```typescript
function computeComplexity(snapshot) {
  // Normalize values to a 0-1 range
  const levelProgress = Math.min(snapshot.level / 20, 1); // Assumes level cap around 20
  const boardHeight = snapshot.stats.maxHeight / snapshot.options.height; // How full is the board?
  const gravity = Math.min(snapshot.gravity / 2, 1); // Normalize gravity

  // Weighted average
  const weights = { level: 0.5, height: 0.3, gravity: 0.2 };
  const complexity = (levelProgress * weights.level) + (boardHeight * weights.height) + (gravity * weights.gravity);

  return complexity;
}
```

### C. Instrument & Rule Mapping
This table defines the initial sound design for VibeCodeTris events.

| Game Event | Suggested Synth (`Tone.js`) | Musical Role | Pitch/Parameter Mapping |
| :--- | :--- | :--- | :--- |
| `pieceSpawn` | `PluckSynth` | Light, high-pitched melodic blip. | Pitch mapped to the current piece type (e.g., I, J, L). |
| `pieceLock` | `MembraneSynth` | Solid, bassy, percussive hit. | Pitch mapped to the piece's final Y-position (lower is deeper). |
| `hardDrop` | `NoiseSynth` | A quick, descending "swoosh" sound. | The duration of the noise sweep is proportional to drop distance. |
| `lineClear` (1-3) | `FMSynth` | A rising arpeggio of 2-3 notes. | The number of notes matches the lines cleared. |
| `lineClear` (4) | `AMSynth` + `FMSynth` | A fuller, celebratory chord or arpeggio. | A distinct, major-key sound to signify a "Tetris". |
| `levelUp` | `Synth` | A sustained, uplifting pad sound. | A clear two-note motif (e.g., a perfect fifth). |
| `gameOver` | `Synth` | A low, dissonant, descending tone. | A minor-second interval that slowly fades out. |

---

## 5 — Implementation Roadmap

Development will proceed in the following concrete steps:

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

---

## 6 — Boilerplate & Patterns (from original spec)

The following sections contain the original, still-relevant technical details and code patterns for implementing the system with `Tone.js`.

### Scale & Pitch Mapping
- **Scale representation:** store scale as semitone offsets from root, e.g., Major: `[0, 2, 4, 5, 7, 9, 11]`.
- **Quantize function:**
  - Input a pitch candidate (integer index).
  - Map integer → degree: `degree = index % scale.length`.
  - Octave offset: `octave = Math.floor(index / scale.length)`.
  - MIDI = `rootMidi + scale[degree] + octave * 12`.

### Rhythm & Scheduling
- Use a `Tone.Transport` with a lookahead (e.g., 256 ms).
- Align triggers to rhythmic slots (beats, 8th notes, bars) for musicality.
- Debounce or throttle high-frequency events to avoid audio clutter.

### Performance & Deployment
- **Voice Capping**: Enforce per-instrument `maxVoices`. Use a voice stealing policy (e.g., oldest voice).
- **Pooling**: Reuse synth/sampler objects instead of creating them per-trigger.
- **Suspend on Hidden Tabs**: Reduce CPU when `document.hidden` is true by pausing the `Tone.Transport`.
- **Lazy-loading**: Not required for a synth-only approach.

### Debugging & Tuning Tools
- A simple event logger (`console.log`) showing (event, rule chosen, pitch, scheduled time) will be sufficient for initial development.
- A UI element displaying the current `complexity` metric (0–1).
