# Process overview

## What I built

**Leap**: a hold-to-charge, release-to-jump platformer. Holding Space or the
pointer grows a jump; releasing commits it instantly, deciding stayed /
advanced / skipped / missed at that moment, not by where the character
happens to land. Easy/Medium/Hard vary only platform width and gap, never
physics; scoring rewards a precise landing (+2 in a ±5% center zone, +1
otherwise) and tracks combos and a persistent best. The opening screen has no
instructions anywhere — a bouncing Space-key icon is the only thing on it, and
the only thing that reappears after a win or a loss.

## The moments that mattered

**1. Landing on your own platform was a loss**

A short jump that landed back on the current platform was originally treated as a miss because `resolveJump` only checked the next platform. Instead of special-casing short holds, I changed the model to distinguish four outcomes: **stayed, advanced, skipped, and missed**. This separated a safe short jump from actually falling into the gap and also made the sequential-platform rule explicit. I knew the change was correct because I tested short, normal, and over-long jumps, and changed the existing test in `spec/jump.test.ts` from expecting `landed === false` to explicitly asserting `outcome === "stayed"`. Commit:[`a6fd825`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/a6fd825)

**2. A score nobody could see didn't matter**

The score was visible during play but disappeared behind the WIN/LOSS overlay at the moment it mattered. Instead of only adding the number to the ending message, I made scoring a secondary reason to replay: the results panel shows the final Score, a per-mode Best score, and the player's combo. I persisted Best with `localStorage` because Easy, Medium, and Hard have different scoring conditions. I verified the combo behaviour with `spec/scoring.test.ts`, then manually checked that Best survived a page reload while the current Score reset. Commit:
[`4d98b1f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/4d98b1f)

**3. Every level was the exact same level**

The first version generated the same platform widths and gaps every run, making the later part of the level increasingly memorisable. Instead of randomising everything at once, I changed the generation in stages: first the gaps, then the widths after the reachability check still passed. I kept a bounded regenerate-if-unreachable safeguard so randomness could not create an impossible jump. I verified the fairness constraint with `spec/level-fairness.test.ts` and added `spec/level-randomness.test.ts` to check that generated platforms were not identical. Commits:
[`a6fd825`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/a6fd825),
[`91bc620`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/91bc620)
