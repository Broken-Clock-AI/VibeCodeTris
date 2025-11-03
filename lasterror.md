> weird.. I'm getting a similar error from the web build up on github pag 
  : Global.js:72  * Tone.js v15.1.22 * 
  test-audio-scheduled-source-node-start-method-negative-parameters-suppoj
  s:4  The AudioContext was not allowed to start. It must be resumed (or 
  created) after a user gesture on the page.
  uo @ test-audio-scheduled-source-node-start-method-negative-parameters-p
  ort.js:4
  (anonymous) @ native-constant-source-node-factory.js:15
  (anonymous) @ cache-test-result.js:12
  (anonymous) @ native-constant-source-node-factory.js:15
  (anonymous) @ constant-source-node-constructor.js:16
  createConstantSource @ base-audio-context-constructor.js:37
  createConstantSource @ Context.js:120
  Co @ ToneConstantSource.js:18
  Ct @ Signal.js:38
  Mo @ TickSignal.js:16
  Eo @ TickSource.js:33
  Fi @ Clock.js:49
  Vi @ Transport.js:86
  (anonymous) @ Transport.js:613
  (anonymous) @ ContextInitialization.js:16
  wx @ ContextInitialization.js:16
  initialize @ Context.js:90
  get transport @ Context.js:201
  (anonymous) @ index.js:30
  constant-source-node-constructor.js:42  The AudioContext was not alloweo
   start. It must be resumed (or created) after a user gesture on the pag.
  start @ constant-source-node-constructor.js:42
  start @ ToneConstantSource.js:45
  Ct @ Signal.js:46
  Mo @ TickSignal.js:16
  Eo @ TickSource.js:33
  Fi @ Clock.js:49
  Vi @ Transport.js:86
  (anonymous) @ Transport.js:613
  (anonymous) @ ContextInitialization.js:16
  wx @ ContextInitialization.js:16
  initialize @ Context.js:90
  get transport @ Context.js:201
  (anonymous) @ index.js:30
  InputManager.ts:28 InputManager: Keyboard controls enabled.
  touch.ts:114 Touch controls enabled.
  gamepad.ts:98 Gamepad controls enabled.
  accessibility.ts:32 AccessibilityManager initialized.
  main.ts:285 Application initialized.
  [NEW] Explain Console errors by using Copilot in Edge: click

           to explain an error.
          Learn more
          Don't show again
  main.ts:123 PixiJS Deprecation Warning: Application.view is deprecated, 
  please use Application.canvas instead.Deprecated since v8.0.0
  pixiRenderer.ts:450 Renderer started. Requesting engine start with seed 
  410406675
  accessibility.ts:42 Accessibility Announce: Game started.
  main.ts:150 Game started.
  pixiRenderer.ts:233 [WORKER LOG INFO]: Engine started.
  VibeCodeTris/assets/worker-GqYHCUwq.js:1  --- FATAL: Engine crashed --- 
  ReferenceError: SharedArrayBuffer is not defined
      at g.createSnapshot (VibeCodeTris/assets/engine-DD9Klx3k.js:1:8544) 
      at g.tick (VibeCodeTris/assets/engine-DD9Klx3k.js:1:3113)
      at E (VibeCodeTris/assets/worker-GqYHCUwq.js:1:1001)
  E @ VibeCodeTris/assets/worker-GqYHCUwq.js:1
  setInterval
  d @ VibeCodeTris/assets/worker-GqYHCUwq.js:1
  await in d
  p @ VibeCodeTris/assets/worker-GqYHCUwq.js:1
  (anonymous) @ VibeCodeTris/assets/worker-GqYHCUwq.js:1
  pixiRenderer.ts:237  [WORKER FATAL]: SharedArrayBuffer is not defined   
  overrideMethod @ hook.js:608
  (anonymous) @ pixiRenderer.ts:237
  (anonymous) @ renderAPI.ts:19
  emit @ renderAPI.ts:19
  handleMessage @ renderAPI.ts:66
  renderAPI.ts:119 Worker terminated.


✦ That is an excellent and frustrating catch. You are right, it's the exat
   same error, but for a different reason.

  Here's the breakdown:

   * The Local Fix: The changes we made to vite.config.ts were for the    
     local development server only. They tell Vite how to behave when you 
     run npm run dev.
   * The Production Problem: When you build the project for production (nm
      run build), Vite creates a static dist folder. This folder is then  
     deployed to GitHub Pages. GitHub Pages is a completely different web 
     server, and it does not read your `vite.config.ts` file.

  Therefore, the production server (GitHub Pages) is not sending the
  required cross-origin isolation headers, and SharedArrayBuffer is
  disabled.

  The Solution

  We need to configure GitHub Pages to send these headers. The modern way 
   to do this is by modifying your deployment workflow file. I will read  
  your workflow file at .github/workflows/deploy.yml to see how it's      
  configured and then add the necessary steps to enable the headers.      
╭───────────────────────────────────────────────────────────────────────╮
│ ✓  ReadFile .github\workflows\deploy.yml                              │
╰───────────────────────────────────────────────────────────────────────╯
✦ Okay, I've reviewed your deploy.yml workflow file. It's using the modern
  actions/deploy-pages method, which is great. However, it's missing the
  step that actually configures the GitHub Pages environment to send the
  required headers.

  I will add a new step called Configure GitHub Pages to your workflow.
  This step will run before the deployment and explicitly enable the
  necessary cross-origin isolation headers. This is the correct and
  recommended way to solve this for GitHub Pages.
╭───────────────────────────────────────────────────────────────────────╮
│ ✓  Edit .github\workflows\deploy.yml:     needs: build... =>     nee… │
│                                                                       │
│    49   runs-on: ubuntu-latest                                        │
│    50   needs: build                                                  │
│    51   steps:                                                        │
│    52 +   - name: Configure GitHub Pages                              │
│    53 +     uses: actions/configure-pages@v5                          │
│    54 +     with:                                                     │
│    55 +       headers: |                                              │
│    56 +         Cross-Origin-Opener-Policy: same-origin               │
│    57 +         Cross-Origin-Embedder-Policy: require-corp            │
│    58     - name: Deploy to GitHub Pages                              │
│    59       id: deployment                                            │
│    60       uses: actions/deploy-pages@v4                             │
╰───────────────────────────────────────────────────────────────────────╯
✕ [API Error: You have exhausted your daily quota on this model.]