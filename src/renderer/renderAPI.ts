// src/renderer/renderAPI.ts
import { Snapshot } from '../logic/types';

// A simple event emitter for the API
type Listener<T> = (data: T) => void;

class EventEmitter<TEventMap extends Record<string, any>> {
    private listeners: { [K in keyof TEventMap]?: Listener<TEventMap[K]>[] } = {};

    public on<K extends keyof TEventMap>(event: K, listener: Listener<TEventMap[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    public emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void {
        this.listeners[event]?.forEach(listener => listener(data));
    }

    public clear(): void {
        this.listeners = {};
    }
}

// --- Render API ---
// This is the main interface between the UI/renderer and the game engine worker.
class RenderAPI extends EventEmitter<{
    snapshot: Snapshot;
    log: { level: string; msg: string };
    fatal: { error: string };
}> {
    private worker: Worker | null = null;
    private sequenceId = 0;

    constructor() {
        super();
        // Note: Worker initialization is deferred to the start() method
        // to avoid issues with server-side rendering or environment setup.
    }

    private post(type: string, payload?: any) {
        if (!this.worker) {
            console.error("Cannot post message: Worker is not initialized.");
            return;
        }
        this.worker.postMessage({
            protocolVersion: 1,
            seq: this.sequenceId++,
            type,
            payload,
        });
    }

    private handleMessage(event: MessageEvent) {
        const { type, payload } = event.data;
        switch (type) {
            case 'snapshot':
                this.emit('snapshot', payload as Snapshot);
                break;
            case 'log':
                this.emit('log', payload);
                break;
            case 'fatal':
                this.emit('fatal', payload);
                this.destroy(); // Worker is in a terminal state
                break;
            default:
                console.warn(`RenderAPI received unknown message type: ${type}`);
                break;
        }
    }

    /**
     * Starts the game engine worker.
     * @param seed The seed for the random number generator.
     */
    public start(seed: number) {
        if (this.worker) {
            console.warn("RenderAPI: Worker already started. Ignoring call.");
            return;
        }
        
        // Using Vite's special worker constructor
        this.worker = new Worker(new URL('../logic/worker.ts', import.meta.url), {
            type: 'module'
        });

        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = (err) => {
            console.error("Worker error:", err);
            this.emit('fatal', { error: err.message });
        };

        this.post('start', { seed });
    }

    /**
     * Sends a user input action to the worker.
     * @param action The action to send (e.g., 'moveLeft').
     */
    public sendInput(action: any) {
        this.post('input', action);
    }

    /**
     * Requests a fresh snapshot from the worker.
     */
    public requestSnapshot() {
        this.post('requestSnapshot', { reason: 'Manual request from UI' });
    }

    /**
     * Destroys the worker and clears all event listeners.
     */
    public destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            console.log("Worker terminated.");
        }
        this.clear(); // Clear all event listeners
    }
}

// Export a singleton instance of the API
export const renderAPI = new RenderAPI();