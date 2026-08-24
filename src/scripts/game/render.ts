import { FLIGHT_CONFIG, PLAYER_SIZE, SCORE_POINTS } from "./config";
import type { World } from "./types";

const PLATFORM_COLOR = "#2f3b52";
const PLATFORM_HEIGHT = 14;
const PLATFORM_RADIUS = 6;
const PLAYER_COLOR = "#ffb454";
const PLAYER_RADIUS = 6;

const BASELINE_FRACTION = 0.62; // platforms sit 62% down the logical viewport
const ANCHOR_FRACTION = 0.32; // player is kept ~32% in from the left edge
const ARC_HEIGHT = 46;
const FALL_DISTANCE = 220;
const MAX_SQUISH_MS = 500;

const CHARGE_CIRCLE_MIN_RADIUS = 6; // visible the instant Space goes down
const CHARGE_CIRCLE_MAX_RADIUS = 34;
const CHARGE_CIRCLE_GROWTH_TAU_MS = 280; // time constant of the asymptotic growth
const CHARGE_CIRCLE_COLOR = "255, 180, 84";

const POPUP_DURATION_MS = 650; // how long a "+2"/"+1" stays visible after landing
const POPUP_RISE_DISTANCE = 34;
const POPUP_CENTER_COLOR = "255, 214, 102"; // brighter/warmer for a precise landing
const POPUP_EDGE_COLOR = "230, 230, 230";
const COMBO_LABEL_OFFSET = 14; // sits just above the points text, same fade

const MISS_SHAKE_DURATION_MS = 320; // a brief jolt right as the miss registers, not the whole fall
const MISS_SHAKE_MAGNITUDE_PX = 4;
const MISS_FADE_MAX_ALPHA = 0.35; // scene dims toward this as the fall plays out, never to black

export function draw(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
  logicalWidth: number,
  logicalHeight: number,
): void {
  const baselineY = logicalHeight * BASELINE_FRACTION;
  const { x: playerX, y: playerY, squishX, squishY } = playerPose(world, nowMs, baselineY);
  const cameraX = Math.max(0, playerX - logicalWidth * ANCHOR_FRACTION);
  const isMissFlight = world.flight?.outcome === "missed";
  const missElapsed = isMissFlight ? nowMs - world.flight!.startMs : 0;

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  ctx.save();
  if (isMissFlight) {
    const shakeT = clamp(1 - missElapsed / MISS_SHAKE_DURATION_MS, 0, 1);
    ctx.translate(
      Math.sin(missElapsed * 0.09) * MISS_SHAKE_MAGNITUDE_PX * shakeT,
      Math.cos(missElapsed * 0.13) * MISS_SHAKE_MAGNITUDE_PX * 0.6 * shakeT,
    );
  }

  ctx.fillStyle = PLATFORM_COLOR;
  for (const platform of world.platforms) {
    const screenX = platform.x - cameraX;
    if (screenX + platform.width < 0 || screenX > logicalWidth) continue;
    roundedRect(ctx, screenX, baselineY, platform.width, PLATFORM_HEIGHT, PLATFORM_RADIUS);
    ctx.fill();
  }

  drawChargeCircle(ctx, world, nowMs, playerX - cameraX, baselineY);
  drawScorePopup(ctx, world, nowMs, cameraX, baselineY);

  ctx.fillStyle = PLAYER_COLOR;
  ctx.save();
  ctx.translate(playerX - cameraX, playerY);
  ctx.scale(squishX, squishY);
  roundedRect(
    ctx,
    -PLAYER_SIZE.width / 2,
    -PLAYER_SIZE.height,
    PLAYER_SIZE.width,
    PLAYER_SIZE.height,
    PLAYER_RADIUS,
  );
  ctx.fill();
  ctx.restore();

  ctx.restore(); // undoes the shake translate — the fade below stays put

  if (isMissFlight) {
    const fadeT = clamp(missElapsed / (FLIGHT_CONFIG.durationMs + FLIGHT_CONFIG.fallDurationMs), 0, 1);
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeT * MISS_FADE_MAX_ALPHA})`;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
  }
}

interface Pose {
  x: number;
  y: number;
  squishX: number;
  squishY: number;
}

function playerPose(world: World, nowMs: number, baselineY: number): Pose {
  if (world.flight) {
    const elapsed = nowMs - world.flight.startMs;
    const arcMs = FLIGHT_CONFIG.durationMs;

    if (elapsed <= arcMs) {
      const t = clamp(elapsed / arcMs, 0, 1);
      const x = lerp(world.flight.fromX, world.flight.toX, t);
      const y = baselineY - Math.sin(t * Math.PI) * ARC_HEIGHT;
      return { x, y, squishX: 1, squishY: 1 };
    }

    const fallMs = world.flight.durationMs - arcMs;
    const tf = clamp((elapsed - arcMs) / fallMs, 0, 1);
    return { x: world.flight.toX, y: baselineY + tf * tf * FALL_DISTANCE, squishX: 1, squishY: 1 };
  }

  if (world.chargeStartMs !== null) {
    const t = clamp((nowMs - world.chargeStartMs) / MAX_SQUISH_MS, 0, 1);
    return { x: world.playerX, y: baselineY, squishX: 1 + t * 0.5, squishY: 1 - t * 0.35 };
  }

  return { x: world.playerX, y: baselineY, squishX: 1, squishY: 1 };
}

// The one indicator of jump strength: appears the instant Space goes down,
// grows continuously underneath the character for as long as it's held (an
// asymptotic ease toward CHARGE_CIRCLE_MAX_RADIUS, so it's always a smooth
// curve, never a discrete step), and vanishes the instant it's released —
// driven directly by chargeStartMs, the same clock resolveJump uses, so the
// circle's size always matches the strength the jump will actually have.
function drawChargeCircle(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
  x: number,
  baselineY: number,
): void {
  if (world.chargeStartMs === null) return;

  const holdMs = nowMs - world.chargeStartMs;
  const growth = 1 - Math.exp(-holdMs / CHARGE_CIRCLE_GROWTH_TAU_MS);
  const radius = CHARGE_CIRCLE_MIN_RADIUS + (CHARGE_CIRCLE_MAX_RADIUS - CHARGE_CIRCLE_MIN_RADIUS) * growth;

  ctx.beginPath();
  ctx.arc(x, baselineY, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${CHARGE_CIRCLE_COLOR}, 0.25)`;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${CHARGE_CIRCLE_COLOR}, 0.9)`;
  ctx.stroke();
}

// Rises and fades above the landing spot for a moment — the only place the
// scoring rule is ever communicated, since there's no explanatory text.
function drawScorePopup(
  ctx: CanvasRenderingContext2D,
  world: World,
  nowMs: number,
  cameraX: number,
  baselineY: number,
): void {
  const popup = world.scorePopup;
  if (!popup) return;

  const elapsed = nowMs - popup.startMs;
  if (elapsed > POPUP_DURATION_MS) return;

  const t = clamp(elapsed / POPUP_DURATION_MS, 0, 1);
  const y = baselineY - PLAYER_SIZE.height - t * POPUP_RISE_DISTANCE;
  const alpha = 1 - t;
  const isCenter = popup.points >= SCORE_POINTS.centerScore;
  const screenX = popup.x - cameraX;

  ctx.save();
  ctx.font = isCenter ? "bold 16px sans-serif" : "14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = `rgba(${isCenter ? POPUP_CENTER_COLOR : POPUP_EDGE_COLOR}, ${alpha})`;
  ctx.fillText(`+${popup.points}`, screenX, y);

  // Only worth calling out once it's an actual streak (2+) — a bare "+2"
  // already says "precise", so tagging every single one would be noise.
  if (popup.combo >= 2) {
    ctx.font = "11px sans-serif";
    ctx.fillStyle = `rgba(${POPUP_CENTER_COLOR}, ${alpha * 0.85})`;
    ctx.fillText(`COMBO ×${popup.combo}`, screenX, y - COMBO_LABEL_OFFSET);
  }

  ctx.restore();
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
