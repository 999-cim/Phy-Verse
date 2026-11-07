import { STORAGE_KEYS, readRaw } from './storage.js';

/**
 * window.PhyVerse — exact public API and behavior preserved from test017.html.
 * This module installs the global at import time so the 3D engine can register
 * its language/theme listeners during its own module evaluation.
 */
const bridge = {
  version: '3.0.0',
  lang: (readRaw(STORAGE_KEYS.lang) === 'en') ? 'en' : 'zh-HK',
  theme: readRaw(STORAGE_KEYS.theme) || 'light',
  experiments: [],
  openExperiment: null,
  closeExperiment: null,
  _langCbs: [],
  _themeCbs: [],
  onLangChange: function (cb) {
    if (typeof cb === 'function') this._langCbs.push(cb);
  },
  onThemeChange: function (cb) {
    if (typeof cb === 'function') this._themeCbs.push(cb);
  },
  setLang: function (v) {
    this.lang = v;
    for (let i = 0; i < this._langCbs.length; i++) {
      try { this._langCbs[i](v); } catch (e) { console.error('[PhyVerse] langCb error:', e); }
    }
  },
  setTheme: function (v) {
    this.theme = v;
    document.documentElement.setAttribute('data-theme', v);
    for (let i = 0; i < this._themeCbs.length; i++) {
      try { this._themeCbs[i](v); } catch (e) { console.error('[PhyVerse] themeCb error:', e); }
    }
  },
  registerExperiment: function (exp) {
    if (!exp || !exp.id) {
      console.error('[PhyVerse] Invalid experiment registration:', exp);
      return;
    }
    for (let i = 0; i < this.experiments.length; i++) {
      if (this.experiments[i].id === exp.id) {
        this.experiments[i] = exp;
        return;
      }
    }
    this.experiments.push(exp);
  }
};

if (!window.PhyVerse) {
  window.PhyVerse = bridge;
}

export default bridge;
