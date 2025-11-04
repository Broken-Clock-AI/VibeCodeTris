// src/audio/AudioEngine.ts
import { Snapshot } from "../logic/types";
import { AudioConfig, InstrumentConfig, EventRuleConfig, PitchSourceConfig, RhythmConfig, SCALES } from "./types";
import { GRAVITY_START_DELAY } from "../logic/constants";
import * as Tone from 'tone';
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
  public pattern: number[];
  private root: number;

  constructor(rootMidi: number, patternName: keyof typeof SCALES) {
    this.root = rootMidi;
    this.pattern = SCALES[patternName];
  }

  quantize(index: number): number {
    // This calculation correctly handles negative indices by wrapping them.
    const degree = ((index % this.pattern.length) + this.pattern.length) % this.pattern.length;
    const octave = Math.floor(index / this.pattern.length);
    return this.root + this.pattern[degree] + octave * 12;
  }

  midiToFreq(m: number): number { return 440 * Math.pow(2, (m - 69) / 12); }
}

// --- Instrument Manager & Voice Pooling (adapted from spec) ---
class Instrument {
  public id: string;
  private opts: InstrumentConfig;
  private pool: (ToneSynth | TonePolySynth)[] = [];
  private maxVoices: number;
  private gainNode: ToneGain | null = null;
  private reverb: Tone.Reverb | null = null;
  private initialized: boolean = false;

  constructor(id: string, opts: InstrumentConfig) {
    this.id = id;
    this.opts = opts;
    this.maxVoices = opts.maxVoices || 8;
  }

  public init() {
    if (this.initialized) return;
    this.gainNode = new Tone.Gain(this.opts.gain || 0.8).toDestination();
    if (this.opts.effects?.sendReverb) {
        this.reverb = new Tone.Reverb({
            decay: 4,
            preDelay: 0.01,
            wet: this.opts.effects.sendReverb
        }).connect(this.gainNode);
    }
    this.initialized = true;
  }

  trigger(noteMidi: number | number[], velocity: number = 0.8, dur: ToneUnit.Time = '8n', when?: ToneUnit.Time, params: any = {}) {
    if (!this.initialized || !this.gainNode) return;
    const isChord = Array.isArray(noteMidi);
    const freqs = isChord ? noteMidi.map(m => this.midiToFreq(m)) : this.midiToFreq(noteMidi);
    const safeWhen = when ?? Tone.now();

    let voice;
    if (isChord) {
        voice = new Tone.PolySynth(Tone.Synth, this.opts.preset || {}).connect(this.reverb || this.gainNode);
    } else {
        voice = this.pool.find(v => !(v as any).isPlaying);
        if (!voice) {
            if (this.pool.length < this.maxVoices) {
                voice = new Tone.Synth(this.opts.preset || {}).connect(this.reverb || this.gainNode);
                this.pool.push(voice);
            } else {
                // Voice stealing: re-use the oldest voice (at the front of the array) without disposing it.
                voice = this.pool.shift()!;
                this.pool.push(voice); // Move it to the end of the array to mark it as most recently used.
            }
        }
    }
    
    // Explicitly schedule attack and release to avoid internal Tone.js timing issues with long notes.
    const durationInSeconds = Tone.Time(dur).toSeconds();
    voice.triggerAttack(freqs as any, safeWhen, velocity);
    if (durationInSeconds > 0) {
        voice.triggerRelease(safeWhen + durationInSeconds);
    }

    if (!isChord) {
        (voice as any).isPlaying = true;
        // Set the voice to be not playing slightly after its duration to account for the release phase.
        setTimeout(() => { 
            (voice as any).isPlaying = false; 
        }, Tone.Time(dur).toMilliseconds() + 50);
    } else {
        // For the temporary PolySynth, dispose after the duration to clean up resources
        setTimeout(() => { 
            voice.dispose(); 
        }, Tone.Time(dur).toMilliseconds() + 100);
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
  private activePieceRootIndex: number | null = null;
  private activePieceCurrentIndex: number | null = null;

  constructor(config: { [key: string]: EventRuleConfig }, scale: Scale, rng: SeededRNG) {
    this.config = config;
    this.scale = scale;
    this.rng = rng;
  }

  handleEvent(ev: any, gameState: any) {
    const rule = this.config[ev.type];
    // A rule isn't required for the new piece melody events, so we check for that.
    if (!rule && !['pieceMoveLeft', 'pieceMoveRight', 'softDropTick', 'hardDrop', 'gravityStep'].includes(ev.type)) {
        return;
    }

    // --- Piece Melody System ---
    // This new system handles piece-specific sounds dynamically.
    switch (ev.type) {
        case 'pieceSpawn':
            const rootIndex = this.mapPitch(this.config.pieceSpawn.pitchSource, ev, gameState);
            this.activePieceRootIndex = rootIndex;
            this.activePieceCurrentIndex = rootIndex;
            break;
        
        case 'pieceMoveLeft':
            if (this.activePieceCurrentIndex !== null) {
                this.activePieceCurrentIndex--; // Create progression
                const midi = this.scale.quantize(this.activePieceCurrentIndex);
                const instrument = Instruments.get('pieceMovementSynth');
                if (instrument) instrument.trigger(midi, 0.6, '16n', this.alignToSlot({ mode: 'onBeat', slot: '16n' }));
            }
            return;

        case 'pieceMoveRight':
            if (this.activePieceCurrentIndex !== null) {
                this.activePieceCurrentIndex++; // Create progression
                const midi = this.scale.quantize(this.activePieceCurrentIndex);
                const instrument = Instruments.get('pieceMovementSynth');
                if (instrument) instrument.trigger(midi, 0.6, '16n', this.alignToSlot({ mode: 'onBeat', slot: '16n' }));
            }
            return;
        
        case 'gravityStep':
            if (this.activePieceRootIndex !== null) {
                const midi = this.scale.quantize(this.activePieceRootIndex - Math.floor(this.rng.nextRange(0, 3))); 
                const instrument = Instruments.get('pieceMovementSynth');
                if (instrument) instrument.trigger(midi, 0.2, '32n', this.alignToSlot({ mode: 'onBeat', slot: '32n' }));
            }
            return;

        case 'softDropTick':
             if (this.activePieceRootIndex !== null) {
                const midi = this.scale.quantize(this.activePieceRootIndex - Math.floor(this.rng.nextRange(0, 3))); 
                const instrument = Instruments.get('pieceMovementSynth');
                if (instrument) instrument.trigger(midi, 0.3, '32n', this.alignToSlot({ mode: 'onBeat', slot: '32n' }));
            }
            return;

        case 'hardDrop':
            if (this.activePieceRootIndex !== null) {
                const root = this.scale.quantize(this.activePieceRootIndex);
                const arpeggio = [root, this.scale.quantize(this.activePieceRootIndex - 2), this.scale.quantize(this.activePieceRootIndex - 4), this.scale.quantize(this.activePieceRootIndex - 7)];
                const instrument = Instruments.get('pieceMovementSynth');
                if (instrument) {
                    const now = Tone.now();
                    instrument.trigger(arpeggio[0], 0.9, '16n', now);
                    instrument.trigger(arpeggio[1], 0.8, '16n', now + 0.05);
                    instrument.trigger(arpeggio[2], 0.7, '16n', now + 0.1);
                    instrument.trigger(arpeggio[3], 0.6, '16n', now + 0.15);
                }
            }
            return;

        case 'pieceLock':
            if (this.activePieceRootIndex !== null) {
                const midi = this.scale.quantize(this.activePieceRootIndex); // Use original root note
                const instrument = Instruments.get(rule.instrumentId);
                if (instrument) instrument.trigger(midi, 0.9, rule.duration || '8n', this.alignToSlot(rule.rhythm));
                
                // Reset state for the next piece
                this.activePieceRootIndex = null;
                this.activePieceCurrentIndex = null;
                return;
            }
            break;
    }

    // --- Generic Rule Handler ---
    if (!rule) return;

    const p = this.rng.next();
    if (p > (rule.probability || 1)) {
        return;
    }

    let midi: number | number[];
    let vel = rule.velocity ? this.rng.nextRange(rule.velocity.min, rule.velocity.max) : 0.8;

    if (ev.type === 'lineClear') {
        const instrument = Instruments.get(rule.instrumentId);
        if (!instrument) {
            console.error(`[AudioEngine] Instrument not found: ${rule.instrumentId}`);
            return;
        }

        const basePitchIndex = this.mapPitch(rule.pitchSource, ev, gameState);
        const rootNote = this.scale.quantize(basePitchIndex + (rule.pitchOffset || 0));
        const lineCount = ev.data.count;
        
        let chord: number[];
        const majorTriad = [rootNote, rootNote + 4, rootNote + 7];
        
        switch (lineCount) {
            case 1: chord = majorTriad; vel = 0.7; break;
            case 2: chord = [...majorTriad, rootNote + 12]; vel = 0.8; break;
            case 3: chord = [...majorTriad, rootNote + 11]; vel = 0.9; break;
            case 4: chord = [...majorTriad, rootNote + 11, rootNote + 12]; vel = 1.0; break;
            default: chord = majorTriad; vel = 0.7; break;
        }

        // Play an arpeggio instead of a block chord
        const now = Tone.now();
        chord.forEach((note, i) => {
            instrument.trigger(note, vel, '8n', now + i * 0.05);
        });
        return; // Skip the generic trigger at the end
    } else {
        // For pieceSpawn, use the newly set current index
        const pitchIndex = ev.type === 'pieceSpawn' && this.activePieceCurrentIndex !== null 
            ? this.activePieceCurrentIndex 
            : this.mapPitch(rule.pitchSource, ev, gameState);
        midi = this.scale.quantize(pitchIndex + (rule.pitchOffset || 0));
    }

    const when = this.alignToSlot(rule.rhythm);

    const instrument = Instruments.get(rule.instrumentId);
    if (instrument) {
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
    const now = Tone.now();
    const slot = (rhythm && rhythm.slot) ? rhythm.slot : "8n";
    const next = Tone.Time(slot).toSeconds() * Math.ceil(Tone.Transport.seconds / Tone.Time(slot).toSeconds());
    return now + (next - Tone.Transport.seconds);
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
  private lastVolume: number = 1;
  private isGameOverSoundPlayed: boolean = false;

  constructor(gameSeed: number, config: AudioConfig) {
    this.rng = new SeededRNG(gameSeed);
    this.config = config;
    
    // Pre-create instrument instances, but don't initialize Tone objects yet.
    this.config.instruments.forEach((instConfig: InstrumentConfig) => {
      const instrument = new Instrument(instConfig.id, instConfig);
      Instruments.set(instConfig.id, instrument);
    });
  }

  public async initializeAudioContext() {
    if (this.initialized) return;
    
    await Tone.start();
    console.log('Audio context started');
    this.initialized = true;

    this.masterGain = new Tone.Gain(1).toDestination();

    Tone.Transport.bpm.value = this.config.meta.tempo;
    Tone.Transport.timeSignature = this.config.meta.timeSignature;

    const scale = new Scale(this.config.scales.default.root, this.config.scales.default.pattern);

    // Now that the audio context is started, initialize the Tone objects inside each instrument.
    Instruments.forEach(instrument => instrument.init());

    this.rulesEngine = new RulesEngine(this.config.rules, scale, this.rng);
    
    Tone.Transport.start("+0.1");
  }

  public playJammerSound(preset: any, pitch: number): void {
    if (!this.initialized) return;
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    const synth = new Tone.Synth(preset).toDestination();
    synth.triggerAttackRelease(freq, '8n', Tone.now());
    // Dispose of the synth after a short time to clean up resources
    setTimeout(() => synth.dispose(), 500);
  }

  public playTestSound() {
      if (!this.initialized) {
          console.warn("AudioEngine not initialized. Cannot play test sound.");
          return;
      }
      const testInstrument = Instruments.get("pieceSpawnSynth");
      if (testInstrument) {
          const now = Tone.now();
          testInstrument.trigger(60, 0.8, '8n', now); // Play a C4 note
      } else {
          console.error("Test sound failed: 'pieceSpawnSynth' instrument not found.");
      }
  }

  public playSpawnSound() {
    if (!this.initialized) return;
    const instrument = Instruments.get("pieceSpawnSynth");
    if (instrument) instrument.trigger(60, 0.8, '8n', Tone.now());
  }

  public playLockSound() {
      if (!this.initialized) return;
      const instrument = Instruments.get("pieceLockSynth");
      if (instrument) instrument.trigger(55, 0.9, '8n', Tone.now());
  }

  public playClearSound() {
      if (!this.initialized) return;
      const instrument = Instruments.get("lineClearSynth");
      if (instrument) {
          const now = Tone.now();
          const chord = [60, 64, 67]; // C Major triad
          chord.forEach((note, i) => {
              instrument.trigger(note, 0.8, '8n', now + i * 0.05);
          });
      }
  }

  public playMovementSound() {
      if (!this.initialized) return;
      const instrument = Instruments.get("pieceMovementSynth");
      if (instrument) instrument.trigger(72, 0.6, '16n', Tone.now());
  }

  public playGameOverSound() {
      if (!this.initialized) return;
      const instrument = Instruments.get("gameOverSynth");
      if (instrument) {
          const now = Tone.now();
          // Descending C minor arpeggio over 2 octaves
          const arpeggio = [72, 67, 63, 60, 55, 51, 48]; 
          const duration = '8n';
          arpeggio.forEach((note, i) => {
              // Decrease velocity for each note to create a fade-out effect
              const velocity = 1.0 - (i * 0.1); 
              instrument.trigger(note, velocity, duration, now + i * 0.12);
          });
      }
  }

  public playMusicBoxTest() {
    if (!this.initialized) {
        console.warn("AudioEngine not initialized. Cannot play music box test.");
        return;
    }

    // Create effects chain
    const reverb = new Tone.Reverb({
        decay: 3,
        wet: 0.25,
    }).toDestination();

    const delay = new Tone.PingPongDelay({
        delayTime: "8n",
        feedback: 0.2,
        wet: 0.15
    }).connect(reverb);

    // Create the synth based on the spec
    const musicBoxSynth = new Tone.FMSynth({
        harmonicity: 3.01,
        modulationIndex: 14,
        oscillator: { type: 'sine' },
        envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0,
            release: 1,
        },
        modulation: { type: 'triangle' },
        modulationEnvelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0,
            release: 0.5,
        },
    }).connect(delay);

    // Play a test arpeggio (C-E-G-A -> G-E-C)
    const now = Tone.now();
    const notes = ["C5", "E5", "G5", "A5", "G5", "E5", "C5"];
    notes.forEach((note, i) => {
        // Add slight random detune for humanization
        musicBoxSynth.detune.value = (Math.random() - 0.5) * 10;
        musicBoxSynth.triggerAttackRelease(note, "8n", now + i * 0.2);
    });
  }

  public playDreamCelestaTest() {
    if (!this.initialized) return;

    const reverb = new Tone.Reverb({ decay: 5, wet: 0.4 }).toDestination();
    const chorus = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.7,
        feedback: 0.1,
        wet: 0.5
    }).connect(reverb);

    const celestaSynth = new Tone.FMSynth({
        harmonicity: 4,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 2 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.02, decay: 0.3, sustain: 0, release: 2 },
    }).connect(chorus);

    const now = Tone.now();
    const notes = ["C5", "E5", "G5", "A5", "G5", "E5", "C5"];
    notes.forEach((note, i) => {
        celestaSynth.detune.value = (Math.random() - 0.5) * 8;
        celestaSynth.triggerAttackRelease(note, "4n", now + i * 0.3);
    });
  }

  public playToyPianoTest() {
    if (!this.initialized) return;

    const reverb = new Tone.Reverb({ decay: 0.5, wet: 0.2 }).toDestination();
    
    const toyPianoSynth = new Tone.Synth({
        oscillator: { type: 'pulse', width: 0.3 },
        envelope: {
            attack: 0.01,
            decay: 0.15,
            sustain: 0.05,
            release: 0.3,
        },
    }).connect(reverb);

    const now = Tone.now();
    const notes = ["C5", "E5", "G5", "A5", "G5", "E5", "C5"];
    notes.forEach((note, i) => {
        toyPianoSynth.triggerAttackRelease(note, "8n", now + i * 0.15);
    });
  }

  public handleSnapshot(snapshot: Snapshot) {
    if (!this.initialized || !this.rulesEngine) return;

    if (snapshot.gameOver) {
        if (!this.isGameOverSoundPlayed) {
            this.playGameOverSound();
            this.isGameOverSoundPlayed = true;
        }
        return;
    } else {
        this.isGameOverSoundPlayed = false;
    }

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
    this.lastVolume = volume;
    this.masterGain.gain.value = volume;
  }

  public toggleMute(mute: boolean) {
    if (!this.masterGain) return;
    if (mute) {
        this.lastVolume = this.masterGain.gain.value;
        this.masterGain.gain.value = 0;
    } else {
        this.masterGain.gain.value = this.lastVolume;
    }
  }
}
