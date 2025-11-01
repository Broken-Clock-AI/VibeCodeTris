// src/audio/AudioEngine.ts
import { Snapshot } from "../logic/types";
import { AudioConfig, InstrumentConfig, EventRuleConfig, PitchSourceConfig, RhythmConfig, SCALES } from "./types";
import { GRAVITY_START_DELAY } from "../logic/constants";

// --- Type Imports for Tone.js ---
// We can't import the whole library at the top level, but we need the types.
import type { Gain as ToneGain, Synth as ToneSynth, PolySynth as TonePolySynth, Unit as ToneUnit, Time as ToneTime } from "tone";

// --- Deterministic PRNG (from spec) ---
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

class SeededRNG {
  private rng: () => number;
  constructor(seed: number) { this.rng = mulberry32(seed >>> 0); }
  next(): number { return this.rng(); }
  nextRange(min: number, max: number): number { return min + this.next() * (max - min); }
}

// --- Scale & Pitch Mapping (from spec) ---
class Scale {
  private root: number;
  private pattern: number[];

  constructor(rootMidi: number, patternName: keyof typeof SCALES) {
    this.root = rootMidi;
    this.pattern = SCALES[patternName];
  }

  quantize(index: number): number {
    const degree = index % this.pattern.length;
    const octave = Math.floor(index / this.pattern.length);
    return this.root + this.pattern[degree] + octave * 12;
  }

  midiToFreq(m: number): number { return 440 * Math.pow(2, (m - 69) / 12); }
}

// --- Instrument Manager & Voice Pooling (adapted from spec) ---
class Instrument {
  public id: string;
  private opts: InstrumentConfig;
  private pool: (ToneSynth | TonePolySynth)[];
  private maxVoices: number;
  private gainNode: ToneGain;
  private Tone: any; // Store the dynamically imported Tone.js library

  constructor(id: string, opts: InstrumentConfig, toneLib: any) {
    this.id = id;
    this.opts = opts;
    this.Tone = toneLib;
    this.maxVoices = opts.maxVoices || 8;
    this.gainNode = new this.Tone.Gain(opts.gain || 0.8).toDestination();
    this.pool = [];
  }

  trigger(noteMidi: number | number[], velocity: number = 0.8, dur: ToneUnit.Time = '8n', when: ToneUnit.Time, params: any = {}) {
    const isChord = Array.isArray(noteMidi);
    const freqs = isChord ? noteMidi.map(m => this.midiToFreq(m)) : this.midiToFreq(noteMidi);

    let voice;
    if (isChord) {
        voice = new this.Tone.PolySynth(this.Tone.Synth, this.opts.preset || {}).connect(this.gainNode);
    } else {
        voice = this.pool.find(v => !(v as any).isPlaying);
        if (!voice) {
            if (this.pool.length < this.maxVoices) {
                voice = new this.Tone.Synth(this.opts.preset || {}).connect(this.gainNode);
                this.pool.push(voice);
            } else {
                voice = this.pool.shift()!;
                voice.dispose();
                voice = new this.Tone.Synth(this.opts.preset || {}).connect(this.gainNode);
                this.pool.push(voice);
            }
        }
    }
    
    voice.triggerAttackRelease(freqs, dur, when, velocity);

    if (!isChord) {
        (voice as any).isPlaying = true;
        setTimeout(() => { (voice as any).isPlaying = false; }, this.Tone.Time(dur).toMilliseconds());
    } else {
        // For PolySynth, dispose after the duration to clean up resources
        setTimeout(() => { voice.dispose(); }, this.Tone.Time(dur).toMilliseconds() + 100);
    }
  }

  private midiToFreq(m: number): number {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
}

const Instruments = new Map<string, Instrument>();

// --- Rules Engine (adapted from spec) ---
class RulesEngine {
  private config: { [key: string]: EventRuleConfig };
  private scale: Scale;
  private rng: SeededRNG;
  private Tone: any;

  constructor(config: { [key: string]: EventRuleConfig }, scale: Scale, rng: SeededRNG, toneLib: any) {
    this.config = config;
    this.scale = scale;
    this.rng = rng;
    this.Tone = toneLib;
  }

  handleEvent(ev: any, gameState: any) {
    console.log(`[AudioEngine] Handling event:`, ev);
    const rule = this.config[ev.type];
    if (!rule) {
        console.log(`[AudioEngine] No rule found for event type: ${ev.type}`);
        return;
    }
    console.log(`[AudioEngine] Found rule:`, rule);

    const p = this.rng.next();
    if (p > (rule.probability || 1)) {
        console.log(`[AudioEngine] Probability check failed (${p} > ${rule.probability || 1}). Skipping.`);
        return;
    }

    let midi: number | number[];
    let vel = rule.velocity ? this.rng.nextRange(rule.velocity.min, rule.velocity.max) : 0.8;

    if (ev.type === 'lineClear') {
        const basePitchIndex = this.mapPitch(rule.pitchSource, ev, gameState);
        const rootNote = this.scale.quantize(basePitchIndex + (rule.pitchOffset || 0));
        const lineCount = ev.data.count;
        
        const majorTriad = [rootNote, rootNote + 4, rootNote + 7];
        
        switch (lineCount) {
            case 1: // Single
                midi = majorTriad;
                vel = 0.7;
                break;
            case 2: // Double
                midi = [...majorTriad, rootNote + 12]; // Add octave
                vel = 0.8;
                break;
            case 3: // Triple
                midi = [...majorTriad, rootNote + 11]; // Major 7th
                vel = 0.9;
                break;
            case 4: // Tetris
                midi = [...majorTriad, rootNote + 11, rootNote + 12]; // Major 7th + octave
                vel = 1.0;
                break;
            default:
                midi = majorTriad;
                vel = 0.7;
                break;
        }
    } else {
        const pitchIndex = this.mapPitch(rule.pitchSource, ev, gameState);
        midi = this.scale.quantize(pitchIndex + (rule.pitchOffset || 0));
    }

    const when = this.alignToSlot(rule.rhythm);

    console.log(`[AudioEngine] Calculated audio parameters:`, { midi, when, vel });

    const instrument = Instruments.get(rule.instrumentId);
    if (instrument) {
        console.log(`[AudioEngine] Triggering instrument '${rule.instrumentId}'`);
        instrument.trigger(midi, vel, rule.duration || '8n', when);
    } else {
        console.error(`[AudioEngine] Instrument not found: ${rule.instrumentId}`);
    }
  }

  private mapPitch(ps: PitchSourceConfig, ev: any, gs: any): number {
    if (ps.type === 'mapIndex') {
      const pieceTypeMap: { [key: string]: number } = {
        'I': 0, 'O': 1, 'T': 2, 'L': 3, 'J': 4, 'S': 5, 'Z': 6
      };
      const key = ev.data ? ev.data[ps.mapKey!] : undefined;
      return key !== undefined && pieceTypeMap[key] !== undefined ? pieceTypeMap[key] : 0;
    } else if (ps.type === 'normalize') {
      const v = gs[ps.mapKey!];
      const t = (v - ps.min!) / (ps.max! - ps.min!);
      const idx = Math.floor(t * (this.scale.pattern.length * (ps.octaves || 2)));
      return Math.max(0, idx);
    } else if (ps.type === 'random') {
      return Math.floor(this.rng.nextRange(0, ps.maxIndex || 8));
    }
    return 0;
  }

  private alignToSlot(rhythm: RhythmConfig): number {
    const now = this.Tone.now();
    const slot = (rhythm && rhythm.slot) ? rhythm.slot : "8n";
    const next = this.Tone.Time(slot).toSeconds() * Math.ceil(this.Tone.Transport.seconds / this.Tone.Time(slot).toSeconds());
    return now + (next - this.Tone.Transport.seconds);
  }
}

function getGravityTicks(level: number): number {
    if (level <= 0) return GRAVITY_START_DELAY;
    const gravity = Math.max(1, GRAVITY_START_DELAY - Math.pow(level, 1.5));
    return gravity;
}

function computeComplexity(snapshot: Snapshot): number {
    const levelProgress = Math.min(snapshot.level / 20, 1);
    const board = new Uint8Array(snapshot.boardBuffer);
    const { rows, cols } = snapshot;
    let maxHeight = 0;
    for (let r = 0; r < rows; r++) {
        let rowHasBlock = false;
        for (let c = 0; c < cols; c++) {
            if (board[r * cols + c] !== 0) {
                rowHasBlock = true;
                break;
            }
        }
        if (rowHasBlock) {
            maxHeight = rows - r;
            break;
        }
    }
    const boardHeight = maxHeight / rows;
    const gravityTicks = getGravityTicks(snapshot.level);
    const gravity = 1.0 - ( (gravityTicks - 1) / (GRAVITY_START_DELAY - 1) );
    const weights = { level: 0.5, height: 0.3, gravity: 0.2 };
    const complexity = (levelProgress * weights.level) + (boardHeight * weights.height) + (gravity * weights.gravity);
    return Math.max(0, Math.min(1, complexity));
}

// --- AudioEngine Class ---
export class AudioEngine {
  private rng: SeededRNG;
  private rulesEngine: RulesEngine | null = null;
  private masterGain: ToneGain | null = null;
  private initialized: boolean = false;
  private config: AudioConfig;
  private Tone: any = null;

  constructor(gameSeed: number, config: AudioConfig) {
    this.rng = new SeededRNG(gameSeed);
    this.config = config;
  }

  public async initializeAudioContext() {
    if (this.initialized) return;

    // Dynamically import Tone.js
    this.Tone = await import("tone");
    
    await this.Tone.start();
    this.initialized = true;

    this.masterGain = new this.Tone.Gain(1).toDestination();

    this.Tone.Transport.bpm.value = this.config.meta.tempo;
    this.Tone.Transport.timeSignature = this.config.meta.timeSignature;

    const scale = new Scale(this.config.scales.default.root, this.config.scales.default.pattern);

    this.config.instruments.forEach((instConfig: InstrumentConfig) => {
      const instrument = new Instrument(instConfig.id, instConfig, this.Tone);
      Instruments.set(instConfig.id, instrument);
    });

    this.rulesEngine = new RulesEngine(this.config.rules, scale, this.rng, this.Tone);
    
    this.Tone.Transport.start("+0.1");
    console.log("AudioContext initialized and Tone.Transport started.");
  }

  public playTestSound() {
      if (!this.initialized) {
          console.warn("AudioEngine not initialized. Cannot play test sound.");
          return;
      }
      console.log("Attempting to play test sound...");
      const testInstrument = Instruments.get("pieceSpawnSynth");
      if (testInstrument) {
          const now = this.Tone.now();
          testInstrument.trigger(60, 0.8, '8n', now); // Play a C4 note
          console.log("Test sound triggered on instrument 'pieceSpawnSynth'.");
      } else {
          console.error("Test sound failed: 'pieceSpawnSynth' instrument not found.");
      }
  }

  public handleSnapshot(snapshot: Snapshot) {
    if (!this.initialized || !this.rulesEngine) return;

    snapshot.events.forEach(event => {
      this.rulesEngine!.handleEvent(event, snapshot);
    });

    const complexity = computeComplexity(snapshot);
    this.updateMix(complexity);
  }

  private updateMix(complexity: number) {
    if (!this.masterGain) return;
    const targetGain = 0.5 + complexity * 0.5;
    this.masterGain.gain.rampTo(targetGain, 0.5);
  }

  public setMasterVolume(volume: number) {
    if (!this.masterGain) return;
    this.masterGain.gain.value = volume;
  }

  public toggleMute(mute: boolean) {
    if (!this.masterGain) return;
    this.masterGain.mute = mute;
  }
}
