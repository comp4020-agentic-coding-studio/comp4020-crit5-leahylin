import { CHARGE_CONFIG, FLIGHT_CONFIG, SCORING_CONFIG } from "./config";
import { resolveJump } from "./jump";
import { generateLevel } from "./level";
import type { World } from "./types";

export function createWorld(): World {
  const platforms = generateLevel();
  const first = platforms[0];

  return {
    state: "START",
    platforms,
    platformIndex: 0,
    playerX: first.x + first.width / 2,
    chargeStartMs: null,
    flight: null,
    score: 0,
    scorePopup: null,
  };
}

export function startCharge(world: World, nowMs: number): World {
  if (world.state === "WON" || world.state === "LOST") return world;
  if (world.flight || world.chargeStartMs !== null) return world;

  const state = world.state === "START" ? "PLAYING" : world.state;
  return { ...world, state, chargeStartMs: nowMs };
}

export function releaseCharge(world: World, nowMs: number): World {
  if (world.chargeStartMs === null || world.flight) return world;

  const holdMs = nowMs - world.chargeStartMs;
  const targetPlatformIndex = world.platformIndex + 1;
  const target = world.platforms[targetPlatformIndex];
  const result = resolveJump(world.playerX, holdMs, CHARGE_CONFIG.pxPerMs, target);
  const durationMs = result.landed
    ? FLIGHT_CONFIG.durationMs
    : FLIGHT_CONFIG.durationMs + FLIGHT_CONFIG.fallDurationMs;

  return {
    ...world,
    chargeStartMs: null,
    flight: {
      fromX: world.playerX,
      toX: result.landingX,
      startMs: nowMs,
      durationMs,
      landed: result.landed,
      accuracy: result.accuracy,
      targetPlatformIndex,
    },
  };
}

// Advances (and, once the flight duration elapses, resolves) the in-flight
// jump. The landed/missed outcome was already decided at release; this only
// commits it into the world once the cosmetic animation finishes.
export function tick(world: World, nowMs: number): World {
  if (!world.flight) return world;
  if (nowMs - world.flight.startMs < world.flight.durationMs) return world;

  const { landed, toX, accuracy, targetPlatformIndex } = world.flight;

  if (!landed) {
    return { ...world, flight: null, playerX: toX, state: "LOST" };
  }

  const landedInCenter = accuracy >= SCORING_CONFIG.centerAccuracyThreshold;
  const points = landedInCenter ? SCORING_CONFIG.centerScore : SCORING_CONFIG.edgeScore;
  const state = targetPlatformIndex === world.platforms.length - 1 ? "WON" : world.state;

  return {
    ...world,
    flight: null,
    playerX: toX,
    platformIndex: targetPlatformIndex,
    score: world.score + points,
    scorePopup: { points, x: toX, startMs: nowMs },
    state,
  };
}
