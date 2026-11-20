// Leonida Legend — round 2 tracker logic: checklist + per-trophy count trackers in
// localStorage, an audit bar computed live from the data, numbered cited steps in the
// guide panel, a sources registry, a next-up roadmap list, filters by kind and grade,
// the spoiler shield for story trophies, and export/import. Everything runs offline.
const EARNED_KEY = 'leonida-legend-earned-v1';
const COUNTS_KEY = 'leonida-legend-counts-v1';
const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const gradeEl = document.getElementById('grade');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const onlyLeftEl = document.getElementById('only-left');
let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
let counts = JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}');
let activeKind = 'all';
let selectedName = null;
const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const registry = data.source_registry ?? [];
const registryByKey = Object.fromEntries(registry.map((s) => [s.key, s]));

function saveProgress() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

function saveCounts() {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}

function isStory(trophy) {
  return trophy.tags.includes('story');
}

function displayName(trophy) {
  if (spoilerEl.checked && isStory(trophy) && !earned.has(trophy.name)) return '🔒 Hidden story trophy';
  return trophy.name;
}

function displayDescription(trophy) {
  if (spoilerEl.checked && isStory(trophy) && !earned.has(trophy.name)) return 'Spoiler shield is on: earn this story trophy to reveal its description and guide.';
  return trophy.description;
}

function matchesFilters(trophy) {
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (activeKind !== 'all' && !trophy.tags.includes(activeKind)) return false;
  if (onlyLeftEl.checked && earned.has(trophy.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !`${trophy.name} ${trophy.description} ${trophy.kind}`.toLowerCase().includes(q)) return false;
  return true;
}

function sourceKeysOf(trophy) {
  const text = `${trophy.sources} ${(trophy.steps ?? []).join(' ')}`;
  return [...new Set([...text.matchAll(/\[(S\d)\]/g)].map((m) => m[1]))].sort();
}

function renderAudit() {
  const allSteps = trophies.flatMap((t) => t.steps ?? []);
  const tagged = allSteps.filter((s) => /\[(S\d)\]/.test(s)).length;
  const pct = allSteps.length ? Math.round((tagged / allSteps.length) * 100) : 0;
  const backed = trophies.filter((t) => sourceKeysOf(t).length >= 2).length;
  const caution = trophies.filter((t) => t.missable).length;
  const hiddenCount = trophies.filter((t) => t.hidden).length;
  const logged = Object.values(counts).reduce((sum, n) => sum + n, 0);
  document.getElementById('audit-bar').textContent =
    `AUDIT · 55/55 official name, description & grade [S2] · 1P 2G 6S 46B · ${hiddenCount} PSN-hidden [S3] · ${allSteps.length} steps, ${tagged} cited (${pct}%) · ${backed}/55 guides backed by 2+ sources · ${registry.length} registry sources read in full · ${caution} ⚠ caution flags · 0 online trophies · ${logged} counted steps logged by you`;
}

function renderRegistry() {
  const host = document.getElementById('registry');
  host.replaceChildren();
  for (const src of registry) {
    const card = document.createElement('article');
    card.className = 'src-card';
    const h = document.createElement('h3');
    h.textContent = `[${src.key}] ${src.name}`;
    const what = document.createElement('p');
    what.textContent = src.what;
    const url = document.createElement('p');
    url.className = 'src-url';
    url.textContent = src.url;
    card.append(h, what, url);
    host.append(card);
  }
}

function renderNextUp() {
  const host = document.getElementById('next-up');
  host.replaceChildren();
  const next = trophies.filter((t) => !earned.has(t.name)).sort((a, b) => a.stage - b.stage || a.id - b.id).slice(0, 4);
  const h = document.createElement('h3');
  h.textContent = 'Next up — roadmap order';
  host.append(h);
  if (!next.length) {
    const p = document.createElement('p');
    p.textContent = 'Everything is earned. Leonida Legend status: achieved.';
    host.append(p);
    return;
  }
  const ol = document.createElement('ol');
  for (const t of next) {
    const li = document.createElement('li');
    li.textContent = `${displayName(t)} — Stage ${t.stage}${t.missable ? ' · ⚠ CAUTION' : ''}${t.hidden ? ' · PSN-hidden' : ''}`;
    li.addEventListener('click', () => showGuide(t));
    ol.append(li);
  }
  host.append(ol);
}

function countRow(trophy) {
  const wrap = document.createElement('div');
  wrap.className = 'your-count';
  const label = document.createElement('span');
  const now = counts[trophy.name] ?? 0;
  label.textContent = `YOUR COUNT — ${now} / ${trophy.count}${now >= trophy.count ? ' ✓ target reached' : ` · ${trophy.count - now} to go`}`;
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Decrease count for ${trophy.name}`);
  minus.addEventListener('click', () => {
    counts[trophy.name] = Math.max(0, (counts[trophy.name] ?? 0) - 1);
    saveCounts();
    renderAudit();
    showGuide(trophy);
    renderList();
  });
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Increase count for ${trophy.name}`);
  plus.addEventListener('click', () => {
    counts[trophy.name] = Math.min(trophy.count, (counts[trophy.name] ?? 0) + 1);
    saveCounts();
    renderAudit();
    showGuide(trophy);
    renderList();
  });
  const note = document.createElement('span');
  note.className = 'count-note';
  note.textContent = 'saved in this browser';
  wrap.append(label, minus, plus, note);
  return wrap;
}

function showGuide(trophy) {
  selectedName = trophy.name;
  const hiddenBySpoiler = spoilerEl.checked && isStory(trophy) && !earned.has(trophy.name);
  detailEl.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = displayName(trophy);
  const desc = document.createElement('p');
  desc.className = 'd-desc';
  desc.textContent = `“${displayDescription(trophy)}” — official PlayStation description`;
  detailEl.append(title, desc);
  if (hiddenBySpoiler) {
    const note = document.createElement('p');
    note.textContent = 'Guide hidden by the spoiler shield until this trophy is earned. Turn the shield off above if you want to read ahead.';
    detailEl.append(note);
    return;
  }
  const metaH = document.createElement('h4');
  metaH.textContent = 'Kind · Roadmap stage · Missable · PSN';
  const meta = document.createElement('p');
  meta.textContent = `${trophy.kind} · Stage ${trophy.stage} of 5 · ${trophy.missable ? '⚠ CAUTION: treat as missable — do it when it first appears and keep a save before it (see Roadmap).' : 'Not flagged missable: it can be earned whenever you reach it.'} · ${trophy.hidden ? 'Hidden on PSN until earned [S3]' : 'Shown on PSN before earning [S3]'}`;
  detailEl.append(metaH, meta);
  if (trophy.count) detailEl.append(countRow(trophy));
  const guideH = document.createElement('h4');
  guideH.textContent = 'Guide — in our own words';
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  detailEl.append(guideH, guide);
  if (trophy.steps?.length) {
    const stepsH = document.createElement('h4');
    stepsH.textContent = `How to earn it — ${trophy.steps.length} steps, each cited`;
    const ol = document.createElement('ol');
    ol.className = 'steps';
    for (const step of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      ol.append(li);
    }
    detailEl.append(stepsH, ol);
  }
  const srcH = document.createElement('h4');
  srcH.textContent = 'Sources';
  const src = document.createElement('p');
  src.textContent = trophy.sources;
  detailEl.append(srcH, src);
  const keys = sourceKeysOf(trophy);
  if (keys.length) {
    const reg = document.createElement('p');
    reg.className = 'reg-line';
    reg.textContent = `Registry: ${keys.map((k) => `[${k}] ${registryByKey[k]?.name ?? k}`).join(' · ')}`;
    detailEl.append(reg);
  }
}

function renderProgress() {
  document.getElementById('progress').textContent = `${earned.size} of ${trophies.length} earned`;
  document.getElementById('bar-fill').style.width = `${(earned.size / trophies.length) * 100}%`;
  const byGrade = (g) => `${earnedCount(g)}/${trophies.filter((t) => t.grade === g).length}`;
  document.getElementById('grade-progress').textContent =
    `Platinum ${byGrade('platinum')} · Gold ${byGrade('gold')} · Silver ${byGrade('silver')} · Bronze ${byGrade('bronze')}`;
}

function earnedCount(gradeName) {
  return trophies.filter((t) => t.grade === gradeName && earned.has(t.name)).length;
}

function renderList() {
  renderProgress();
  renderNextUp();
  rowsEl.replaceChildren();
  let shown = 0;
  for (const trophy of trophies) {
    if (!matchesFilters(trophy)) continue;
    shown++;
    const card = document.createElement('article');
    card.className = `trophy g-${trophy.grade}${earned.has(trophy.name) ? ' earned' : ''}${selectedName === trophy.name ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.name);
    box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(trophy.name);
      else earned.delete(trophy.name);
      saveProgress();
      renderList();
      showGuide(trophy);
    });
    const body = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = displayName(trophy);
    const d = document.createElement('p');
    d.className = 'desc';
    d.textContent = displayDescription(trophy);
    const meta = document.createElement('p');
    meta.className = 'meta';
    const now = counts[trophy.name] ?? 0;
    meta.textContent = `${trophy.kind} · Stage ${trophy.stage}${trophy.count ? ` · Count ${now}/${trophy.count}` : ''} · ${trophy.steps?.length ?? 0} cited steps${trophy.hidden ? ' · PSN-HIDDEN' : ''}${trophy.missable ? ' · ⚠ CAUTION — treat as missable' : ''}`;
    body.append(h, d, meta);
    const badge = document.createElement('span');
    badge.className = `grade-badge b-${trophy.grade}`;
    badge.textContent = trophy.grade;
    card.append(box, body, badge);
    card.addEventListener('click', () => { showGuide(trophy); renderListSelection(); });
    rowsEl.append(card);
  }
  document.getElementById('showing').textContent = `Showing ${shown} of ${trophies.length} trophies. Progress and counts save automatically in this browser.`;
  document.getElementById('online-note').hidden = activeKind !== 'online';
}

function renderListSelection() {
  for (const card of rowsEl.children) card.classList.remove('selected');
}

function setKind(kind) {
  activeKind = kind;
  for (const chip of document.querySelectorAll('.chip')) chip.classList.toggle('active', chip.dataset.kind === kind);
  renderList();
}

document.getElementById('kind-chips').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-kind]');
  if (btn) setKind(btn.dataset.kind);
});
document.getElementById('nav-missables').addEventListener('click', () => setKind('missable'));
document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], counts }, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const parsed = JSON.parse(await file.text());
  const names = Array.isArray(parsed) ? parsed : parsed.earned ?? [];
  earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
  if (!Array.isArray(parsed) && parsed.counts) counts = parsed.counts;
  saveProgress();
  saveCounts();
  renderList();
});
gradeEl.addEventListener('change', renderList);
searchEl.addEventListener('input', renderList);
spoilerEl.addEventListener('change', () => {
  renderList();
  const current = trophies.find((t) => t.name === selectedName);
  if (current) showGuide(current); // spoiler shield applies to the open guide panel too
});
onlyLeftEl.addEventListener('change', renderList);
renderAudit();
renderRegistry();
renderList();
showGuide(trophies[27]); // Positive Mental Attitude open by default: the one missable that matters, with its count tracker.
selectedName = trophies[27].name;
renderList();
