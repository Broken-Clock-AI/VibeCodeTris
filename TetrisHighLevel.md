Good — below is a **comprehensive, high-level refactor of the project specification** distilled into a single, actionable blueprint you can use to move from messy single-file experiments to a production-ready, deterministic Tetris engine + renderer stack.

I converted the long living spec into a prioritized, implementable architecture, explicit APIs, acceptance tests, risk mitigations, and a JIRA-style task list so the project can be handed off to engineers or executed iteratively. No fluff — everything below is immediately actionable.

# 1 — One-line project purpose

Build a **deterministic, worker-driven Tetris engine** (TypeScript) that emits compact snapshots + event lists to a renderer. Ship a minimal PixiJS visual renderer for MVP and a “Visualizer” mode (shaders/particles) as polish. Engine must be fully unit-tested and replayable (seed + input log).

# 2 — Core architectural principles (refactor summary)

* **Authority:** single authoritative source of truth — the Logic Worker. All game outcomes come from worker ticks.
* **Determinism:** seedable PRNG + 7-bag; tick-driven simulation (fixed-step).
* **Separation of concerns:** Logic Worker (rules) ↔ Snapshot/Event Bus ↔ Renderer(s) (visuals/audio/UI).
* **Small, stable contracts:** use versioned messages + transferable typed arrays for snapshots.
* **Test-first:** engine unit tests, replay regression suite, and golden files.
* **Resilience:** worker crash/recover, snapshot request, desync detection & reconciliation.
* **Accessibility & fallbacks:** screen-reader support, non-WebGL fallback, touch controls, performance LOD.

# 3 — Minimal viable product (MVP) — what “done” looks like

* Worker-based deterministic engine implementing: board, SRS rotation, 7-bag, hold, next queue, lock delay (move-reset), DAS/ARR input semantics, scoring (Guideline minimal).
* Snapshot API: worker posts snapshots at fixed TPS (default 60) including board buffer, current piece, next queue, hold, score/level/lines, and events.
* A simple browser UI + PixiJS renderer that consumes snapshots and:

  * draws board & current piece & ghost,
  * shows Next/Hold/Score,
  * handles keyboard + basic touch,
  * handles hard/soft drop and hold.
* Unit tests for rotation, collisions, bag RNG determinism, lock semantics.
* Replay capability: seed + input capture → identical run.

# 4 — Top-level components & files

```
/src
  /logic
    engine.ts        // pure deterministic engine (no DOM) + tick loop + message API
    rules.ts         // SRS tables, lock semantics, scoring
    rng.ts           // seedable RNG (already implemented)
    types.ts         // shared TS interfaces
    worker.ts        // message glue for DedicatedWorker
    recover.ts       // recover bootstrap support
  /renderer
    pixiRenderer.ts  // PixiJS minimal renderer (MVP)
    renderAPI.ts     // small adapter: subscribe snapshots/events
    shaders/         // shaders for Visualizer later
  /ui
    controls.tsx
    settings.tsx
    accessibility.ts
  /tests
    unit/            // engine unit tests
    integration/     // replay golden tests
  /tools
    replayPlayer.ts
index.html
vite.config.ts
```

# 5 — Message and snapshot contract (canonical)

All messages include `protocolVersion`.

**Worker → Renderer**

* `postMessage({ protocolVersion:1, type:'snapshot', payload: Snapshot })`
* `postMessage({ protocolVersion:1, type:'event', payload: Event })`
* `postMessage({ protocolVersion:1, type:'log', payload:{level,msg} })`

**Renderer/UI → Worker**

* `postMessage({ protocolVersion:1, type:'start', payload:{seed,mode,config} })`
* `postMessage({ protocolVersion:1, type:'input', payload:{tick, action:'left'|'right'|'rotateCW'|'rotateCCW'|'soft'|'hard'|'hold', source} })`
* `postMessage({ protocolVersion:1, type:'requestSnapshot', payload:{reason} })`
* `postMessage({ protocolVersion:1, type:'recover', payload:Snapshot })`

**Snapshot (payload shorthand)**

```ts
{
  tick: number,
  rows: number,
  cols: number,
  boardBuffer: ArrayBuffer, // Uint8Array rows*cols (transferable)
  current: { type: string, matrix: Uint8Array, x:number, y:number, rotation:number, color:number } | null,
  nextTypes: Uint8Array, // small
  holdType: number, // 0=none
  score: number, level:number, lines:number,
  events: Event[] // ephemeral; small
}
```

# 6 — Engine tick & timing (refactor)

* Use a **performance.now()** driven fixed-step loop (accumulator pattern) to avoid drift.
* Worker runs `processTick()` deterministically for each tick; gravity and input resolution are decoupled. Input queue consumed per tick.
* Worker publishes snapshots every tick (or every N ticks if optimizing) — renderer interpolates visually.

# 7 — RNG & piece order (refactor)

* Use a small, tested seedable PRNG (e.g., mulberry32 or PCG variant) — you already have `rng.ts`.
* Implement 7-bag using Fisher-Yates on `bag7()` from the RNG instance; generate `bagSequence()` for continuous stream.

# 8 — Input semantics & DAS/ARR (refactor)

* Worker implements DAS/ARR in deterministic frames:

  * On `keydown` UI sends event; worker tracks key state and applies repeating actions according to `DAS` (initial delay) and `ARR` (repeat rate in ticks or ms).
  * Soft drop and hard drop are actions processed on tick boundary; hard drop locks immediately and emits `lock` event.
* Late input policy: worker accepts inputs stamped with `clientTick` if within `allowedLateWindow` (default 1 tick). Log outliers.

# 9 — Event vocabulary (for renderer)

Minimal set (expandable):

* `spawn`, `lock`, `lineClear` (with rows & clearType), `tSpin`, `backToBack`, `combo`, `hold`, `gameOver`, `particleEmit`, `scoreUpdate`.
  Renderer uses events to trigger audio/visuals.

# 10 — Renderer responsibilities & fallbacks

* Renderer must:

  * subscribe snapshots, maintain last & prev snapshot, compute `alpha` for interpolation,
  * draw board, ghost piece, current piece,
  * play audio on events and spawn GPU particles using events,
  * detect missed snapshots and request recovery.
* Fallbacks:

  * If WebGL not available: use Canvas2D renderer (simpler visuals);
  * Progressive degradation: heavy shader/particle features are gated by device capabilities and user `performance` setting.

# 11 — Worker crash / recovery (refactor)

* Worker installs try/catch; on fatal crash post `type:'fatal'` before termination.
* UI `worker.onerror` / `worker.onmessageerror`:

  * save last snapshot to localStorage,
  * spawn new worker,
  * `postMessage({type:'recover', payload:lastSnapshot})`.
* Worker handles `recover` to bootstrap state from snapshot.

# 12 — Testing & CI (refactor)

* **Unit tests** (Vitest):

  * rotation tests (SRS expected outputs),
  * bag RNG determinism across seeds,
  * collision and lock behavior,
  * scoring correctness including T-Spins/back-to-back.
* **Integration tests:**

  * replay golden files (seed + inputs) → assert board hashes at checkpoints.
* **CI**: run unit + integration tests on PR; block merges on failing golden tests.

# 13 — Accessibility & UX (refactor)

* ARIA:

  * HUD items use `aria-live="polite"`,
  * controls keyboard remappable and large-touch targets,
  * text-only mode to support screen-readers (summaries rather than full board readouts).
* Colorblind palettes + high-contrast theme switch.

# 14 — Telemetry & privacy (refactor)

* Opt-in only.
* Minimal crash payload: anonymized UA, protocolVersion, lastSnapshotTick, stack (no user input).
* No shipping of replay logs unless user opts in.

# 15 — Risk register (top items) & mitigations

1. **Timing drift / non-determinism** — Mitigation: perf.now loop, unit tests, golden replays.
2. **PRNG cross-browser variance** — Mitigation: use small deterministic PRNG (no BigInt), test sequences on major browsers.
3. **Worker crash** — Mitigation: recover message + local snapshot save.
4. **Renderer/worker desync** — Mitigation: snapshot request & extrapolation + visual reconciliation animation.
5. **Mobile performance** — Mitigation: automatic LOD and feature gating.

# 16 — Audio contract (explicitly added)

* Worker emits `event` messages (e.g., `lineClear`, `lock`, `tSpin`, `backToBack`) with intensity metadata.
* Renderer/Audio system must:

  * subscribe to events,
  * run WebAudio on main thread,
  * be responsible for audio latency compensation (e.g., pre-buffer small sounds),
  * support mute & SFX/music separate toggles.
    This resolves the previously under-specified audio subsystem.

# 17 — Touch mapping (explicit patterns)

* Swipe left/right → move once (tap/hold + DAS repeat supported)
* Tap → rotate (configurable to rotateCW/CCW)
* Two-finger tap → hold
* Long-press bottom area → soft drop; swipe down or two-finger swipe down → hard drop (optionally)
* Provide a “control help” overlay for mobile initial run

# 18 — Acceptance criteria (for milestone sign-off)

**MILESTONE: Engine MVP**

* Unit tests pass (rotation, collision, RNG).
* Worker publishes snapshots at 60 TPS.
* Replaying seed+input reproduces board hash at 3 checkpoints.

**MILESTONE: Renderer MVP**

* Pixi renderer receives snapshots and draws board + current piece + ghost.
* Keyboard controls operate and inputs reach worker; hard drop locks correctly; hold works.
* No console errors; no parse-time exceptions.

**MILESTONE: Robustness**

* Worker crash recovery tested (simulate crash → recover).
* Desync handling: renderer requests snapshot when missing and reconciles state.

# 19 — JIRA-style prioritized task list (ready to import)

**EPIC: Engine Core**

* TASK: Implement engine base (engine.ts) — deterministic tick loop, board model, spawn/lock/merge, snapshot emission.

  * Acceptance: snapshots emitted; basic collisions work.
* TASK: Add SRS rotation & wall-kick table (rules.ts).

  * Acceptance: rotation unit tests pass.
* TASK: Implement 7-bag RNG integration (rng.ts) — deterministic.

  * Acceptance: bag tests pass.
* TASK: DAS/ARR & input queue in worker.

  * Acceptance: repeat behavior matches config.

**EPIC: Infrastructure**

* TASK: Worker message API & recover handler.

  * Acceptance: recover message boots state.
* TASK: Protocol versioning in messages.

  * Acceptance: worker rejects invalid protocol with clear error.

**EPIC: Renderer**

* TASK: PixiJS renderer skeleton (pixiRenderer.ts) — render snapshot, interpolate between ticks, show HUD.

  * Acceptance: visual matches snapshot state.
* TASK: Event wiring for audio + particles stub.

  * Acceptance: events logged to console; audio system plays sample on event.

**EPIC: Testing**

* TASK: Unit test suite (rotation/collision/lock/rng).

  * Acceptance: CI green.
* TASK: Replay/golden file infrastructure & initial golden test.

  * Acceptance: golden test passes.

**EPIC: Robustness & UX**

* TASK: Crash/recover flow test harness.

  * Acceptance: worker crash + recover works.
* TASK: Accessibility baseline (ARIA HUDs, keyboard remap panel).

  * Acceptance: screen-reader reads HUD updates.

**EPIC: Polish (post-MVP)**

* TASK: Pixi visualizer: particles and bloom.
* TASK: Mobile touch controls & tuning.
* TASK: Visualizer mode: music sync and advanced shaders.

# 20 — Immediate next steps I will execute for you now (pick any; I will produce the artifact)

I can produce any single deliverable *right now* — pick one and I’ll output it in full in the next message (no waiting):

* **A. `engine.ts` skeleton**: deterministic tick loop + snapshot emitter + simple rules (spawn/merge/lock) ready to run in a worker.
* **B. `worker` message & recover handler**: message router for start/input/requestSnapshot/recover + protocolVersion checks.
* **C. JIRA CSV / checklist**: ready-to-import set of tasks with fields (summary, description, priority, acceptance criteria, dependencies).
* **D. Pixi renderer skeleton**: subscribes to mocked snapshots and draws board+current+ghost.

(You already have `rng.ts` — we can wire it in.)

---

# 21 — Closing / summary

This refactor condenses the long spec into a concrete engineering plan: authoritative worker, precise API, prioritized tasks, acceptance criteria, resiliency, and accessible fallbacks. The open remaining design items (audio latency tuning, exact DAS/ARR default numbers, mobile control mapping tweaks) were converted into small discrete tasks in the above list so they won’t block delivery.

 