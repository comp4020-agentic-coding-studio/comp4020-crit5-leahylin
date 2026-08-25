import { CENTER_ACCURACY_THRESHOLDS, DEFAULT_MODE, LOGICAL_WIDTH } from "./config";
import { createConfetti } from "./confetti";
import { createInput } from "./input";
import type { InputSource } from "./input";
import { draw } from "./render";
import { loadBestScore, saveBestScore } from "./storage";
import { createSoundEngine } from "./sound";
import { createWorld, releaseCharge, startCharge, tick } from "./state";
import type { DifficultyMode, World } from "./types";

export interface GameElements {
  canvas: HTMLCanvasElement;
  confettiCanvas: HTMLCanvasElement;
  scoreEl: HTMLElement;
  bestEl: HTMLElement;
  difficultyEl: HTMLElement;
  startHintEl: HTMLElement;
  overlayEl: HTMLElement;
  overlayMessageEl: HTMLElement;
  newBestEl: HTMLElement;
  statScoreEl: HTMLElement;
  statBestEl: HTMLElement;
  restartBtn: HTMLButtonElement;
}

// How long the "pressed" flash plays on the Space key icon, and how long the
// start hint stays on screen after that press before it's hidden — kept
// equal so the hint never disappears mid-animation.
const ICON_FLASH_MS = 220;
// Restart is delayed by this much after the icon flash starts so the flash is
// actually visible before the overlay (and its icons) disappear underneath it.
const RESTART_FLASH_DELAY_MS = 160;

export function init(elements: GameElements): void {
  const {
    canvas,
    confettiCanvas,
    scoreEl,
    bestEl,
    difficultyEl,
    startHintEl,
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
  const keyIcons = Array.from(document.querySelectorAll<HTMLElement>(".key-icon"));

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

  // Flashes the Space key icon's "pressed" state briefly — same visual
  // language for starting the game and for Play Again. Only a keyboard press
  // has an icon to flash; a mouse click has no on-screen affordance to light
  // up, so it's a no-op (returns false so callers can skip the matching delay).
  function flashForSource(source: InputSource): boolean {
    if (source !== "keyboard") return false;
    for (const icon of keyIcons) {
      icon.classList.remove("key-icon--pressed");
      void icon.offsetWidth; // restart the CSS animation if it's already mid-flash
      icon.classList.add("key-icon--pressed");
      window.setTimeout(() => icon.classList.remove("key-icon--pressed"), ICON_FLASH_MS);
    }
    return true;
  }

  let startHintHideTimer: number | null = null;

  function showStartHint(): void {
    if (startHintHideTimer !== null) {
      window.clearTimeout(startHintHideTimer);
      startHintHideTimer = null;
    }
    startHintEl.hidden = false;
  }

  // When Space started the game, wait for the press-flash to finish before
  // hiding the hint so the player actually sees the key light up. A mouse
  // click has no flash to wait for, so it hides immediately.
  function dismissStartHint(flashed: boolean): void {
    if (startHintHideTimer !== null) return;
    if (!flashed) {
      startHintEl.hidden = true;
      return;
    }
    startHintHideTimer = window.setTimeout(() => {
      startHintEl.hidden = true;
      startHintHideTimer = null;
    }, ICON_FLASH_MS);
  }

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
    // The trophy climbs with you the moment the run passes the stored best,
    // rather than only catching up on the results screen — so overtaking your
    // record is visible while it happens. bestScore itself is still only
    // written by finalizeResults, so an abandoned run never persists.
    bestEl.textContent = String(Math.max(bestScore, world.score));

    const ended = world.state === "WON" || world.state === "LOST";
    overlayEl.hidden = !ended;
    setRestartKeyboardActive(ended);
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

  // The one restart implementation — the button's click listener and the
  // WON/LOST-only keyboard shortcut below both call this (via triggerRestart),
  // never their own copy of the reset logic.
  function restart(): void {
    world = createWorld(mode);
    resultsFinalized = false;
    isNewBest = false;
    confetti.stop();
    showStartHint();
    syncUI();
  }

  // Flashes the Space key icon when keyboard-triggered, then hands off to the
  // single restart() implementation once the flash is visible. A mouse click
  // restarts immediately — no icon, no delay.
  function triggerRestart(source: InputSource): void {
    if (flashForSource(source)) {
      window.setTimeout(restart, RESTART_FLASH_DELAY_MS);
    } else {
      restart();
    }
  }

  // Space/Enter only restart while the result screen is up. preventDefault
  // here also suppresses the browser's own Enter/Space click-activation on a
  // focused button, so a focused restart button can't double-fire this.
  function onRestartKeydown(event: KeyboardEvent): void {
    if (event.code !== "Space" && event.code !== "Enter") return;
    event.preventDefault();
    triggerRestart("keyboard");
  }

  let restartKeyboardActive = false;
  function setRestartKeyboardActive(active: boolean): void {
    if (active === restartKeyboardActive) return;
    restartKeyboardActive = active;
    if (active) {
      window.addEventListener("keydown", onRestartKeydown);
    } else {
      window.removeEventListener("keydown", onRestartKeydown);
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
      onChargeStart: (source) => {
        const wasCharging = world.chargeStartMs !== null;
        const wasStart = world.state === "START";
        world = startCharge(world, performance.now());
        if (!wasCharging && world.chargeStartMs !== null) sound.startCharge();
        if (wasStart && world.state === "PLAYING") {
          dismissStartHint(flashForSource(source));
        }
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

  restartBtn.addEventListener("click", () => triggerRestart("pointer"));

  showStartHint();

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
