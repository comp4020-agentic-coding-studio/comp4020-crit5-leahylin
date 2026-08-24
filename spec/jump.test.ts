import { describe, expect, it } from "vitest";
import { resolveJump } from "../src/scripts/game/jump";

// The spec's one required rule: release timing determines whether the jump
// lands. Hold too little and you fall short of the platform; hold too long
// and you overshoot past it — only a landing point inside the platform's
// bounds counts as a successful jump.
describe("resolveJump", () => {
  const platform = { x: 200, width: 60 }; // spans 200..260
  const pxPerMs = 0.3;
  const origin = 100;

  it("falls short of the platform when the hold is too brief", () => {
    expect(resolveJump(origin, 300, pxPerMs, platform).landed).toBe(false);
  });

  it("lands when the hold puts the landing point inside the platform", () => {
    expect(resolveJump(origin, 500, pxPerMs, platform).landed).toBe(true);
  });

  it("overshoots past the platform when the hold is too long", () => {
    expect(resolveJump(origin, 900, pxPerMs, platform).landed).toBe(false);
  });

  it("scores higher accuracy the closer the landing is to the platform's center", () => {
    const center = resolveJump(origin, 433, pxPerMs, platform); // lands near x=230, the center
    const edge = resolveJump(origin, 527, pxPerMs, platform); // lands near x=258, the far edge
    expect(center.accuracy).toBeGreaterThan(edge.accuracy);
  });
});
