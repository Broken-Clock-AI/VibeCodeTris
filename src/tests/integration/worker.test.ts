// src/tests/integration/worker.test.ts
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { Snapshot } from '../../logic/types';

const WORKER_PATH = resolve(__dirname, '../../logic/worker.ts');

describe('Worker Integration Tests', () => {
    let worker: Worker;
    let lastSnapshot: Snapshot | null = null;
    let messages: any[] = [];

    beforeEach(() => {
        messages = [];
        lastSnapshot = null;
        // To run TypeScript files in a worker, we need to use ts-node
        worker = new Worker(WORKER_PATH, {
            execArgv: ['-r', 'ts-node/register'],
        });

        worker.on('message', (msg) => {
            messages.push(msg);
            if (msg.type === 'snapshot') {
                lastSnapshot = msg.payload;
            }
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
        });
    });

    afterEach(() => {
        worker.terminate();
    });

    test('should start, receive snapshots, and process input', (done) => {
        let snapshotCount = 0;
        worker.on('message', (msg) => {
            if (msg.type === 'snapshot') {
                snapshotCount++;
                expect(msg.payload.tick).toBeGreaterThanOrEqual(1);
                if (snapshotCount === 1) {
                    // After the first snapshot, send an input
                    worker.postMessage({ type: 'input', seq: 1, payload: { action: 'moveLeft' } });
                }
                if (snapshotCount > 2) {
                    // We've received a few snapshots, the test is good
                    done();
                }
            }
        });

        worker.postMessage({ type: 'start', seq: 0, payload: { seed: 12345 } });
    }, 10000); // 10s timeout for async test

    test('should recover from a valid snapshot', (done) => {
        let recovered = false;
        worker.on('message', (msg) => {
            if (msg.type === 'snapshot' && lastSnapshot && !recovered) {
                recovered = true;
                // Terminate the worker to simulate a crash
                worker.terminate().then(() => {
                    // Create a new worker
                    const newWorker = new Worker(WORKER_PATH, {
                        execArgv: ['-r', 'ts-node/register'],
                    });

                    newWorker.on('message', (newMsg) => {
                        if (newMsg.type === 'log' && newMsg.payload.msg.includes('Engine recovered')) {
                            // The new worker has successfully recovered
                            newWorker.terminate();
                            done();
                        }
                    });
                    
                    // Send the recovery message with the last known good snapshot
                    newWorker.postMessage({ type: 'recover', seq: 1, payload: lastSnapshot });
                });
            }
        });

        // Start the engine to get a snapshot
        worker.postMessage({ type: 'start', seq: 0, payload: { seed: 54321 } });
    }, 15000);

    test('should reject out-of-sequence messages', (done) => {
        let logCount = 0;
        worker.on('message', (msg) => {
            if (msg.type === 'log' && msg.payload.level === 'warn') {
                logCount++;
                expect(msg.payload.msg).toContain('out-of-order');
                if (logCount === 1) { // We only expect one out-of-order message
                    done();
                }
            }
        });

        // Send messages with sequence IDs 0, 2, then 1 (out of order)
        worker.postMessage({ type: 'start', seq: 0, payload: { seed: 111 } });
        worker.postMessage({ type: 'input', seq: 2, payload: { action: 'moveRight' } });
        worker.postMessage({ type: 'input', seq: 1, payload: { action: 'moveLeft' } }); // This should be rejected
    }, 10000);
});