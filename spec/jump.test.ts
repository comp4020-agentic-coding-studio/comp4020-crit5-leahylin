import { describe, expect, it } from "vitest";
import { resolveJump } from "../src/scripts/game/jump";

// Progression must be sequential: a jump is judged against the platform
// *index* sequence, never raw physical distance, so landing far enough to
// reach a later platform is still invalid if it skips the immediately next
// one.
describe("resolveJump", () => {
  const platforms = [
    { x: 0, width: 60 }, // 0: 0..60 (current)
    { x: 200, width: 60 }, // 1: 200..260 (immediately next)
    { x: 400, width: 60 }, // 2: 400..460 (next-next)
  ];
  const pxPerMs = 0.3;
  const origin = 30; // center of platform 0
  const currentIndex = 0;

  it("stays on the current platform for a short hold that lands back on it", () => {
    const result = resolveJump(origin, 50, pxPerMs, platforms, currentIndex); // lands at x=45
    expect(result.outcome).toBe("stayed");
    expect(result.landedIndex).toBe(0);
  });

  it("misses when the landing point falls in a gap", () => {
    const result = resolveJump(origin, 300, pxPerMs, platforms, currentIndex); // lands at x=120
    expect(result.outcome).toBe("missed");
    expect(result.landedIndex).toBeNull();
  });

  it("advances when the landing point lands on the immediately next platform", () => {
    const result = resolveJump(origin, 700, pxPerMs, platforms, currentIndex); // lands at x=240
    expect(result.outcome).toBe("advanced");
    expect(result.landedIndex).toBe(1);
  });

  it("treats landing beyond the immediately next platform as an invalid skip", () => {
    const result = resolveJump(origin, 1400, pxPerMs, platforms, currentIndex); // lands at x=450
    expect(result.outcome).toBe("skipped");
    expect(result.landedIndex).toBe(2);
  });

  it("scores higher accuracy the closer the landing is to the target platform's center", () => {
    const center = resolveJump(origin, 667, pxPerMs, platforms, currentIndex); // lands near x=230, the center
    const edge = resolveJump(origin, 760, pxPerMs, platforms, currentIndex); // lands near x=258, the far edge
    expect(center.accuracy).toBeGreaterThan(edge.accuracy);
  });
});
