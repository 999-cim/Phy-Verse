import './core/bridge.js';
import { initPractice } from './ui/practice.js';
import { initOcr } from './core/ocr.js';
import { initLauncher } from './ui/launcher.js';
import { initSelector, closeExperiment } from './ui/selector.js';
import { initResultModal } from './ui/result-modal.js';
import { initLeaderboard } from './ui/leaderboard.js';
import { initToolbar } from './ui/toolbar.js';
import { registerExperiments } from './lab/engine.js';
import { experiments } from './lab/experiments/index.js';

/** Application composition root. Keep initialization in the original part order. */
function boot() {
  initPractice();
  initOcr();
  initLauncher();
  initSelector();
  initResultModal({ onBack: closeExperiment });
  initLeaderboard();
  initToolbar();
  registerExperiments(experiments);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
