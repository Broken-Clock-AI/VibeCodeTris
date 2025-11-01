# 🎮 VibeCodeTris

> A deterministic, worker-driven Tetris engine built with TypeScript and PixiJS.  
> Cleanly separated logic, rendering, and accessibility layers for precision, performance, and replayability.

---

## 🌐 Live Demo

👉 **Play it here:** [https://broken-clock-ai.github.io/VibeCodeTris/](https://broken-clock-ai.github.io/VibeCodeTris/)

Experience the deterministic engine in action — real-time worker updates, smooth rendering, and replayable logic.

---

## 🧭 Overview

**VibeCodeTris** is a modern reimagining of the classic Tetris engine — designed for clarity, determinism, and modularity.  
It runs its core game logic inside a **Web Worker**, isolating state updates and ensuring reproducible gameplay across sessions.  
The main thread handles rendering and user interface, allowing smooth visuals without compromising input precision or game state integrity.

---

## ✨ Features

- 🧩 **Deterministic Engine** — every piece, tick, and frame follows a reproducible seed-based logic.
- ⚙️ **Worker-Authoritative Architecture** — isolates game logic from rendering for clean concurrency.
- 🎨 **Modern Rendering** — powered by **PixiJS**, enabling performant 2D graphics.
- ♿ **Accessibility Built-In** — includes color-blind palettes, high-contrast mode, and patterned piece options.
- 🧪 **Test Coverage** — validated with **Vitest** for predictable behavior and engine integrity.
- 🧱 **Modular Design** — logic, renderer, and UI layers remain decoupled for easy extension.

---

## 🏗️ Architecture

```
                ┌───────────────────────────┐
                │         Renderer          │
                │  (PixiJS + UI Layer)      │
                └────────────┬──────────────┘
                             │
                     Message Bus / Events
                             │
                ┌────────────▼──────────────┐
                │       Game Worker         │
                │  (Deterministic Engine)   │
                │  - Input Queue            │
                │  - RNG & Seed Handling    │
                │  - Frame Step Logic       │
                └────────────┬──────────────┘
                             │
                         State Snapshots
                             │
                ┌────────────▼──────────────┐
                │    Replay / Serialization │
                └───────────────────────────┘
```

> _A full diagram is available at_ `docs/architecture.png` _(placeholder)_

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18  
- npm or pnpm

### Installation
```bash
git clone https://github.com/Broken-Clock-AI/VibeCodeTris.git
cd VibeCodeTris
npm install
```

### Development
```bash
npm run dev
```
Launches a local development server via **Vite**.

### Testing
```bash
npm run test
```
Runs the **Vitest** suite for deterministic logic validation.

---

## 🧩 Roadmap

| Phase | Focus Area | Status |
|:------|:------------|:--------|
| 1 | Core deterministic engine | ✅ Complete |
| 2 | Worker integration | ✅ Complete |
| 3 | Rendering layer (PixiJS) | ✅ Complete |
| 4 | Accessibility features | ✅ Complete |
| 5 | Advanced tooling & editor integration | 🚧 In Progress |

---

## 🤝 Contributing

Contributions are welcome!  
To propose changes:
1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/new-idea`)  
3. Commit and push your changes  
4. Open a Pull Request  

Please ensure tests pass before submission.

---

## 📄 License

Released under the **MIT License**.  
See [`LICENSE`](LICENSE) for details.

---

## 🧠 Credits

Developed by **Broken Clock AI**  
Special thanks to contributors and testers supporting deterministic game research.

---
