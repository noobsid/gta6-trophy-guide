# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/noobsid/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/noobsid/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — an offline trophy guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy is shown with its official name, description and grade, plus a guide written for this entry in its own words that names its sources (the official PlayStation description, and the trophy list with its tracked counts as listed by Exophase and PSNProfiles). A five-stage roadmap leads to the Platinum: story chapters and named missions first, the big counts (250 stunts, 42 shooting-range golds, 100 WAiNK locations, 52 areas…) swept district by district, partner and one-off moment trophies banked before the finale, then the final mission and 100% completion. Sixteen trophies carry a ⚠ CAUTION flag built from their official descriptions — tied to one named mission, one named person, a unique animal, a choice or a single moment — so you do them when they first appear. The tracker saves progress in your browser (localStorage), filters by kind (story, missable, collectibles, activities, online — the official list has no online trophies) and by grade, searches, hides story trophies behind a spoiler shield until they are earned, and exports/imports progress as a file. Original look only: no Rockstar logo and no official artwork, and the app makes no network requests.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

or open `app/index.html` in a desktop browser with any static server rooted at `app/`. Hand-in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to the output and writes `dossier.json` with the vendored `vendor/makefun-frontend.ts`, unchanged from the kit. `shots.json` describes the four screenshots in `screenshots/`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=88mn4thc&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
