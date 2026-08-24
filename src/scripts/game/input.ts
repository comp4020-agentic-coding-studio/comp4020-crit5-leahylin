export interface ChargeHandlers {
  onChargeStart: () => void;
  onChargeEnd: () => void;
}

function isSpace(event: KeyboardEvent): boolean {
  return event.code === "Space" || event.key === " ";
}

export function createInput(handlers: ChargeHandlers): void {
  window.addEventListener("keydown", (event) => {
    if (!isSpace(event) || event.repeat) return;
    event.preventDefault(); // Space scrolls the page otherwise
    handlers.onChargeStart();
  });

  window.addEventListener("keyup", (event) => {
    if (!isSpace(event)) return;
    event.preventDefault();
    handlers.onChargeEnd();
  });

  // Holding Space while the tab loses focus would otherwise leave the charge
  // stuck forever, since no keyup ever fires — release it as-is instead.
  window.addEventListener("blur", () => {
    handlers.onChargeEnd();
  });
}
