// Game Timing and Ticks
export const TPS = 60; // Ticks Per Second
export const TICK_MS = 1000 / TPS;

// Input Handling
export const DAS = 10; // Delayed Auto Shift in ticks
export const ARR = 1;  // Auto Repeat Rate in ticks
export const ALLOWED_LATE_WINDOW = 1; // How many ticks late an input can be

// Board Dimensions
export const ROWS = 20;
export const COLS = 10;

// Gameplay Mechanics
export const GRAVITY_START_DELAY = 60; // Ticks before gravity starts
export const LOCK_DELAY = 30; // Ticks a piece can rest on a surface before locking

// Feature Flags
export const ENABLE_VISUALIZER = false;
export const ENABLE_PARTICLES = false;
export const ENABLE_AUDIO_SYNC = false;
