export type InputSource = "keyboard" | "pointer";

export interface ChargeHandlers {
  onChargeStart: (source: InputSource) => void;
  onChargeEnd: (source: InputSource) => void;
}

function isSpace(event: KeyboardEvent): boolean {
  return event.code === "Space" || event.key === " ";
}

export function createInput(handlers: ChargeHandlers, canvas: HTMLCanvasElement): void {
  window.addEventListener("keydown", (event) => {
    if (!isSpace(event) || event.repeat) return;
    event.preventDefault(); // Space scrolls the page otherwise
    handlers.onChargeStart("keyboard");
  });

  window.addEventListener("keyup", (event) => {
    if (!isSpace(event)) return;
    event.preventDefault();
    handlers.onChargeEnd("keyboard");
  });

  // Holding Space while the tab loses focus would otherwise leave the charge
  // stuck forever, since no keyup ever fires — release it as-is instead.
  window.addEventListener("blur", () => {
    handlers.onChargeEnd("keyboard");
  });

  // Pointer events cover mouse and touch alike, so a press-and-hold on the
  // canvas charges a jump exactly like holding Space does.
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handlers.onChargeStart("pointer");
  });

  canvas.addEventListener("pointerup", (event) => {
    event.preventDefault();
    handlers.onChargeEnd("pointer");
  });

  // A pointer that leaves the canvas or gets interrupted (e.g. a system
  // gesture) mid-hold would otherwise leave the charge stuck forever, since
  // no pointerup ever fires there — release it as-is, same as window blur.
  canvas.addEventListener("pointercancel", () => {
    handlers.onChargeEnd("pointer");
  });
  canvas.addEventListener("pointerleave", () => {
    handlers.onChargeEnd("pointer");
  });
}
