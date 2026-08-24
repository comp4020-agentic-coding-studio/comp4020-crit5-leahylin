import { describe, expect, it } from "vitest";
import { CENTER_ACCURACY_THRESHOLDS, SCORE_POINTS } from "../src/scripts/game/config";
import { tick } from "../src/scripts/game/state";
import type { DifficultyMode, World } from "../src/scripts/game/types";

// Landing accuracy (from resolveJump) is 1 - |landingX - center| / (width / 2),
// so accuracy >= CENTER_ACCURACY_THRESHOLDS[mode] is exactly "within that
// mode's center-scoring zone" — the per-difficulty precision bar for +2.
function worldWithLanding(mode: DifficultyMode, accuracy: number): World {
  return {
    state: "PLAYING",
    mode,
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
      outcome: "advanced",
      accuracy,
      landedIndex: 1,
    },
  };
}

describe("scoring", () => {
  const modes: DifficultyMode[] = ["easy", "medium", "hard"];

  for (const mode of modes) {
    const threshold = CENTER_ACCURACY_THRESHOLDS[mode];

    describe(mode, () => {
      it(`awards +2 for landing within the ${mode} center-scoring zone`, () => {
        const result = tick(worldWithLanding(mode, threshold), 100);
        expect(result.score).toBe(SCORE_POINTS.centerScore);
      });

      it(`awards +1 for landing outside the ${mode} center-scoring zone`, () => {
        const result = tick(worldWithLanding(mode, threshold - 0.01), 100);
        expect(result.score).toBe(SCORE_POINTS.edgeScore);
      });
    });
  }

  it("makes harder modes require more precision (smaller center-scoring zone)", () => {
    expect(CENTER_ACCURACY_THRESHOLDS.easy).toBeLessThan(CENTER_ACCURACY_THRESHOLDS.medium);
    expect(CENTER_ACCURACY_THRESHOLDS.medium).toBeLessThan(CENTER_ACCURACY_THRESHOLDS.hard);
  });
});
