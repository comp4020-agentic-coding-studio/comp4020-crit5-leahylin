import type { DifficultyMode } from "./types";

const KEY_PREFIX = "leap:best-score:";

// Best score is kept per difficulty mode, not as one global number — the
// center-scoring zone (and so how many +2s are attainable) differs per mode,
// so an Easy score and a Hard score aren't comparable.
export function loadBestScore(mode: DifficultyMode): number {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + mode);
    const value = raw === null ? 0 : Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(mode: DifficultyMode, score: number): void {
  try {
    localStorage.setItem(KEY_PREFIX + mode, String(score));
  } catch {
    // localStorage unavailable (private browsing, disabled) — the best score
    // just won't persist across reloads, which isn't fatal to the game.
  }
}
