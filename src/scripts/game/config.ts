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
  widthStart: number;
  widthEnd: number;
  gapMin: number; // px, inclusive lower bound of each platform's random gap
  gapMax: number; // px, inclusive upper bound of each platform's random gap
}

// widthEnd * CHARGE_CONFIG.pxPerMs must stay comfortably above the 100ms
// human-releasable floor asserted in spec/level-fairness.test.ts — easy
// 233ms, medium 153ms, hard 113ms. gapMin/gapMax are the per-mode ranges a
// gap is randomly drawn from at level-generation time (see level.ts) — they
// only ever shift the required hold-time, never the width-derived tolerance
// window, so the fairness proof holds for any gap drawn from this range.
export const LEVEL_CONFIGS: Record<DifficultyMode, LevelConfig> = {
  easy: { count: 20, widthStart: 110, widthEnd: 70, gapMin: 60, gapMax: 100 },
  medium: { count: 25, widthStart: 90, widthEnd: 46, gapMin: 80, gapMax: 140 },
  hard: { count: 30, widthStart: 80, widthEnd: 34, gapMin: 120, gapMax: 160 },
};

export const DEFAULT_MODE: DifficultyMode = "easy";

export const FLIGHT_CONFIG = {
  durationMs: 380, // fixed cosmetic arc time, independent of distance
  fallDurationMs: 500, // extra cosmetic fall time after a miss, before LOST
};

export const PLAYER_SIZE = { width: 22, height: 22 };

// resolveJump's accuracy is 1 - |landingX - center| / (width / 2), so
// accuracy >= threshold is exactly "landing within (1 - threshold) * 50% of
// the platform's width from its center" — the higher the threshold, the
// stricter (smaller) the center-scoring zone. Easy ±15%, Medium ±10%, Hard ±5%.
export const CENTER_ACCURACY_THRESHOLDS: Record<DifficultyMode, number> = {
  easy: 0.7,
  medium: 0.8,
  hard: 0.9,
};

export const SCORE_POINTS = {
  centerScore: 2,
  edgeScore: 1,
};
