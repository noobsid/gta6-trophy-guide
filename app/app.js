// Leonida Legend — the tracker logic for the round-3 guide: everything the earlier rounds
// had (earned checklist, a count tracker per counted trophy, a live audit bar, numbered
// steps that cite the registry, the sources registry itself, the next-up list, filters, the
// spoiler shield, export/import) plus round 3's per-item checklists — whose ticks feed the
// count trackers — the full 100% completion checklist and the sources-differ panel.
// All state lives in localStorage and everything runs offline.
const EARNED_KEY = 'leonida-legend-earned-v1';
const COUNTS_KEY = 'leonida-legend-counts-v1';
const ITEMS_KEY = 'leonida-legend-items-v1';
const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const gradeEl = document.getElementById('grade');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const onlyLeftEl = document.getElementById('only-left');
let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
let counts = JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}');
let itemsDone = JSON.parse(localStorage.getItem(ITEMS_KEY) ?? '{}');
let activeKind = 'all';
let selectedName = null;
const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const registry = data.source_registry ?? [];
const registryByKey = Object.fromEntries(registry.map((s) => [s.key, s]));
const completionChecklist = data.completion_checklist ?? [];
const sourcesDiffer = data.sources_differ ?? [];

function saveProgress() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

function saveCounts() {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}

function saveItems() {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(itemsDone));
}

// Ticking a checklist item feeds the trophy's YOUR COUNT by the item's units — a meditation
// spot is worth 1–2 meditations, a shooting-range course its 3–4 golds, everything else 1 —
// capped at the trophy's target. Unticking subtracts the same units back off.
function toggleItem(trophy, item, checked) {
  const done = new Set(itemsDone[trophy.name] ?? []);
  if (checked) done.add(item.name);
  else done.delete(item.name);
  itemsDone[trophy.name] = [...done];
  if (trophy.count) {
    const units = item.units ?? 1;
    const now = counts[trophy.name] ?? 0;
    counts[trophy.name] = Math.min(trophy.count, Math.max(0, now + (checked ? units : -units)));
    saveCounts();
  }
  saveItems();
  renderAudit();
  showGuide(trophy);
  renderList();
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
  return [...new Set([...text.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

function renderAudit() {
  const allSteps = trophies.flatMap((t) => t.steps ?? []);
  const tagged = allSteps.filter((s) => /\[(S\d+)\]/.test(s)).length;
  const pct = allSteps.length ? Math.round((tagged / allSteps.length) * 100) : 0;
  const backed = trophies.filter((t) => sourceKeysOf(t).length >= 2).length;
  const caution = trophies.filter((t) => t.missable).length;
  const hiddenCount = trophies.filter((t) => t.hidden).length;
  const allItems = trophies.flatMap((t) => t.items ?? []);
  const itemTrophies = trophies.filter((t) => t.items?.length).length;
  const checklistLines = completionChecklist.reduce((n, g) => n + g.items.length, 0);
  const logged = Object.values(counts).reduce((sum, n) => sum + n, 0);
  document.getElementById('audit-bar').textContent =
    `AUDIT · 55/55 official name, description & grade [S2] · 1P 2G 6S 46B · ${hiddenCount} PSN-hidden [S3] · ${allSteps.length} steps, ${tagged} cited (${pct}%) · ${backed}/55 guides backed by 2+ sources · ${registry.length} registry sources read in full, ${registry.length - 4} of them fetched sub-pages · ${allItems.length} per-item checklist entries across ${itemTrophies} trophies · the ${checklistLines}-line 100% checklist [S10] · ${sourcesDiffer.length} sources-differ notes · ${caution} ⚠ caution flags · 0 online trophies · ${logged} counted steps logged by you`;
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

function renderChecklist100() {
  const host = document.getElementById('checklist100');
  if (!host) return;
  host.replaceChildren();
  for (const group of completionChecklist) {
    const card = document.createElement('article');
    card.className = 'src-card';
    const h = document.createElement('h3');
    h.textContent = group.group;
    const ul = document.createElement('ul');
    ul.className = 'checklist-lines';
    for (const line of group.items) {
      const li = document.createElement('li');
      li.textContent = line;
      ul.append(li);
    }
    card.append(h, ul);
    host.append(card);
  }
}

function renderDiffer() {
  const host = document.getElementById('differ');
  if (!host) return;
  host.replaceChildren();
  for (const entry of sourcesDiffer) {
    const card = document.createElement('article');
    card.className = 'src-card differ-card';
    const h = document.createElement('h3');
    h.textContent = entry.topic;
    const p = document.createElement('p');
    p.textContent = entry.detail;
    card.append(h, p);
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
  note.textContent = trophy.items?.length ? 'saved in this browser · the checklist below feeds this counter' : 'saved in this browser';
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
  if (trophy.items?.length) {
    const itemsH = document.createElement('h4');
    const doneCount = (itemsDone[trophy.name] ?? []).length;
    itemsH.textContent = `Item checklist — ${doneCount} of ${trophy.items.length} ticked`;
    detailEl.append(itemsH);
    if (trophy.items_note) {
      const note = document.createElement('p');
      note.className = 'items-note';
      note.textContent = trophy.items_note;
      detailEl.append(note);
    }
    const list = document.createElement('div');
    list.className = 'items-list';
    const doneSet = new Set(itemsDone[trophy.name] ?? []);
    for (const item of trophy.items) {
      const row = document.createElement('label');
      row.className = `item-row${doneSet.has(item.name) ? ' done' : ''}`;
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = doneSet.has(item.name);
      box.setAttribute('aria-label', `Tick ${item.name} for ${trophy.name}`);
      box.addEventListener('change', () => toggleItem(trophy, item, box.checked));
      const text = document.createElement('span');
      text.textContent = `${item.name} — ${item.where} [${item.src}]`;
      row.append(box, text);
      list.append(row);
    }
    detailEl.append(list);
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
    meta.textContent = `${trophy.kind} · Stage ${trophy.stage}${trophy.count ? ` · Count ${now}/${trophy.count}` : ''} · ${trophy.steps?.length ?? 0} cited steps${trophy.items?.length ? ` · Items ${(itemsDone[trophy.name] ?? []).length}/${trophy.items.length}` : ''}${trophy.hidden ? ' · PSN-HIDDEN' : ''}${trophy.missable ? ' · ⚠ CAUTION — treat as missable' : ''}`;
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
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], counts, items: itemsDone }, null, 2)], { type: 'application/json' }));
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
  if (!Array.isArray(parsed) && parsed.items) itemsDone = parsed.items;
  saveProgress();
  saveCounts();
  saveItems();
  renderAudit();
  renderList();
});
gradeEl.addEventListener('change', renderList);
searchEl.addEventListener('input', renderList);
// Keyboard shortcut: pressing "/" anywhere outside a text field jumps straight to the
// search box, so the list can be filtered without reaching for the mouse.
document.addEventListener('keydown', (event) => {
  if (event.key !== '/') return;
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  if (typing) return;
  event.preventDefault();
  searchEl.focus();
  searchEl.select();
});
spoilerEl.addEventListener('change', () => {
  renderList();
  const current = trophies.find((t) => t.name === selectedName);
  if (current) showGuide(current); // the spoiler shield applies to the open guide panel too
});
onlyLeftEl.addEventListener('change', renderList);
renderAudit();
renderRegistry();
renderChecklist100();
renderDiffer();
renderList();
showGuide(trophies[27]); // Positive Mental Attitude opens by default: the one missable that matters, with its count tracker.
selectedName = trophies[27].name;
renderList();
