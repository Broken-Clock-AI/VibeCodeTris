# The VibeCoding Methodology: Best Practices from VibeCodeTris

This document synthesizes a comprehensive list of best practices that define the "VibeCoding" methodology, derived from the entire lifecycle of the VibeCodeTris project—from its initial specification and architectural design to its implementation, debugging, and deployment.

---

### **I. Foundational Methodology**

1.  **Spec-First, AI-Augmented Development:**
    *   **Practice:** Every major feature or architectural component begins with a detailed, human-readable specification in Markdown (e.g., `MASTER_PROJECT_SPEC.md`, `VibeCodeTris_Procedural_Audio_Spec.md`).
    *   **Rationale:** This forces clarity of thought and establishes a stable contract. The AI partner excels at generating, refining, and analyzing these specs, ensuring the plan is robust before a single line of code is written. This was the single most critical factor in the project's success.

2.  **The AI as an "Analytical Partner," Not Just a Coder:**
    *   **Practice:** Utilize the AI for high-level analysis, risk assessment, and planning. The AI's role is to read all documentation, identify potential conflicts or gaps (like the `SharedArrayBuffer` issue), and propose structured, actionable plans.
    *   **Rationale:** The AI's ability to process the entire repository context provides insights a human might miss. The most effective workflow is `Human Direction -> AI Analysis & Plan -> Human Approval -> AI Implementation`.

3.  **Documentation-Driven Analysis:**
    *   **Practice:** When analyzing the project, prioritize reading the Markdown documentation (`.md` files) over raw source code to understand intent, architecture, and history.
    *   **Rationale:** As we saw, a broad keyword search of the code can fail or miss context. The documentation provides the "why," which is essential for making informed decisions.

### **II. Architectural Principles**

4.  **Build Authoritative, Decoupled Logic:**
    *   **Practice:** Isolate the core application logic into a self-contained, authoritative unit (like our Web Worker). This unit should be the single source of truth and have no knowledge of the presentation layer.
    *   **Rationale:** This creates a system that is highly testable, resilient to UI bugs, and keeps the main thread responsive. It is the foundation for determinism and replayability.

5.  **Deterministic by Design:**
    *   **Practice:** Ensure all outcomes are perfectly reproducible from a seed and an input log. This requires using a seedable PRNG, running logic on a fixed tick-rate, and avoiding non-deterministic APIs within the core engine.
    *   **Rationale:** This is a superpower for debugging ("golden file" testing) and a cornerstone for features like replays, AI training, and netplay.

6.  **Snapshot-Based Communication:**
    *   **Practice:** Use versioned, checksum-validated "snapshots" as the primary data contract between the logic and presentation layers. The renderer should be a passive consumer of this state.
    *   **Rationale:** This enforces a clean separation of concerns, simplifies state management, and makes it possible to implement robust features like crash/recovery.

7.  **Embrace Procedural & Dynamic Systems:**
    *   **Practice:** Prioritize procedural generation (for audio, visuals, etc.) over static assets where possible.
    *   **Rationale:** This reduces dependency on external assets, allows for greater dynamic range in response to gameplay, and aligns with a creative, code-centric "vibe."

### **III. Development Workflow & Quality**

8.  **The Agentic Git Workflow:**
    *   **Practice:** Adhere to a strict `branch -> implement -> commit -> merge` cycle for every task. Commits should be atomic and logical.
    *   **Rationale:** As defined in `AgenticWorkflow.md`, this isolates work, maintains a stable `main` branch, and creates a reversible, auditable history, which is critical when working with an AI partner.

9.  **Multi-Layered, Purpose-Driven Testing:**
    *   **Practice:** Implement three distinct layers of testing:
        1.  **Unit Tests:** For pure, isolated logic (e.g., rotation rules, RNG determinism).
        2.  **Integration Tests:** For component lifecycles (e.g., worker crash/recovery).
        3.  **End-to-End "Golden" Tests:** Using the replay system to verify that a full gameplay session produces a bit-for-bit identical result.
    *   **Rationale:** This ensures quality at every level, from individual functions to the system as a whole.

10. **Accessibility as a Foundational Feature, Not an Add-On:**
    *   **Practice:** Treat accessibility as a Tier 1 requirement. Design features (like color palettes, high-contrast modes, and distinct patterns) to be blendable and integrated into the core rendering pipeline from the start.
    *   **Rationale:** Building accessibility in from the beginning is far more effective and less costly than retrofitting it later.

### **IV. Technology & Tooling**

11. **Lean & Purposeful Dependencies:**
    *   **Practice:** Maintain a minimal, well-understood set of third-party libraries. For VibeCodeTris, this was `PixiJS` (rendering), `Tone.js` (audio), and `Vite`/`Jest` (tooling).
    *   **Rationale:** This reduces complexity, minimizes potential points of failure, and keeps the focus on the core application logic.

12. **Build Tools *Into* the Application (The "Jammer" Pattern):**
    *   **Practice:** When a workflow involves frequent, creative iteration (like sound design), build an interactive tool for it directly into the application (e.g., the `ToneJammerIntegrationPlan.md`).
    *   **Rationale:** This creates a powerful, frictionless feedback loop, allowing for real-time creation and fine-tuning, which dramatically accelerates creative development.

13. **Verify Hosting Provider Capabilities Early:**
    *   **Practice:** Before committing to a deployment platform, verify that it supports all required modern web features.
    *   **Rationale:** The `SharedArrayBuffer` issue with GitHub Pages was a critical lesson. A five-minute check upfront can save days of debugging and migration effort. This is now a mandatory step in our deployment checklist.
