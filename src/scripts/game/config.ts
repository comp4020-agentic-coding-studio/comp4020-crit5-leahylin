// The level's gaps are only fair if they stay within what CHARGE_CONFIG can
// actually cross with a humanly-releasable hold. See spec/level-fairness.test.ts.
export const CHARGE_CONFIG = {
  pxPerMs: 0.3, // jump distance = hold duration (ms) * pxPerMs, uncapped —
  // holding too long must be able to overshoot, so there's no ceiling
};

export const LEVEL_CONFIG = {
  logicalWidth: 400, // logical viewport width; canvas scales this to fit any actual size
  count: 20,
  widthStart: 90,
  widthEnd: 34,
  gapStart: 26,
  gapEnd: 150,
};

export const FLIGHT_CONFIG = {
  durationMs: 380, // fixed cosmetic arc time, independent of distance
  fallDurationMs: 500, // extra cosmetic fall time after a miss, before LOST
};

export const PLAYER_SIZE = { width: 22, height: 22 };

export const SCORING_CONFIG = {
  // resolveJump's accuracy is 1 - |landingX - center| / (width / 2), so
  // accuracy >= 0.8 is exactly "landing within 10% of the platform's width
  // from its center" (|landingX - center| <= 0.1 * width).
  centerAccuracyThreshold: 0.8,
  centerScore: 2,
  edgeScore: 1,
};
