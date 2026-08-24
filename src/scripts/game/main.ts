import { LEVEL_CONFIG } from "./config";
import { createInput } from "./input";
import { draw } from "./render";
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

  createInput({
    onChargeStart: () => {
      world = startCharge(world, performance.now());
    },
    onChargeEnd: () => {
      world = releaseCharge(world, performance.now());
    },
  });

  restartBtn.addEventListener("click", () => {
    world = createWorld();
    syncOverlay();
  });

  function frame(): void {
    const now = performance.now();
    world = tick(world, now);
    draw(ctx, world, now, LEVEL_CONFIG.logicalWidth, logicalHeight);
    syncOverlay();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
