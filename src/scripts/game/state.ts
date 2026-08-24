import {
  CENTER_ACCURACY_THRESHOLDS,
  CHARGE_CONFIG,
  DEFAULT_MODE,
  FLIGHT_CONFIG,
  LEVEL_CONFIGS,
  SCORE_POINTS,
} from "./config";
import { resolveJump } from "./jump";
import { generateLevel } from "./level";
import type { DifficultyMode, World } from "./types";

// seed defaults to something that changes every call so each playthrough
// gets a different (but still fair) layout; pass an explicit seed to
// reproduce a specific level, e.g. for testing.
export function createWorld(mode: DifficultyMode = DEFAULT_MODE, seed: number = Math.random() * 2 ** 32): World {
  const platforms = generateLevel(LEVEL_CONFIGS[mode], seed);
  const first = platforms[0];

  return {
    state: "START",
    mode,
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
  const result = resolveJump(world.playerX, holdMs, CHARGE_CONFIG.pxPerMs, world.platforms, world.platformIndex);
  const durationMs =
    result.outcome === "missed"
      ? FLIGHT_CONFIG.durationMs + FLIGHT_CONFIG.fallDurationMs
      : FLIGHT_CONFIG.durationMs;

  return {
    ...world,
    chargeStartMs: null,
    flight: {
      fromX: world.playerX,
      toX: result.landingX,
      startMs: nowMs,
      durationMs,
      outcome: result.outcome,
      accuracy: result.accuracy,
      landedIndex: result.landedIndex,
    },
  };
}

// Advances (and, once the flight duration elapses, resolves) the in-flight
// jump. The outcome (stayed/advanced/skipped/missed) was already decided at
// release; this only commits it into the world once the cosmetic animation
// finishes. "stayed" is a safe no-op (still standing on the same platform,
// no score); "skipped"/"missed" both end the run even though "skipped" lands
// on real platform ground, since bypassing the next platform is invalid.
export function tick(world: World, nowMs: number): World {
  if (!world.flight) return world;
  if (nowMs - world.flight.startMs < world.flight.durationMs) return world;

  const { outcome, toX, accuracy, landedIndex } = world.flight;

  if (outcome === "missed" || outcome === "skipped") {
    return { ...world, flight: null, playerX: toX, state: "LOST" };
  }

  if (outcome === "stayed") {
    return { ...world, flight: null, playerX: toX };
  }

  const landedInCenter = accuracy >= CENTER_ACCURACY_THRESHOLDS[world.mode];
  const points = landedInCenter ? SCORE_POINTS.centerScore : SCORE_POINTS.edgeScore;
  const state = landedIndex === world.platforms.length - 1 ? "WON" : world.state;

  return {
    ...world,
    flight: null,
    playerX: toX,
    platformIndex: landedIndex as number,
    score: world.score + points,
    scorePopup: { points, x: toX, startMs: nowMs },
    state,
  };
}
