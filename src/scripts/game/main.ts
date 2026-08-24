import { CENTER_ACCURACY_THRESHOLDS, DEFAULT_MODE, LOGICAL_WIDTH } from "./config";
import { createConfetti } from "./confetti";
import { createInput } from "./input";
import { draw } from "./render";
import { loadBestScore, saveBestScore } from "./storage";
import { createSoundEngine } from "./sound";
import { createWorld, releaseCharge, startCharge, tick } from "./state";
import type { DifficultyMode, World } from "./types";

export interface GameElements {
  canvas: HTMLCanvasElement;
  confettiCanvas: HTMLCanvasElement;
  scoreEl: HTMLElement;
  difficultyEl: HTMLElement;
  overlayEl: HTMLElement;
  overlayMessageEl: HTMLElement;
  newBestEl: HTMLElement;
  statScoreEl: HTMLElement;
  statBestEl: HTMLElement;
  restartBtn: HTMLButtonElement;
}

export function init(elements: GameElements): void {
  const {
    canvas,
    confettiCanvas,
    scoreEl,
    difficultyEl,
    overlayEl,
    overlayMessageEl,
    newBestEl,
    statScoreEl,
    statBestEl,
    restartBtn,
  } = elements;
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx: CanvasRenderingContext2D = context;
  const sound = createSoundEngine();
  const confetti = createConfetti(confettiCanvas);
  const difficultyButtons = Array.from(difficultyEl.querySelectorAll<HTMLButtonElement>("button"));

  let logicalHeight = LOGICAL_WIDTH;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    logicalHeight = (rect.height / rect.width) * LOGICAL_WIDTH;
    const scale = canvas.width / LOGICAL_WIDTH;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  let mode: DifficultyMode = DEFAULT_MODE;
  let world: World = createWorld(mode);
  let bestScore = loadBestScore(mode);
  let resultsFinalized = false;
  let isNewBest = false;

  // Runs once per game-end: locks in whether this run beat the stored best
  // and, if so, persists it. Guarded by resultsFinalized since syncUI runs
  // every animation frame while the overlay stays up.
  function finalizeResults(): void {
    resultsFinalized = true;
    isNewBest = world.score > bestScore;
    if (isNewBest) {
      bestScore = world.score;
      saveBestScore(mode, bestScore);
    }
  }

  function syncUI(): void {
    scoreEl.textContent = String(world.score);

    const ended = world.state === "WON" || world.state === "LOST";
    overlayEl.hidden = !ended;
    if (ended) {
      if (!resultsFinalized) finalizeResults();
      const won = world.state === "WON";
      overlayMessageEl.textContent = won ? "YOU MADE IT!" : "GAME OVER";
      overlayMessageEl.classList.toggle("won", won);
      overlayMessageEl.classList.toggle("lost", !won);
      newBestEl.hidden = !isNewBest;
      statScoreEl.textContent = String(world.score);
      statBestEl.textContent = String(bestScore);
    }

    difficultyEl.hidden = world.state !== "START";
    for (const btn of difficultyButtons) {
      const isSelected = btn.dataset.mode === mode;
      btn.classList.toggle("selected", isSelected);
      btn.setAttribute("aria-pressed", String(isSelected));
    }
  }

  function selectMode(next: DifficultyMode): void {
    if (world.state !== "START") return;
    mode = next;
    world = createWorld(mode);
    bestScore = loadBestScore(mode);
    resultsFinalized = false;
    isNewBest = false;
    confetti.stop();
    syncUI();
  }

  for (const btn of difficultyButtons) {
    btn.addEventListener("click", () => {
      const next = btn.dataset.mode as DifficultyMode;
      selectMode(next);
    });
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
    world = createWorld(mode);
    resultsFinalized = false;
    isNewBest = false;
    confetti.stop();
    syncUI();
  });

  function frame(): void {
    const now = performance.now();

    if (world.chargeStartMs !== null) {
      sound.updateCharge(now - world.chargeStartMs);
    }

    const priorFlight = world.flight;
    const priorState = world.state;
    world = tick(world, now);

    if (priorFlight && !world.flight) {
      if (priorFlight.outcome === "stayed" || priorFlight.outcome === "advanced") {
        sound.playLand(priorFlight.accuracy >= CENTER_ACCURACY_THRESHOLDS[world.mode]);
      } else {
        sound.playFail();
      }
    }

    // Only the transition into WON — reaching the final platform — fires the
    // celebration, never an intermediate advance.
    if (priorState !== "WON" && world.state === "WON") {
      confetti.burst();
      sound.playWin();
    }

    draw(ctx, world, now, LOGICAL_WIDTH, logicalHeight);
    syncUI();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
