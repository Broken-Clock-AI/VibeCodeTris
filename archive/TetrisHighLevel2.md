Perfect — we’re moving from **analysis** to **actionable, reconciled project refactor**. I’ve taken your original spec and the SWOT/gaps I outlined and built a **fully reconciled, next-generation Tetris engine project specification**. This version **resolves or explicitly calls out previously open issues**, adds stronger determinism, snapshot integrity, replay readiness, integration safeguards, and performance-aware design.

---

# **Advanced Refactored Tetris Project Specification**

---

## 1 — Project Purpose (One-Liner, Refined)

Build a **fully deterministic, worker-authoritative Tetris engine** (TypeScript) with:

* Complete **replayability** (seed + input log + PRNG/bag state),
* **Compact, validated snapshots** + event stream,
* **Resilient crash/recover** flow,
* **Tested and performance-aware** minimal PixiJS renderer (MVP) with optional Visualizer mode,
* **Accessibility and fallback support** (Canvas2D, screen-readers, touch).

> Includes explicit reconciliation points for previously unspecified engine state (PRNG, timers, counters).

---

## 2 — Core Architectural Principles (Updated)

* **Authority**: Single Logic Worker is the only source-of-truth. Renderer is fully passive, consuming snapshots/events.
* **Determinism**:

  * Seeded, **integer-only PRNG** with serialized state.
  * Tick-driven fixed-step loop (engine logic only; `performance.now()` only for scheduling).
  * DAS/ARR in ticks (not ms), gravity in ticks.
* **Separation of Concerns**:

  * Logic Worker ↔ Snapshot/Event Bus ↔ Renderer/UI
  * Audio is event-driven and scheduled with tick-to-time mapping.
* **Versioned Contracts & Checksums**:

  * Messages: `protocolVersion`, `seq`, `snapshotId`
  * Snapshots: include `checksum`, `engineVersion`, `snapshotSchemaVersion`
* **Test-first & resilient**:

  * Golden replay tests (multi-browser)
  * Unit tests for rotation, collision, scoring, bag determinism
  * Integration tests for desync, message reordering, crash/recover
* **Accessibility & Fallbacks**:

  * Screen-reader friendly HUD and compressed board summary
  * Canvas2D fallback for devices without WebGL
  * Mobile touch controls with clear mappings
* **Snapshot & replay completeness**:

  * PRNG state, bag state, input queue cursor, lock/gravity counters, back-to-back & combo, current tick, board, current/next/hold, events

---

## 3 — MVP Acceptance Criteria (Refined)

### Engine

* Worker emits snapshots at configurable TPS (default 60)
* Deterministic replay: **seed + input log + snapshot PRNG/bag state → identical board hash at multiple checkpoints**
* DAS/ARR deterministic in ticks
* Lock delay, soft/hard drop, SRS rotation, hold, next queue, scoring, back-to-back/combo correctly handled
* Crash/recover workflow passes

### Renderer

* PixiJS renders board + current piece + ghost + HUD
* Interpolates between snapshots using alpha (configurable)
* Plays audio/events with tick-to-time mapping
* Handles keyboard + touch inputs; inputs reach worker accurately
* Visual reconciliation occurs on missing/dropped snapshots
* Progressive degradation on low-end devices

### Robustness & UX

* Desync detection via snapshot checksum & board hashes
* Recover from crash with valid snapshot; invalid/corrupted snapshot triggers resync request
* Accessibility HUD readout + screen-reader summaries pass usability tests
* Telemetry is opt-in; replay logs only if user consents

---

## 4 — Top-Level Components (Updated)

```
/src
  /logic
    engine.ts          // deterministic engine + tick loop + snapshot emitter
    rules.ts           // SRS tables, scoring, lock rules, back-to-back/combo logic
    rng.ts             // seedable integer-only PRNG with serialization
    types.ts           // shared TS interfaces (snapshot, event, replay)
    worker.ts          // message router, seq/check, recover handler
    recover.ts         // snapshot validation & recovery
    constants.ts       // DAS/ARR defaults, gravity, TPS, etc.
  /renderer
    pixiRenderer.ts    // MVP renderer (board + ghost + HUD)
    renderAPI.ts       // snapshot/event subscription
    shaders/           // optional visualizer
  /ui
    controls.tsx
    settings.tsx
    accessibility.ts
  /tests
    unit/              // engine tests (rotation, bag, scoring, lock, DAS/ARR)
    integration/       // replay/golden, crash/recover, message fuzz
  /tools
    replayPlayer.ts    // canonical replay load/save/playback
index.html
vite.config.ts
```

---

## 5 — Message & Snapshot Contract (Refined)

### Worker → Renderer

```ts
postMessage({
  protocolVersion: 1,
  seq: number,
  type: 'snapshot',
  snapshotId: number,
  payload: Snapshot
});

postMessage({
  protocolVersion: 1,
  seq: number,
  type: 'event',
  payload: Event
});

postMessage({
  protocolVersion: 1,
  seq: number,
  type: 'log',
  payload: { level, msg }
});

postMessage({
  protocolVersion: 1,
  seq: number,
  type: 'fatal'
});
```

### Renderer/UI → Worker

```ts
postMessage({ protocolVersion:1, seq:number, type:'start', payload:{seed, mode, config} });
postMessage({ protocolVersion:1, seq:number, type:'input', payload:{tick, action, source} });
postMessage({ protocolVersion:1, seq:number, type:'requestSnapshot', payload:{reason} });
postMessage({ protocolVersion:1, seq:number, type:'recover', payload:Snapshot });
```

---

### Snapshot Schema (Updated & Complete)

```ts
type Snapshot = {
  protocolVersion: number;
  engineVersion: string;
  snapshotSchemaVersion: number;
  snapshotId: number;           // monotonic
  tick: number;                 // authoritative tick
  authoritativeTimeMs: number;  // tick/TPS
  prngState: Uint32Array;       // deterministic PRNG
  bagState: { bag: Uint8Array, index: number };
  inputQueueCursor: number;
  lockCounter: number;
  gravityCounter: number;
  backToBack: number;
  combo: number;
  rows: number;
  cols: number;
  boardBuffer: ArrayBuffer;     // transferable
  current: { type:string, matrix:Uint8Array, x:number, y:number, rotation:number, color:number } | null;
  nextTypes: Uint8Array;
  holdType: number;
  score: number;
  level: number;
  lines: number;
  events: Event[];
  checksum: number;             // xxhash32 or similar
}
```

---

## 6 — Engine Tick & Timing (Refined)

* Fixed-step deterministic loop using `performance.now()` for scheduling only; logic is integer-based.
* Gravity, lock, DAS/ARR are applied per tick.
* Input queue processed per authoritative tick.
* Snapshot emission configurable: per tick or every N ticks (default N=1). Delta snapshots optional for performance.

---

## 7 — DAS/ARR & Input Semantics (Tick-Based)

* DAS/ARR configured in ticks.
* Default: DAS=10 ticks, ARR=1 tick (fastest repeat).
* Soft drop accelerates gravity; hard drop locks immediately.
* Late input policy: worker authoritative; only accepts within `allowedLateWindow` ticks.
* Tests must cover edge cases:

  * simultaneous gravity+move
  * rotation during lock
  * hold followed immediately by spawn/rotation
  * clientTick ahead of authoritative tick

---

## 8 — RNG & 7-Bag (Deterministic)

* Integer-only PRNG
* Bag generated via Fisher-Yates shuffle from PRNG instance
* Bag state serialized in snapshot for replay and recovery
* PRNG state verified across Chrome/Firefox/Safari in CI

---

## 9 — Event Vocabulary (Expanded)

* `spawn`, `lock`, `lineClear`, `tSpin`, `backToBack`, `combo`, `hold`, `gameOver`, `particleEmit`, `scoreUpdate`
* Events include authoritative tick and optional intensity/metadata for audio/particles
* Renderer schedules audio using tick → time mapping

---

## 10 — Recovery & Crash Handling (Fully Specified)

1. Worker wraps `processTick()` in try/catch
2. On crash:

   * Post `fatal` with lastSnapshot
   * Renderer saves snapshot locally
   * Spawn new worker → post `recover` message
3. Snapshot verification:

   * Checksum validation
   * Version/schema match
   * If invalid → request fresh snapshot
4. Replay from recovered snapshot + queued inputs reproduces deterministic behavior

---

## 11 — Testing & CI (Refined)

* **Unit Tests**: rotation/SRS, bag RNG determinism, collision/lock, scoring including T-Spins/back-to-back, DAS/ARR edge cases
* **Integration Tests**:

  * Golden replay files at multiple checkpoints
  * Crash/recover flow
  * Message reordering/loss
* **Cross-Browser Verification**:

  * Chrome, Firefox, Safari
  * RNG, bag sequence, tick-based events identical
* **Performance Tests**:

  * Snapshot emission
  * Buffer reuse / zero-copy
  * Memory/GC impact

---

## 12 — Accessibility & UX

* HUD items `aria-live="polite"`
* Board summaries readable (compressed row/column info)
* Keyboard & touch remappable
* High-contrast + colorblind themes
* Touch mapping fully specified (swipe/tap/long press/two-finger hold)

---

## 13 — Telemetry & Privacy

* Opt-in only
* Minimal crash payload: anonymized UA, protocolVersion, lastSnapshotTick, stack
* No replay logs shipped unless user consents
* LocalStorage snapshot optional, can be disabled via settings

---

## 14 — Risk Register (Refined)

| Risk                           | Mitigation                                                            |
| ------------------------------ | --------------------------------------------------------------------- |
| Timing drift / non-determinism | Fixed-step tick, integer math, unit/golden tests                      |
| PRNG cross-browser variance    | Integer-only PRNG, cross-browser CI tests                             |
| Worker crash                   | Crash/recover flow with snapshot + checksum                           |
| Renderer/worker desync         | Snapshot checksum, delta/sequence IDs, reconciliation animation       |
| Mobile performance             | Delta snapshots, buffer pooling, feature LOD gating                   |
| Edge-case gameplay             | Explicit unit tests for spawn, lock, DAS/ARR, rotations, back-to-back |

---

## 15 — Immediate Next Steps (Recommended)

1. Implement **Worker message router + recover handler** with:

   * seq/snapshotId
   * checksum validation
   * full snapshot fields (PRNG state, bag state, lock/gravity counters)
   * protocolVersion validation
2. Update `engine.ts` skeleton to match refined snapshot schema
3. Implement DAS/ARR deterministic tick conversion and unit tests
4. Add golden replay and crash/recover integration tests
5. Update renderer to consume `seq`, `snapshotId`, and checksum-verified snapshots

---

✅ **This spec reconciles previous open issues**:

* Snapshot completeness & replay determinism
* DAS/ARR ambiguity resolved (ticks)
* Crash/recover & desync explicitly defined
* PRNG deterministic cross-browser
* Message sequencing added (`seq` + `snapshotId`)
* Snapshot checksums and versioning
* Accessibility, telemetry, and fallback clarified

---

If you want, I can **produce the fully wired Worker message router + recover handler (`worker.ts`) next**, including:

* ProtocolVersion & seq checking
* Snapshot validation & checksum
* Recover handshake
* Full snapshot schema with PRNG/bag state, lock counters, back-to-back/combo
* Unit test stubs simulating crash/recover and message reordering

This would give you a **ready-to-run, resilient authoritative worker** as the foundation of the refactored engine.
 
