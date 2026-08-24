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

function widthsOf(platforms: { width: number }[]): number[] {
  return platforms.map((p) => p.width);
}

// The brief: each mode draws its width and gap randomly from fixed ranges so
// the player can't memorize a fixed jump distance or a predictable pattern,
// but generation must still be controlled — every value within its
// configured range, the level fixed at creation time (not re-rolled
// mid-run), and reproducible from a seed for testing even though real
// playthroughs vary.
describe("random platform generation", () => {
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

      it(`draws every width within the configured ${config.widthMin}-${config.widthMax}px range`, () => {
        const platforms = generateLevel(config, 7);
        for (const width of widthsOf(platforms)) {
          expect(width).toBeGreaterThanOrEqual(config.widthMin);
          expect(width).toBeLessThanOrEqual(config.widthMax);
        }
      });

      it("varies the gap from platform to platform instead of using one fixed distance", () => {
        const gaps = gapsOf(generateLevel(config, 7));
        const distinct = new Set(gaps.map((g) => g.toFixed(4)));
        expect(distinct.size).toBeGreaterThan(1);
      });

      it("varies the width from platform to platform instead of a fixed or linear progression", () => {
        const widths = widthsOf(generateLevel(config, 7));
        const distinct = new Set(widths.map((w) => w.toFixed(4)));
        expect(distinct.size).toBeGreaterThan(1);
      });

      it("does not shrink the width monotonically across the level", () => {
        const widths = widthsOf(generateLevel(config, 7));
        const increases = widths.slice(1).filter((w, i) => w > widths[i]).length;
        expect(increases).toBeGreaterThan(0);
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

  it("matches the brief's per-difficulty width ranges", () => {
    expect(LEVEL_CONFIGS.easy.widthMin).toBe(50);
    expect(LEVEL_CONFIGS.easy.widthMax).toBe(90);
    expect(LEVEL_CONFIGS.medium.widthMin).toBe(40);
    expect(LEVEL_CONFIGS.medium.widthMax).toBe(80);
    expect(LEVEL_CONFIGS.hard.widthMin).toBe(30);
    expect(LEVEL_CONFIGS.hard.widthMax).toBe(70);
  });

  it("matches the brief's per-difficulty gap ranges", () => {
    expect(LEVEL_CONFIGS.easy.gapMin).toBe(50);
    expect(LEVEL_CONFIGS.easy.gapMax).toBe(90);
    expect(LEVEL_CONFIGS.medium.gapMin).toBe(70);
    expect(LEVEL_CONFIGS.medium.gapMax).toBe(120);
    expect(LEVEL_CONFIGS.hard.gapMin).toBe(90);
    expect(LEVEL_CONFIGS.hard.gapMax).toBe(140);
  });
});
