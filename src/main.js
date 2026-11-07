import './core/bridge.js';
import { initPractice } from './ui/practice.js';
import { initOcr } from './core/ocr.js';
import { initLauncher } from './ui/launcher.js';
import { initSelector, closeExperiment } from './ui/selector.js';
import { initResultModal } from './ui/result-modal.js';
import { initLeaderboard } from './ui/leaderboard.js';
import { initToolbar } from './ui/toolbar.js';
import { initAuthUI } from './ui/auth.js';

/** Application composition root. Keep initialization in the original part order. */
function boot() {
  initPractice();
  initOcr();
  initLauncher();
  initSelector();
  initResultModal({ onBack: closeExperiment });
  initLeaderboard();
  initToolbar();
  initAuthUI();
  startLabLoad();
}

/**
 * Start the 3D lab import after the first-screen UI is initialized.
 * Never await this during boot; the launcher click awaits it only if needed.
 */
function startLabLoad() {
  if (window.__phyLabReady) return window.__phyLabReady;

  const labReady = (async () => {
    const engine = await import('./lab/engine.js');
    const { experiments } = await import('./lab/experiments/index.js');
    engine.registerExperiments(experiments);
    return experiments;
  })();

  window.__phyLabReady = labReady;
  labReady.catch((err) => {
    console.error('[PhyVerse] Lab preload failed:', err);
  });
  return labReady;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
