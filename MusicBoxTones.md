Here’s a **high-level, AI-readable outline** you can give to Gemini CLI so it can reason about how to update your game’s tone palette toward a *music-box* sound, like the **Yoshi’s Island** intro.
It’s phrased to be both **descriptive and implementation-oriented** — easy for an LLM to parse and act on.

---

# 🎼 Music-Box Tonality Design Brief

## 1. Overall Character

* **Primary mood:** gentle, nostalgic, lullaby-like.
* **Timbre:** metallic-plucked hybrid — soft bells, toy-piano or celesta tones.
* **Frequency emphasis:** upper mids (2–6 kHz) with smooth high-end roll-off.
* **Dynamic profile:** quiet, airy, with delicate reverb tail.
* **Tempo range:** 70–90 BPM, lullaby swing or simple triple meter.
* **Humanization:** slight detune or micro-timing variance per note.

---

## 2. Instrumentation Layers

### a. **Primary Voice – Music Box Synth**

* **Envelope:** very fast attack (≈ 0.01 s), short decay (0.2–0.4 s), near-zero sustain, long release (≈ 1 s).
* **Oscillator type:** sine or triangle; optionally FM or AM modulation for bell tone.
* **Detune:** ±5–10 cents random per note.
* **Stereo imaging:** light chorus or panning jitter.
* **Goal:** emulate the plucked metal tines of a music box.

### b. **Secondary Layer – Bell / Celesta Accent**

* Optional **one-octave-up** voice, quieter, with longer release.
* Use metallic or sample-based bell overtones to add sparkle.
* Volume -12 to -18 dB relative to main voice.

### c. **Ambience – Reverb & Delay**

* **Reverb:** light, bright, 2–4 s decay, 20–30 % wet mix.
* **Optional delay:** short stereo ping-pong (⅛ note) with subtle feedback (≈ 0.2).
* **Purpose:** creates dreamy space and decay reminiscent of a small resonant box.

### d. **Optional Support Textures**

* Soft pad or sine drone one octave below root to anchor the tonality.
* Vinyl/tape noise layer at –40 dB for analog warmth (optional).

---

## 3. Harmonic & Melodic Language

* **Key center:** major or mixolydian; avoid harsh minor seconds.
* **Intervals:** emphasize 3rds, 6ths, and simple triadic arpeggios.
* **Motion:** broken chords, rocking back-and-forth patterns.
* **Example pattern:** C–E–G–A → G–E–C (descending lullaby gesture).
* **Harmony density:** minimal — 1–3 voices at a time.

---

## 4. Tone.js Implementation Hints

* Base synth: `Tone.FMSynth` or `Tone.MembraneSynth` tuned for bell-like attack.
* Envelope settings and harmonicity from section 2a.
* Add `Tone.Reverb` and optional `Tone.PingPongDelay`.
* For “human” feel, randomize `detune` and `velocity`.
* Maintain per-note release overlap for natural ringing.

---

## 5. Adaptation Goals for Game

* Replace existing “pure sine / saw” voices with the music-box synth template.
* Adjust global mix to favor higher frequency presence and lower dynamic range.
* Ensure loopable playback without abrupt tail cutoffs.
* Maintain CPU efficiency: 2–3 synth layers maximum.

---

## 6. Optional Style Variants

| Variant               | Description                     | Tone Difference                 |
| --------------------- | ------------------------------- | ------------------------------- |
| **Classic Music Box** | Closest to Yoshi’s Island intro | FM Sine + gentle reverb         |
| **Dream Celesta**     | More ethereal                   | Add shimmer, longer reverb      |
| **Toy Piano Hybrid**  | Retro chiptune vibe             | Slight square + shorter release |

---

You can tell Gemini CLI something like:

> “Refactor my current Tone.js synth configuration to implement a **music-box-style soundscape** as described in the above specification — focusing on gentle plucked envelopes, slight detune, and lullaby harmonic motion.”

