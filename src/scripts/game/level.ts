import type { LevelConfig } from "./config";
import type { Platform } from "./types";

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

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

// Each gap is drawn independently, uniformly at random from
// [config.gapMin, config.gapMax] — different every platform, so the player
// can't memorize a fixed jump distance. Only the gap is randomized, never
// the width, so the width-derived fairness proof in
// spec/level-fairness.test.ts (a jump's hold-time tolerance window depends
// only on the target platform's width, not on the gap that precedes it)
// holds for any gap drawn from this range. The level is generated once, up
// front, from a seed — never re-rolled mid-playthrough — so a given seed
// always reproduces the exact same level.
export function generateLevel(config: LevelConfig, seed: number): Platform[] {
  const rng = mulberry32(seed);
  const platforms: Platform[] = [];
  let x = 0;

  for (let i = 0; i < config.count; i++) {
    const t = config.count === 1 ? 0 : i / (config.count - 1);
    const width = lerp(config.widthStart, config.widthEnd, t);

    if (i > 0) {
      const gap = config.gapMin + rng() * (config.gapMax - config.gapMin);
      x += platforms[i - 1].width + gap;
    }

    platforms.push({ x, width });
  }

  return platforms;
}
