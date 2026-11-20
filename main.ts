// Leonida Legend — entry program for gta6-trophy-guide-01 (Node 22, standard library only).
// My guide lives in app/ as plain static files (index.html, style.css, app.js, data/trophies.json):
// a 55-trophy GTA VI checklist and tracker with a five-stage platinum roadmap, caution flags for
// the trophies whose official descriptions tie them to one mission, person or moment, cited
// guides for every trophy, filters, a spoiler shield, and export/import — all fully offline.
// This program hands the guide in: it copies app/ and screenshots/ to the output directory and
// writes dossier.json there with buildDossier from vendor/makefun-frontend.ts, which I leave
// byte-for-byte unchanged because the scorer rebuilds the dossier with its own copy and compares.
// Run it locally the same way the grader does, with MAKEFUN_OUTPUT_DIR standing in for /output:
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

// The caps below are the scorer's own: at most 4 screenshots of 256 KiB each, at most 993 files
// and directories in app/, at most 48 MiB of app files, and a 160 KiB cap on the dossier text.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`${guideTitle}: app/ and screenshots/ copied to ${out}, and dossier.json written there.`);
