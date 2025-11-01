// src/audio/types.ts

import * as Tone from "tone";

// Define the SCALES object here as well, or import it if it's in its own file
export const SCALES = {
  majorPent: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  // Add other scales as needed
};

export interface PitchSourceConfig {
  type: 'mapIndex' | 'normalize' | 'random';
  mapKey?: string;
  scalePattern?: keyof typeof SCALES;
  min?: number;
  max?: number;
  octaves?: number;
  maxIndex?: number;
}

export interface RhythmConfig {
  mode: 'onBeat' | 'onEvent';
  slot?: Tone.Unit.Time;
}

export interface EventRuleConfig {
  id: string;
  description: string;
  instrumentId: string;
  pitchSource: PitchSourceConfig;
  rhythm: RhythmConfig;
  probability?: number;
  velocity?: { min: number; max: number };
  duration?: Tone.Unit.Time;
  pitchOffset?: number;
}

export interface InstrumentConfig {
  id: string;
  type: 'synth' | 'sampler'; // Currently only 'synth' is implemented
  preset?: Tone.SynthOptions; // Tone.SynthOptions for synth type
  sampleUrls?: string[]; // For sampler type
  envelope?: { attack: number; decay: number; sustain: number; release: number };
  maxVoices?: number;
  gain?: number;
  effects?: {
    sendReverb?: number;
    sendDelay?: number;
    filter?: { type: string; frequency: number };
  };
}

export interface ScaleConfig {
  root: number; // MIDI note number for the root
  pattern: keyof typeof SCALES; // Name of the scale pattern
}

export interface AudioConfig {
  meta: {
    name: string;
    tempo: number;
    timeSignature: Tone.Unit.TimeSignature;
  };
  scales: {
    default: ScaleConfig;
    [key: string]: ScaleConfig; // Allow for other named scales
  };
  instruments: InstrumentConfig[];
  rules: { [key: string]: EventRuleConfig };
}
