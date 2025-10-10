n### **Git-Based Agentic Workflow**

This document outlines the Git-based workflow we will use to ensure project integrity, provide consistent checkpoints, and prevent accidental damage during agentic development.

#### **Core Principles**

1.  **Atomicity**: Group related changes into a single, logical commit.
2.  **History**: Maintain a complete, chronological record of every change.
3.  **Reversibility**: Ensure any change can be safely and instantly reverted.

---

#### **Proposed Workflow**

1.  **Initialization (Do Once)**:
    *   Initialize a Git repository in the project root.
    *   Create a `.gitignore` file tailored for a Vite/TypeScript project.
    *   Make an initial commit containing all planning documents to establish a clean `main` branch.

2.  **Feature Branching (For Every New Task)**:
    *   Before starting any new task, create a new, descriptive branch (e.g., `feature/phase-1-constants`).
    *   All work for that task will happen exclusively on this branch. The `main` branch will remain untouched and stable.

3.  **Implementation & Verification**:
    *   Perform the requested task on the feature branch.
    *   After implementation, run any relevant verification steps (tests, linting, etc.).

4.  **Checkpoint Commit**:
    *   Once the task is complete and verified, commit the changes to the feature branch with a clear, conventional commit message (e.g., `feat(logic): Create constants.ts with initial game parameters`).
    *   This commit serves as our **consistent, atomic checkpoint**.

5.  **User Review & Merge**:
    *   Inform the user that the task is complete on its branch.
    *   The user can then review the changes. If approved, the user merges the feature branch into `main`. This gives the user final control over the stable codebase.

6.  **Rinse and Repeat**:
    *   Follow this `branch -> implement -> commit -> merge` cycle for every subsequent task.

---

#### **Contingency Plan (What if Something Goes Wrong?)**

*   **Mistake on a branch?**: The changes are isolated. We can revert the commit or delete the faulty branch entirely. The `main` branch is never in a broken state.
*   **Bug introduced after a merge?**: Git allows us to easily revert the merge commit on `main` or check out the state of the project from before the merge to diagnose the issue.

This workflow provides the perfect balance: the agent can work efficiently on isolated tasks, while the user retains ultimate control and the project remains safe and stable on the `main` branch at all times.
