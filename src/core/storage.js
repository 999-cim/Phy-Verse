/**
 * Central registry for PhyVerse localStorage keys.
 * IMPORTANT: these strings are a public compatibility surface. Do not rename,
 * version, migrate, or normalize them.
 */
export const STORAGE_KEYS = Object.freeze({
  history: 'phy_history_v2',
  expScores: 'phygenius_exp_scores_v1',
  notes: 'phy_notes_v2',
  lang: 'phy_lang_v2',
  theme: 'phy_theme_v2',
  streak: 'phy_streak_v2',
  lastExperiment: 'phyverse_exp_last_v1',
});

export const MARKS_KEY_PREFIX = 'phyverse_exp_marks_';

export function marksKey(experimentId) {
  return MARKS_KEY_PREFIX + experimentId;
}

export function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* preserve the original best-effort behavior */
  }
}

export function removeRaw(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* preserve the original best-effort behavior */
  }
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* preserve the original best-effort behavior */
  }
}

export function readLang() {
  return readRaw(STORAGE_KEYS.lang);
}

export function writeLang(value) {
  writeRaw(STORAGE_KEYS.lang, value);
}

export function readTheme() {
  return readRaw(STORAGE_KEYS.theme);
}

export function writeTheme(value) {
  writeRaw(STORAGE_KEYS.theme, value);
}
