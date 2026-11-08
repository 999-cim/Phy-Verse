import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../core/firebase.js';

const BAR_ID = 'phyFirebaseAuthBar';
let unsubscribe = null;
let currentUser = null;
let langHooked = false;

function isEnglish() {
  return !!((window.PhyVerse && window.PhyVerse.lang === 'en') || document.documentElement.lang === 'en');
}

function googleLoginLabel() { return isEnglish() ? 'Sign in with Google' : '使用 Google 登入'; }
function signOutLabel() { return isEnglish() ? 'Sign out' : '登出'; }

function ensureBar() {
  const header = document.getElementById('phy-header');
  if (!header) return null;
  let bar = document.getElementById(BAR_ID);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.className = 'phy-auth-bar';
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 12px;background:#f5eddc;border-bottom:1px solid rgba(70,55,38,.18);';
    header.insertAdjacentElement('afterend', bar);
  }
  return bar;
}

function toast(message) {
  if (typeof window.PHY_toast === 'function') {
    window.PHY_toast(message, 'warn');
    return;
  }
  console.warn('[PhyVerse Firebase]', message);
}

function googleIcon() {
  return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.8V6.5H1.4a12 12 0 0 0 0 11l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.7 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>';
}

function render(user) {
  currentUser = user;
  const bar = ensureBar();
  if (!bar) return;
  bar.replaceChildren();

  if (!isFirebaseConfigured) {
    const note = document.createElement('span');
    note.style.cssText = 'font:600 12px/1.3 Inter,ui-sans-serif,sans-serif;color:#6b5b45;letter-spacing:.03em;';
    note.textContent = 'Firebase 尚未設定 · 請加入 VITE_FIREBASE_*';
    bar.appendChild(note);
    return;
  }

  if (user) {
    const chip = document.createElement('div');
    chip.className = 'phy-auth-chip';
    chip.style.cssText = 'display:flex;align-items:center;gap:8px;';

    const avatar = document.createElement('span');
    avatar.className = 'phy-auth-avatar';
    avatar.style.cssText = 'width:26px;height:26px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#e8dfcf;color:#5b4b36;font:700 12px Inter;';
    if (user.photoURL) {
      const img = document.createElement('img');
      img.src = user.photoURL;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.addEventListener('error', () => { avatar.textContent = (user.email || 'U')[0].toUpperCase(); });
      avatar.appendChild(img);
    } else {
      avatar.textContent = (user.email || 'U')[0].toUpperCase();
    }

    const email = document.createElement('span');
    email.className = 'phy-auth-email';
    email.textContent = user.email || '';
    email.title = user.email || '';
    email.style.cssText = 'font:500 12px Inter,ui-sans-serif,sans-serif;color:#4b4236;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

    const out = document.createElement('button');
    out.type = 'button';
    out.textContent = signOutLabel();
    out.style.cssText = 'border:1px solid rgba(70,55,38,.28);border-radius:999px;background:#fbf5e8;color:#5b4b36;padding:5px 11px;font:600 12px Inter,ui-sans-serif,sans-serif;cursor:pointer;';
    out.addEventListener('click', async () => {
      out.disabled = true;
      try { await signOut(auth); } catch (err) { toast(err?.message || '登出失敗'); out.disabled = false; }
    });

    chip.append(avatar, email, out);
    bar.appendChild(chip);
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'phyFirebaseLogin';
  btn.type = 'button';
  btn.innerHTML = `${googleIcon()}<span style="margin-left:6px">${googleLoginLabel()}</span>`;
  btn.style.cssText = 'display:inline-flex;align-items:center;border:1px solid rgba(70,55,38,.3);border-radius:999px;background:#fffaf0;color:#4b4236;padding:6px 12px;font:600 12px Inter,ui-sans-serif,sans-serif;cursor:pointer;box-shadow:0 1px 0 rgba(70,55,38,.08);';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.style.opacity = '.6';
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('[PhyVerse Firebase] Google sign-in failed:', err);
      toast(err?.message || 'Google 登入失敗');
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
  bar.appendChild(btn);
}

export function initFirebaseAuth() {
  if (!langHooked && window.PhyVerse && typeof window.PhyVerse.onLangChange === 'function') {
    window.PhyVerse.onLangChange(() => render(currentUser));
    langHooked = true;
  }
  const bar = ensureBar();
  if (!bar) return;

  if (!isFirebaseConfigured) {
    render(null);
    return;
  }

  if (unsubscribe) unsubscribe();
  unsubscribe = onAuthStateChanged(auth, (user) => {
    render(user);
  }, (err) => {
    console.error('[PhyVerse Firebase] Auth state failed:', err);
    render(null);
  });
}
