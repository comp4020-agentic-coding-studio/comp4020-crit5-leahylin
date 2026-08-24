import type { Platform } from "./types";

export function chargeToDistance(holdMs: number, pxPerMs: number): number {
  return holdMs * pxPerMs;
}

export type JumpOutcome = "stayed" | "advanced" | "skipped" | "missed";

export interface JumpResult {
  outcome: JumpOutcome;
  landingX: number;
  landedIndex: number | null;
  accuracy: number;
}

// Progression must be sequential: landing back on the platform you're
// already standing on is a safe no-op (stayed), landing on the immediately
// next platform advances (advanced), landing on any platform further ahead
// is an invalid skip even though it's physically reachable (skipped), and
// landing in a gap is a miss (missed). Only "stayed"/"advanced" carry a
// meaningful accuracy — both are ends the game (skipped/missed).
export function resolveJump(
  originX: number,
  holdMs: number,
  pxPerMs: number,
  platforms: Platform[],
  currentIndex: number,
): JumpResult {
  const landingX = originX + chargeToDistance(holdMs, pxPerMs);
  const landedIndex = findLandingIndex(platforms, currentIndex, landingX);

  if (landedIndex === null) {
    return { outcome: "missed", landingX, landedIndex: null, accuracy: 0 };
  }

  if (landedIndex > currentIndex + 1) {
    return { outcome: "skipped", landingX, landedIndex, accuracy: 0 };
  }

  const platform = platforms[landedIndex];
  const center = platform.x + platform.width / 2;
  const accuracy = clamp(1 - Math.abs(landingX - center) / (platform.width / 2), 0, 1);
  const outcome: JumpOutcome = landedIndex === currentIndex ? "stayed" : "advanced";
  return { outcome, landingX, landedIndex, accuracy };
}

// Platforms are ordered, non-overlapping, and strictly increasing in x, and
// a jump only ever moves forward — so the first platform (from currentIndex
// onward) whose span contains landingX is the one landed on, and a gap
// found before reaching one means the jump missed entirely.
function findLandingIndex(platforms: Platform[], currentIndex: number, landingX: number): number | null {
  for (let i = currentIndex; i < platforms.length; i++) {
    const platform = platforms[i];
    if (landingX < platform.x) return null;
    if (landingX <= platform.x + platform.width) return i;
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
