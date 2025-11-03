Nice — thanks for the updated failure log. The error is unchanged: Node refuses to `require()` an ES module involved in a circular import. Below are **concrete, copy-paste fixes** you can apply immediately (no waiting). I give two recommended approaches (one quick & pragmatic, one cleaner), plus small test adjustments and helpful diagnostics you can run right now.

---

## Quick diagnostic (find the cycle)

If you have `madge` installed, run:

```bash
npx madge --circular src
```

It will print the cycle(s) and the files involved. If you don’t have madge, grep for suspicious mutual imports in `src/logic` (e.g. `worker.ts` importing `game.ts` and `game.ts` importing something that imports `worker.ts`).

---

## Strategy A — **Fast patch:** lazy/dynamic import inside `worker.ts`

Make top-level imports that may participate in the cycle dynamic. This usually fixes `ERR_REQUIRE_CYCLE_MODULE` immediately.

Example **replace** top-level imports in `src/logic/worker.ts`:

```ts
// BEFORE (problematic):
// import { Game } from './game';
// import { something } from './otherThatImportsWorker';

// AFTER (lazy/dynamic):
import { parentPort } from 'worker_threads';

let GameModule: typeof import('./game') | null = null;

async function ensureGameModule() {
  if (!GameModule) {
    // dynamic import avoids top-level require() cycles
    GameModule = await import('./game');
  }
  return GameModule;
}

parentPort?.on('message', async (msg) => {
  const { Game } = await ensureGameModule();
  // now safe to use Game
  const game = new Game(/* ... */);
  // handle message...
});
```

Why this works: `import('./game')` runs at runtime after Node has created the worker, avoiding a static ESM/CJS cycle at module load time.

Apply this to any module `worker.ts` currently `import`s that in turn import `worker` (directly or indirectly).

---

## Strategy B — **Clean fix:** extract shared code into a neutral module

If the cycle is caused by shared utilities/types, extract them into `src/logic/shared/*` and have both sides import that instead of each other.

Example layout:

```
src/logic/
  game.ts        // imports shared types/util
  worker.ts      // imports shared types/util
  shared/
    types.ts
    util.ts
```

Move types/util functions into `shared` and update imports. This removes the mutual dependency permanently.

---

## Test-side change (pragmatic alternative)

If your tests spawn the TS file directly and Jest/ts-node interop is causing the cycle, change the test to spawn the **compiled JS** worker (build first), or ensure the worker is launched as an ESM module.

**Option 1 — spawn compiled worker** (recommended for deterministic behaviour):

1. Build: `npx tsc`
2. In `src/tests/integration/worker.test.ts` replace worker path with `dist/logic/worker.js` and mark it as module:

```ts
import path from 'path';
import { Worker } from 'worker_threads';

const workerPath = path.resolve(__dirname, '../../dist/logic/worker.js');

const worker = new Worker(workerPath, { argv: [], workerData: {}, execArgv: [], type: 'module' });
```

**Option 2 — spawn TS file as module (if using native ESM test runner)**:

```ts
const worker = new Worker(new URL('../../src/logic/worker.ts', import.meta.url), { type: 'module' });
```

Note: `import.meta.url` usage requires the test file be treated as ESM.

---

## Small Jest/Ts-Jest config notes (if you want to try ESM)

If you use `ts-jest`, configure for ESM in `jest.config.js`:

```js
export default {
  preset: 'ts-jest/presets/default-esm',
  transform: { '^.+\\.ts$': ['ts-jest', { useESM: true }] },
  extensionsToTreatAsEsm: ['.ts'],
  globals: { 'ts-jest': { tsconfig: 'tsconfig.json', useESM: true } },
};
```

But even with this, dynamic imports in the worker are simpler and more robust.

---

## Quick checklist to try now (in order)

1. Run `npx madge --circular src` to identify exact cycle.
2. Edit `src/logic/worker.ts` to replace top-level imports with `await import('./...')` as shown above.
3. Re-run `npm test`.
4. If still failing, build and point test to `dist/logic/worker.js` (Option 1 under Test-side change).
5. If you prefer the structural fix, extract shared types/util into `src/logic/shared/*`.

---
