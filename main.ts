// Leonida Legend — the entry program for gta6-trophy-guide-01 (Node 22, standard library only).
// The guide itself is a small static site in app/ (index.html, style.css, app.js and
// data/trophies.json): a tracker and cited guide for all 55 GTA VI trophies, organised as a
// five-stage platinum roadmap. Its data carries 239 steps that each end in a source tag from
// the file's own registry — the PowerPyx roadmap, the Exophase list, the GAMES.GG hidden
// split, Press Start's cross-check and eight fetched PowerPyx sub-pages (S1–S12 in all) —
// plus PSN-hidden flags for the 28 hidden trophies, a count tracker per counted trophy,
// 85 per-item checklist entries spread over six counted trophies whose ticks feed those
// trackers, the complete 35-line 100% completion checklist, eight sources-differ notes, an
// audit bar computed live from the data, caution flags, filters, a spoiler shield and
// export/import. Everything runs offline, and every file was written in recorded sessions.
// This program performs the hand-in: it copies app/ and screenshots/ into the output
// directory and writes dossier.json there using buildDossier from vendor/makefun-frontend.ts,
// which stays byte-for-byte unchanged — the scorer rebuilds the dossier with its own copy
// and compares the two. To run it the way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const guideTitle = 'Leonida Legend — GTA VI Trophy Guide & Tracker';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The limits passed here are the scorer's own caps: no more than 4 screenshots of 256 KiB
// apiece, no more than 993 files and directories under app/, no more than 48 MiB of app
// files, and a 160 KiB ceiling on the dossier text.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`${guideTitle}: app/ and screenshots/ copied to ${out}, and dossier.json written there.`);
