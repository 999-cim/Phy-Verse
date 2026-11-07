import '../core/bridge.js';
import { STORAGE_KEYS, writeRaw } from '../core/storage.js';
import { showResult, hideResult } from './result-modal.js';

/** Selector grid + lab shell + bridge open/close. */
const SCREENS = {
  launcher: 'phylabLauncher',
  selector: 'phylabSelector',
  lab: 'phylabLab',
};

function el(id) { return document.getElementById(id); }

function isEn() {
  return !!((window.PhyVerse && window.PhyVerse.lang === 'en') || document.documentElement.lang === 'en');
}

const PARTS = [
  { id: 'gas', numZh: '一', numEn: 'I', nameZh: '氣體定律', nameEn: 'Gases' },
  { id: 'heat', numZh: '二', numEn: 'II', nameZh: '熱學', nameEn: 'Heat' },
  { id: 'mech', numZh: '三', numEn: 'III', nameZh: '力學', nameEn: 'Mechanics' },
  { id: 'elec', numZh: '四', numEn: 'IV', nameZh: '電學', nameEn: 'Electricity' },
  { id: 'optics', numZh: '五', numEn: 'V', nameZh: '光學', nameEn: 'Optics' },
  { id: 'waves', numZh: '六', numEn: 'VI', nameZh: '波動', nameEn: 'Waves' },
  { id: 'misc', numZh: '七', numEn: 'VII', nameZh: '其他', nameEn: 'Miscellaneous' },
];

function openWithPageTurn(exp, row) {
  const selector = el('phylabSelector');
  if (!selector || selector.classList.contains('is-turning')) return;

  row.classList.add('is-selected');
  selector.classList.add('is-turning');

  window.setTimeout(() => {
    selector.classList.remove('is-turning');
    row.classList.remove('is-selected');
    if (window.PhyVerse && typeof window.PhyVerse.openExperiment === 'function') {
      window.PhyVerse.openExperiment(exp.id);
    }
  }, 470);
}

function esc(s) {
  const str = String(s === undefined || s === null ? '' : s);
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (c === '&') out += '&amp;';
    else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else if (c === '"') out += '&quot;';
    else out += c;
  }
  return out;
}

export function showScreen(name) {
  Object.keys(SCREENS).forEach((key) => {
    const node = el(SCREENS[key]);
    if (!node) return;
    if (key === name) node.classList.remove('hidden');
    else node.classList.add('hidden');
  });
  const toolbar = el('phylabToolbar');
  if (toolbar) toolbar.classList.toggle('is-selector-hidden', name === 'selector');
}

export function hideAll() {
  Object.keys(SCREENS).forEach((key) => {
    const node = el(SCREENS[key]);
    if (node) node.classList.add('hidden');
  });
}

export function defaultPreviewSVG(exp, index) {
  const cat = (exp && exp.cat) ? exp.cat : 'mech';
  const numStr = (index + 1 < 10 ? '0' : '') + (index + 1);
  const badge = '<text x="18" y="24" font-size="11" fill="#6366f1" font-family="monospace" font-weight="800">3D #' + numStr + '</text>';
  if (cat === 'gas') {
    return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">' + badge
      + '<rect x="75" y="18" width="50" height="72" rx="6" fill="rgba(77,163,255,0.18)" stroke="#4f46e5" stroke-width="2"/>'
      + '<rect x="78" y="34" width="44" height="10" rx="3" fill="#6366f1"/>'
      + '<circle cx="90" cy="62" r="3" fill="#4f46e5"/><circle cx="108" cy="70" r="3" fill="#4f46e5"/><circle cx="96" cy="78" r="3" fill="#4f46e5"/>'
      + '</svg>';
  }
  if (cat === 'heat') {
    return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">' + badge
      + '<rect x="70" y="32" width="60" height="56" rx="8" fill="rgba(239,68,68,0.16)" stroke="#ef4444" stroke-width="2"/>'
      + '<line x1="100" y1="16" x2="100" y2="68" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>'
      + '<circle cx="100" cy="72" r="6" fill="#ef4444"/>'
      + '</svg>';
  }
  if (cat === 'elec') {
    return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">' + badge
      + '<rect x="45" y="28" width="110" height="56" rx="8" fill="none" stroke="#f59e0b" stroke-width="2"/>'
      + '<circle cx="75" cy="56" r="13" fill="#4f46e5"/><text x="75" y="60" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">V</text>'
      + '<circle cx="125" cy="56" r="13" fill="#10b981"/><text x="125" y="60" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">A</text>'
      + '</svg>';
  }
  if (cat === 'optics') {
    return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">' + badge
      + '<rect x="70" y="42" width="60" height="36" rx="4" fill="rgba(167,139,250,0.25)" stroke="#7c3aed" stroke-width="2"/>'
      + '<line x1="55" y1="18" x2="100" y2="42" stroke="#ef4444" stroke-width="2.5"/>'
      + '<line x1="100" y1="42" x2="130" y2="92" stroke="#3b82f6" stroke-width="2.5"/>'
      + '</svg>';
  }
  if (cat === 'waves') {
    return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">' + badge
      + '<path d="M 35 56 Q 55 20 75 56 T 115 56 T 155 56" fill="none" stroke="#4f46e5" stroke-width="3"/>'
      + '</svg>';
  }
  return '<svg viewBox="0 0 200 110" preserveAspectRatio="xMidYMid meet">' + badge
    + '<line x1="100" y1="16" x2="128" y2="72" stroke="#64748b" stroke-width="2"/>'
    + '<circle cx="128" cy="74" r="11" fill="#4f46e5"/>'
    + '<path d="M 72 74 A 56 56 0 0 0 128 74" fill="none" stroke="#a5b4fc" stroke-width="1.5" stroke-dasharray="4 3"/>'
    + '</svg>';
}

export function renderSelector() {
  const grid = el('phylabExpGrid');
  if (!grid) return;

  const selector = el('phylabSelector');
  if (selector) selector.classList.remove('is-turning');

  grid.innerHTML = '';
  const list = (window.PhyVerse && window.PhyVerse.experiments) ? window.PhyVerse.experiments : [];
  const en = isEn();
  const countEl = el('phylabBookCount');
  if (countEl) countEl.textContent = en ? `${list.length} experiments` : `${list.length} 個實驗`;

  let pageNo = 0;

  PARTS.forEach((part) => {
    const items = list.filter((exp) => (exp.cat || 'misc') === part.id);
    if (!items.length) return;

    const section = document.createElement('section');
    section.className = 'phylab-toc-part';

    const head = document.createElement('div');
    head.className = 'phylab-toc-part-head';
    const partLabel = en ? `Part ${part.numEn}` : `第${part.numZh}部`;
    const partName = en ? part.nameEn : part.nameZh;
    head.innerHTML = ''
      + '<span class="phylab-toc-part-no">' + esc(partLabel) + '</span>'
      + '<h3>' + esc(partName) + '</h3>'
      + '<span class="phylab-toc-part-count">' + String(items.length).padStart(2, '0') + '</span>';
    section.appendChild(head);

    items.forEach((exp) => {
      pageNo += 1;
      const page = String(pageNo).padStart(2, '0');
      const title = en ? (exp.title_en || exp.title_zh || exp.id) : (exp.title_zh || exp.title_en || exp.id);
      const desc = en ? (exp.desc_en || exp.desc_zh || '') : (exp.desc_zh || exp.desc_en || '');

      const row = document.createElement('button');
      row.className = 'phylab-toc-row';
      row.type = 'button';
      row.setAttribute('data-exp-id', exp.id);
      row.setAttribute('aria-label', (en ? `Page ${page}: ` : `第 ${page} 頁：`) + title);
      row.innerHTML = ''
        + '<span class="phylab-toc-page">' + page + '</span>'
        + '<span class="phylab-toc-main">'
        +   '<span class="phylab-toc-title">' + esc(title) + '</span>'
        +   '<span class="phylab-toc-desc">' + esc(desc) + '</span>'
        + '</span>'
        + '<span class="phylab-toc-arrow" aria-hidden="true">→</span>';

      row.addEventListener('click', () => openWithPageTurn(exp, row));
      section.appendChild(row);
    });

    grid.appendChild(section);
  });
}

export function openExperiment(id) {
  const list = (window.PhyVerse && window.PhyVerse.experiments) ? window.PhyVerse.experiments : [];
  let exp = null;
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) { exp = list[i]; break; }
  }
  if (!exp) {
    console.error('[Lab] Unknown experiment:', id);
    return;
  }
  if (window.__currentExp && typeof window.__currentExp.destroy === 'function') {
    try { window.__currentExp.destroy(); } catch (e1) {}
  }
  writeRaw(STORAGE_KEYS.lastExperiment, id);
  hideResult();
  window.__currentExp = exp;
  showScreen('lab');

  const en = isEn();
  const titleEl = el('phylabLabTitle');
  if (titleEl) titleEl.textContent = en ? (exp.title_en || exp.title_zh || exp.id) : (exp.title_zh || exp.title_en || exp.id);

  const stageMount = el('phylab-stage-mount');
  if (stageMount) {
    stageMount.innerHTML = '<div class="phyexp-root"></div>';
    const container = stageMount.querySelector('.phyexp-root');
    if (typeof exp.init === 'function') exp.init(container);
  }
}

export function closeExperiment() {
  if (window.__currentExp && typeof window.__currentExp.destroy === 'function') {
    try { window.__currentExp.destroy(); } catch (e) {}
  }
  window.__currentExp = null;
  hideResult();
  const toolbar = el('phylabToolbar');
  if (toolbar) toolbar.classList.remove('result-open');
  const stageMount = el('phylab-stage-mount');
  if (stageMount) stageMount.innerHTML = '';
  showScreen('selector');
  renderSelector();
}

function initSelectorShell() {
  const root = document.getElementById('phylab-root') || document.body;
  if (document.getElementById('phylabSelector')) return;

  const selector = document.createElement('div');
  selector.id = 'phylabSelector';
  selector.className = 'phylab-overlay hidden';
  selector.innerHTML = `
    <div class="phylab-selector-content">
      <div class="phylab-book" id="phylabBook">
        <header class="phylab-book-head">
          <p class="phylab-book-kicker">PHYVERSE · 3D PHYSICS LAB</p>
          <h2 class="phylab-book-title">物理之書</h2>
          <p class="phylab-book-sub">
            <span>全書目錄 · <span id="phylabBookCount">15 個實驗</span></span>
            <span>逐頁翻閱，選一個實驗開始</span>
          </p>
        </header>
        <div class="phylab-book-toc" id="phylabExpGrid"></div>
        <footer class="phylab-book-foot">
          <button class="phylab-bookmark" data-phylab-nav="launcher" type="button">返回啟動器</button>
          <span class="phylab-book-folio">PhyVerse · 3D Lab · 2026</span>
        </footer>
      </div>
    </div>`;
  root.appendChild(selector);

  const lab = document.createElement('div');
  lab.id = 'phylabLab';
  lab.className = 'phylab-overlay hidden';
  lab.innerHTML = `
    <div class="phylab-lab-shell">
      <div class="phylab-lab-head">
        <button class="phylab-back" data-phylab-nav="selector" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="15 18 9 12 15 6"/></svg>
          <span>返回</span>
        </button>
        <h2 id="phylabLabTitle"></h2>
        <div class="phylab-lab-actions">
          <button id="phylabReset" type="button">重置</button>
          <button id="phylabScore" type="button">提交評分</button>
        </div>
      </div>
      <div id="phylab-stage-mount"></div>
    </div>`;
  root.appendChild(lab);
}

function bindNav() {
  document.querySelectorAll('[data-phylab-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-phylab-nav');
      if (target === 'launcher') showScreen('launcher');
      else if (target === 'selector') closeExperiment();
    });
  });

  const resetBtn = el('phylabReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!window.__currentExp) return;
      if (typeof window.__currentExp.reset === 'function') window.__currentExp.reset();
      else if (window.PhyVerse && typeof window.PhyVerse.openExperiment === 'function') {
        window.PhyVerse.openExperiment(window.__currentExp.id);
      }
    });
  }

  const scoreBtn = el('phylabScore');
  if (scoreBtn) {
    scoreBtn.addEventListener('click', () => {
      if (!window.__currentExp || typeof window.__currentExp.score !== 'function') return;
      showResult(window.__currentExp.score());
    });
  }
}

export function initSelector() {
  initSelectorShell();
  bindNav();

  if (window.PhyVerse) {
    window.PhyVerse.openExperiment = openExperiment;
    window.PhyVerse.closeExperiment = closeExperiment;
    window.PhyVerse.renderSelector = renderSelector;
    window.PhyVerse.onLangChange((v) => {
      const sel = el('phylabSelector');
      if (sel && !sel.classList.contains('hidden')) renderSelector();
      if (window.__currentExp) {
        const titleEl = el('phylabLabTitle');
        if (titleEl) {
          titleEl.textContent = (v === 'en')
            ? (window.__currentExp.title_en || window.__currentExp.title_zh)
            : (window.__currentExp.title_zh || window.__currentExp.title_en);
        }
        const resultBackdrop = el('phylabResultBackdrop');
        if (resultBackdrop && resultBackdrop.classList.contains('show') && typeof window.__currentExp.score === 'function') {
          setTimeout(() => {
            try { showResult(window.__currentExp.score(), true); } catch (e) {}
          }, 140);
        }
      }
    });
  }

  showScreen('launcher');
  console.log('[PhyVerse Lab v2] Framework ready | registered experiments: ' + (window.PhyVerse ? window.PhyVerse.experiments.length : 0));
}
