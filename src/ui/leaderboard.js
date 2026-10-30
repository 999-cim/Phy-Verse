import '../core/bridge.js';
import { STORAGE_KEYS, readJson, writeJson, removeRaw, readRaw } from '../core/storage.js';
import { closeExperiment, showScreen } from './selector.js';

/** Leaderboard tab panel + floating-toolbar modal, with the original local data rules. */
const T = {
  zh: {
    home: '主頁', tab_leaderboard: '排行', title_leaderboard: '排行榜',
    subtitle_leaderboard: '記錄你的最佳成績', lb_exp: '實驗', lb_prac: '練習', lb_total: '總分',
    lb_empty: '尚未有任何記錄，去練習或做實驗吧！', lb_reset: '清除實驗記錄',
    lb_confirm_reset: '確定清除所有實驗分數？', lb_total_score: '總積分', lb_exp_total: '實驗總分',
    lb_prac_total: '練習總分', lb_exp_count: '實驗次數', lb_avg_exp: '平均實驗得分',
    lb_avg_prac: '平均練習得分', just_now: '剛剛', min_ago: ' 分鐘前', hr_ago: ' 小時前', d_ago: ' 天前',
    lb_title: '排行榜', theme: '主題', rank: '排行',
  },
  en: {
    home: 'Home', tab_leaderboard: 'Rank', title_leaderboard: 'Leaderboard',
    subtitle_leaderboard: 'Track your best scores', lb_exp: 'Experiment', lb_prac: 'Practice', lb_total: 'Total',
    lb_empty: 'No records yet. Start practicing or try an experiment!', lb_reset: 'Clear Experiment Records',
    lb_confirm_reset: 'Clear all experiment scores?', lb_total_score: 'Total', lb_exp_total: 'Experiment',
    lb_prac_total: 'Practice', lb_exp_count: 'Runs', lb_avg_exp: 'Avg Experiment', lb_avg_prac: 'Avg Practice',
    just_now: 'Just now', min_ago: ' min ago', hr_ago: ' hr ago', d_ago: ' d ago',
    lb_title: 'Leaderboard', theme: 'Theme', rank: 'Rank',
  },
};

let currentCat = 'experiment';
let modalCat = 'experiment';
let installed = false;

function $(id) { return document.getElementById(id); }
function getLang() {
  const s = readRaw(STORAGE_KEYS.lang);
  return (s === 'en' || s === 'zh') ? s : 'zh';
}
function t(key) { return (T[getLang()] && T[getLang()][key]) || T.zh[key] || key; }
function loadExp() { return readJson(STORAGE_KEYS.expScores, []); }
function saveExp(list) {
  if (list.length > 20) list = list.slice(-20);
  writeJson(STORAGE_KEYS.expScores, list);
}
function loadPrac() { return readJson(STORAGE_KEYS.history, []); }
function formatWhen(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return t('just_now');
  if (diff < 3600000) return Math.floor(diff / 60000) + t('min_ago');
  if (diff < 86400000) return Math.floor(diff / 3600000) + t('hr_ago');
  if (diff < 604800000) return Math.floor(diff / 86400000) + t('d_ago');
  return new Date(ts).toLocaleDateString(getLang() === 'en' ? 'en-US' : 'zh-HK');
}

function injectHomeButton() {
  const header = document.querySelector('.header-inner');
  if (!header) return;
  const actions = header.querySelector('.header-actions');
  if (!actions || $('phyHomeBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'phyHomeBtn';
  btn.className = 'icon-btn';
  btn.type = 'button';
  btn.title = t('home');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  btn.addEventListener('click', () => {
    if (window.__currentExp && window.PhyVerse && typeof window.PhyVerse.closeExperiment === 'function') {
      closeExperiment();
    }
    showScreen('launcher');
    const res = $('phylabResultBackdrop');
    if (res) res.classList.remove('show');
  });
  actions.insertBefore(btn, actions.firstChild);
}

function switchToLeaderboard() {
  ['practice', 'formulas', 'report', 'library'].forEach((name) => {
    const p = $('panel-' + name);
    if (p) p.classList.remove('active');
  });
  const lb = $('panel-leaderboard');
  if (lb) lb.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === 'leaderboard');
  });
  renderPanel(currentCat);
}

function injectTab() {
  const tabbar = document.querySelector('.tabbar-inner');
  if (!tabbar) return;
  if (document.querySelector('.tab-btn[data-tab="leaderboard"]')) return;
  const btn = document.createElement('button');
  btn.className = 'tab-btn';
  btn.setAttribute('data-tab', 'leaderboard');
  btn.type = 'button';
  btn.innerHTML = '<span class="tab-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span><span class="tab-lb-label"></span>';
  btn.querySelector('.tab-lb-label').textContent = t('tab_leaderboard');
  tabbar.appendChild(btn);
  btn.addEventListener('click', switchToLeaderboard);
  document.querySelectorAll('.tab-btn:not([data-tab="leaderboard"])').forEach((other) => {
    other.addEventListener('click', () => {
      const lb = $('panel-leaderboard');
      if (lb) lb.classList.remove('active');
    });
  });
}

function injectPanel() {
  const main = document.querySelector('.main');
  if (!main || $('panel-leaderboard')) return;
  const panel = document.createElement('section');
  panel.id = 'panel-leaderboard';
  panel.className = 'panel';
  panel.innerHTML = '<h2 class="page-title" id="phyLbTitle"></h2><p class="page-subtitle" id="phyLbSubtitle"></p><div id="phyLbTabs" class="phy-lb-tabs"></div><div id="phyLbContent"></div><button id="phyLbReset" class="btn-danger" type="button" style="margin-top:16px;"></button>';
  main.appendChild(panel);

  const tabsWrap = $('phyLbTabs');
  const cats = ['experiment', 'practice', 'total'];
  const keys = { experiment: 'lb_exp', practice: 'lb_prac', total: 'lb_total' };
  cats.forEach((cat) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (cat === currentCat ? ' selected' : '');
    b.textContent = t(keys[cat]);
    b.setAttribute('data-lb-cat', cat);
    b.addEventListener('click', () => {
      currentCat = cat;
      tabsWrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
      b.classList.add('selected');
      renderPanel(cat);
    });
    tabsWrap.appendChild(b);
  });

  const resetBtn = $('phyLbReset');
  resetBtn.textContent = t('lb_reset');
  resetBtn.addEventListener('click', () => {
    if (!confirm(t('lb_confirm_reset'))) return;
    removeRaw(STORAGE_KEYS.expScores);
    renderPanel(currentCat);
  });
}

function renderPanel(cat) {
  const titleEl = $('phyLbTitle');
  const subEl = $('phyLbSubtitle');
  const content = $('phyLbContent');
  const resetBtn = $('phyLbReset');
  const tabsWrap = $('phyLbTabs');
  if (!content) return;
  titleEl.textContent = t('title_leaderboard');
  subEl.textContent = t('subtitle_leaderboard');
  resetBtn.textContent = t('lb_reset');
  if (tabsWrap) {
    tabsWrap.querySelectorAll('.chip').forEach((chip, i) => {
      chip.textContent = t(['lb_exp', 'lb_prac', 'lb_total'][i]);
      chip.classList.toggle('selected', chip.getAttribute('data-lb-cat') === cat);
    });
  }
  content.innerHTML = '';
  if (cat === 'experiment') renderExp(content);
  else if (cat === 'practice') renderPrac(content);
  else renderTotal(content);
}

function renderExp(container) {
  const list = loadExp().slice().sort((a, b) => b.score - a.score || b.ts - a.ts).slice(0, 10);
  const lang = getLang();
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'phy-lb-empty';
    e.textContent = t('lb_empty');
    container.appendChild(e);
    return;
  }
  const card = document.createElement('div');
  card.className = 'phy-lb-card';
  let html = '';
  list.forEach((it, i) => {
    const rankCls = 'phy-lb-rank' + (i < 3 ? ' rank-' + (i + 1) : '');
    const name = (lang === 'en' && it.nameEn) ? it.nameEn : it.name;
    html += `<div class="phy-lb-row"><div class="${rankCls}">${i + 1}</div><div class="phy-lb-info"><div class="phy-lb-topic">${name}</div><div class="phy-lb-when">${formatWhen(it.ts)}</div></div><div class="phy-lb-score">${it.score}<span class="phy-lb-score-max"> / 100</span></div></div>`;
  });
  card.innerHTML = html;
  container.appendChild(card);
}

function renderPrac(container) {
  const list = loadPrac();
  const enriched = list.map((e) => ({
    topic: e.topic_zh, topicEn: e.topic_en, score: e.score, total: e.total,
    pct: e.total > 0 ? Math.round((e.score / e.total) * 100) : 0, ts: e.ts,
  })).sort((a, b) => b.pct - a.pct || b.ts - a.ts).slice(0, 10);
  if (!enriched.length) {
    const em = document.createElement('div');
    em.className = 'phy-lb-empty';
    em.textContent = t('lb_empty');
    container.appendChild(em);
    return;
  }
  const lang = getLang();
  const card = document.createElement('div');
  card.className = 'phy-lb-card';
  let html = '';
  enriched.forEach((it, j) => {
    const rankCls = 'phy-lb-rank' + (j < 3 ? ' rank-' + (j + 1) : '');
    const name = (lang === 'en' && it.topicEn) ? it.topicEn : it.topic;
    html += `<div class="phy-lb-row"><div class="${rankCls}">${j + 1}</div><div class="phy-lb-info"><div class="phy-lb-topic">${name}</div><div class="phy-lb-when">${it.score} / ${it.total} - ${formatWhen(it.ts)}</div></div><div class="phy-lb-score">${it.pct}%</div></div>`;
  });
  card.innerHTML = html;
  container.appendChild(card);
}

function totals() {
  const expList = loadExp();
  const pracList = loadPrac();
  let totalExp = 0;
  let totalPracPct = 0;
  expList.forEach((e) => { totalExp += e.score; });
  pracList.forEach((e) => { if (e.total > 0) totalPracPct += (e.score / e.total) * 100; });
  return { expList, pracList, totalExp, totalPracPct, overall: Math.round(totalExp + totalPracPct) };
}

function renderTotal(container) {
  const { expList, pracList, totalExp, totalPracPct, overall } = totals();
  const stats = document.createElement('div');
  stats.className = 'phy-lb-stats';
  stats.innerHTML = `<div class="phy-lb-stat"><div class="phy-lb-stat-num">${overall}</div><div class="phy-lb-stat-lbl">${t('lb_total_score')}</div></div><div class="phy-lb-stat"><div class="phy-lb-stat-num">${Math.round(totalExp)}</div><div class="phy-lb-stat-lbl">${t('lb_exp_total')}</div></div><div class="phy-lb-stat"><div class="phy-lb-stat-num">${Math.round(totalPracPct)}</div><div class="phy-lb-stat-lbl">${t('lb_prac_total')}</div></div><div class="phy-lb-stat"><div class="phy-lb-stat-num">${expList.length}</div><div class="phy-lb-stat-lbl">${t('lb_exp_count')}</div></div>`;
  container.appendChild(stats);

  if (expList.length + pracList.length > 0) {
    const avgExp = expList.length > 0 ? Math.round(totalExp / expList.length) : 0;
    const avgPrac = pracList.length > 0 ? Math.round(totalPracPct / pracList.length) : 0;
    const summary = document.createElement('div');
    summary.className = 'phy-lb-card';
    summary.innerHTML = `<div class="phy-lb-row"><div class="phy-lb-info"><div class="phy-lb-topic">${t('lb_avg_exp')}</div></div><div class="phy-lb-score">${avgExp}</div></div><div class="phy-lb-row"><div class="phy-lb-info"><div class="phy-lb-topic">${t('lb_avg_prac')}</div></div><div class="phy-lb-score">${avgPrac}%</div></div>`;
    container.appendChild(summary);
  }
}

function hookExpScore() {
  document.addEventListener('click', (e) => {
    const target = e.target;
    const btn = target && target.closest ? target.closest('#phylabScore') : null;
    if (!btn) return;
    setTimeout(() => {
      const backdrop = $('phylabResultBackdrop');
      if (!backdrop || !backdrop.classList.contains('show')) return;
      const sub = $('phylabResultSub');
      const title = $('phylabLabTitle');
      if (!sub || !title) return;
      const m = (sub.textContent || '').match(/(\d+)\s*\/\s*100/);
      if (!m) return;
      const score = parseInt(m[1], 10);
      const text = title.textContent || '';
      let nameZh = text;
      let nameEn = text;
      if (window.__currentExp) {
        nameZh = window.__currentExp.title_zh || text;
        nameEn = window.__currentExp.title_en || text;
      }
      const list = loadExp();
      list.push({ name: nameZh, nameEn, score, ts: Date.now() });
      saveExp(list);
    }, 300);
  }, true);
}

function hookLang() {
  const update = () => {
    const lbLabel = document.querySelector('.tab-lb-label');
    if (lbLabel) lbLabel.textContent = t('tab_leaderboard');
    const homeBtn = $('phyHomeBtn');
    if (homeBtn) homeBtn.title = t('home');
    const panel = $('panel-leaderboard');
    if (panel && panel.classList.contains('active')) renderPanel(currentCat);
    if ($('p9LbBackdrop') && $('p9LbBackdrop').classList.contains('show')) renderModal(modalCat);
  };
  const langBtn = $('langBtn');
  if (langBtn) langBtn.addEventListener('click', () => setTimeout(update, 120));
  if (window.PhyVerse) window.PhyVerse.onLangChange(() => setTimeout(update, 60));
}

export function initLeaderboard() {
  if (installed) return;
  installed = true;
  injectHomeButton();
  injectTab();
  injectPanel();
  hookExpScore();
  hookLang();
  console.log('[Part 8] Leaderboard + Fixes ready');
}

/* ------------------------- floating-toolbar leaderboard modal ------------------------- */
function buildModal() {
  if ($('p9LbBackdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'p9-lb-backdrop';
  backdrop.id = 'p9LbBackdrop';
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  backdrop.innerHTML = '<div class="p9-lb-modal"><div class="p9-lb-head"><div class="p9-lb-title"><span>&#127942;</span><span id="p9LbTitleText">Leaderboard</span></div><button class="p9-lb-close" id="p9LbClose" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="p9-lb-tabs" id="p9LbTabs"><button class="p9-lb-tab" data-p9cat="experiment" type="button"></button><button class="p9-lb-tab" data-p9cat="practice" type="button"></button><button class="p9-lb-tab" data-p9cat="total" type="button"></button></div><div class="p9-lb-content" id="p9LbContent"></div></div>';
  document.body.appendChild(backdrop);
  $('p9LbClose').addEventListener('click', closeModal);
  backdrop.querySelectorAll('.p9-lb-tab').forEach((b) => {
    b.addEventListener('click', () => {
      modalCat = b.getAttribute('data-p9cat');
      renderModal(modalCat);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('show')) closeModal();
  });
}

export function openLeaderboardModal() {
  buildModal();
  const backdrop = $('p9LbBackdrop');
  if (!backdrop) return;
  renderModal(modalCat);
  backdrop.classList.add('show');
}

function closeModal() {
  const backdrop = $('p9LbBackdrop');
  if (backdrop) backdrop.classList.remove('show');
  if (window.PhyVerseToolbar && typeof window.PhyVerseToolbar.update === 'function') {
    window.PhyVerseToolbar.update();
  }
}

function renderModal(cat) {
  const titleText = $('p9LbTitleText');
  if (titleText) titleText.textContent = t('lb_title');
  const tabs = $('p9LbTabs');
  if (tabs) {
    const keys = ['lb_exp', 'lb_prac', 'lb_total'];
    const cats = ['experiment', 'practice', 'total'];
    tabs.querySelectorAll('.p9-lb-tab').forEach((btn, i) => {
      btn.textContent = t(keys[i]);
      btn.classList.toggle('active', cats[i] === cat);
    });
  }
  const content = $('p9LbContent');
  if (!content) return;
  content.innerHTML = '';
  if (cat === 'experiment') {
    const list = loadExp().slice().sort((a, b) => b.score - a.score || b.ts - a.ts).slice(0, 10);
    if (!list.length) { content.innerHTML = '<div class="p9-lb-empty">' + t('lb_empty') + '</div>'; return; }
    const lang = getLang();
    let html = '<div class="p9-lb-card">';
    list.forEach((it, i) => {
      const rankCls = 'p9-lb-rank' + (i < 3 ? ' rank-' + (i + 1) : '');
      const name = (lang === 'en' && it.nameEn) ? it.nameEn : it.name;
      html += `<div class="p9-lb-row"><div class="${rankCls}">${i + 1}</div><div class="p9-lb-info"><div class="p9-lb-topic">${name}</div><div class="p9-lb-when">${formatWhen(it.ts)}</div></div><div class="p9-lb-score">${it.score}<span class="p9-lb-score-max"> / 100</span></div></div>`;
    });
    content.innerHTML = html + '</div>';
  } else if (cat === 'practice') {
    const top = loadPrac().map((e) => ({
      topic: e.topic_zh, topicEn: e.topic_en, score: e.score, total: e.total,
      pct: e.total > 0 ? Math.round((e.score / e.total) * 100) : 0, ts: e.ts,
    })).sort((a, b) => b.pct - a.pct || b.ts - a.ts).slice(0, 10);
    if (!top.length) { content.innerHTML = '<div class="p9-lb-empty">' + t('lb_empty') + '</div>'; return; }
    const lang = getLang();
    let html = '<div class="p9-lb-card">';
    top.forEach((it, j) => {
      const rankCls = 'p9-lb-rank' + (j < 3 ? ' rank-' + (j + 1) : '');
      const name = (lang === 'en' && it.topicEn) ? it.topicEn : it.topic;
      html += `<div class="p9-lb-row"><div class="${rankCls}">${j + 1}</div><div class="p9-lb-info"><div class="p9-lb-topic">${name}</div><div class="p9-lb-when">${it.score} / ${it.total} - ${formatWhen(it.ts)}</div></div><div class="p9-lb-score">${it.pct}%</div></div>`;
    });
    content.innerHTML = html + '</div>';
  } else {
    const { expList, pracList, totalExp, totalPracPct, overall } = totals();
    const avgExp = expList.length > 0 ? Math.round(totalExp / expList.length) : 0;
    const avgPrac = pracList.length > 0 ? Math.round(totalPracPct / pracList.length) : 0;
    content.innerHTML = `<div class="p9-lb-stats"><div class="p9-lb-stat"><div class="p9-lb-stat-num">${overall}</div><div class="p9-lb-stat-lbl">${t('lb_total_score')}</div></div><div class="p9-lb-stat"><div class="p9-lb-stat-num">${Math.round(totalExp)}</div><div class="p9-lb-stat-lbl">${t('lb_exp_total')}</div></div><div class="p9-lb-stat"><div class="p9-lb-stat-num">${Math.round(totalPracPct)}</div><div class="p9-lb-stat-lbl">${t('lb_prac_total')}</div></div><div class="p9-lb-stat"><div class="p9-lb-stat-num">${expList.length}</div><div class="p9-lb-stat-lbl">${t('lb_exp_count')}</div></div></div><div class="p9-lb-card"><div class="p9-lb-row"><div class="p9-lb-info"><div class="p9-lb-topic">${t('lb_avg_exp')}</div></div><div class="p9-lb-score">${avgExp}</div></div><div class="p9-lb-row"><div class="p9-lb-info"><div class="p9-lb-topic">${t('lb_avg_prac')}</div></div><div class="p9-lb-score">${avgPrac}%</div></div></div>`;
  }
}
