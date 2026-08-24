import { CHARGE_CONFIG } from "./config";
import type { LevelConfig } from "./config";
import type { Platform } from "./types";

// A jump's hold-time tolerance window is width / pxPerMs (see
// spec/level-fairness.test.ts) — below this, a human can't reliably release
// within the window that lands on the platform. Configs are chosen so
// widthMin itself already clears this floor; drawReachableWidth is a safety
// net for that guarantee, not something real configs rely on.
const MIN_WINDOW_MS = 100;

// mulberry32: small, fast, seeded PRNG — same seed always produces the same
// sequence, so a level can be reproduced exactly for testing, while real
// gameplay seeds with something that changes every run (see state.ts).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draws a width uniformly from [config.widthMin, config.widthMax], but never
// hands back one whose hold-time window would fall under the human-releasable
// floor — redraws instead, per the brief's "if a randomly generated platform
// is unreachable, regenerate it rather than placing an impossible platform."
// Bounded attempts, falling back to the range's most generous width, so a
// hypothetical config whose whole range sits under the floor can't loop forever.
function drawReachableWidth(rng: () => number, config: LevelConfig): number {
  for (let attempt = 0; attempt < 50; attempt++) {
    const width = config.widthMin + rng() * (config.widthMax - config.widthMin);
    if (width / CHARGE_CONFIG.pxPerMs >= MIN_WINDOW_MS) return width;
  }
  return config.widthMax;
}

// Both width and gap are drawn independently and uniformly at random for
// every platform — no linear progression — so no two playthroughs (and no
// two platforms within one) look alike. The level is generated once, up
// front, from a seed — never re-rolled mid-playthrough — so a given seed
// always reproduces the exact same level.
export function generateLevel(config: LevelConfig, seed: number): Platform[] {
  const rng = mulberry32(seed);
  const platforms: Platform[] = [];
  let x = 0;

  for (let i = 0; i < config.count; i++) {
    const width = drawReachableWidth(rng, config);

    if (i > 0) {
      const gap = config.gapMin + rng() * (config.gapMax - config.gapMin);
      x += platforms[i - 1].width + gap;
    }

    platforms.push({ x, width });
  }

  return platforms;
}
