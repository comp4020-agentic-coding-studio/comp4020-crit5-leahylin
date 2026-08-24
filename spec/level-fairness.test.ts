import { describe, expect, it } from "vitest";
import { CHARGE_CONFIG, LEVEL_CONFIGS } from "../src/scripts/game/config";
import { generateLevel } from "../src/scripts/game/level";

// The spec requires "no unfair placements" and forgiving early jumps, for
// every difficulty mode. This computes, from the same constants the player
// experiences, the hold-time window that lands each jump (a platform's width
// converted to milliseconds of Space), and asserts it never shrinks below a
// floor a human can reliably hit by releasing a key, and that it only gets
// tighter as the level goes on — in Easy, Medium, and Hard alike.
//
// Fixed seeds, not Math.random(), so a failure is reproducible. The window
// formula only depends on platform width, never on the randomly-drawn gap
// that precedes it, so this should hold for any seed — checked across
// several to make sure no particular roll of the gaps can break it.
describe("level fairness", () => {
  const { pxPerMs } = CHARGE_CONFIG;
  const MIN_WINDOW_MS = 100;
  const SEEDS = [1, 42, 1337];

  for (const [mode, config] of Object.entries(LEVEL_CONFIGS)) {
    describe(mode, () => {
      for (const seed of SEEDS) {
        describe(`seed ${seed}`, () => {
          const platforms = generateLevel(config, seed);

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
      }
    });
  }
});
