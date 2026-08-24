import { init } from "./game/main";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const scoreEl = document.querySelector<HTMLElement>("#score");
const overlayEl = document.querySelector<HTMLElement>("#overlay");
const overlayMessageEl = document.querySelector<HTMLElement>("#overlay-message");
const restartBtn = document.querySelector<HTMLButtonElement>("#restart");

if (canvas && scoreEl && overlayEl && overlayMessageEl && restartBtn) {
  init({ canvas, scoreEl, overlayEl, overlayMessageEl, restartBtn });
}
