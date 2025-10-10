// src/logic/worker.ts

/**
 * This file will act as the main entry point for the Web Worker.
 * It will be responsible for:
 * 1.  Receiving messages from the main thread (UI).
 * 2.  Routing messages to the TetrisEngine.
 * 3.  Managing message sequencing (seq) and checksums.
 * 4.  Handling the crash/recover handshake.
 * 5.  Posting snapshots and events back to the main thread.
 */

console.log("Worker script loaded.");

// Placeholder for the engine instance
let engine: any = null;

self.onmessage = (e: MessageEvent) => {
    const { type, payload, seq } = e.data;

    console.log(`Worker received message: type=${type}, seq=${seq}`);

    switch (type) {
        case 'start':
            // TODO: Initialize TetrisEngine with seed and config
            console.log('Start message received', payload);
            break;
        
        case 'input':
            // TODO: Pass input to the engine
            console.log('Input message received', payload);
            break;

        case 'recover':
            // TODO: Re-initialize engine from a snapshot
            console.log('Recover message received', payload);
            break;
        
        case 'requestSnapshot':
            // TODO: Send the latest snapshot to the main thread
            console.log('Snapshot request received', payload);
            break;

        default:
            console.warn(`Unknown message type received in worker: ${type}`);
            break;
    }
};
