import '../core/bridge.js';

/** Lab score result modal. One-way dependency: selector imports this module. */
let onBack = null;

function isEn() {
  return !!((window.PhyVerse && window.PhyVerse.lang === 'en') || document.documentElement.lang === 'en');
}

function esc(s) {
  const str = String(s === undefined || s === null ? '' : s);
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charAt(i);
    if (c === '&') out += '&amp;';
    else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else if (c === '"') out += '&quot;';
    else out += c;
  }
  return out;
}

export function initResultModal(options = {}) {
  onBack = typeof options.onBack === 'function' ? options.onBack : null;
  const root = document.getElementById('phylab-root') || document.body;
  if (document.getElementById('phylabResultBackdrop')) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'phylab-result-backdrop';
  backdrop.id = 'phylabResultBackdrop';
  backdrop.innerHTML = `
    <div class="phylab-result-modal">
      <div class="phylab-result-header">
        <div class="phylab-result-emoji" id="phylabResultEmoji">&#127881;</div>
        <div class="phylab-result-title" id="phylabResultTitle"></div>
        <div class="phylab-result-sub" id="phylabResultSub"></div>
      </div>
      <div class="phylab-result-score">
        <div class="phylab-score-ring">
          <svg viewBox="0 0 90 90">
            <circle class="phylab-score-ring-bg" cx="45" cy="45" r="38"/>
            <circle class="phylab-score-ring-fg" id="phylabScoreRing" cx="45" cy="45" r="38" stroke-dasharray="0 239"/>
          </svg>
          <div class="phylab-score-ring-text" id="phylabScoreText">0%</div>
        </div>
      </div>
      <div class="phylab-result-compare" id="phylabResultCompare"></div>
      <div class="phylab-advice" id="phylabResultAdvice"></div>
      <div class="phylab-result-actions">
        <button class="phylab-result-retry" id="phylabResultRetry" type="button">重試</button>
        <button class="phylab-result-back" id="phylabResultBack" type="button">返回列表</button>
      </div>
    </div>`;
  root.appendChild(backdrop);

  document.getElementById('phylabResultRetry').addEventListener('click', () => {
    hideResult();
    if (window.__currentExp && typeof window.__currentExp.reset === 'function') {
      window.__currentExp.reset();
    }
  });

  document.getElementById('phylabResultBack').addEventListener('click', () => {
    hideResult();
    if (onBack) onBack();
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) hideResult();
  });
}

export function hideResult() {
  const backdrop = document.getElementById('phylabResultBackdrop');
  if (backdrop) backdrop.classList.remove('show');
  const tb = document.getElementById('phylabToolbar');
  if (tb) tb.classList.remove('result-open');
}

export function showResult(result, quiet) {
  if (!result) return;
  if (result.error) {
    if (typeof window.PHY_toast === 'function') window.PHY_toast(result.error, 'warn');
    else alert(result.error);
    return;
  }
  const backdrop = document.getElementById('phylabResultBackdrop');
  if (!backdrop) return;

  const scoreVal = Number(result.score) || 0;
  const en = isEn();
  let emoji;
  let title;
  if (scoreVal >= 90) { emoji = '\uD83C\uDFC6'; title = en ? 'Perfect!' : '完美！'; }
  else if (scoreVal >= 75) { emoji = '\u2728'; title = en ? 'Well done' : '表現不錯'; }
  else if (scoreVal >= 55) { emoji = '\uD83D\uDC4D'; title = en ? 'Good effort' : '尚可接受'; }
  else { emoji = '\uD83D\uDCDA'; title = en ? 'Keep practising' : '需要改進'; }

  window.__lastLabResult = result;
  document.getElementById('phylabResultEmoji').textContent = emoji;
  document.getElementById('phylabResultTitle').textContent = title;
  document.getElementById('phylabResultSub').textContent = (en ? 'Score: ' : '得分：') + scoreVal + ' / 100';

  const circumference = 2 * Math.PI * 38;
  const dash = (scoreVal / 100) * circumference;
  const ring = document.getElementById('phylabScoreRing');
  if (ring) {
    const color = scoreVal >= 75 ? '#10b981' : (scoreVal >= 55 ? '#f59e0b' : '#ef4444');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-dasharray', quiet ? (dash + ' ' + circumference) : ('0 ' + circumference));
    if (!quiet) {
      setTimeout(() => ring.setAttribute('stroke-dasharray', dash + ' ' + circumference), 100);
    }
  }
  const textEl = document.getElementById('phylabScoreText');
  if (textEl) {
    const c = scoreVal >= 75 ? '#10b981' : (scoreVal >= 55 ? '#f59e0b' : '#ef4444');
    textEl.style.color = c;
    if (quiet) {
      textEl.textContent = scoreVal + '%';
    } else {
      textEl.textContent = '0%';
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(scoreVal, (elapsed / 800) * scoreVal);
        textEl.textContent = Math.round(pct) + '%';
        if (pct < scoreVal) requestAnimationFrame(animate);
      };
      animate();
    }
  }

  const measuredStr = (typeof result.measured === 'number') ? result.measured.toFixed(2) : String(result.measured !== undefined ? result.measured : '--');
  const expectedStr = (typeof result.expected === 'number') ? result.expected.toFixed(2) : String(result.expected !== undefined ? result.expected : '--');
  const errNum = parseFloat(result.errorPct);
  const errStr = !isNaN(errNum) ? errNum.toFixed(2) : String(result.errorPct || '0.0');
  const unitStr = result.unit ? (' ' + esc(result.unit)) : '';
  const errColor = (!isNaN(errNum) && errNum < 5) ? '#10b981' : ((!isNaN(errNum) && errNum < 15) ? '#f59e0b' : '#ef4444');

  const proc = !!result.procedure;
  const lblMine = proc ? (en ? 'Your reading' : '你的讀數') : (en ? 'Your result' : '你的結果');
  const lblRef = proc ? (en ? 'Recorded' : '記錄值') : (en ? 'Expected' : '標準值');
  const lblErr = proc ? (en ? 'Deviation' : '偏差') : (en ? 'Error' : '誤差');
  document.getElementById('phylabResultCompare').innerHTML = `
    <div class="phylab-compare-row"><span class="phylab-compare-label">${lblMine}</span><span class="phylab-compare-value">${esc(measuredStr)}${unitStr}</span></div>
    <div class="phylab-compare-row"><span class="phylab-compare-label">${lblRef}</span><span class="phylab-compare-value">${esc(expectedStr)}${unitStr}</span></div>
    <div class="phylab-compare-row"><span class="phylab-compare-label">${lblErr}</span><span class="phylab-compare-value" style="color:${errColor};">${esc(errStr)}%</span></div>`;

  const adviceList = Array.isArray(result.advice) ? result.advice : (result.advice ? [String(result.advice)] : []);
  let adviceHtml = '<div class="phylab-advice-head">' + (en ? 'Experiment Advice' : '實驗建議') + '</div><ul>';
  for (let i = 0; i < adviceList.length; i++) adviceHtml += '<li>' + esc(adviceList[i]) + '</li>';
  adviceHtml += '</ul>';
  document.getElementById('phylabResultAdvice').innerHTML = adviceHtml;

  backdrop.classList.add('show');
  const resultToolbar = document.getElementById('phylabToolbar');
  if (resultToolbar) resultToolbar.classList.add('result-open');
  if (!quiet && scoreVal >= 75 && typeof window.PHY_launchConfetti === 'function') {
    try { window.PHY_launchConfetti(); } catch (e) {}
  }
}
