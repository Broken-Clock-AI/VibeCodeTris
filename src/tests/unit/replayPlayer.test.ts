/** @jest-environment jsdom */

// src/tests/unit/replayPlayer.test.ts

import { ReplayPlayer } from '../../replay/replayPlayer';
import { ReplayData } from '../../replay/types';
import { GameInput, Snapshot } from '../../logic/types';
import { TetrisEngine } from '../../logic/engine';

// Mock the TetrisEngine to isolate the ReplayPlayer logic
jest.mock('../../logic/engine');

const MockedTetrisEngine = TetrisEngine as jest.MockedClass<typeof TetrisEngine>;

// A minimal snapshot object for testing purposes
const mockSnapshot: Snapshot = {
  tick: 0,
  gameOver: false,
  protocolVersion: 1,
  engineVersion: 'test',
  snapshotSchemaVersion: 1,
  snapshotId: 1,
  authoritativeTimeMs: 0,
  prngState: new Uint32Array(),
  bagState: { bag: new Uint8Array(), index: 0 },
  inputQueueCursor: 0,
  lockCounter: 0,
  gravityCounter: 0,
  backToBack: 0,
  combo: 0,
  rows: 20,
  cols: 10,
  boardBuffer: new ArrayBuffer(0),
  current: null,
  nextTypes: new Uint8Array(),
  holdType: 0,
  score: 0,
  level: 1,
  lines: 0,
  events: [],
  checksum: 0,
};

describe('ReplayPlayer', () => {
  let requestAnimationFrameCallbackQueue: ((time: number) => void)[] = [];

  beforeEach(() => {
    // Clear all mocks before each test
    MockedTetrisEngine.mockClear();
    
    (MockedTetrisEngine.prototype.tick as jest.Mock).mockImplementation(() => {
      return { ...mockSnapshot };
    });

    // Mock requestAnimationFrame to have manual control over the game loop
    requestAnimationFrameCallbackQueue = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: (time: number) => void) => {
      requestAnimationFrameCallbackQueue.push(callback);
      return requestAnimationFrameCallbackQueue.length;
    });
  });

  afterEach(() => {
    (window.requestAnimationFrame as jest.Mock).mockRestore();
  });

  const advanceFrame = () => {
    // Dequeue and execute the oldest animation frame callback
    const callback = requestAnimationFrameCallbackQueue.shift();
    if (callback) {
      callback(0); // The time argument is not used by ReplayPlayer
    }
  };

  it('should instantiate correctly with replay data', () => {
    const replayData: ReplayData = { initialSeed: 123, inputs: [] };
    new ReplayPlayer(replayData);
    expect(MockedTetrisEngine).toHaveBeenCalledWith(123);
  });

  it('should start playback when play() is called', () => {
    const replayData: ReplayData = { initialSeed: 1, inputs: [] };
    const replayPlayer = new ReplayPlayer(replayData);
    
    const snapshotCallback = jest.fn();
    replayPlayer.subscribe(snapshotCallback);
    
    replayPlayer.play(); // Sync tick 1
    expect(snapshotCallback).toHaveBeenCalledTimes(1);
    
    advanceFrame(); // Async tick 2
    expect(snapshotCallback).toHaveBeenCalledTimes(2);
  });

  it('should process inputs at the correct tick', () => {
    const inputs: GameInput[] = [
      { tick: 1, action: 'moveLeft' },
      { tick: 3, action: 'rotateCW' },
    ];
    const replayData: ReplayData = { initialSeed: 1, inputs };
    const replayPlayer = new ReplayPlayer(replayData);
    const engineInstance = MockedTetrisEngine.mock.instances[0];
    const snapshotCallback = jest.fn();
    replayPlayer.subscribe(snapshotCallback);

    // play() calls the first tick synchronously
    replayPlayer.play(); // Tick 1
    expect(engineInstance.handleInput).toHaveBeenCalledTimes(1);
    expect(engineInstance.handleInput).toHaveBeenNthCalledWith(1, 'moveLeft');

    advanceFrame(); // Tick 2
    
    advanceFrame(); // Tick 3
    expect(engineInstance.handleInput).toHaveBeenCalledTimes(2);
    expect(engineInstance.handleInput).toHaveBeenNthCalledWith(2, 'rotateCW');

    expect(snapshotCallback).toHaveBeenCalledTimes(3);
  });

  it('should stop playback when pause() is called', () => {
    const replayData: ReplayData = { initialSeed: 1, inputs: [] };
    const replayPlayer = new ReplayPlayer(replayData);
    const snapshotCallback = jest.fn();
    replayPlayer.subscribe(snapshotCallback);
    
    replayPlayer.play(); // Tick 1
    expect(snapshotCallback).toHaveBeenCalledTimes(1);

    replayPlayer.pause();

    // Try to advance a frame after pausing
    advanceFrame();
    // The callback should not have been called again
    expect(snapshotCallback).toHaveBeenCalledTimes(1);
  });
});
