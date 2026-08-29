# Process overview

## What I built

**Leap** is a hold-to-charge, release-to-jump platformer inspired by the Chinese mobile game WeChat Jump Jump. Holding Space or the pointer charges a jump, and releasing it immediately determines whether the player **stayed, advanced, skipped, or missed**. Easy, Medium, and Hard change only platform width and gap, not the physics. Scoring rewards precise landings (+2 within a ±5% centre zone, +1 otherwise), with combos and a persistent best score. The opening screen has no written instructions; a bouncing Space-key icon is the only affordance, and it reappears after a win or loss.

## The moments that mattered

I worked with the coding agent iteratively rather than in one shot: I made one change at a time, tested and playtested it, then used the results to set constraints for the next change. In this way, tests and observed behaviour became part of how I directed the agent, rather than just checking the final result.

**1. Landing on your own platform was a loss**

A short jump that landed back on the current platform was originally treated as a miss because `resolveJump` only checked the next platform. 

Instead of treating this as a special case for short jumps, I decided that every jump should have one of four outcomes: **stayed, advanced, skipped, or missed** and directed Claude to implement this as part of the game model. This made the sequential-platform rule explicit rather than relying on where the character happened to land. 

Claude updated `spec/jump.test.ts` to reflect this rule, changing the expected result from `landed === false` to explicitly asserting `outcome === "stayed"`. I then verified the change by testing short, normal, and over-long jumps.

Commit:[`a6fd825`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/a6fd825)

**2. A score nobody could see didn't matter**

The score was visible during play but disappeared behind the WIN/LOSS overlay at the moment it mattered. 

Instead of only making the number visiable on the ending screen, I decided that scoring should give the player a reason to replay. I therefore directed Claude to make the results panel to show the final Score, a per-mode Best score, and the player's combo. 

Claude implemented the scoring and persistence changes using `localStorage` and added `spec/scoring.test.ts` to cover the scoring behaviour. I then manually checked that Best survived a page reload while the current Score reset. 

This changed the role of scoring from information displayed during the game into a replay incentive. 

Commit:
[`4d98b1f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/4d98b1f)

**3. Every level was the exact same level**

The first version generated the same platform widths and gaps every run, making the later part of the level increasingly memorisable. 

Instead of adding unrestricted randomness, I decided to introduce it in stages: first the gaps, then the widths after the reachability check still passed. I directed Claude to keep a bounded regenerate-if-unreachable safeguard so that generated levels could vary without creating impossible jumps.

I then asked Claude to add tests for both constraints: `spec/level-fairness.test.ts` checks that generated jumps remain playable, while `spec/level-randomness.test.ts` checks that generated platforms are not identical. I used these tests, together with manual playtesting, to verify that the randomness changed the level without breaking its playability.

Commits:
[`a6fd825`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/a6fd825),
[`91bc620`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-leahylin/commit/91bc620)
