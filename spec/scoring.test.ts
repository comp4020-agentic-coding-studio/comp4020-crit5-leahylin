import { describe, expect, it } from "vitest";
import { SCORING_CONFIG } from "../src/scripts/game/config";
import { tick } from "../src/scripts/game/state";
import type { World } from "../src/scripts/game/types";

// Landing accuracy (from resolveJump) is 1 - |landingX - center| / (width / 2),
// so accuracy >= 0.8 is exactly "within 10% of the platform's width from its
// center" — the precision bar the spec sets for the +2 bonus.
function worldWithLanding(accuracy: number): World {
  return {
    state: "PLAYING",
    platforms: [
      { x: 0, width: 100 },
      { x: 200, width: 100 },
    ],
    platformIndex: 0,
    playerX: 50,
    chargeStartMs: null,
    score: 0,
    scorePopup: null,
    flight: {
      fromX: 50,
      toX: 250,
      startMs: 0,
      durationMs: 10,
      landed: true,
      accuracy,
      targetPlatformIndex: 1,
    },
  };
}

describe("scoring", () => {
  it("awards +2 for landing within 10% of the platform's width from its center", () => {
    const result = tick(worldWithLanding(0.8), 100);
    expect(result.score).toBe(SCORING_CONFIG.centerScore);
  });

  it("awards +1 for landing further than 10% of the platform's width from its center", () => {
    const result = tick(worldWithLanding(0.79), 100);
    expect(result.score).toBe(SCORING_CONFIG.edgeScore);
  });
});
