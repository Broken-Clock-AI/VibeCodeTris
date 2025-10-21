// src/tests/integration/replay.test.ts

import { ReplayPlayer } from '../../replay/replayPlayer';
import { ReplayData } from '../../replay/types';
import { TetrisEngine } from '../../logic/engine';
import { Snapshot } from '../../logic/types';

describe('ReplayPlayer Integration Test', () => {
  it('should reproduce the exact same final state from a known replay file', () => {
    const goldenReplay: ReplayData = {
      initialSeed: 12345,
      inputs: [
        { tick: 10, action: 'moveLeft' },
        { tick: 20, action: 'moveRight' },
        { tick: 30, action: 'rotateCW' },
        { tick: 40, action: 'hardDrop' },
        { tick: 55, action: 'moveLeft' },
        { tick: 65, action: 'moveLeft' },
        { tick: 75, action: 'rotateCCW' },
        { tick: 85, action: 'hardDrop' },
      ],
    };

    const goldenEngine = new TetrisEngine(goldenReplay.initialSeed);
    let goldenSnapshot: Snapshot | null = null;

    const replayPlayer = new ReplayPlayer(goldenReplay);
    let finalReplaySnapshot: Snapshot | null = null;

    replayPlayer.subscribe((snapshot) => {
      finalReplaySnapshot = snapshot;
      
      // Drive the golden engine in lock-step with the replay player
      const input = goldenReplay.inputs.find((input) => input.tick === snapshot.tick - 1);
      if (input) {
        goldenEngine.handleInput(input.action);
      }
      goldenSnapshot = goldenEngine.tick();
    });

    const player = replayPlayer as any;
    for (let i = 0; i < 100; i++) {
      player.tick();
    }

    expect(finalReplaySnapshot).not.toBeNull();
    expect(goldenSnapshot).not.toBeNull();

    // Compare the final states
    expect(finalReplaySnapshot!.tick).toBe(goldenSnapshot!.tick);
    expect(finalReplaySnapshot!.score).toBe(goldenSnapshot!.score);
    expect(finalReplaySnapshot!.checksum).toBe(goldenSnapshot!.checksum);
  });
});
