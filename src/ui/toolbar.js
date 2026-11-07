import '../core/bridge.js';
import { STORAGE_KEYS, readRaw } from '../core/storage.js';
import { openLeaderboardModal } from './leaderboard.js';

/** Floating lab toolbar + the original one-way English translator. */
const LAB_MAP = {
  '選擇實驗': 'Choose Experiment',
  '返回': 'Back',
  '重置': 'Reset',
  '提交評分': 'Submit',
  '重試': 'Retry',
  '返回列表': 'Back to List',
  '完美！': 'Perfect!',
  '表現不錯': 'Well done',
  '尚可接受': 'OK',
  '需要改進': 'Needs work',
  '你的結果': 'Your result',
  '標準值': 'Expected',
  '誤差': 'Error',
  '你的讀數': 'Your reading',
  '記錄值': 'Recorded',
  '偏差': 'Deviation',
  '實驗建議': 'Experiment Advice',
  '練習題目': 'Practice',
  '實驗模擬器': 'Experiment Simulator',
  '隨機生成 HKDSE 風格物理題，即時批改與分析': 'Random HKDSE-style problems with instant grading',
  '模擬香港中學標準物理實驗，動手操作與評分': 'Simulate HK secondary school 3D physics experiments',
};

const T = {
  zh: { theme: '主題', rank: '排行' },
  en: { theme: 'Theme', rank: 'Rank' },
};

let observer = null;
let translating = false;
const origText = new WeakMap();

function $(id) { return document.getElementById(id); }
function getLang() {
  const s = readRaw(STORAGE_KEYS.lang);
  return (s === 'en' || s === 'zh') ? s : 'zh';
}
function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}
function t(key) { return (T[getLang()] && T[getLang()][key]) || T.zh[key] || key; }

function clickMainButton(id) {
  const el = $(id);
  if (!el) return;
  let ev;
  try {
    ev = new MouseEvent('click', { bubbles: false, cancelable: true, view: window });
  } catch (e) {
    ev = document.createEvent('MouseEvents');
    ev.initMouseEvent('click', false, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  }
  el.dispatchEvent(ev);
}

function updateToolbar() {
  const bar = $('phylabToolbar');
  if (!bar) return;
  const langText = $('phylabToolbarLangText');
  if (langText) langText.textContent = getLang() === 'en' ? '中文' : 'EN';
  const themeText = $('phylabToolbarThemeText');
  if (themeText) themeText.textContent = t('theme');
  const rankText = $('phylabToolbarRankText');
  if (rankText) rankText.textContent = t('rank');

  bar.classList.toggle('light-mode', getTheme() === 'light');

  let anyOverlayOpen = false;
  ['phylabLauncher', 'phylabSelector', 'phylabLab'].forEach((id) => {
    const el = $(id);
    if (el && !el.classList.contains('hidden')) anyOverlayOpen = true;
  });
  const lab = $('phylabLab');
  const labVisible = !!(lab && !lab.classList.contains('hidden'));
  bar.classList.toggle('lab-mode', labVisible);
  if (!labVisible) bar.classList.remove('expanded');

  const lbModal = $('p9LbBackdrop');
  if (lbModal && lbModal.classList.contains('show')) bar.classList.add('hidden');
  else bar.classList.toggle('hidden', !anyOverlayOpen);
}

function injectToolbar() {
  if ($('phylabToolbar')) return;
  const bar = document.createElement('div');
  bar.id = 'phylabToolbar';
  bar.className = 'phylab-toolbar';
  bar.innerHTML = `
    <button class="phylab-toolbar-toggle" type="button" title="Tools">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
    <button id="phylabToolbarLang" type="button"><span id="phylabToolbarLangText">EN</span></button>
    <button id="phylabToolbarTheme" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><span id="phylabToolbarThemeText">Theme</span></button>
    <button id="phylabToolbarRank" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg><span id="phylabToolbarRankText">Rank</span></button>`;
  document.body.appendChild(bar);

  bar.querySelector('.phylab-toolbar-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    bar.classList.toggle('expanded');
  });
  $('phylabToolbarLang').addEventListener('click', () => clickMainButton('langBtn'));
  $('phylabToolbarTheme').addEventListener('click', () => {
    clickMainButton('themeBtn');
    updateToolbar();
  });
  $('phylabToolbarRank').addEventListener('click', openLeaderboardModal);
  document.addEventListener('click', (e) => {
    if (!bar.classList.contains('expanded')) return;
    if (!bar.contains(e.target)) bar.classList.remove('expanded');
  });
  updateToolbar();
}

function translateNode(node) {
  if (node.nodeType === 3) {
    const text = node.textContent;
    if (!text || !text.trim()) return;
    if (!origText.has(node)) origText.set(node, text);
    const orig = origText.get(node);
    let target = orig;
    if (getLang() === 'en') {
      const trimmed = orig.trim();
      if (LAB_MAP[trimmed]) target = orig.replace(trimmed, LAB_MAP[trimmed]);
      else if (orig.indexOf('得分：') !== -1) target = orig.replace('得分：', 'Score: ');
    }
    if (node.textContent !== target) node.textContent = target;
  } else if (node.nodeType === 1) {
    const tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') return;
    if (node.classList && node.classList.contains('phyexp-root')) return;
    if (node.id === 'phylabExpGrid' || node.id === 'phylabLabTitle') return;
    for (let i = 0; i < node.childNodes.length; i++) translateNode(node.childNodes[i]);
  }
}

function translateAll() {
  if (translating) return;
  translating = true;
  ['phylabLauncher', 'phylabSelector', 'phylabLab', 'phylabResultBackdrop'].forEach((id) => {
    const el = $(id);
    if (el) translateNode(el);
  });
  updateToolbar();
  if (observer) { try { observer.takeRecords(); } catch (e) {} }
  translating = false;
}

function startObserver() {
  if (observer) { try { observer.disconnect(); } catch (e) {} }
  observer = new MutationObserver((mutations) => {
    if (translating) return;
    let real = false;
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].type === 'childList' && mutations[i].addedNodes.length > 0) { real = true; break; }
    }
    if (!real) { try { observer.takeRecords(); } catch (e) {} return; }
    if (observer._timer) clearTimeout(observer._timer);
    observer._timer = setTimeout(translateAll, 80);
  });
  ['phylabLauncher', 'phylabSelector', 'phylabResultBackdrop'].forEach((id) => {
    const el = $(id);
    if (el) observer.observe(el, { childList: true, subtree: true });
  });
}

function watchScreens() {
  ['phylabLauncher', 'phylabSelector', 'phylabLab'].forEach((id) => {
    const el = $(id);
    if (!el) return;
    const obs = new MutationObserver(updateToolbar);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
}

export function initToolbar() {
  injectToolbar();
  startObserver();
  ['langBtn', 'themeBtn'].forEach((id) => {
    const btn = $(id);
    if (btn) btn.addEventListener('click', () => setTimeout(id === 'langBtn' ? translateAll : updateToolbar, 100));
  });
  if (window.PhyVerse) {
    window.PhyVerse.onLangChange(() => setTimeout(translateAll, 80));
    window.PhyVerse.onThemeChange(() => setTimeout(updateToolbar, 60));
  }
  watchScreens();
  if (getLang() === 'en') setTimeout(translateAll, 300);
  window.PhyVerseToolbar = { update: updateToolbar };
  console.log('[Part 9 v2+v6] Lab Lang/Theme/Leaderboard & Collapsible toolbar ready');
}
