Perfect — let’s produce a **fully scaffolded AI-agent-ready deliverable map** for your Tetris engine. This will include:

* **Explicit module breakdown**
* **Task DAG / dependencies**
* **Function signatures / interfaces**
* **Stub data / golden snapshots**
* **Edge-case matrix for deterministic verification**
* **Feature gating for optional modules**

---

# **1 — Module & Deliverable Breakdown**

| Module                         | Deliverable        | Scope                                                                                   | Interfaces / Signatures                                                                                                           | Notes / AI Guidance                                         |
| ------------------------------ | ------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Engine Core**                | engine.ts          | Deterministic tick loop, board, spawn/lock/merge, snapshot emitter                      | `tick(inputQueue: Input[], deltaTicks: number): Snapshot` <br> `spawnPiece(): void` <br> `lockPiece(): Event[]`                   | MVP core; all PRNG/bag/lock/back-to-back/combo logic here   |
| **Rules**                      | rules.ts           | SRS rotation, wall kicks, scoring, T-Spins, back-to-back, combo                         | `rotate(piece: Piece, direction: RotateDir, board: Board): boolean` <br> `scoreLines(lines: number, type: LineClearType): number` | Pure logic, testable independently                          |
| **PRNG / Bag**                 | rng.ts             | Seedable deterministic RNG, 7-bag                                                       | `next(): number` <br> `bag7(): number[]` <br> `serialize(): Uint32Array` <br> `deserialize(state: Uint32Array)`                   | Include serialized state in snapshots for replay            |
| **Worker Router**              | worker.ts          | Message routing: start, input, requestSnapshot, recover, seq/protocolVersion validation | `routeMessage(msg: Message): void` <br> `recover(snapshot: Snapshot): void`                                                       | Handles crash/recover flow; atomic unit for AI to implement |
| **Recovery**                   | recover.ts         | Snapshot validation & bootstrap                                                         | `validateSnapshot(snapshot: Snapshot): boolean` <br> `bootstrapFromSnapshot(snapshot: Snapshot): void`                            | Checks checksum, protocolVersion, engineVersion             |
| **Renderer**                   | pixiRenderer.ts    | MVP PixiJS render: board, ghost, HUD                                                    | `render(snapshot: Snapshot, alpha: number): void` <br> `subscribeEvents(events: Event[]): void`                                   | Optional feature: Visualizer mode / shaders                 |
| **Renderer Adapter**           | renderAPI.ts       | Snapshot/event subscription layer                                                       | `subscribe(callback: (snapshot: Snapshot) => void): void`                                                                         | Decouples engine from renderer                              |
| **UI / Controls**              | controls.tsx       | Keyboard + touch input                                                                  | `onInput(action: Action, source: InputSource): void`                                                                              | Remappable, supports accessibility                          |
| **Accessibility**              | accessibility.ts   | ARIA HUD, high contrast, screen-reader board summaries                                  | `updateHUD(snapshot: Snapshot): void`                                                                                             | Provides textual summary for assistive tech                 |
| **Replay Tool**                | replayPlayer.ts    | Replay engine + golden tests                                                            | `loadReplay(seed: number, inputs: Input[]): void` <br> `play(): void`                                                             | Generates deterministic board for test verification         |
| **Unit Tests**                 | /tests/unit        | Rotation, collision, lock, bag RNG, scoring, DAS/ARR                                    | Test stubs using Vitest                                                                                                           | Fully isolated; AI can generate independently               |
| **Integration / Golden Tests** | /tests/integration | Replay + crash/recover + multi-browser verification                                     | Load replay + assert board hash                                                                                                   | Needs stub golden snapshot example                          |
| **Constants / Config**         | constants.ts       | DAS/ARR defaults, gravity, TPS, feature flags                                           | `DAS: number, ARR: number, Gravity: number`                                                                                       | Configurable, AI can reference during generation            |

---

# **2 — Task DAG / Dependencies**

```
Engine Core
  ├─ Rules (rotation, scoring, wall-kicks)
  ├─ PRNG/Bag
  └─ Constants

Worker Router
  ├─ Engine Core
  ├─ Recover
  └─ Message contract

Recover
  └─ Snapshot schema + checksum

Renderer
  ├─ RenderAPI
  └─ Engine snapshot subscription

Replay Player
  ├─ Engine Core
  └─ PRNG/Bag state serialized

Unit Tests
  ├─ Engine Core
  ├─ Rules
  └─ PRNG/Bag

Integration Tests
  ├─ Replay Player
  ├─ Engine Core
  ├─ Worker Router
  └─ Renderer
```

* **Optional / Post-MVP**

  * Visualizer (Renderer shaders / particles)
  * Audio sync system

> The DAG ensures AI can atomize deliverables and implement modules in parallel wherever dependencies allow.

---

# **3 — Function Signatures / Interfaces (AI-Friendly)**

### Engine

```ts
interface Engine {
  tick(inputQueue: Input[], deltaTicks: number): Snapshot;
  spawnPiece(): void;
  lockPiece(): Event[];
  serializeState(): Uint8Array;
  deserializeState(data: Uint8Array): void;
}
```

### Worker

```ts
interface WorkerRouter {
  routeMessage(msg: Message): void;
  recover(snapshot: Snapshot): void;
}
```

### Renderer

```ts
interface Renderer {
  render(snapshot: Snapshot, alpha: number): void;
  subscribeEvents(events: Event[]): void;
}
```

### PRNG / Bag

```ts
interface PRNG {
  next(): number;
  bag7(): number[];
  serialize(): Uint32Array;
  deserialize(state: Uint32Array): void;
}
```

---

# **4 — Stub Data / Golden Snapshots**

* **Golden snapshot structure**

```ts
const goldenSnapshot: Snapshot = {
  protocolVersion: 1,
  engineVersion: "1.0.0",
  snapshotSchemaVersion: 1,
  snapshotId: 1,
  tick: 0,
  authoritativeTimeMs: 0,
  prngState: new Uint32Array([123456789]),
  bagState: { bag: new Uint8Array([0,1,2,3,4,5,6]), index: 0 },
  inputQueueCursor: 0,
  lockCounter: 0,
  gravityCounter: 0,
  backToBack: 0,
  combo: 0,
  rows: 20,
  cols: 10,
  boardBuffer: new ArrayBuffer(200),
  current: null,
  nextTypes: new Uint8Array([0,1,2]),
  holdType: 0,
  score: 0,
  level: 0,
  lines: 0,
  events: [],
  checksum: 0
};
```

* AI can generate **hundreds of variants** for replay/golden test stubs.

---

# **5 — Edge-Case Scenario Matrix (JSON)**

```json
[
  { "scenario": "hardDropDuringLock", "input": "hardDrop", "tick": 5, "expectedEvent": "lock", "expectedBoardChange": true },
  { "scenario": "rotateIntoWall", "input": "rotateCW", "tick": 7, "expectedEvent": "spawn", "expectedBoardChange": false },
  { "scenario": "DASRepeat", "input": "moveRightHeld", "tick": 10, "expectedPosition": 5 },
  { "scenario": "TSpinMini", "input": "rotateCCW", "tick": 12, "expectedEvent": "tSpin", "backToBack": 1 }
]
```

* AI can use this to auto-generate unit/integration tests per scenario.

---

# **6 — Feature Flags / Optional Modules**

| Feature              | Flag                | Notes                          |
| -------------------- | ------------------- | ------------------------------ |
| Visualizer / Shaders | `ENABLE_VISUALIZER` | Post-MVP                       |
| Particles            | `ENABLE_PARTICLES`  | Depends on WebGL / performance |
| Audio latency tuning | `ENABLE_AUDIO_SYNC` | Optional, post-MVP             |

---

# ✅ Summary

This scaffold provides:

1. **Atomic deliverables** for engine, worker, renderer, replay, tests
2. **Explicit DAG / dependency map** for parallel generation
3. **Function signatures/interfaces** for AI to implement modules independently
4. **Stub snapshots / golden files** for deterministic verification
5. **Edge-case matrix** for test generation
6. **Feature flags** for post-MVP polish

> With this, an AI can autonomously “spaghettify” the project into fully independent tasks, implement them in isolation, and recombine them reliably.

---

If you want, I can **next generate a ready-to-import JIRA / CSV task list** from this scaffold that matches your DAG, with **dependencies, acceptance criteria, and atomic deliverables**, so an AI or human could literally start implementing module-by-module immediately.

Do you want me to do that next?
