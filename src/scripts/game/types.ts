export type DifficultyMode = "easy" | "medium" | "hard";

export interface Platform {
  x: number;
  width: number;
}

export type JumpOutcome = "stayed" | "advanced" | "skipped" | "missed";

// Committed at the instant Space is released — the outcome/accuracy/landed
// platform are already decided; everything after this is a cosmetic tween
// toward toX. "stayed" = landed back on the current platform (no progress),
// "advanced" = landed on the immediately next platform, "skipped" = landed
// on a platform further ahead (invalid — game over), "missed" = landed in a
// gap (game over).
export interface Flight {
  fromX: number;
  toX: number;
  startMs: number;
  durationMs: number;
  outcome: JumpOutcome;
  accuracy: number;
  landedIndex: number | null;
}

export type GameState = "START" | "PLAYING" | "WON" | "LOST";

// A "+2"/"+1" fired the instant a landing resolves, purely for the score
// feedback animation — render.ts fades it out on its own after popupMs.
// combo is the consecutive-center-landing streak at this landing (0 for an
// edge landing); render.ts only shows the "COMBO ×N" tag once it's >= 2.
export interface ScorePopup {
  points: number;
  combo: number;
  x: number;
  startMs: number;
}

export interface World {
  state: GameState;
  mode: DifficultyMode;
  platforms: Platform[];
  platformIndex: number; // index of the platform the player is standing on
  playerX: number; // resting x while standing, or last committed x mid-flight
  chargeStartMs: number | null; // set while Space is held, else null
  flight: Flight | null;
  score: number;
  scorePopup: ScorePopup | null;
  combo: number; // consecutive center landings right now; resets on an edge or stayed landing
  perfectLandings: number; // total center landings this run
  bestCombo: number; // highest combo streak reached this run
}
