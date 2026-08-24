import type { Platform } from "./types";

export function chargeToDistance(holdMs: number, pxPerMs: number): number {
  return holdMs * pxPerMs;
}

export interface JumpResult {
  landed: boolean;
  landingX: number;
  accuracy: number;
}

// The one rule the whole game is built on: release timing determines
// whether the jump lands. Too short a hold falls short of the platform; too
// long overshoots past it. Both are misses — only a hold that lands the
// player inside the platform's bounds counts as landed.
export function resolveJump(
  originX: number,
  holdMs: number,
  pxPerMs: number,
  platform: Platform,
): JumpResult {
  const landingX = originX + chargeToDistance(holdMs, pxPerMs);
  const landed = landingX >= platform.x && landingX <= platform.x + platform.width;
  if (!landed) return { landed: false, landingX, accuracy: 0 };

  const center = platform.x + platform.width / 2;
  const accuracy = clamp(1 - Math.abs(landingX - center) / (platform.width / 2), 0, 1);
  return { landed: true, landingX, accuracy };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
