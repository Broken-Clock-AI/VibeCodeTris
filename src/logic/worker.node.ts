// src/logic/worker.node.ts
// This file is the entry point for the worker when running in the Node.js test environment.
import type { Snapshot } from './types';

/**
 * The main logic for the worker. It's environment-agnostic and receives
 * a "port" object for communication with the main thread.
 * @param {any} port - The communication port (parentPort in Node).
 */
async function run(port: any) {
    // --- Lazy Imports ---
    const { TetrisEngine } = await import('./engine.js');
    const { TICK_MS } = await import('./constants.js');
    const { validateSnapshot } = await import('./recover.js');

    // --- Worker State ---
    let engine: InstanceType<typeof TetrisEngine> | null = null;
    let loop: NodeJS.Timeout | null = null;
    let sequenceId = 0;
    let lastReceivedSeq = -1;

    function post(type: string, payload?: any, transferables?: Transferable[]) {
        const message = {
            protocolVersion: 1,
            seq: sequenceId++,
            type,
            payload,
        };
        port.postMessage(message, transferables || []);
    }

    function stopEngine() {
        if (loop) {
            clearInterval(loop);
            loop = null;
        }
        engine = null;
        console.log("Engine stopped and cleaned up.");
    }

    function startEngine(seed: number) {
        stopEngine();
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

        if (seq !== undefined && seq <= lastReceivedSeq) {
            console.warn(`Received out-of-order message. Ignoring seq ${seq} (last was ${lastReceivedSeq}).`);
            post('log', { level: 'warn', msg: `out-of-order` });
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
                if (typeof payload === 'object' && payload.type === 'setTimings') {
                    engine.setTimings(payload.das, payload.arr);
                } else {
                    engine.handleInput(payload);
                }
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

    port.on('message', handleMessage);
    console.log("Worker script loaded and message handler attached.");
}

// This is the entry point for the `worker-wrapper.cjs`
export async function workerMain() {
    const { parentPort } = await import('worker_threads');
    if (parentPort) {
        await run(parentPort);
    } else {
        console.error("workerMain called without parentPort. This should not happen.");
    }
}
