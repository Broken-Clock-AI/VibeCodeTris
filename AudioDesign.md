# VibeCodeTris Audio Design

This document outlines the procedural audio design for VibeCodeTris, implemented using Tone.js. The system is designed to be deterministic, musical, and responsive to gameplay.

## Audio Engine Overview

The audio engine is built on the following principles:

*   **Tone.js:** A powerful Web Audio framework used for all synthesis and scheduling.
*   **Deterministic RNG:** A seeded pseudo-random number generator (`mulberry32`) ensures that the audio is the same for a given game seed, which is crucial for replays.
*   **Musical Scales:** All melodic sounds are quantized to a predefined musical scale to ensure they are harmonious.
*   **Instruments:** A pool of synthesizers is managed by an `Instrument` class. Each instrument has a unique ID and a Tone.js preset.
*   **Rules Engine:** A `RulesEngine` maps game events to specific audio rules, which determine which instrument to play and with what parameters.

## Metadata

*   **Tempo:** 100 BPM
*   **Time Signature:** 4/4

## Scales

*   **Default Scale:** C3 Major Pentatonic (`[0, 2, 4, 7, 9]`) rooted at MIDI note 60 (C3).

## Instruments

### 1. `pieceSpawnSynth`

*   **Purpose:** Plays a sound when a new Tetris piece spawns.
*   **Type:** `synth`
*   **Tone.js Preset:**
    *   **Oscillator:** `triangle`
    *   **Envelope:**
        *   `attack`: 0.01
        *   `decay`: 0.2
        *   `sustain`: 0.1
        *   `release`: 0.2
*   **Max Voices:** 6
*   **Gain:** 0.6

### 2. `pieceLockSynth`

*   **Purpose:** Plays a sound when a piece locks into place.
*   **Type:** `synth`
*   **Tone.js Preset:**
    *   **Oscillator:** `sine`
    *   **Envelope:**
        *   `attack`: 0.01
        *   `decay`: 0.1
        *   `sustain`: 0
        *   `release`: 0.1
*   **Max Voices:** 6
*   **Gain:** 0.7

### 3. `lineClearSynth`

*   **Purpose:** Plays a sound when one or more lines are cleared.
*   **Type:** `synth`
*   **Tone.js Preset:**
    *   **Oscillator:** `sine`
    *   **Envelope:**
        *   `attack`: 0.1
        *   `decay`: 0.3
        *   `sustain`: 0.1
        *   `release`: 0.5
*   **Max Voices:** 4
*   **Gain:** 0.8

### 4. `gameOverSynth`

*   **Purpose:** Plays a sound when the game is over.
*   **Type:** `synth`
*   **Tone.js Preset:**
    *   **Oscillator:** `sawtooth`
    *   **Envelope:**
        *   `attack`: 0.1
        *   `decay`: 1
        *   `sustain`: 0.5
        *   `release`: 1
*   **Max Voices:** 1
*   **Gain:** 0.5

### 5. `pieceMovementSynth`

*   **Purpose:** Plays short, percussive sounds for piece movements (left, right, soft drop, hard drop).
*   **Type:** `synth`
*   **Tone.js Preset:**
    *   **Oscillator:** `sine`
    *   **Envelope:**
        *   `attack`: 0.005
        *   `decay`: 0.1
        *   `sustain`: 0
        *   `release`: 0.1
*   **Max Voices:** 8
*   **Gain:** 0.5

## Game Events and Audio Rules

### 1. `pieceSpawn`

*   **Description:** Plays when a new piece spawns.
*   **Instrument:** `pieceSpawnSynth`
*   **Pitch Source:** The pitch is determined by the type of the piece (`I`, `O`, `T`, `L`, `J`, `S`, `Z`), mapping each to a different note in the scale.
*   **Rhythm:** Plays on the event.
*   **Duration:** 16th note.

### 2. `pieceLock`

*   **Description:** Plays when a piece locks.
*   **Instrument:** `pieceLockSynth`
*   **Pitch Source:** A random note from the first 3 notes of the scale.
*   **Rhythm:** Plays on the event.
*   **Duration:** 8th note.

### 3. `lineClear`

*   **Description:** Plays when lines are cleared.
*   **Instrument:** `lineClearSynth`
*   **Pitch Source:** A random note from the first 5 notes of the scale. The chord played depends on the number of lines cleared:
    *   **1 line:** Major triad
    *   **2 lines:** Major triad with an added octave
    *   **3 lines:** Major 7th chord
    *   **4 lines (Tetris):** Major 7th chord with an added octave
*   **Rhythm:** Plays on the event.
*   **Duration:** 4th note.

### 4. `gameOver`

*   **Description:** Plays when the game is over.
*   **Instrument:** `gameOverSynth`
*   **Pitch Source:** The pitch is determined by the final level.
*   **Rhythm:** Plays on the event.
*   **Duration:** Whole note.

### 5. Piece Melody System

This system is not part of the main rules engine but is handled separately in the `AudioEngine`. It creates melodic phrases based on the player's actions.

*   **`pieceMoveLeft` / `pieceMoveRight`**
    *   **Instrument:** `pieceMovementSynth`
    *   **Pitch:** The pitch is based on a "root" note established when the piece spawns. Moving left decreases the pitch, and moving right increases it, creating a melodic progression.
    *   **Rhythm:** Plays on the beat, quantized to the nearest 16th note.
    *   **Duration:** 16th note.

*   **`softDropTick`**
    *   **Instrument:** `pieceMovementSynth`
    *   **Pitch:** A random note slightly below the piece's root note.
    *   **Rhythm:** Plays on the beat, quantized to the nearest 32nd note.
    *   **Duration:** 32nd note.

*   **`hardDrop`**
    *   **Instrument:** `pieceMovementSynth`
    *   **Pitch:** A fast downward arpeggio based on the piece's root note.
    *   **Rhythm:** Plays immediately.
    *   **Duration:** 16th note for each note in the arpeggio.
