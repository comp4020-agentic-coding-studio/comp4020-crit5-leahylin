import type { DifficultyMode } from "./types";

// The level's gaps are only fair if they stay within what CHARGE_CONFIG can
// actually cross with a humanly-releasable hold. See spec/level-fairness.test.ts.
// Shared across every difficulty mode — only level geometry and the scoring
// zone change per mode; physics and controls stay identical.
export const CHARGE_CONFIG = {
  pxPerMs: 0.3, // jump distance = hold duration (ms) * pxPerMs, uncapped —
  // holding too long must be able to overshoot, so there's no ceiling
};

export const LOGICAL_WIDTH = 400; // logical viewport width; canvas scales this to fit any actual size

export interface LevelConfig {
  count: number;
  widthMin: number; // px, inclusive lower bound of each platform's random width
  widthMax: number; // px, inclusive upper bound of each platform's random width
  gapMin: number; // px, inclusive lower bound of each platform's random gap
  gapMax: number; // px, inclusive upper bound of each platform's random gap
}

// widthMin * CHARGE_CONFIG.pxPerMs must stay at or above the 100ms
// human-releasable floor asserted in spec/level-fairness.test.ts — easy
// 167ms, medium 133ms, hard exactly 100ms — since every platform's width is
// now drawn independently from [widthMin, widthMax] (see level.ts), the
// floor has to hold for the smallest width the range can produce, not just
// an end-of-level value. gapMin/gapMax are the per-mode ranges a gap is
// randomly drawn from at level-generation time — they only ever shift the
// required hold-time, never the width-derived tolerance window.
export const LEVEL_CONFIGS: Record<DifficultyMode, LevelConfig> = {
  easy: { count: 35, widthMin: 50, widthMax: 90, gapMin: 50, gapMax: 90 },
  medium: { count: 35, widthMin: 40, widthMax: 80, gapMin: 70, gapMax: 120 },
  hard: { count: 35, widthMin: 30, widthMax: 70, gapMin: 90, gapMax: 140 },
};

export const DEFAULT_MODE: DifficultyMode = "easy";

export const FLIGHT_CONFIG = {
  durationMs: 380, // fixed cosmetic arc time, independent of distance
  // Extra cosmetic fall time after a miss, before LOST — long enough (with
  // the arc, ~1.2s total) that the player visibly sees themselves fall
  // through the gap before Game Over appears, short enough to stay snappy.
  fallDurationMs: 800,
};

export const PLAYER_SIZE = { width: 22, height: 22 };

// resolveJump's accuracy is 1 - |landingX - center| / (width / 2), so
// accuracy >= threshold is exactly "landing within (1 - threshold) * 50% of
// the platform's width from its center" — the higher the threshold, the
// stricter (smaller) the center-scoring zone. Same ±5% zone in every mode;
// difficulty comes from level geometry (LEVEL_CONFIGS), not the scoring zone.
export const CENTER_ACCURACY_THRESHOLDS: Record<DifficultyMode, number> = {
  easy: 0.9,
  medium: 0.9,
  hard: 0.9,
};

export const SCORE_POINTS = {
  centerScore: 2,
  edgeScore: 1,
};
