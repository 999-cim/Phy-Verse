import { showScreen, hideAll, renderSelector } from './selector.js';

/** Fullscreen lab launcher (the two-choice landing screen). */
export function initLauncher() {
  const root = document.getElementById('phylab-root') || document.body;
  if (document.getElementById('phylabLauncher')) return;

  const wrap = document.createElement('div');
  wrap.id = 'phylabLauncher';
  wrap.className = 'phylab-overlay';
  wrap.innerHTML = `
    <div class="phylab-particles" id="phylabParticles"></div>
    <div class="phylab-launch-content">
      <div class="phylab-brand">
        <div class="phylab-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="2.5"/>
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/>
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/>
          </svg>
        </div>
        <h1>PhyVerse</h1>
        <p>HKDSE Physics - Interactive 3D Learning</p>
      </div>
      <div class="phylab-choices">
        <button class="phylab-choice" data-phylab-choice="practice" type="button">
          <div class="phylab-choice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <h3>練習題目</h3>
          <p>隨機生成 HKDSE 風格物理題，即時批改與分析</p>
          <span class="phylab-choice-tag">Practice</span>
        </button>
        <button class="phylab-choice" data-phylab-choice="experiment" type="button">
          <div class="phylab-choice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 3v6L4 20a1 1 0 0 0 .9 1.4h14.2a1 1 0 0 0 .9-1.4L15 9V3"/>
              <line x1="8" y1="3" x2="16" y2="3"/>
              <line x1="7.5" y1="15" x2="16.5" y2="15"/>
            </svg>
          </div>
          <h3>實驗模擬器</h3>
          <p>模擬香港中學標準物理實驗，動手操作與評分</p>
          <span class="phylab-choice-tag">3D Simulator</span>
        </button>
      </div>
      <div class="phylab-footer">PhyVerse v3.0 - Free forever - No account needed</div>
    </div>`;
  root.appendChild(wrap);

  const particles = document.getElementById('phylabParticles');
  if (particles) {
    let html = '';
    for (let i = 0; i < 30; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 20;
      const duration = 15 + Math.random() * 15;
      const size = 1 + Math.random() * 3;
      html += `<div class="phylab-particle" style="left:${left}%; animation-delay:-${delay}s; animation-duration:${duration}s; width:${size}px; height:${size}px;"></div>`;
    }
    particles.innerHTML = html;
  }

  document.querySelectorAll('[data-phylab-choice]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-phylab-choice');
      if (choice === 'practice') {
        hideAll();
      } else if (choice === 'experiment') {
        showScreen('selector');
        renderSelector();
      }
    });
  });
}
