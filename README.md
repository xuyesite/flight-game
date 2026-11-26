# Sky Courier: Ring Run

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/xuyesite/flight-game/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/xuyesite/flight-game/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

A tiny original flight game for the make.fun **Make the best flight game** bounty. Fly the little red courier plane over the valley in an 800×600 play area, fully offline, no network requests, no engines, no templates.

## How to play

- **Mission 1 — Ring Run:** fly through 8 golden rings.
- **Mission 2 — Star Harvest:** collect 12 sky stars.
- **Mission 3 — Home Run:** land gently on runway 27.
- Dodge balloons and birds, watch your fuel, 3 lives, score, pause and restart.
- Controls: mouse (proportional, recommended) or keyboard. Sound can be muted.

## Run

Open `game/index.html` in a desktop browser, or serve the `game/` folder statically. Runs 60+ seconds with no errors and no network requests.

## Files

- `game/` — the whole game (HTML/CSS/JS, standard library only).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` into the output directory and writes `dossier.json`.
- `screenshots/` — 4 scripted shots (play, start, landing, win).
- `shots.json` — the shot list.
- `vendor/makefun-game.ts` — the kit's dossier helper (not authored here).
- `LICENSE` — MIT.
