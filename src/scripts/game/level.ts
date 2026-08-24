import { LEVEL_CONFIG } from "./config";
import type { Platform } from "./types";

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

// Deterministic on purpose: the "no unfair placements" requirement should be
// provable from CHARGE_CONFIG (see config.ts), not left to chance on a
// per-playthrough seed. Same level every run is fine for a course prototype.
export function generateLevel(config: typeof LEVEL_CONFIG = LEVEL_CONFIG): Platform[] {
  const platforms: Platform[] = [];
  let x = 0;

  for (let i = 0; i < config.count; i++) {
    const t = config.count === 1 ? 0 : i / (config.count - 1);
    const width = lerp(config.widthStart, config.widthEnd, t);

    if (i > 0) {
      const gap = lerp(config.gapStart, config.gapEnd, t);
      x += platforms[i - 1].width + gap;
    }

    platforms.push({ x, width });
  }

  return platforms;
}
