// src/logic/worker.ts

// This worker is designed to be isomorphic, running in both Node.js for tests
// and the browser for the actual application.

import { TICK_MS } from './constants';

// Type placeholder for the engine, to be filled by the dynamic import.
type TetrisEngineType = import('./engine.js').TetrisEngine;
type TetrisEngineConstructor = typeof import('./engine.js').TetrisEngine;

// Lazy-loaded engine constructor.
let Engine: TetrisEngineConstructor | null = null;

/**
 * Dynamically imports and returns the TetrisEngine constructor.
 * Caches the result to avoid repeated dynamic imports.
 */
async function getEngineConstructor(): Promise<TetrisEngineConstructor> {
    if (!Engine) {
        const { TetrisEngine } = await import('./engine.js');
        Engine = TetrisEngine;
    }
    return Engine;
}

/**
 * The main, environment-agnostic logic for the worker.
 * @param port The communication port (parentPort in Node, self in browser).
 */
function run(port: any) {
    let engine: TetrisEngineType | null = null;
    let loop: NodeJS.Timeout | null = null;
    let sequenceId = 0;
    let lastReceivedSeq = -1;

    const post = (type: string, payload?: any, transferables?: Transferable[]) => {
        port.postMessage({ protocolVersion: 1, seq: sequenceId++, type, payload }, transferables || []);
    };

    const stopEngine = () => {
        if (loop) clearInterval(loop);
        loop = null;
        engine = null;
    };

    const startEngine = async (seed: number, isLineClearAnimationEnabled: boolean) => {
        stopEngine();
        const EngineConstructor = await getEngineConstructor();
        engine = new EngineConstructor(seed, isLineClearAnimationEnabled);
        loop = setInterval(processTick, TICK_MS);
        post('log', { level: 'info', msg: 'Engine started.' });
    };

    const recoverFromSnapshot = async (snapshot: any) => {
        const { validateSnapshot } = await import('./recover.js');
        if (validateSnapshot(snapshot)) {
            stopEngine();
            const EngineConstructor = await getEngineConstructor();
            engine = EngineConstructor.fromSnapshot(snapshot);
            loop = setInterval(processTick, TICK_MS);
            post('log', { level: 'info', msg: `Engine recovered from snapshot ${snapshot.snapshotId}.` });
        } else {
            console.error("Recovery failed: Received invalid snapshot.");
            post('fatal', { error: 'Cannot recover from invalid snapshot.' });
        }
    };

    const processTick = () => {
        if (!engine) return;
        try {
            const snapshot = engine.tick();
            post('snapshot', snapshot);
        } catch (error) {
            console.error("--- FATAL: Engine crashed ---", error);
            stopEngine();
            post('fatal', { error: (error as Error).message });
        }
    };

    const handleMessage = (data: any) => {
        const { type, payload, seq } = data;
        if (seq !== undefined) {
            if (seq <= lastReceivedSeq) {
                post('log', { level: 'warn', msg: 'out-of-order' });
                return;
            }
            lastReceivedSeq = seq;
        }

        switch (type) {
            case 'start': startEngine(payload.seed, payload.isLineClearAnimationEnabled); break;
            case 'input': engine?.handleInput(payload); break;
            case 'recover': recoverFromSnapshot(payload); break;
        }
    };

    port.on('message', (eventOrData: any) => {
        handleMessage(eventOrData.data || eventOrData);
    });
}

// --- Environment-Specific Entry Point ---
(async () => {
    const isNode = typeof process !== 'undefined' && process.versions?.node;

    if (isNode) {
        // We are in Node.js (test environment)
        try {
            // Use eval to hide the import from Vite's static analysis
            const { parentPort } = await eval("import('worker_threads')");
            run(parentPort);
        } catch (e) {
            console.error("Node.js worker initialization failed:", e);
        }
    } else {
        // We are in the browser
        const port = self as any;
        // Shim the `.on()` method for API consistency with Node's EventEmitter
        port.on = (eventName: string, listener: (event: MessageEvent) => void) => {
            if (eventName === 'message') {
                port.addEventListener('message', listener);
            }
        };
        run(port);
    }
})();