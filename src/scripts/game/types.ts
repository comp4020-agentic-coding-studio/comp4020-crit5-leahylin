export interface Platform {
  x: number;
  width: number;
}

// Committed at the instant Space is released — landed/accuracy/target are
// already decided; everything after this is a cosmetic tween toward toX.
export interface Flight {
  fromX: number;
  toX: number;
  startMs: number;
  durationMs: number;
  landed: boolean;
  accuracy: number;
  targetPlatformIndex: number;
}

export type GameState = "START" | "PLAYING" | "WON" | "LOST";

// A "+2"/"+1" fired the instant a landing resolves, purely for the score
// feedback animation — render.ts fades it out on its own after popupMs.
export interface ScorePopup {
  points: number;
  x: number;
  startMs: number;
}

export interface World {
  state: GameState;
  platforms: Platform[];
  platformIndex: number; // index of the platform the player is standing on
  playerX: number; // resting x while standing, or last committed x mid-flight
  chargeStartMs: number | null; // set while Space is held, else null
  flight: Flight | null;
  score: number;
  scorePopup: ScorePopup | null;
}
