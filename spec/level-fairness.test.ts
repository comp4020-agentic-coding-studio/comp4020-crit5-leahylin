import { describe, expect, it } from "vitest";
import { CHARGE_CONFIG } from "../src/scripts/game/config";
import { generateLevel } from "../src/scripts/game/level";

// The spec requires "no unfair placements" and forgiving early jumps. This
// computes, from the same constants the player experiences, the hold-time
// window that lands each jump (a platform's width converted to milliseconds
// of Space), and asserts it never shrinks below a floor a human can reliably
// hit by releasing a key, and that it only gets tighter as the level goes on.
describe("level fairness", () => {
  const platforms = generateLevel();
  const { pxPerMs } = CHARGE_CONFIG;
  const MIN_WINDOW_MS = 100;

  function windowMs(index: number): number {
    return platforms[index].width / pxPerMs;
  }

  it("keeps every jump's hold-time window reliably hittable", () => {
    for (let i = 1; i < platforms.length; i++) {
      expect(windowMs(i)).toBeGreaterThanOrEqual(MIN_WINDOW_MS);
    }
  });

  it("never gets easier as the level progresses", () => {
    for (let i = 2; i < platforms.length; i++) {
      expect(windowMs(i)).toBeLessThanOrEqual(windowMs(i - 1));
    }
  });
});
