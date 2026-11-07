import {
  getSettings,
  getUser,
  handleAuthCallback,
  logout as identityLogout,
  oauthLogin,
  updateUser,
} from '@netlify/identity';
import { STORAGE_KEYS, readJson, writeJson } from './storage.js';

/**
 * Netlify Identity + Google OAuth + per-user cloud sync.
 *
 * Cloud data is stored in the signed-in user's Netlify Identity
 * user_metadata under `phyverse_sync_v1`. It is small (practice history and
 * experiment scores), so this avoids adding a separate database/function.
 * Local-only operation remains the default when no user is signed in.
 */
const CLOUD_FIELD = 'phyverse_sync_v1';
const DATA_EVENT = 'phyverse:data-sync';

let currentUser = null;
let authUnavailable = false;
let googleEnabled = null;
let readyPromise = null;
const listeners = new Set();

function emitAuth() {
  const state = { user: currentUser, unavailable: authUnavailable, googleEnabled, ready: !!readyPromise };
  listeners.forEach((cb) => {
    try { cb(state); } catch (e) { console.error('[PhyVerse Auth] listener error:', e); }
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function readLocalData() {
  return {
    history: asArray(readJson(STORAGE_KEYS.history, [])),
    expScores: asArray(readJson(STORAGE_KEYS.expScores, [])),
  };
}

function writeLocalData(data) {
  writeJson(STORAGE_KEYS.history, data.history);
  writeJson(STORAGE_KEYS.expScores, data.expScores);
}

function readCloudData(user) {
  const raw = user && user.userMetadata && user.userMetadata[CLOUD_FIELD];
  if (!raw || typeof raw !== 'object') return null;
  return {
    history: asArray(raw.history),
    expScores: asArray(raw.expScores),
  };
}

function tsOf(item) {
  const n = Number(item && item.ts);
  return Number.isFinite(n) ? n : 0;
}

function historyKey(item) {
  return JSON.stringify([
    tsOf(item),
    item && item.topic_zh,
    item && item.topic_en,
    item && item.score,
    item && item.total,
    item && item.elapsed,
  ]);
}

function expScoreKey(item) {
  return JSON.stringify([
    tsOf(item),
    item && item.name,
    item && item.nameEn,
    item && item.score,
  ]);
}

function mergeLists(localList, cloudList, keyFn) {
  const map = new Map();
  const all = [...cloudList, ...localList].filter((item) => item && typeof item === 'object');
  all.sort((a, b) => tsOf(a) - tsOf(b));
  for (const item of all) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()].sort((a, b) => tsOf(a) - tsOf(b));
}

/**
 * Pure, idempotent merge: same input twice produces the same output.
 * Dedupe key includes ts plus the record payload, so two distinct records that
 * share a millisecond timestamp are not accidentally collapsed.
 */
export function mergeSyncData(local, cloud) {
  return {
    history: mergeLists(local.history, cloud.history, historyKey),
    expScores: mergeLists(local.expScores, cloud.expScores, expScoreKey),
  };
}

function cloudPayload(data) {
  const times = [...data.history, ...data.expScores].map(tsOf).filter((n) => n > 0);
  return {
    version: 1,
    updatedAt: times.length ? Math.max(...times) : 0,
    history: data.history,
    expScores: data.expScores,
  };
}

function sameRecords(a, b) {
  return JSON.stringify({ history: a.history, expScores: a.expScores }) ===
    JSON.stringify({ history: b.history, expScores: b.expScores });
}

async function uploadCloud(user, data) {
  const payload = cloudPayload(data);
  const nextMetadata = {
    ...(user.userMetadata || {}),
    [CLOUD_FIELD]: payload,
  };
  const updated = await updateUser({ data: nextMetadata });
  if (updated) currentUser = updated;
  return updated;
}

async function syncCloud(user) {
  const local = readLocalData();
  const cloud = readCloudData(user);
  const hasLocal = local.history.length > 0 || local.expScores.length > 0;
  const hasCloud = !!cloud && (cloud.history.length > 0 || cloud.expScores.length > 0);

  if (!hasCloud) {
    if (hasLocal) await uploadCloud(user, local);
    return local;
  }

  if (!hasLocal) {
    writeLocalData(cloud);
    window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: cloud }));
    return cloud;
  }

  const merged = mergeSyncData(local, cloud);
  writeLocalData(merged);
  if (!sameRecords(merged, cloud)) {
    await uploadCloud(user, merged);
  }
  window.dispatchEvent(new CustomEvent(DATA_EVENT, { detail: merged }));
  return merged;
}

export async function initAuth() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    try {
      try {
        await handleAuthCallback();
      } catch (err) {
        authUnavailable = true;
        console.warn('[PhyVerse Auth] OAuth callback handling failed:', err);
      }

      try {
        const settings = await getSettings();
        googleEnabled = !!(settings && settings.providers && settings.providers.google);
      } catch (err) {
        authUnavailable = true;
        googleEnabled = null;
        console.warn('[PhyVerse Auth] Identity settings unavailable:', err && err.message ? err.message : err);
      }

      try {
        currentUser = await getUser();
      } catch (err) {
        authUnavailable = true;
        currentUser = null;
        console.warn('[PhyVerse Auth] Identity unavailable:', err && err.message ? err.message : err);
      }

      if (currentUser) {
        try {
          await syncCloud(currentUser);
        } catch (err) {
          console.error('[PhyVerse Auth] Cloud sync failed:', err);
        }
      }

      return currentUser;
    } catch (err) {
      authUnavailable = true;
      currentUser = null;
      console.error('[PhyVerse Auth] Init failed:', err);
      return null;
    } finally {
      emitAuth();
    }
  })();

  return readyPromise;
}

export function loginWithGoogle() {
  if (authUnavailable || googleEnabled === false) {
    throw new Error('Netlify Identity / Google provider is not enabled on this site.');
  }
  try {
    oauthLogin('google');
  } catch (err) {
    /* oauthLogin navigates and then throws AuthError("Redirecting..."). */
    if (!/Redirecting/i.test(err && err.message ? err.message : '')) throw err;
  }
}

export async function logout() {
  await identityLogout();
  currentUser = null;
  emitAuth();
}

export function getAuthState() {
  return { user: currentUser, unavailable: authUnavailable, googleEnabled, ready: !!readyPromise };
}

export function onAuthChange(cb) {
  if (typeof cb !== 'function') return () => {};
  listeners.add(cb);
  cb(getAuthState());
  return () => listeners.delete(cb);
}

export function getCurrentUser() {
  return currentUser;
}
