// Leonida Legend — tracker logic: checklist in localStorage, filters by kind and grade,
// spoiler shield for story trophies, export/import, and a guide panel with cited sources.
const STORAGE_KEY = 'leonida-legend-earned-v1';
const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const gradeEl = document.getElementById('grade');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const onlyLeftEl = document.getElementById('only-left');
let earned = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
let activeKind = 'all';
let selectedName = null;
const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
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
  const sections = [
    ['Guide — in our own words', trophy.guide],
    ['Kind · Roadmap stage · Missable', `${trophy.kind} · Stage ${trophy.stage} of 5 · ${trophy.missable ? '⚠ CAUTION: treat as missable — do it when it first appears and keep a save before it (see Roadmap).' : 'Not flagged missable: it can be earned whenever you reach it.'}${trophy.count ? ` · Tracked count: ${trophy.count}` : ''}`],
    ['Sources', trophy.sources],
  ];
  for (const [heading, body] of sections) {
    const h = document.createElement('h4');
    h.textContent = heading;
    const p = document.createElement('p');
    p.textContent = body;
    detailEl.append(h, p);
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
    meta.textContent = `${trophy.kind} · Stage ${trophy.stage}${trophy.count ? ` · Count ${trophy.count}` : ''}${trophy.missable ? ' · ⚠ CAUTION — treat as missable' : ''}`;
    body.append(h, d, meta);
    const badge = document.createElement('span');
    badge.className = `grade-badge b-${trophy.grade}`;
    badge.textContent = trophy.grade;
    card.append(box, body, badge);
    card.addEventListener('click', () => { showGuide(trophy); renderListSelection(); });
    rowsEl.append(card);
  }
  document.getElementById('showing').textContent = `Showing ${shown} of ${trophies.length} trophies. Progress saves automatically in this browser.`;
  document.getElementById('online-note').hidden = activeKind !== 'online';
}

function renderListSelection() {
  for (const card of rowsEl.children) card.classList.remove('selected');
}

document.getElementById('kind-chips').addEventListener('click', (event) => {
  const btn = event.target.closest('[data-kind]');
  if (!btn) return;
  activeKind = btn.dataset.kind;
  for (const chip of document.querySelectorAll('.chip')) chip.classList.toggle('active', chip === btn);
  renderList();
});
document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned], null, 2)], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const names = JSON.parse(await file.text());
  earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
  saveProgress();
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
renderList();
showGuide(trophies[16]); // The Shootist open by default: 42 challenges, a cited guide at a glance.
selectedName = trophies[16].name;
renderList();
