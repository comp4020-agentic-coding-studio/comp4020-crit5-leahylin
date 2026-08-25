import { init } from "./game/main";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const confettiCanvas = document.querySelector<HTMLCanvasElement>("#confetti");
const scoreEl = document.querySelector<HTMLElement>("#score");
const bestEl = document.querySelector<HTMLElement>("#best");
const difficultyEl = document.querySelector<HTMLElement>("#difficulty");
const startHintEl = document.querySelector<HTMLElement>("#start-hint");
const overlayEl = document.querySelector<HTMLElement>("#overlay");
const overlayMessageEl = document.querySelector<HTMLElement>("#overlay-message");
const newBestEl = document.querySelector<HTMLElement>("#overlay-new-best");
const statScoreEl = document.querySelector<HTMLElement>("#stat-score");
const statBestEl = document.querySelector<HTMLElement>("#stat-best");
const restartBtn = document.querySelector<HTMLButtonElement>("#restart");

if (
  canvas &&
  confettiCanvas &&
  scoreEl &&
  bestEl &&
  difficultyEl &&
  startHintEl &&
  overlayEl &&
  overlayMessageEl &&
  newBestEl &&
  statScoreEl &&
  statBestEl &&
  restartBtn
) {
  init({
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
  });
}
