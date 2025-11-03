// src/logic/worker-wrapper.cjs
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  try {
    // make a file:// URL that points to the Node.js-specific TS source
    const workerTsPath = path.resolve(__dirname, 'worker.node.ts');
    const workerUrl = pathToFileURL(workerTsPath).href;

    // dynamic import (this will be handled by the ESM loader you're using during tests)
    const mod = await import(workerUrl);

    // call exported workerMain (lazy imports inside worker.ts will happen now)
    if (mod && (mod.workerMain || mod.default)) {
      const fn = mod.workerMain || mod.default;
      await fn();
    } else {
      console.error('worker-wrapper: worker module did not export workerMain or default');
      process.exit(1);
    }
  } catch (err) {
    console.error('worker-wrapper error:', err);
    process.exit(1);
  }
})();
