import { init } from "./game/main";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const scoreEl = document.querySelector<HTMLElement>("#score");
const difficultyEl = document.querySelector<HTMLElement>("#difficulty");
const overlayEl = document.querySelector<HTMLElement>("#overlay");
const overlayMessageEl = document.querySelector<HTMLElement>("#overlay-message");
const restartBtn = document.querySelector<HTMLButtonElement>("#restart");

if (canvas && scoreEl && difficultyEl && overlayEl && overlayMessageEl && restartBtn) {
  init({ canvas, scoreEl, difficultyEl, overlayEl, overlayMessageEl, restartBtn });
}
