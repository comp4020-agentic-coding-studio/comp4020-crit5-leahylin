import { describe, expect, it } from "vitest";
import { LEVEL_CONFIGS } from "../src/scripts/game/config";
import { generateLevel } from "../src/scripts/game/level";

function gapsOf(platforms: { x: number; width: number }[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < platforms.length; i++) {
    gaps.push(platforms[i].x - (platforms[i - 1].x + platforms[i - 1].width));
  }
  return gaps;
}

// The brief: each mode draws its gaps randomly from a fixed range so the
// player can't memorize a jump distance, but generation must still be
// controlled — every gap within the configured range, the level fixed at
// creation time (not re-rolled mid-run), and reproducible from a seed for
// testing even though real playthroughs vary.
describe("random platform gaps", () => {
  const modes = Object.entries(LEVEL_CONFIGS);

  for (const [mode, config] of modes) {
    describe(mode, () => {
      it(`draws every gap within the configured ${config.gapMin}-${config.gapMax}px range`, () => {
        const platforms = generateLevel(config, 7);
        for (const gap of gapsOf(platforms)) {
          expect(gap).toBeGreaterThanOrEqual(config.gapMin);
          expect(gap).toBeLessThanOrEqual(config.gapMax);
        }
      });

      it("varies the gap from platform to platform instead of using one fixed distance", () => {
        const gaps = gapsOf(generateLevel(config, 7));
        const distinct = new Set(gaps.map((g) => g.toFixed(4)));
        expect(distinct.size).toBeGreaterThan(1);
      });

      it("reproduces the exact same level from the same seed", () => {
        const a = generateLevel(config, 99);
        const b = generateLevel(config, 99);
        expect(a).toEqual(b);
      });

      it("produces a different level from a different seed", () => {
        const a = generateLevel(config, 1);
        const b = generateLevel(config, 2);
        expect(a).not.toEqual(b);
      });
    });
  }

  it("matches the brief's per-difficulty gap ranges", () => {
    expect(LEVEL_CONFIGS.easy.gapMin).toBe(60);
    expect(LEVEL_CONFIGS.easy.gapMax).toBe(100);
    expect(LEVEL_CONFIGS.medium.gapMin).toBe(80);
    expect(LEVEL_CONFIGS.medium.gapMax).toBe(140);
    expect(LEVEL_CONFIGS.hard.gapMin).toBe(120);
    expect(LEVEL_CONFIGS.hard.gapMax).toBe(160);
  });
});
