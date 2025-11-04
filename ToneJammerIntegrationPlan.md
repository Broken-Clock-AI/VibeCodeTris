# 🎹 Tone Jammer v2: An Integrated Audio Design Tool

## 1. Vision & Goal

This document outlines a plan to integrate a procedural sound design tool, the **Tone Jammer**, directly into the VibeCodeTris application.

The primary goal is to evolve our audio design workflow from a descriptive, iterative process into a **real-time, interactive, and seamless experience**. This tool will empower the developer to create, randomize, and fine-tune sounds directly within the application. The final output can be copied as a new preset or, more powerfully, used to **directly update the game's source code**, creating a frictionless "round-trip" editing workflow.

## 2. Core Features

The Tone Jammer will be a new, self-contained screen accessible from the main menu.

*   **Interactive Synth Controls:** A UI with sliders and selectors for real-time manipulation of a `Tone.js` synthesizer's key parameters.
*   **Enhanced Real-Time Feedback:**
    *   **Live Preview Toggle:** A switch to enable/disable instant audio feedback as parameters are changed.
    *   **Preview Pitch Slider:** A dedicated slider to test the sound at different pitches without altering the preset's base frequency.
*   **Granular Procedural Generation:**
    *   A main "Randomize All" button to generate completely new sounds.
    *   Individual "dice" (🎲) icons next to each parameter group (e.g., Envelope, Filter) to randomize only that section of the sound.
*   **Seamless Preset Management:**
    *   **Load:** A dropdown to load the presets of existing in-game instruments for fine-tuning.
    *   **State Management:** A visual indicator (`*`) to show when a loaded preset has been modified ("dirty" state).
    *   **"Copy as New..." Button:** Copies the current synth's configuration to the clipboard as a new, standalone JSON snippet.
    *   **"Update in Code" Button:** Directly modifies the `src/main.ts` file to update the configuration of the currently loaded preset, eliminating any manual copy-pasting.

## 3. User Interface & Workflow

### a. UI Layout:

*   **Main Panel:** A central area with ~10 sliders and 1 waveform selector.
*   **Parameter Groups:** Each logical group (Envelope, Filter) will have a "dice" (🎲) icon next to its title.
*   **Metadata Panel:** Input fields for `id`, `gain`, `maxVoices`, and `reverb` level.
*   **Control Panel:**
    *   `Load Preset` (Dropdown): Populated with existing instrument IDs. Will show a `*` when modified.
    *   `Live Preview` (Toggle Switch).
    *   `Preview Pitch` (Slider).
    *   `Play` (Button).
    *   `Randomize All` (Button).
    *   `Copy as New...` (Button).
    *   `Update in Code` (Button): Disabled until an existing preset is loaded.
    *   `Back` (Button).

### b. Intended Workflow:

1.  Navigate from **Main Menu** -> **Tone Jammer**.
2.  Select an existing sound like `pieceMovementSynth` from the `Load Preset` dropdown.
3.  Toggle on `[x] Live Preview`.
4.  Adjust the `envelope.decay` slider. The sound plays instantly with each adjustment.
5.  The preset name now shows `pieceMovementSynth*`.
6.  The filter isn't quite right. Click the "dice" icon next to the **Filter** section to randomize only the filter parameters.
7.  Once satisfied, click **"Update in Code"**. The tool will find and replace the `pieceMovementSynth` configuration in `src/main.ts` automatically.
8.  The sound is now updated in the game, with no manual code editing required.

## 4. Technical Implementation Plan

### a. File Structure:

*   **`index.html`**: Add a "Tone Jammer" button and the new screen `div` with all the enhanced UI controls.
*   **`src/main.ts`**:
    *   Wire all Tone Jammer UI controls.
    *   Implement the logic for loading presets, managing the "dirty" state, and orchestrating the calls to the `AudioEngine` and the new `ToneJammerManager`.
*   **`src/audio/AudioEngine.ts`**:
    *   The `playJammerSound(preset: object, pitch: number)` method will be updated to accept a pitch parameter.
*   **`src/ui/tone-jammer.ts` (New File):** This module, a `ToneJammerManager` class, will be the brain of the tool. It will:
    *   Hold the current state of the synth parameters.
    *   Contain the randomization logic (both global and granular).
    *   Generate the JSON for the "Copy as New..." button.
    *   Construct the `replace` tool call for the "Update in Code" button by reading `src/main.ts`, finding the correct instrument object, and replacing it with the new configuration.

### b. Data Structure & "Update in Code" Logic:

The "Update in Code" feature is critical. The `ToneJammerManager` will perform these steps:

1.  Read the entire content of `src/main.ts`.
2.  Find the `audioConfig` object.
3.  Within the `instruments` array, locate the object whose `id` matches the loaded preset. This requires careful string manipulation or regex to ensure accuracy.
4.  Generate the new configuration string from the tool's current state.
5.  Use the `replace` tool to swap the old instrument object string with the new one in the file content.

This provides a robust, automated way to manage the audio configuration directly from the tool.