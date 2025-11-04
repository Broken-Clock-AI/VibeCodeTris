// src/ui/tone-jammer.ts

import { AudioConfig, InstrumentConfig } from "../audio/types";
import { AudioEngine } from "../audio/AudioEngine";

type JammerUIElements = {
    loadPreset: HTMLSelectElement;
    livePreview: HTMLInputElement;
    previewPitch: HTMLInputElement;
    play: HTMLButtonElement;
    randomizeAll: HTMLButtonElement;
    copy: HTMLButtonElement;
    update: HTMLButtonElement;
    id: HTMLInputElement;
    gain: HTMLInputElement;
    maxVoices: HTMLInputElement;
    reverb: HTMLInputElement;
    waveform: HTMLSelectElement;
    envAttack: HTMLInputElement;
    envDecay: HTMLInputElement;
    envSustain: HTMLInputElement;
    envRelease: HTMLInputElement;
};

/**
 * Manages the state and logic for the Tone Jammer UI.
 */
export class ToneJammerManager {
    private audioConfig: AudioConfig;
    private audioEngine: AudioEngine;
    private ui: JammerUIElements;
    private currentState: Partial<InstrumentConfig> = {};

    constructor(audioConfig: AudioConfig, audioEngine: AudioEngine, uiElements: JammerUIElements) {
        this.audioConfig = audioConfig;
        this.audioEngine = audioEngine;
        this.ui = uiElements;
        this.populatePresetDropdown();
        this.attachEventListeners();
        console.log('ToneJammerManager initialized');
    }

    private populatePresetDropdown(): void {
        this.ui.loadPreset.innerHTML = ''; // Clear existing options
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a preset...';
        this.ui.loadPreset.appendChild(defaultOption);

        this.audioConfig.instruments.forEach(instrument => {
            const option = document.createElement('option');
            option.value = instrument.id;
            option.textContent = instrument.id;
            this.ui.loadPreset.appendChild(option);
        });
    }

    private attachEventListeners(): void {
        this.ui.play.addEventListener('click', () => this.playSound());
        this.ui.randomizeAll.addEventListener('click', () => this.randomizeAll());

        // Add listeners to all controls for live preview
        const controls = [
            this.ui.previewPitch, this.ui.gain, this.ui.maxVoices, this.ui.reverb, 
            this.ui.waveform, this.ui.envAttack, this.ui.envDecay, 
            this.ui.envSustain, this.ui.envRelease
        ];
        controls.forEach(control => {
            control.addEventListener('change', () => {
                if (this.ui.livePreview.checked) {
                    this.playSound();
                }
            });
            control.addEventListener('pointerup', () => {
                if (this.ui.livePreview.checked) {
                    this.playSound();
                }
            });
            control.addEventListener('keyup', () => {
                if (this.ui.livePreview.checked) {
                    this.playSound();
                }
            });
        });
    }

    private getCurrentSynthState(): any {
        return {
            oscillator: {
                type: this.ui.waveform.value
            },
            envelope: {
                attack: parseFloat(this.ui.envAttack.value),
                decay: parseFloat(this.ui.envDecay.value),
                sustain: parseFloat(this.ui.envSustain.value),
                release: parseFloat(this.ui.envRelease.value)
            }
        };
    }

    private playSound(): void {
        const preset = this.getCurrentSynthState();
        const pitch = parseInt(this.ui.previewPitch.value, 10);
        this.audioEngine.playJammerSound(preset, pitch);
    }

    /**
     * Randomizes all synth parameters.
     */
    public randomizeAll(): void {
        const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
        this.ui.waveform.value = waveforms[Math.floor(Math.random() * waveforms.length)];
        this.ui.gain.value = Math.random().toFixed(2);
        this.ui.reverb.value = Math.random().toFixed(2);

        // Randomize envelope
        this.ui.envAttack.value = (Math.random() * 2).toFixed(3);
        this.ui.envDecay.value = (Math.random() * 2).toFixed(3);
        this.ui.envSustain.value = Math.random().toFixed(2);
        this.ui.envRelease.value = (Math.random() * 5).toFixed(2);
        
        // Update current state from UI
        this.updateStateFromUI();

        if (this.ui.livePreview.checked) {
            this.playSound();
        }
    }

    private updateStateFromUI(): void {
        this.currentState = {
            ...this.currentState,
            gain: parseFloat(this.ui.gain.value),
            effects: {
                sendReverb: parseFloat(this.ui.reverb.value)
            },
            preset: this.getCurrentSynthState()
        };
    }

    /**
     * Randomizes a specific group of parameters.
     * @param group The parameter group to randomize (e.g., 'envelope', 'filter').
     */
    public randomizeGroup(group: string): void {
        console.log(`Randomizing parameter group: ${group}`);
        // Logic to randomize a specific group will go here.
    }

    /**
     * Generates a JSON string of the current synth configuration.
     * @returns A JSON string of the current state.
     */
    public copyAsNew(): string {
        console.log('Copying current state as new JSON');
        this.updateStateFromUI();
        return JSON.stringify(this.currentState, null, 2);
    }

    /**
     * Updates the audio configuration in the main source code.
     */
    public updateInCode(): void {
        console.log('Updating configuration in source code');
        // This will involve reading src/main.ts, finding the config, and replacing it.
    }

    /**
     * Loads a preset into the Tone Jammer.
     * @param presetId The ID of the preset to load.
     */
    public loadPreset(presetId: string): void {
        const instrument = this.audioConfig.instruments.find(inst => inst.id === presetId);
        if (!instrument) {
            console.error(`Preset with id "${presetId}" not found.`);
            return;
        }
        
        this.currentState = instrument;
        console.log('Loading preset:', this.currentState);
        
        // Update UI with loaded preset values
        this.ui.id.value = instrument.id;
        this.ui.gain.value = instrument.gain.toString();
        this.ui.maxVoices.value = instrument.maxVoices.toString();
        this.ui.reverb.value = (instrument.effects?.sendReverb || 0).toString();
        
        if (instrument.preset.oscillator) {
            this.ui.waveform.value = instrument.preset.oscillator.type;
        }

        if (instrument.preset.envelope) {
            this.ui.envAttack.value = (instrument.preset.envelope.attack || 0.005).toString();
            this.ui.envDecay.value = (instrument.preset.envelope.decay || 0.1).toString();
            this.ui.envSustain.value = (instrument.preset.envelope.sustain || 0.3).toString();
            this.ui.envRelease.value = (instrument.preset.envelope.release || 1).toString();
        }
        
        // Enable the "Update in Code" button
        this.ui.update.disabled = false;
    }
}
