// src/logic/worker.ts

// --- Environment Agnostic Shim ---
// This block makes the worker compatible with both browser and Node.js environments.
// It creates a `self` object that mimics the WorkerGlobalScope for Node.js.
if (typeof self === 'undefined') {
    const { parentPort } = require('worker_threads');
    
    // Create a `self` object that mimics the properties we need from the browser's WorkerGlobalScope
    global.self = {
        postMessage: (message: any, transferables?: Transferable[]) => {
            parentPort.postMessage(message, transferables);
        },
        onmessage: null, // This will be assigned by the worker code later
    } as any; // Use 'as any' to satisfy TypeScript, as the signatures are not identical

    // When the parent port receives a message, trigger the `self.onmessage` handler
    parentPort.on('message', (message: any) => {
        if (global.self.onmessage) {
            // Simulate the MessageEvent object that the browser would provide
            global.self.onmessage({ data: message } as MessageEvent);
        }
    });
}
// --- End Shim ---

import { TetrisEngine } from './engine';
import { TICK_MS } from './constants';
import { validateSnapshot } from './recover';
import { GameInput, Snapshot } from './types';

// --- Worker State ---
let engine: TetrisEngine | null = null;
let loop: NodeJS.Timeout | null = null;
let sequenceId = 0;
let lastReceivedSeq = -1;
const inputQueue: GameInput[] = [];

function post(type: string, payload?: any, transferables?: Transferable[]) {
    const message = {
        protocolVersion: 1,
        seq: sequenceId++,
        type,
        payload,
    };
    self.postMessage(message, transferables || []);
}

function stopEngine() {
    if (loop) {
        clearInterval(loop);
        loop = null;
    }
    engine = null;
    inputQueue.length = 0; // Clear the input queue
    console.log("Engine stopped and cleaned up.");
}

function startEngine(seed: number) {
    stopEngine(); // Ensure any previous instance is cleared
    console.log(`Worker starting new engine with seed=${seed}`);
    engine = new TetrisEngine(seed);
    loop = setInterval(processTick, TICK_MS);
    post('log', { level: 'info', msg: 'Engine started.' });
}

function recoverFromSnapshot(snapshot: Snapshot) {
    if (validateSnapshot(snapshot)) {
        stopEngine();
        console.log(`Worker recovering from snapshot ${snapshot.snapshotId}`);
        engine = TetrisEngine.fromSnapshot(snapshot); 
        
        loop = setInterval(processTick, TICK_MS);
        post('log', { level: 'info', msg: `Engine recovered from snapshot ${snapshot.snapshotId}.` });
    } else {
        console.error("Recovery failed: Received invalid snapshot.");
        post('fatal', { error: 'Cannot recover from invalid snapshot.' });
    }
}

function processTick() {
    if (!engine) return;

    try {
        const snapshot = engine.tick();
        post('snapshot', snapshot, [snapshot.boardBuffer]);
    } catch (error) {
        console.error("--- FATAL: Engine crashed ---", error);
        stopEngine();
        post('fatal', { error: (error as Error).message });
    }
}

function handleMessage(data: any) {
    const { type, payload, seq } = data;

    // --- Sequence Validation ---
    if (seq !== undefined && seq <= lastReceivedSeq) {
        console.warn(`Received out-of-order message. Ignoring seq ${seq} (last was ${lastReceivedSeq}).`);
        post('log', { level: 'warn', msg: `out-of-order` }); // Simplified for test stability
        return;
    }
    if (seq !== undefined) {
        lastReceivedSeq = seq;
    }

    switch (type) {
        case 'start':
            startEngine(payload.seed);
            break;
        
        case 'input':
            if (!engine) return;
            engine.handleInput(payload.action);
            break;

        case 'recover':
            recoverFromSnapshot(payload);
            break;
        
        case 'requestSnapshot':
            if (!engine) return;
            const snapshot = engine.tick();
            post('snapshot', snapshot, [snapshot.boardBuffer]);
            break;

        default:
            console.warn(`Unknown message type received in worker: ${type}`);
            post('log', { level: 'warn', msg: `Unknown message type: ${type}` });
            break;
    }
}

// --- Attach Message Listener ---
// @ts-ignore: This is the most reliable way to handle the type mismatch
// between the browser's MessageEvent and Node's simple message object.
self.onmessage = (e: any) => {
    handleMessage(e.data);
};

console.log("Worker script loaded and message handler attached.");