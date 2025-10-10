// src/logic/constants.ts

// --- Core Gameplay ---
export const COLS = 10;
export const ROWS = 20;
export const TICK_MS = 1000 / 60; // 60 ticks per second

// --- Timing (in Ticks) ---
export const DAS = 10; // Delayed Auto Shift
export const ARR = 1;  // Auto Repeat Rate
export const LOCK_DELAY = 30; // Ticks before a piece locks down
export const GRAVITY_START_DELAY = 60; // Ticks before gravity starts

// --- Versioning ---
export const PROTOCOL_VERSION = 1;
export const CURRENT_ENGINE_VERSION = "0.1.0";
export const SNAPSHOT_SCHEMA_VERSION = 1;
