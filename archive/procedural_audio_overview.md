# Procedural / Adaptive Music System — Comprehensive Spec

> Purpose: implement a Mini Metro / Dinosaur Polo Club style music system for a web game. The system must generate harmonious, emergent music driven by game events, be deterministic when needed, be low-bandwidth, and scale in density as game complexity increases.

---

## 1 — High-level Design Goals
- **Event-driven:** Game events trigger musical output (notes, arpeggios, pulses, percussive clicks, control changes).
- **Harmonically safe:** Notes are constrained to a per-level tonal palette (scale, mode, root) to guarantee consonance.
- **Clocked/quantized:** Musical events align to a stable transport/clock (beat/bar alignment).
- **Low bandwidth:** Use synths or tiny samples rather than long audio files.
- **Adaptive density:** As the game state grows complex, audio mixes in more layers/effects (reverb/delay) to escalate.
- **Deterministic randomness:** Seeded PRNG for reproducible results when required.
- **Voice limits & pooling:** Cap voices per instrument to avoid CPU overload.
- **Cross-browser friendly:** Respect autoplay policies and provide format fallbacks where necessary.
- **Modular & testable:** Data-driven mapping rules and JSON-configurable instruments and event tables.

---

## 2 — Core Components & Responsibilities
1. **Transport / Scheduler** — central clock with tempo, lookahead scheduling.
2. **Sound Engine** — synths or sample players, voice pools, envelopes, filters, FX sends; API: `trigger(instrumentId, note, velocity, duration, params)`.
3. **Music Rules Engine** — maps game events + state → musical actions. Contains tuning/scale and rhythmic sets.
4. **State Monitor / Complexity Metric** — aggregates game metrics into a normalized `complexity` scalar guiding mix changes.
5. **Asset Manager** — loads samples/synth presets, handles memory and CDN-hosted assets.
6. **Debug / Visualization** — timeline inspector showing scheduled notes, active voices, current scale and complexity.

---

## 3 — Data Models (JSON Schemas)

### Instrument descriptor
```json
{
  "id": "string",
  "type": "synth|sampler",
  "preset": { "synthType": "sine|fm|pluck|..." },
  "sampleUrls": ["https://...ogg"],
  "envelope": { "attack": 0.01, "decay": 0.1, "sustain": 0.7, "release": 0.3 },
  "maxVoices": 8,
  "midiTranspose": 0,
  "gain": 0.8,
  "effects": {
    "sendReverb": 0.2,
    "sendDelay": 0.05,
    "filter": { "type": "lowpass", "frequency": 8000 }
  }
}
```

### EventRule descriptor
```json
{
  "id": "station_spawn",
  "description": "When a new station is placed",
  "instrumentId": "plockedPad",
  "pitchSource": { "type": "mapIndex", "mapKey": "lineIndex", "scalePattern": "majorPentatonic" },
  "rhythm": { "mode": "onBeat", "slot": "nextBar+0" },
  "probability": 1.0,
  "velocity": { "min": 0.6, "max": 0.9 },
  "duration": "8n",
  "mutate": { "detuneRange": 10 }
}
```

### System config (global)
```json
{
  "tempo": 90,
  "timeSignature": "4/4",
  "scaleByLevel": {
    "London": { "root": "D3", "scale": "Dorian" },
    "Default": { "root": "C3", "scale": "MajorPentatonic" }
  },
  "rhythmicSets": {
    "default": ["4n", "4n", "8n", "2n"],
    "busy": ["8n", "8n", "8n", "4n"]
  }
}
```

---

## 4 — Scale & Pitch Mapping Rules (Exact)
- **Scale representation:** store scale as semitone offsets from root, e.g., Major: `[0, 2, 4, 5, 7, 9, 11]`.
- **Quantize function:**
  - Input a pitch candidate (integer index).
  - Map integer → degree: `degree = index % scale.length`.
  - Octave offset: `octave = Math.floor(index / scale.length)`.
  - MIDI = `rootMidi + scale[degree] + octave * 12`.

**Example**: Root `C3` (MIDI 48), pentatonic `[0, 2, 4, 7, 9]`:
- mapIndex 0 → `C3` (48)
- mapIndex 4 → `A3` (57)
- mapIndex 6 → degree 1 (wrap) + octave 1 → `D4` etc.

---

## 5 — Rhythm, Transport & Scheduling (Concrete)
- Use a Transport with configurable lookahead (e.g., 256 ms).
- Align triggers to rhythmic slots (beats, 8th notes, bars).
- Debounce/throttle high-frequency events per beat (e.g., only one stationSpawn per beat).
- **Scheduling pseudocode:**
```text
onGameEvent(e):
  rule = MusicRulesEngine.lookup(e.type)
  if random() > rule.probability then return
  note = MusicRulesEngine.selectPitch(rule, gameState)
  scheduleTime = Transport.alignToNextSlot(rule.rhythm.slot)
  Transport.scheduleAt(scheduleTime, () => SoundEngine.trigger(rule.instrumentId, note, velocity, duration, params))
```

---

## 6 — Deterministic Randomness
- Use seeded PRNG (e.g., mulberry32, xorshift) seeded by `gameSeed + runId`.
- Use it for:
  - Choosing rhythmic variants.
  - Deciding detune.
  - Picking sample variant.
- Example mulberry32 implementation (JS):
```js
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

---

## 7 — Implementation Patterns & Copy-paste Code (Tone.js-based)

> Notes: This is a single-file conceptual demo. Extract to modules in production.

### 7.1 — Setup: Transport + Seeded RNG + Scale class
```js
import * as Tone from "tone";

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

class SeededRNG {
  constructor(seed) { this.rng = mulberry32(seed >>> 0); }
  next() { return this.rng(); }
  nextRange(min, max) { return min + this.next() * (max - min); }
}

class Scale {
  constructor(rootMidi, pattern) {
    this.root = rootMidi;
    this.pattern = pattern;
  }
  quantize(index) {
    const degree = index % this.pattern.length;
    const octave = Math.floor(index / this.pattern.length);
    return this.root + this.pattern[degree] + octave * 12;
  }
  midiToFreq(m) { return 440 * Math.pow(2, (m - 69)/12); }
}

// Example patterns:
const SCALES = { majorPent: [0,2,4,7,9], dorian: [0,2,3,5,7,9,10], lydian: [0,2,4,6,7,9,11] };

const rng = new SeededRNG(12345);
const scale = new Scale(60, SCALES.majorPent);

Tone.Transport.bpm.value = 90;
Tone.Transport.start("+0.1"); // start after user gesture
```

### 7.2 — Instrument manager & voice pooling (Tone.Synth example)
```js
class Instrument {
  constructor(id, opts) {
    this.id = id;
    this.opts = opts;
    this.pool = [];
    this.maxVoices = opts.maxVoices || 8;
    this.gain = new Tone.Gain(opts.gain || 0.8).toDestination();
  }
  trigger(noteMidi, velocity=0.8, dur='8n', when=Tone.now(), params={}) {
    let voice = this.pool.find(v => !v.isPlaying);
    if (!voice) {
      if (this.pool.length < this.maxVoices) {
        voice = new Tone.Synth(this.opts.preset || {}).connect(this.gain);
        this.pool.push(voice);
      } else {
        voice = this.pool.shift();
      }
    }
    const freq = 440 * Math.pow(2, (noteMidi - 69) / 12);
    voice.triggerAttackRelease(freq, dur, when, velocity);
    voice.isPlaying = true;
    setTimeout(() => { voice.isPlaying = false; }, Tone.Time(dur).toMilliseconds());
  }
}

const pad = new Instrument('pad', { preset: { oscillator: { type: 'sine' } }, gain: 0.6 });
const Instruments = new Map();
Instruments.set('pad', pad);
```

### 7.3 — Rules Engine (mapping events → musical actions)
```js
class RulesEngine {
  constructor(config, scale, rng) {
    this.config = config;
    this.scale = scale;
    this.rng = rng;
  }
  handleEvent(ev, gameState) {
    const rule = this.config[ev.type];
    if (!rule) return;
    const p = this.rng.next();
    if (p > (rule.probability || 1)) return;
    const pitchIndex = this.mapPitch(rule.pitchSource, ev, gameState);
    const midi = this.scale.quantize(pitchIndex + (rule.pitchOffset || 0));
    const when = this.alignToSlot(rule.rhythm);
    const vel = rule.velocity ? this.rng.nextRange(rule.velocity.min, rule.velocity.max) : 0.8;
    Instruments.get(rule.instrumentId).trigger(midi, vel, rule.duration || '8n', when);
  }
  mapPitch(ps, ev, gs) {
    if (ps.type === 'mapIndex') {
      return ev[ps.mapKey] || 0;
    } else if (ps.type === 'normalize') {
      const v = gs[ps.mapKey];
      const t = (v - ps.min) / (ps.max - ps.min);
      const idx = Math.floor(t * (this.scale.pattern.length * (ps.octaves || 2)));
      return Math.max(0, idx);
    } else if (ps.type === 'random') {
      return Math.floor(this.rng.nextRange(0, ps.maxIndex || 8));
    }
    return 0;
  }
  alignToSlot(rhythm) {
    const slot = (rhythm && rhythm.slot) ? rhythm.slot : "8n";
    const next = Tone.Time(slot).toSeconds() * Math.ceil(Tone.Transport.seconds / Tone.Time(slot).toSeconds());
    return Tone.now() + (next - Tone.Transport.seconds);
  }
}
```

### 7.4 — Complexity metric & adaptive mix
```js
function computeComplexity(gameState) {
  const w = { lines: 0.4, activeVehicles: 0.3, avgWait: 0.3 };
  const normLines = Math.min(gameState.lines / 20, 1);
  const normVehicles = Math.min(gameState.activeVehicles / 100, 1);
  const normWait = Math.min(gameState.avgWait / 60, 1);
  return (normLines * w.lines + normVehicles * w.activeVehicles + normWait * w.avgWait) / (w.lines + w.activeVehicles + w.avgWait);
}

function updateMix(complexity) {
  const percGain = 0.2 + complexity * 0.8;
  Percussion.gain.gain.rampTo(percGain, 0.5);
  Reverb.send.level.rampTo(0.1 + complexity * 0.5, 0.5);
}
```

---

## 8 — Procedural (No-sample) vs Sample-based: Tradeoffs
- **Procedural (synths only)**: no downloads, instant playback, full pitch control, dynamic timbre, slightly higher CPU load with many voices.
- **Samples**: lower CPU per voice, richer non-synth textures, larger downloads. Use small one-shot samples for percussion/ambience if desired.
- **Hybrid**: best of both — synth for notes, tiny samples for tactile hits or ambiences.

---

## 9 — Instrument Suggestions (procedural synth mappings)
| Game Event | Suggested Synth | Role |
|------------|------------------|------|
| station_spawn | `PluckSynth` | Tuned percussive blip |
| passenger_board | `FMSynth` | Bell/chime accent |
| train_depart | `Synth` (sine/triangle) | Simple melodic tone |
| line_extended | `AMSynth` | Sustained glassy tone |
| overload | `MembraneSynth` | Low percussive tension cue |
| ambient_layer | `Synth` + Reverb | Droning bed |

---

## 10 — Assets & Authoring Recommendations
- Export single-note sample banks or tiny one-shots (50–400ms) at 44.1kHz.
- Use `.ogg` with `.mp3` fallback for Safari.
- Author in OpenMPT, MilkyTracker, SunVox, or any DAW; export minimal samples for each instrument variation.

---

## 11 — Performance & Deployment Notes
- **Voice capping**: enforce per-instrument `maxVoices`. Use voice stealing policy.
- **Pooling**: reuse synth/sampler objects instead of creating per-trigger.
- **Suspend on hidden tabs**: reduce CPU when `document.hidden` is true.
- **Lazy-load**: initial minimal instrument set; fetch more on idle or level load.
- **CDN + caching**: versioned assets with `Cache-Control` for long cache times.

---

## 12 — Debugging & Tuning Tools
- Timeline visualizer for scheduled events.
- Event logger (event, rule chosen, pitch, scheduled time).
- Scale inspector for current root/scale and last N notes.
- Complexity meter (0–1).
- Voice monitor for current voices/CPU usage.

---

## 13 — Testing & QA
- Use seeded PRNG and scripted event sequences for deterministic testing.
- Run stress tests and throttle/coalesce events to check scheduler stability.
- Cross-browser test on Chrome, Firefox, Safari (iOS), Edge.
- Mobile battery & thermal tests for long sessions.

---

## 14 — Edge Cases & Pitfalls
- Avoid scheduling races; always schedule to Transport timeline.
- Coalesce high-frequency events to avoid audio clutter.
- Provide graceful fallback to synths if sample decoding fails.
- Monitor global voice counts and progressively reduce complexity under load.

---

## 15 — Integration Notes
- **Phaser/PIXI**: call RulesEngine from game event handlers; schedule via Transport.
- **Three.js**: same; keep audio scheduling on dedicated audio module.
- **Unity WebGL**: can implement in Unity audio or expose JS hooks to Tone.js; consider fidelity/performance tradeoffs.

---

## 16 — Example JSON Configuration (Full)
```json
{
  "meta": { "name": "MiniMetroLike_Prototype", "tempo": 80, "timeSignature": "4/4" },
  "scales": {
    "default": { "root": 60, "pattern": [0,2,4,7,9] },
    "cityNight": { "root": 62, "pattern": [0,2,3,5,7,9,10] }
  },
  "instruments": [
    { "id":"plock", "type":"synth", "preset": {"oscillator":{"type":"triangle"}}, "maxVoices":6, "gain":0.6 },
    { "id":"click", "type":"sampler", "sampleUrls": ["click.ogg"], "maxVoices":10, "gain":0.8 }
  ],
  "rules": {
    "station_spawn": {
      "instrumentId":"plock",
      "pitchSource": { "type":"mapIndex", "mapKey":"lineIndex" },
      "rhythm": { "slot":"8n" },
      "probability": 1,
      "velocity": { "min":0.5, "max":0.9 },
      "duration":"8n"
    },
    "passenger_delivered": {
      "instrumentId":"click",
      "pitchSource": { "type":"random", "maxIndex":4 },
      "rhythm": { "slot":"16n" },
      "probability": 0.8,
      "velocity": { "min":0.3, "max":0.6 },
      "duration":"16n"
    }
  }
}
```

---

## 17 — Next-step Deliverables (if you want them now)
- Tone.js runnable POC (HTML + single JS file) that responds to `station_spawn`, `passenger_delivered`, and `congestion_increase` with a Start button and timeline visualizer.
- Extracted quotes and timestamps from Disasterpeace talks (if you want verbatim citations).
- Small single-note procedural sample bank exports (zipped).

---

## 18 — Quick reference copy-paste header for resuming work
```
Resume procedural music project:
seed=12345; tempo=90; root=C4; scale=majorPent
Wanted deliverables: Tone.js POC reacting to station_spawn/passenger_delivered/congestion_increase + timeline visualizer + JSON rules export.
```

---

### Author's note
This document is intended to be a complete, self-contained spec for quickly building an experimental web-based procedural music system inspired by *Mini Metro*. Use the code snippets as working scaffolding — they are intentionally pragmatic rather than toyishly academic. Good luck, and if you want the POC now I can generate an HTML+JS file you can run locally.
