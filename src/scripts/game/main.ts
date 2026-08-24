import { LEVEL_CONFIG, SCORING_CONFIG } from "./config";
import { createInput } from "./input";
import { draw } from "./render";
import { createSoundEngine } from "./sound";
import { createWorld, releaseCharge, startCharge, tick } from "./state";
import type { World } from "./types";

export interface GameElements {
  canvas: HTMLCanvasElement;
  scoreEl: HTMLElement;
  overlayEl: HTMLElement;
  overlayMessageEl: HTMLElement;
  restartBtn: HTMLButtonElement;
}

export function init(elements: GameElements): void {
  const { canvas, scoreEl, overlayEl, overlayMessageEl, restartBtn } = elements;
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx: CanvasRenderingContext2D = context;
  const sound = createSoundEngine();

  let logicalHeight = LEVEL_CONFIG.logicalWidth;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    logicalHeight = (rect.height / rect.width) * LEVEL_CONFIG.logicalWidth;
    const scale = canvas.width / LEVEL_CONFIG.logicalWidth;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  let world: World = createWorld();

  function syncOverlay(): void {
    scoreEl.textContent = String(world.score);
    const ended = world.state === "WON" || world.state === "LOST";
    overlayEl.hidden = !ended;
    if (ended) {
      overlayMessageEl.textContent = world.state === "WON" ? "You made it." : "Missed.";
    }
  }

  createInput(
    {
      onChargeStart: () => {
        const wasCharging = world.chargeStartMs !== null;
        world = startCharge(world, performance.now());
        if (!wasCharging && world.chargeStartMs !== null) sound.startCharge();
      },
      onChargeEnd: () => {
        const wasCharging = world.chargeStartMs !== null;
        world = releaseCharge(world, performance.now());
        if (wasCharging) {
          sound.stopCharge();
          sound.playJump();
        }
      },
    },
    canvas,
  );

  restartBtn.addEventListener("click", () => {
    world = createWorld();
    syncOverlay();
  });

  function frame(): void {
    const now = performance.now();

    if (world.chargeStartMs !== null) {
      sound.updateCharge(now - world.chargeStartMs);
    }

    const priorFlight = world.flight;
    world = tick(world, now);

    if (priorFlight && !world.flight) {
      if (priorFlight.landed) {
        sound.playLand(priorFlight.accuracy >= SCORING_CONFIG.centerAccuracyThreshold);
      } else {
        sound.playFail();
      }
    }

    draw(ctx, world, now, LEVEL_CONFIG.logicalWidth, logicalHeight);
    syncOverlay();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
