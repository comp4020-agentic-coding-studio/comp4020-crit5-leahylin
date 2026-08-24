import { describe, expect, it } from "vitest";
import { CHARGE_CONFIG, LEVEL_CONFIGS } from "../src/scripts/game/config";
import { generateLevel } from "../src/scripts/game/level";

// The spec requires "no unfair placements" for every difficulty mode, even
// though every platform's width and gap are now drawn independently at
// random (no linear progression). This computes, from the same constants
// the player experiences, the hold-time window that lands each jump (a
// platform's width converted to milliseconds of Space) and asserts it never
// falls below a floor a human can reliably hit by releasing a key — for
// every platform, not just the level's narrowest end.
//
// Fixed seeds, not Math.random(), so a failure is reproducible. The window
// formula only depends on platform width, never on the randomly-drawn gap
// that precedes it, so this should hold for any seed — checked across
// several to make sure no particular roll of the widths can break it.
describe("level fairness", () => {
  const { pxPerMs } = CHARGE_CONFIG;
  const MIN_WINDOW_MS = 100;
  const SEEDS = [1, 42, 1337];

  for (const [mode, config] of Object.entries(LEVEL_CONFIGS)) {
    describe(mode, () => {
      for (const seed of SEEDS) {
        it(`keeps every jump's hold-time window reliably hittable (seed ${seed})`, () => {
          const platforms = generateLevel(config, seed);
          for (let i = 1; i < platforms.length; i++) {
            expect(platforms[i].width / pxPerMs).toBeGreaterThanOrEqual(MIN_WINDOW_MS);
          }
        });
      }
    });
  }
});
