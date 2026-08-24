// Procedural sound effects via Web Audio API — synthesized tones rather than
// audio files, so there's nothing to fetch and every constant here is the
// whole sound design. Every method is a safe no-op when Web Audio isn't
// available, so the game stays fully playable with sound disabled/unsupported.

const MASTER_GAIN = 0.18;

const CHARGE_MIN_HZ = 180;
const CHARGE_MAX_HZ = 520;
const CHARGE_GROWTH_TAU_MS = 280; // mirrors the charge circle's growth feel in render.ts
const CHARGE_FADE_S = 0.05;

const JUMP_START_HZ = 420;
const JUMP_END_HZ = 720;
const JUMP_DURATION_S = 0.12;

const LAND_EDGE_HZ = 440;
const LAND_CENTER_HZ = 660; // higher pitch reinforces the +2 precision bonus
const LAND_DURATION_S = 0.14;

const FAIL_START_HZ = 220;
const FAIL_END_HZ = 80;
const FAIL_DURATION_S = 0.28;

const WIN_NOTES_HZ = [523.25, 659.25, 783.99]; // C5, E5, G5 — a short major arpeggio
const WIN_NOTE_DURATION_S = 0.16;
const WIN_NOTE_GAP_S = 0.09;

export interface SoundEngine {
  startCharge(): void;
  updateCharge(holdMs: number): void;
  stopCharge(): void;
  playJump(): void;
  playLand(isCenter: boolean): void;
  playFail(): void;
  playWin(): void;
}

const silent: SoundEngine = {
  startCharge() {},
  updateCharge() {},
  stopCharge() {},
  playJump() {},
  playLand() {},
  playFail() {},
  playWin() {},
};

export function createSoundEngine(): SoundEngine {
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) return silent;

  let ctx: AudioContext | null = null;
  let chargeOsc: OscillatorNode | null = null;
  let chargeGain: GainNode | null = null;

  function ensureContext(): AudioContext {
    if (!ctx) ctx = new AudioContextCtor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function stopChargeOscillator(): void {
    if (!chargeOsc || !chargeGain || !ctx) {
      chargeOsc = null;
      chargeGain = null;
      return;
    }
    const stopAt = ctx.currentTime + CHARGE_FADE_S;
    chargeGain.gain.cancelScheduledValues(ctx.currentTime);
    chargeGain.gain.setValueAtTime(chargeGain.gain.value, ctx.currentTime);
    chargeGain.gain.linearRampToValueAtTime(0, stopAt); // fade out, not a hard stop click
    chargeOsc.stop(stopAt + 0.01);
    chargeOsc = null;
    chargeGain = null;
  }

  // A one-shot tone with a short linear attack (avoids a click) and an
  // exponential release (sounds more natural than a linear fade for a
  // percussive hit). Frequency can glide from freqStart to freqEnd.
  function playTone(
    freqStart: number,
    freqEnd: number,
    durationS: number,
    peakGain: number,
    type: OscillatorType,
  ): void {
    const audio = ensureContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + durationS);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationS);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + durationS + 0.02);
  }

  return {
    startCharge() {
      const audio = ensureContext();
      stopChargeOscillator();

      chargeOsc = audio.createOscillator();
      chargeGain = audio.createGain();
      chargeOsc.type = "triangle";
      chargeOsc.frequency.setValueAtTime(CHARGE_MIN_HZ, audio.currentTime);
      chargeGain.gain.setValueAtTime(0, audio.currentTime);
      chargeGain.gain.linearRampToValueAtTime(MASTER_GAIN * 0.5, audio.currentTime + CHARGE_FADE_S);
      chargeOsc.connect(chargeGain);
      chargeGain.connect(audio.destination);
      chargeOsc.start();
    },

    updateCharge(holdMs: number) {
      if (!chargeOsc || !ctx) return;
      const growth = 1 - Math.exp(-holdMs / CHARGE_GROWTH_TAU_MS);
      const freq = CHARGE_MIN_HZ + (CHARGE_MAX_HZ - CHARGE_MIN_HZ) * growth;
      chargeOsc.frequency.setValueAtTime(freq, ctx.currentTime);
    },

    stopCharge() {
      stopChargeOscillator();
    },

    playJump() {
      playTone(JUMP_START_HZ, JUMP_END_HZ, JUMP_DURATION_S, MASTER_GAIN, "triangle");
    },

    playLand(isCenter: boolean) {
      const freq = isCenter ? LAND_CENTER_HZ : LAND_EDGE_HZ;
      const peak = isCenter ? MASTER_GAIN * 1.1 : MASTER_GAIN * 0.8;
      playTone(freq, freq * 1.05, LAND_DURATION_S, peak, "sine");
    },

    playFail() {
      playTone(FAIL_START_HZ, FAIL_END_HZ, FAIL_DURATION_S, MASTER_GAIN, "sawtooth");
    },

    // A short ascending triad rather than one tone — reads as "celebratory"
    // without needing to be loud or long (kept at MASTER_GAIN, same as everything else).
    playWin() {
      const audio = ensureContext();
      WIN_NOTES_HZ.forEach((freq, i) => {
        const startAt = audio.currentTime + i * WIN_NOTE_GAP_S;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startAt);
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(MASTER_GAIN, startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + WIN_NOTE_DURATION_S);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(startAt);
        osc.stop(startAt + WIN_NOTE_DURATION_S + 0.02);
      });
    },
  };
}
