// src/tests/integration/worker.test.ts
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { Snapshot } from '../../logic/types';

jest.setTimeout(30000); // 30s global timeout for this file

// Point directly to the compiled worker file.
const WORKER_PATH = resolve(__dirname, '../../../dist/logic/worker.js');

describe('Worker Integration Tests', () => {
    let worker: Worker;
    let lastSnapshot: Snapshot | null = null;
    let messages: any[] = [];

    beforeEach((done) => {
        messages = [];
        lastSnapshot = null;
        
        // Load the compiled JS worker as an ES Module.
        worker = new Worker(WORKER_PATH, {
            workerData: {}, // Pass any initial data if needed
            type: 'module',
        } as any);

        let isReady = false;
        worker.on('message', (msg) => {
            messages.push(msg);
            if (msg.type === 'snapshot') {
                lastSnapshot = msg.payload;
            }
            // The worker is ready once it has started and sent its first log message.
            if (msg.type === 'log' && msg.payload.msg === 'Engine started.' && !isReady) {
                isReady = true;
                done();
            }
        });

        worker.on('error', (err) => {
            console.error('Worker error:', err);
            // If the worker errors during setup, fail the test.
            done(err);
        });

        // Start the worker immediately for all tests.
        worker.postMessage({ type: 'start', seq: 0, payload: { seed: 12345 } });
    });

    afterEach(() => {
        worker.terminate();
    });

    test('should process input after starting', (done) => {
        let snapshotCount = 0;
        const messageHandler = (msg: any) => {
            if (msg.type === 'snapshot') {
                snapshotCount++;
                if (snapshotCount > 1) { // Wait for a snapshot after the input
                    // A simple check to see if state changed is enough
                    worker.off('message', messageHandler); // Clean up listener
                    done();
                }
            }
        };
        worker.on('message', messageHandler);
        // Send an input after the worker is confirmed ready.
        worker.postMessage({ type: 'input', seq: 1, payload: { action: 'moveLeft' } });
    });

    test('should recover from a valid snapshot', (done) => {
        let recovered = false;
        const messageHandler = (msg: any) => {
            if (msg.type === 'snapshot' && lastSnapshot && !recovered) {
                recovered = true;
                worker.off('message', messageHandler); // Clean up listener

                worker.terminate().then(() => {
                    const newWorker = new Worker(WORKER_PATH, {
                        workerData: {}, // Pass any initial data if needed
                        type: 'module',
                    } as any);

                    newWorker.on('message', (newMsg) => {
                        if (newMsg.type === 'snapshot') {
                            const recoveredSnapshot = newMsg.payload;
                            expect(recoveredSnapshot.tick).toBe(lastSnapshot!.tick + 1);
                            expect(recoveredSnapshot.score).toBe(lastSnapshot!.score);
                            newWorker.terminate();
                            done();
                        }
                    });
                    
                    newWorker.on('error', (err) => done(err));
                    newWorker.postMessage({ type: 'recover', seq: 1, payload: lastSnapshot });
                });
            }
        };
        worker.on('message', messageHandler);
    });

    test('should reject out-of-sequence messages', (done) => {
        const messageHandler = (msg: any) => {
            if (msg.type === 'log' && msg.payload.level === 'warn') {
                expect(msg.payload.msg).toContain('out-of-order');
                worker.off('message', messageHandler); // Clean up listener
                done();
            }
        };
        worker.on('message', messageHandler);

        worker.postMessage({ type: 'input', seq: 2, payload: { action: 'moveRight' } });
        worker.postMessage({ type: 'input', seq: 1, payload: { action: 'moveLeft' } }); 
    });
});