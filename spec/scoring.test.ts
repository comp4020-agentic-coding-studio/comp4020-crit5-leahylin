import { describe, expect, it } from "vitest";
import { CENTER_ACCURACY_THRESHOLDS, SCORE_POINTS } from "../src/scripts/game/config";
import { tick } from "../src/scripts/game/state";
import type { DifficultyMode, Flight, World } from "../src/scripts/game/types";

// Landing accuracy (from resolveJump) is 1 - |landingX - center| / (width / 2),
// so accuracy >= CENTER_ACCURACY_THRESHOLDS[mode] is exactly "within that
// mode's center-scoring zone" — the per-difficulty precision bar for +2.
function worldWithFlight(
  mode: DifficultyMode,
  flight: Flight,
  overrides: Partial<Pick<World, "combo" | "perfectLandings" | "bestCombo" | "score">> = {},
): World {
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
    combo: 0,
    perfectLandings: 0,
    bestCombo: 0,
    flight,
    ...overrides,
  };
}

function advancedFlight(accuracy: number): Flight {
  return { fromX: 50, toX: 250, startMs: 0, durationMs: 10, outcome: "advanced", accuracy, landedIndex: 1 };
}

function stayedFlight(): Flight {
  return { fromX: 50, toX: 50, startMs: 0, durationMs: 10, outcome: "stayed", accuracy: 1, landedIndex: 0 };
}

describe("scoring", () => {
  const modes: DifficultyMode[] = ["easy", "medium", "hard"];

  for (const mode of modes) {
    const threshold = CENTER_ACCURACY_THRESHOLDS[mode];

    describe(mode, () => {
      it(`awards +2 for landing within the ${mode} center-scoring zone`, () => {
        const result = tick(worldWithFlight(mode, advancedFlight(threshold)), 100);
        expect(result.score).toBe(SCORE_POINTS.centerScore);
      });

      it(`awards +1 for landing outside the ${mode} center-scoring zone`, () => {
        const result = tick(worldWithFlight(mode, advancedFlight(threshold - 0.01)), 100);
        expect(result.score).toBe(SCORE_POINTS.edgeScore);
      });
    });
  }

  it("makes harder modes require more precision (smaller center-scoring zone)", () => {
    expect(CENTER_ACCURACY_THRESHOLDS.easy).toBeLessThan(CENTER_ACCURACY_THRESHOLDS.medium);
    expect(CENTER_ACCURACY_THRESHOLDS.medium).toBeLessThan(CENTER_ACCURACY_THRESHOLDS.hard);
  });

  describe("combo", () => {
    const threshold = CENTER_ACCURACY_THRESHOLDS.easy;

    it("starts a combo at 1 on the first center landing", () => {
      const result = tick(worldWithFlight("easy", advancedFlight(threshold)), 100);
      expect(result.combo).toBe(1);
    });

    it("increments the combo on each consecutive center landing", () => {
      const world = worldWithFlight("easy", advancedFlight(threshold), {
        combo: 2,
        perfectLandings: 2,
        bestCombo: 2,
      });
      const result = tick(world, 100);
      expect(result.combo).toBe(3);
      expect(result.perfectLandings).toBe(3);
      expect(result.bestCombo).toBe(3);
    });

    it("resets the combo to 0 on a non-center landing", () => {
      const world = worldWithFlight("easy", advancedFlight(threshold - 0.01), {
        combo: 3,
        perfectLandings: 3,
        bestCombo: 3,
      });
      const result = tick(world, 100);
      expect(result.combo).toBe(0);
    });

    it("resets the combo to 0 when the player lands back on the current platform", () => {
      const world = worldWithFlight("easy", stayedFlight(), { combo: 3, perfectLandings: 3, bestCombo: 3 });
      const result = tick(world, 100);
      expect(result.combo).toBe(0);
    });

    it("keeps bestCombo at the run's peak even after the combo resets", () => {
      const world = worldWithFlight("easy", stayedFlight(), { combo: 3, perfectLandings: 3, bestCombo: 3 });
      const result = tick(world, 100);
      expect(result.bestCombo).toBe(3);
    });

    it("does not multiply points as the combo climbs — center landings stay a fixed +2", () => {
      const world = worldWithFlight("easy", advancedFlight(threshold), {
        combo: 5,
        perfectLandings: 5,
        bestCombo: 5,
        score: 20,
      });
      const result = tick(world, 100);
      expect(result.score).toBe(20 + SCORE_POINTS.centerScore);
    });

    it("does not count a non-center landing as a perfect landing", () => {
      const world = worldWithFlight("easy", advancedFlight(threshold - 0.01), { perfectLandings: 4 });
      const result = tick(world, 100);
      expect(result.perfectLandings).toBe(4);
    });
  });
});
