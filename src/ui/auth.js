import { initAuth, loginWithGoogle, logout, onAuthChange, getAuthState } from '../core/auth.js';

/** Header-adjacent Google Identity bar. Local-only use is unchanged. */
const BAR_ID = 'phyAuthBar';

function ensureBar() {
  const header = document.getElementById('phy-header');
  if (!header) return null;
  let bar = document.getElementById(BAR_ID);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.className = 'phy-auth-bar';
    header.insertAdjacentElement('afterend', bar);
  }
  return bar;
}

function showToast(msg) {
  if (typeof window.PHY_toast === 'function') window.PHY_toast(msg, 'warn');
}

function avatarUrl(user) {
  return user?.pictureUrl || user?.userMetadata?.avatar_url || '';
}

function render(state = getAuthState()) {
  const bar = ensureBar();
  if (!bar) return;
  bar.replaceChildren();
  bar.classList.toggle('is-hidden', !state.user && state.googleEnabled !== true);

  if (state.user) {
    const chip = document.createElement('div');
    chip.className = 'phy-auth-chip';

    const avatar = document.createElement('span');
    avatar.className = 'phy-auth-avatar';
    const pic = avatarUrl(state.user);
    if (pic) {
      const img = document.createElement('img');
      img.src = pic;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { avatar.textContent = (state.user.email || 'U')[0].toUpperCase(); });
      avatar.appendChild(img);
    } else {
      avatar.textContent = (state.user.email || 'U')[0].toUpperCase();
    }

    const email = document.createElement('span');
    email.className = 'phy-auth-email';
    email.textContent = state.user.email || '';
    email.title = state.user.email || '';

    const out = document.createElement('button');
    out.id = 'phyAuthLogout';
    out.className = 'phy-auth-logout';
    out.type = 'button';
    out.textContent = '退出登录';

    chip.append(avatar, email, out);
    bar.appendChild(chip);
    return;
  }

  /* Render the provider button only when getSettings().providers.google is true. */
  if (state.googleEnabled !== true) return;

  const btn = document.createElement('button');
  btn.id = 'phyAuthLogin';
  btn.className = 'phy-auth-login';
  btn.type = 'button';
  btn.title = '用 Google 登录';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.8V6.5H1.4a12 12 0 0 0 0 11l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.7 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg><span>用 Google 登录</span>';
  bar.appendChild(btn);
}

export function initAuthUI() {
  const bar = ensureBar();
  if (!bar) return;

  bar.addEventListener('click', async (e) => {
    const login = e.target.closest('#phyAuthLogin');
    if (login) {
      try {
        login.disabled = true;
        login.setAttribute('aria-busy', 'true');
        loginWithGoogle();
      } catch (err) {
        console.error('[PhyVerse Auth] Google login failed:', err);
        showToast(err?.message || 'Google 登录失败');
        render();
      }
      return;
    }

    const out = e.target.closest('#phyAuthLogout');
    if (out) {
      out.disabled = true;
      try {
        await logout();
      } catch (err) {
        console.error('[PhyVerse Auth] Logout failed:', err);
        showToast('退出登录失败，请稍后重试。');
        render();
      }
    }
  });

  render();
  onAuthChange(render);
  initAuth().then(() => render()).catch((err) => {
    console.error('[PhyVerse Auth] Init failed:', err);
    render();
  });
}
