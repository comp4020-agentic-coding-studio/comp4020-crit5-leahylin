import { init } from "./game/main";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const confettiCanvas = document.querySelector<HTMLCanvasElement>("#confetti");
const scoreEl = document.querySelector<HTMLElement>("#score");
const difficultyEl = document.querySelector<HTMLElement>("#difficulty");
const overlayEl = document.querySelector<HTMLElement>("#overlay");
const overlayMessageEl = document.querySelector<HTMLElement>("#overlay-message");
const newBestEl = document.querySelector<HTMLElement>("#overlay-new-best");
const statScoreEl = document.querySelector<HTMLElement>("#stat-score");
const statBestEl = document.querySelector<HTMLElement>("#stat-best");
const statPerfectEl = document.querySelector<HTMLElement>("#stat-perfect");
const statComboEl = document.querySelector<HTMLElement>("#stat-combo");
const restartBtn = document.querySelector<HTMLButtonElement>("#restart");

if (
  canvas &&
  confettiCanvas &&
  scoreEl &&
  difficultyEl &&
  overlayEl &&
  overlayMessageEl &&
  newBestEl &&
  statScoreEl &&
  statBestEl &&
  statPerfectEl &&
  statComboEl &&
  restartBtn
) {
  init({
    canvas,
    confettiCanvas,
    scoreEl,
    difficultyEl,
    overlayEl,
    overlayMessageEl,
    newBestEl,
    statScoreEl,
    statBestEl,
    statPerfectEl,
    statComboEl,
    restartBtn,
  });
}
