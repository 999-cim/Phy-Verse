import {
  PHY_TEMPLATES, PHY_HINTS, PHY_FORMULAS, PHY_TOPICS, PHY_DIFFS,
  PHY_rand, PHY_f1, PHY_f2, checkNumericAnswer,
  generateQuestionSet, computeReport, buildReportText,
  loadHistory, saveHistory, loadNotes, saveNotes,
  loadStreak, saveStreak, loadLang, saveLang, loadTheme, saveTheme,
} from '../core/practice.js';
import '../core/bridge.js';

/** Practice view: DOM, i18n, question cards, timer, grading UI, report, tabs. */
      /* 確保主應用 HTML DOM 完整掛載 */
      function PHY_mountDOM() {
        var headerEl = document.getElementById("phy-header") || document.querySelector("header.header");
        if (headerEl) {
          headerEl.innerHTML = ''
            + '<div class="header-inner">'
            +   '<div class="logo-wrap">'
            +     '<div class="logo-badge">'
            +       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
            +         '<circle cx="12" cy="12" r="3"/>'
            +         '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/>'
            +         '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/>'
            +       '</svg>'
            +     '</div>'
            +     '<span class="logo-name">PhyVerse</span>'
            +     '<span class="logo-ver">v3.0</span>'
            +   '</div>'
            +   '<div class="header-actions">'
            +     '<div id="streakBadge" class="streak-badge hidden" title="Streak">'
            +       '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>'
            +       '<span id="streakCount">0</span>'
            +     '</div>'
            +     '<button id="themeBtn" class="icon-btn" type="button" title="Theme">'
            +       '<svg id="themeIconLight" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
            +       '<svg id="themeIconDark" class="hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            +     '</button>'
            +     '<button id="langBtn" class="lang-btn" type="button">EN</button>'
            +   '</div>'
            + '</div>';
        }

        var mainEl = document.getElementById("phy-main-container") || document.querySelector("main.main");
        if (mainEl) {
          mainEl.innerHTML = ''
            + '<div id="errorBanner" class="error-banner"></div>'
            + '<section id="panel-practice" class="panel active">'
            +   '<h2 class="page-title" data-i18n="title_practice"></h2>'
            +   '<p class="page-subtitle" data-i18n="subtitle_practice"></p>'
            +   '<div class="card">'
            +     '<label class="section-label" data-i18n="label_topic"></label>'
            +     '<div class="chip-grid" id="topicGrid"></div>'
            +     '<label class="section-label" data-i18n="label_difficulty"></label>'
            +     '<div class="chip-grid diff" id="diffGrid"></div>'
            +     '<label class="section-label">'
            +       '<span data-i18n="label_count"></span>'
            +       '<span id="countLbl" style="color: var(--primary); margin-left: 4px;">3</span>'
            +     '</label>'
            +     '<div class="range-row">'
            +       '<input type="range" id="qCount" min="1" max="8" value="3">'
            +     '</div>'
            +     '<button id="genBtn" class="btn-primary" type="button">'
            +       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
            +         '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>'
            +       '</svg>'
            +       '<span data-i18n="btn_generate"></span>'
            +     '</button>'
            +   '</div>'
            +   '<div id="questions"></div>'
            + '</section>'
            + '<section id="panel-formulas" class="panel">'
            +   '<h2 class="page-title" data-i18n="title_formulas"></h2>'
            +   '<p class="page-subtitle" data-i18n="subtitle_formulas"></p>'
            +   '<div id="formulaList"></div>'
            + '</section>'
            + '<section id="panel-report" class="panel">'
            +   '<h2 class="page-title" data-i18n="title_report"></h2>'
            +   '<p class="page-subtitle" data-i18n="subtitle_report"></p>'
            +   '<div class="stat-grid">'
            +     '<div class="stat">'
            +       '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>'
            +       '<div class="stat-num" id="statTotal">0</div>'
            +       '<div class="stat-label" data-i18n="stat_answered"></div>'
            +     '</div>'
            +     '<div class="stat">'
            +       '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>'
            +       '<div class="stat-num" id="statAvg">--</div>'
            +       '<div class="stat-label" data-i18n="stat_avg"></div>'
            +     '</div>'
            +     '<div class="stat">'
            +       '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg></div>'
            +       '<div class="stat-num" id="statStreak">0</div>'
            +       '<div class="stat-label" data-i18n="stat_streak"></div>'
            +     '</div>'
            +     '<div class="stat">'
            +       '<div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>'
            +       '<div class="stat-num" id="statTime">0<span style="font-size:14px;">m</span></div>'
            +       '<div class="stat-label" data-i18n="stat_time"></div>'
            +     '</div>'
            +   '</div>'
            +   '<div class="card">'
            +     '<h3 style="font-size:15px; font-weight:700; margin-bottom:10px;" data-i18n="recent_records"></h3>'
            +     '<div id="history"></div>'
            +     '<div class="export-row">'
            +       '<button id="exportBtn" class="btn-ghost" type="button">'
            +         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
            +         '<span data-i18n="btn_export"></span>'
            +       '</button>'
            +       '<button id="clearBtn" class="btn-danger" type="button">'
            +         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
            +         '<span data-i18n="btn_clear"></span>'
            +       '</button>'
            +     '</div>'
            +   '</div>'
            + '</section>'
            + '<section id="panel-library" class="panel">'
            +   '<h2 class="page-title" data-i18n="title_library"></h2>'
            +   '<p class="page-subtitle">'
            +     '<span data-i18n="subtitle_library_1"></span> '
            +     '<span id="tplCount" style="color: var(--primary); font-weight: 700;">0</span> '
            +     '<span data-i18n="subtitle_library_2"></span>'
            +   '</p>'
            +   '<div id="libraryList"></div>'
            + '</section>';
        }

        var tabbarEl = document.getElementById("phy-tabbar") || document.querySelector("nav.tabbar");
        if (tabbarEl) {
          tabbarEl.innerHTML = ''
            + '<div class="tabbar-inner">'
            +   '<button class="tab-btn active" data-tab="practice" type="button">'
            +     '<span class="tab-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>'
            +     '<span data-i18n="tab_practice"></span>'
            +   '</button>'
            +   '<button class="tab-btn" data-tab="formulas" type="button">'
            +     '<span class="tab-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>'
            +     '<span data-i18n="tab_formulas"></span>'
            +   '</button>'
            +   '<button class="tab-btn" data-tab="report" type="button">'
            +     '<span class="tab-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>'
            +     '<span data-i18n="tab_report"></span>'
            +   '</button>'
            +   '<button class="tab-btn" data-tab="library" type="button">'
            +     '<span class="tab-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>'
            +     '<span data-i18n="tab_library"></span>'
            +   '</button>'
            + '</div>';
        }

        var toastEl = document.getElementById("toast");
        if (toastEl && !toastEl.classList.contains("toast")) {
          toastEl.className = "toast";
        }
      }


      /* ============================================================
         I18N DICTIONARY
         ============================================================ */
      var PHY_I18N = {
        zh: {
          title_practice: "出題練習",
          subtitle_practice: "隨機生成 HKDSE 風格物理題，即時作答、即時批改",
          title_formulas: "公式速查",
          subtitle_formulas: "HKDSE 物理科常用公式一覽",
          title_report: "學習報告",
          subtitle_report: "追蹤你的學習進度",
          title_library: "題型總覽",
          subtitle_library_1: "內建",
          subtitle_library_2: "個參數化模板",
          label_topic: "課題",
          label_difficulty: "難度",
          label_count: "題數",
          btn_generate: "生成題目",
          btn_export: "匯出報告",
          btn_clear: "清除記錄",
          btn_grade: "批改",
          btn_solution: "解答",
          btn_hint: "提示",
          stat_answered: "作答題數",
          stat_avg: "平均得分",
          stat_streak: "最高連勝",
          stat_time: "總練習時間",
          recent_records: "最近記錄",
          tab_practice: "練習",
          tab_formulas: "公式",
          tab_report: "報告",
          tab_library: "題庫",
          hint_label: "解題提示",
          sol_label: "參考解答",
          verdict_correct: "答對了！",
          verdict_wrong: "再試一次",
          expected_prefix: "正確答案：",
          marks_unit: "分",
          q_prefix: "第",
          q_suffix: "題",
          no_records: "暫無記錄，去練習頁開始吧！",
          placeholder_answer: "輸入你的答案...",
          placeholder_notes: "寫下你的解題思路（可選）...",
          notes_label: "筆記",
          alert_enter_answer: "請先輸入答案",
          confirm_clear: "確定清除所有記錄？此操作無法復原。",
          topic_all: "全部",
          topic_mech: "力學",
          topic_heat: "熱學",
          topic_wave: "波動",
          topic_em: "電磁",
          topic_rad: "放射",
          diff_basic: "基礎",
          diff_mid: "中等",
          diff_adv: "進階",
          tpl_count_suffix: "個模板",
          toast_correct: "太棒了！連勝",
          toast_wrong: "繼續加油！",
          toast_exported: "已匯出報告",
          toast_cleared: "記錄已清除",
          report_title: "PhyVerse 學習報告",
          report_total_attempts: "作答題數",
          report_avg: "平均得分",
          report_best_streak: "最高連勝",
          report_total_time: "總練習時間",
          report_recent: "最近記錄",
          report_min: " 分鐘",
          toast_no_data: "沒有可匯出的資料",
          toast_generated: "已生成題目",
          toast_no_topic: "此課題暫無題目",
          toast_fallback_diff: "此難度暫無題目，已顯示其他難度",
          time_sec: "秒",
          time_min: "分",
          formula_mech: "力學",
          formula_heat: "熱學",
          formula_wave: "波動",
          formula_em: "電磁",
          formula_rad: "放射與天文",
          lab_choice_practice: "練習題目",
          lab_choice_experiment: "實驗模擬器"
        },
        en: {
          title_practice: "Practice",
          subtitle_practice: "Random HKDSE-style problems with instant grading",
          title_formulas: "Formula Sheet",
          subtitle_formulas: "Common HKDSE Physics formulas",
          title_report: "Progress",
          subtitle_report: "Track your learning progress",
          title_library: "Question Types",
          subtitle_library_1: "Built-in",
          subtitle_library_2: "parameterized templates",
          label_topic: "Topic",
          label_difficulty: "Difficulty",
          label_count: "Count",
          btn_generate: "Generate",
          btn_export: "Export",
          btn_clear: "Clear",
          btn_grade: "Grade",
          btn_solution: "Solution",
          btn_hint: "Hint",
          stat_answered: "Answered",
          stat_avg: "Avg Score",
          stat_streak: "Best Streak",
          stat_time: "Total Time",
          recent_records: "Recent Records",
          tab_practice: "Practice",
          tab_formulas: "Formulas",
          tab_report: "Report",
          tab_library: "Library",
          hint_label: "Hint",
          sol_label: "Reference Solution",
          verdict_correct: "Correct!",
          verdict_wrong: "Try Again",
          expected_prefix: "Expected: ",
          marks_unit: "marks",
          q_prefix: "Q",
          q_suffix: "",
          no_records: "No records yet. Start practicing!",
          placeholder_answer: "Enter your answer...",
          placeholder_notes: "Note your approach (optional)...",
          notes_label: "Notes",
          alert_enter_answer: "Please enter an answer first",
          confirm_clear: "Clear all records? This cannot be undone.",
          topic_all: "All",
          topic_mech: "Mechanics",
          topic_heat: "Heat",
          topic_wave: "Waves",
          topic_em: "Electromagnetism",
          topic_rad: "Radioactivity",
          diff_basic: "Basic",
          diff_mid: "Mid",
          diff_adv: "Advanced",
          tpl_count_suffix: "templates",
          toast_correct: "Great! Streak",
          toast_wrong: "Keep going!",
          toast_exported: "Report exported",
          toast_cleared: "Records cleared",
          report_title: "PhyVerse Report",
          report_total_attempts: "Total Attempts",
          report_avg: "Average Score",
          report_best_streak: "Best Streak",
          report_total_time: "Total Time",
          report_recent: "Recent Attempts",
          report_min: " min",
          toast_no_data: "Nothing to export",
          toast_generated: "Questions generated",
          toast_no_topic: "No questions for this topic",
          toast_fallback_diff: "No questions at this difficulty. Showing other difficulties.",
          time_sec: "s",
          time_min: "m",
          formula_mech: "Mechanics",
          formula_heat: "Heat",
          formula_wave: "Waves",
          formula_em: "Electromagnetism",
          formula_rad: "Radioactivity & Astronomy",
          lab_choice_practice: "Practice",
          lab_choice_experiment: "Experiment Simulator"
        }
      };

      var PHY_LANG = "zh";

      function PHY_t(key) {
        var dict = PHY_I18N[PHY_LANG];
        if (dict && dict[key] !== undefined) { return dict[key]; }
        if (PHY_I18N.zh[key] !== undefined) { return PHY_I18N.zh[key]; }
        return key;
      }


/* ============================================================
   STATE
   ============================================================ */
var PHY_STATE = {
  topic: "all",
  diff: "all",
  qs: [],
  history: [],
  notes: {},
  timers: {},
  currentStreak: 0,
  bestStreak: 0,
  sessionStart: null
};
var PHY_LANG = "zh";

function PHY_loadState() {
  try { PHY_STATE.history = loadHistory(); } catch (e1) { PHY_STATE.history = []; }
  try { PHY_LANG = loadLang(); } catch (e2) {}
  try {
    var theme = loadTheme();
    if (theme) { document.documentElement.setAttribute("data-theme", theme); }
  } catch (e3) {}
  try { PHY_STATE.notes = loadNotes(); } catch (e4) { PHY_STATE.notes = {}; }
  try {
    var s = loadStreak();
    PHY_STATE.currentStreak = s.current || 0;
    PHY_STATE.bestStreak = s.best || 0;
  } catch (e5) {}
}

function PHY_saveHistory() { try { saveHistory(PHY_STATE.history); } catch (e) {} }
function PHY_saveLang() { try { saveLang(PHY_LANG); } catch (e) {} }
function PHY_saveNotes() { try { saveNotes(PHY_STATE.notes); } catch (e) {} }
function PHY_saveStreak() { try { saveStreak(PHY_STATE.currentStreak, PHY_STATE.bestStreak); } catch (e) {} }
function PHY_saveTheme(theme) { try { saveTheme(theme); } catch (e) {} }

/* ============================================================
   UTILITIES
   ============================================================ */
function PHY_$(id) { return document.getElementById(id); }
function PHY_fmtTime(sec) {
  if (sec < 60) { return sec + PHY_t("time_sec"); }
  var m = Math.floor(sec / 60);
  var s = sec % 60;
  return m + PHY_t("time_min") + " " + s + PHY_t("time_sec");
}
function PHY_esc(s) {
  var str = String(s);
  var out = "";
  for (var i = 0; i < str.length; i++) {
    var c = str.charAt(i);
    if (c === "&") { out += "&amp;"; }
    else if (c === "<") { out += "&lt;"; }
    else if (c === ">") { out += "&gt;"; }
    else if (c === '"') { out += "&quot;"; }
    else { out += c; }
  }
  return out;
}


      /* ============================================================
         THEME
         ============================================================ */
      function PHY_applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        var lightIcon = PHY_$("themeIconLight");
        var darkIcon = PHY_$("themeIconDark");
        if (lightIcon && darkIcon) {
          if (theme === "dark") {
            lightIcon.classList.add("hidden");
            darkIcon.classList.remove("hidden");
          } else {
            lightIcon.classList.remove("hidden");
            darkIcon.classList.add("hidden");
          }
        }
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute("content", theme === "dark" ? "#312e81" : "#4f46e5");
        }
      }

      function PHY_toggleTheme() {
        var current = document.documentElement.getAttribute("data-theme") || "light";
        var next = (current === "dark") ? "light" : "dark";
        PHY_applyTheme(next);
        PHY_saveTheme(next);
        if (window.PhyVerse) {
          window.PhyVerse.setTheme(next);
        }
      }

      /* ============================================================
         TOAST & CONFETTI
         ============================================================ */
      var PHY_toastTimer = null;

      function PHY_toast(msg, type) {
        var el = PHY_$("toast");
        if (!el) { return; }
        var icon = "";
        if (type === "success") {
          icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        } else if (type === "info") {
          icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        } else if (type === "warn") {
          icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        }
        el.innerHTML = icon + '<span>' + PHY_esc(msg) + '</span>';
        el.classList.add("show");
        if (PHY_toastTimer) { clearTimeout(PHY_toastTimer); }
        PHY_toastTimer = setTimeout(function () {
          el.classList.remove("show");
        }, 2200);
      }

      var PHY_confettiParticles = [];
      var PHY_confettiRAF = null;

      function PHY_launchConfetti() {
        var canvas = PHY_$("confettiCanvas");
        if (!canvas) { return; }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var colors = ["#4f46e5", "#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
        for (var i = 0; i < 60; i++) {
          PHY_confettiParticles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: Math.random() * -12 - 4,
            size: 6 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            vr: (Math.random() - 0.5) * 20,
            life: 1
          });
        }
        if (!PHY_confettiRAF) {
          PHY_confettiRAF = requestAnimationFrame(PHY_confettiStep);
        }
      }

      function PHY_confettiStep() {
        var canvas = PHY_$("confettiCanvas");
        if (!canvas) { return; }
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var alive = false;
        for (var i = 0; i < PHY_confettiParticles.length; i++) {
          var p = PHY_confettiParticles[i];
          if (p.life <= 0) { continue; }
          p.vy += 0.4;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.vr;
          p.life -= 0.012;
          if (p.y > canvas.height + 50) { p.life = 0; }
          if (p.life > 0) {
            alive = true;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
            ctx.restore();
          }
        }
        PHY_confettiParticles = PHY_confettiParticles.filter(function (p) { return p.life > 0; });
        if (alive) {
          PHY_confettiRAF = requestAnimationFrame(PHY_confettiStep);
        } else {
          PHY_confettiRAF = null;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      window.addEventListener("resize", function () {
        var canvas = PHY_$("confettiCanvas");
        if (canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
      });

      /* 暴露工具函數供其他 Part 呼叫 */
      window.PHY_toast = PHY_toast;
      window.PHY_launchConfetti = PHY_launchConfetti;

      /* ============================================================
         I18N APPLY & CHIPS BUILDERS
         ============================================================ */
      function PHY_applyI18n() {
        var els = document.querySelectorAll("[data-i18n]");
        for (var i = 0; i < els.length; i++) {
          var key = els[i].getAttribute("data-i18n");
          els[i].textContent = PHY_t(key);
        }
        var langBtn = PHY_$("langBtn");
        if (langBtn) {
          langBtn.textContent = (PHY_LANG === "en") ? "中文" : "EN";
        }
        document.documentElement.lang = (PHY_LANG === "en") ? "en" : "zh-HK";
      }

      function PHY_buildTopicChips() {
        var grid = PHY_$("topicGrid");
        if (!grid) { return; }
        grid.innerHTML = "";
        for (var i = 0; i < PHY_TOPICS.length; i++) {
          (function (topic) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chip";
            btn.textContent = PHY_t(topic.i18n_key);
            if (PHY_STATE.topic === topic.id) { btn.classList.add("selected"); }
            btn.addEventListener("click", function () {
              PHY_STATE.topic = topic.id;
              var all = grid.querySelectorAll(".chip");
              for (var k = 0; k < all.length; k++) { all[k].classList.remove("selected"); }
              btn.classList.add("selected");
            });
            grid.appendChild(btn);
          })(PHY_TOPICS[i]);
        }
      }

      function PHY_buildDiffChips() {
        var grid = PHY_$("diffGrid");
        if (!grid) { return; }
        grid.innerHTML = "";
        for (var i = 0; i < PHY_DIFFS.length; i++) {
          (function (diff) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chip";
            btn.textContent = PHY_t(diff.i18n_key);
            if (PHY_STATE.diff === diff.id) { btn.classList.add("selected"); }
            btn.addEventListener("click", function () {
              PHY_STATE.diff = diff.id;
              var all = grid.querySelectorAll(".chip");
              for (var k = 0; k < all.length; k++) { all[k].classList.remove("selected"); }
              btn.classList.add("selected");
            });
            grid.appendChild(btn);
          })(PHY_DIFFS[i]);
        }
      }


      /* ============================================================
         GENERATE & RENDER QUESTIONS
         ============================================================ */
      function PHY_generateQuestions() {
        var qCountEl = PHY_$("qCount");
        if (!qCountEl) { return; }
        var count = parseInt(qCountEl.value, 10);

        var out = generateQuestionSet({
          topic: PHY_STATE.topic,
          difficulty: PHY_STATE.diff,
          lang: PHY_LANG,
          count: count
        });
        if (out.empty) {
          PHY_toast(PHY_t("toast_no_topic"), "warn");
          return;
        }

        PHY_STATE.qs = out.qs;
        PHY_STATE.notes = {};
        PHY_STATE.timers = {};
        PHY_STATE.sessionStart = Date.now();
        PHY_renderQuestions();

        if (out.fallbackUsed) {
          PHY_toast(PHY_t("toast_fallback_diff"), "info");
        } else {
          PHY_toast(PHY_t("toast_generated") + " (" + count + ")", "info");
        }
      }

      function PHY_renderQuestions() {
        var area = PHY_$("questions");
        if (!area) { return; }
        area.innerHTML = "";
        if (PHY_STATE.qs.length === 0) { return; }

        for (var i = 0; i < PHY_STATE.qs.length; i++) {
          (function (q, idx) {
            var topicText = (PHY_LANG === "en") ? q.topic_en : q.topic_zh;
            var subText = (PHY_LANG === "en") ? q.subtopic_en : q.subtopic_zh;
            var qLabel = (PHY_LANG === "en") ? ("Q " + (idx + 1)) : ("第 " + (idx + 1) + " 題");
            var marksText = q.marks + " " + PHY_t("marks_unit");

            var div = document.createElement("div");
            div.className = "question";
            div.setAttribute("data-idx", idx);

            var head = document.createElement("div");
            head.className = "q-head";
            var badgesWrap = document.createElement("div");
            badgesWrap.className = "q-badges";
            var bNum = document.createElement("span");
            bNum.className = "badge-num";
            bNum.textContent = qLabel;
            var bTop = document.createElement("span");
            bTop.className = "badge-topic";
            bTop.textContent = topicText + " · " + subText;
            badgesWrap.appendChild(bNum);
            badgesWrap.appendChild(bTop);
            var bMarks = document.createElement("span");
            bMarks.className = "badge-marks";
            bMarks.textContent = marksText;
            head.appendChild(badgesWrap);
            head.appendChild(bMarks);
            div.appendChild(head);

            var timer = document.createElement("div");
            timer.className = "q-timer";
            timer.id = "timer-" + idx;
            timer.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span id="timerTxt-' + idx + '">0:00</span>';
            div.appendChild(timer);
            PHY_STATE.timers[idx] = { start: Date.now(), elapsed: 0, stopped: false };
            PHY_startTimer(idx);

            var qText = document.createElement("div");
            qText.className = "q-text";
            qText.textContent = q.q;
            div.appendChild(qText);

            var textarea = document.createElement("textarea");
            textarea.setAttribute("rows", "2");
            textarea.setAttribute("placeholder", PHY_t("placeholder_answer"));
            textarea.id = "ans-" + idx;
            div.appendChild(textarea);

            var notesLabel = document.createElement("label");
            notesLabel.className = "notes-label";
            notesLabel.textContent = PHY_t("notes_label");
            div.appendChild(notesLabel);

            var notesInput = document.createElement("textarea");
            notesInput.className = "notes-input";
            notesInput.setAttribute("rows", "2");
            notesInput.setAttribute("placeholder", PHY_t("placeholder_notes"));
            notesInput.id = "notes-" + idx;
            var savedNotes = PHY_STATE.notes[q.template_id];
            if (savedNotes) { notesInput.value = savedNotes; }
            notesInput.addEventListener("input", function () {
              PHY_STATE.notes[q.template_id] = notesInput.value;
              PHY_saveNotes();
            });
            div.appendChild(notesInput);

            var btnRow = document.createElement("div");
            btnRow.className = "btn-row";

            var gradeBtn = document.createElement("button");
            gradeBtn.type = "button";
            gradeBtn.className = "btn-grade";
            gradeBtn.setAttribute("data-idx", idx);
            gradeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>' + PHY_t("btn_grade") + '</span>';
            gradeBtn.addEventListener("click", function () { PHY_gradeQuestion(idx); });
            btnRow.appendChild(gradeBtn);

            var hintBtn = document.createElement("button");
            hintBtn.type = "button";
            hintBtn.className = "btn-hint";
            hintBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg><span>' + PHY_t("btn_hint") + '</span>';
            hintBtn.addEventListener("click", function () {
              var hintBox = PHY_$("hint-" + idx);
              if (hintBox) { hintBox.classList.toggle("show"); }
            });
            btnRow.appendChild(hintBtn);

            var solBtn = document.createElement("button");
            solBtn.type = "button";
            solBtn.className = "btn-sol";
            solBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span>' + PHY_t("btn_solution") + '</span>';
            solBtn.addEventListener("click", function () {
              var solEl = PHY_$("sol-" + idx);
              if (solEl) { solEl.classList.toggle("show"); }
            });
            btnRow.appendChild(solBtn);

            div.appendChild(btnRow);

            var hintBox = document.createElement("div");
            hintBox.className = "hint-box";
            hintBox.id = "hint-" + idx;
            var hintText = PHY_HINTS[q.template_id] || "Review the related formula.";
            hintBox.innerHTML = '<div class="hint-label">' + PHY_esc(PHY_t("hint_label")) + '</div>' + PHY_esc(hintText);
            div.appendChild(hintBox);

            var result = document.createElement("div");
            result.className = "result";
            result.id = "res-" + idx;
            div.appendChild(result);

            var sol = document.createElement("div");
            sol.className = "solution";
            sol.id = "sol-" + idx;
            var solLabel = document.createElement("div");
            solLabel.className = "sol-label";
            solLabel.textContent = PHY_t("sol_label");
            sol.appendChild(solLabel);
            var solContent = document.createElement("div");
            solContent.textContent = q.solution;
            sol.appendChild(solContent);
            div.appendChild(sol);

            area.appendChild(div);
          })(PHY_STATE.qs[i], i);
        }
      }


      /* ============================================================
         TIMER & GRADING
         ============================================================ */
      function PHY_startTimer(idx) {
        function tick() {
          var t = PHY_STATE.timers[idx];
          if (!t || t.stopped) { return; }
          var elapsed = Math.floor((Date.now() - t.start) / 1000);
          t.elapsed = elapsed;
          var m = Math.floor(elapsed / 60);
          var s = elapsed % 60;
          var txt = m + ":" + (s < 10 ? "0" : "") + s;
          var el = PHY_$("timerTxt-" + idx);
          if (el) { el.textContent = txt; }
          setTimeout(tick, 1000);
        }
        tick();
      }

      function PHY_stopTimer(idx) {
        var t = PHY_STATE.timers[idx];
        if (t) { t.stopped = true; }
      }

      function PHY_gradeQuestion(idx) {
        var q = PHY_STATE.qs[idx];
        if (!q) { return; }
        var ta = PHY_$("ans-" + idx);
        if (!ta) { return; }
        var text = ta.value.trim();
        if (!text) {
          PHY_toast(PHY_t("alert_enter_answer"), "info");
          return;
        }

        var hit = checkNumericAnswer(text, q.answer).hit;

        PHY_stopTimer(idx);
        var elapsed = PHY_STATE.timers[idx] ? PHY_STATE.timers[idx].elapsed : 0;
        var score = hit ? q.marks : 0;
        var pct = Math.round((score / q.marks) * 100);

        var res = PHY_$("res-" + idx);
        if (!res) { return; }

        var verdictClass = hit ? "correct" : "wrong";
        var verdictText = hit ? PHY_t("verdict_correct") : PHY_t("verdict_wrong");
        var ringColor = hit ? "var(--success)" : "var(--danger)";
        var circumference = 2 * Math.PI * 24;
        var dashArr = (pct / 100) * circumference;

        res.className = "result show " + verdictClass;
        res.innerHTML = "";

        var ringWrap = document.createElement("div");
        ringWrap.className = "score-ring-wrap";

        var ring = document.createElement("div");
        ring.className = "score-ring";
        ring.innerHTML = '<svg viewBox="0 0 56 56">'
          + '<circle class="ring-bg" cx="28" cy="28" r="24"/>'
          + '<circle class="ring-fg" cx="28" cy="28" r="24" stroke="' + ringColor + '" stroke-dasharray="' + dashArr + ' ' + circumference + '"/>'
          + '</svg>'
          + '<div class="ring-text" style="color: ' + ringColor + ';">' + pct + '%</div>';
        ringWrap.appendChild(ring);

        var meta = document.createElement("div");
        meta.className = "score-meta";
        var pts = document.createElement("div");
        pts.className = "score-pts";
        pts.textContent = score + " / " + q.marks;
        var msg = document.createElement("div");
        msg.className = "score-msg";
        msg.textContent = verdictText + " · " + elapsed + PHY_t("time_sec");
        meta.appendChild(pts);
        meta.appendChild(msg);
        ringWrap.appendChild(meta);

        res.appendChild(ringWrap);

        var expected = document.createElement("div");
        expected.className = "expected";
        expected.textContent = PHY_t("expected_prefix") + PHY_f2(q.answer) + " " + q.unit;
        res.appendChild(expected);

        if (hit) {
          PHY_STATE.currentStreak += 1;
          if (PHY_STATE.currentStreak > PHY_STATE.bestStreak) {
            PHY_STATE.bestStreak = PHY_STATE.currentStreak;
          }
          PHY_toast(PHY_t("toast_correct") + " " + PHY_STATE.currentStreak + "!", "success");
          PHY_launchConfetti();
          var streakBadge = PHY_$("streakBadge");
          if (streakBadge) {
            streakBadge.classList.add("pulse");
            setTimeout(function () { streakBadge.classList.remove("pulse"); }, 500);
          }
        } else {
          PHY_STATE.currentStreak = 0;
          PHY_toast(PHY_t("toast_wrong"), "info");
        }
        PHY_saveStreak();
        PHY_updateStreakBadge();

        PHY_STATE.history.push({
          topic_zh: q.topic_zh,
          topic_en: q.topic_en,
          score: score,
          total: q.marks,
          elapsed: elapsed,
          ts: Date.now()
        });
        PHY_saveHistory();
      }

      function PHY_updateStreakBadge() {
        var badge = PHY_$("streakBadge");
        var count = PHY_$("streakCount");
        if (!badge || !count) { return; }
        if (PHY_STATE.currentStreak > 0) {
          badge.classList.remove("hidden");
          count.textContent = PHY_STATE.currentStreak;
        } else {
          badge.classList.add("hidden");
        }
      }


      /* ============================================================
         REPORT, EXPORT, LIBRARY, FORMULAS, TABS
         ============================================================ */
      function PHY_renderReport() {
        var h = PHY_STATE.history;
        var totalEl = PHY_$("statTotal");
        var avgEl = PHY_$("statAvg");
        var streakEl = PHY_$("statStreak");
        var timeEl = PHY_$("statTime");
        if (!totalEl) { return; }

        totalEl.textContent = h.length;

        if (h.length > 0) {
          var sum = 0;
          var totalTime = 0;
          for (var i = 0; i < h.length; i++) {
            sum += (h[i].score / h[i].total) * 100;
            totalTime += (h[i].elapsed || 0);
          }
          avgEl.textContent = Math.round(sum / h.length) + "%";
          var totalMin = Math.round(totalTime / 60);
          timeEl.innerHTML = totalMin + '<span style="font-size:14px;">m</span>';
        } else {
          avgEl.textContent = "--";
          timeEl.innerHTML = '0<span style="font-size:14px;">m</span>';
        }

        streakEl.textContent = PHY_STATE.bestStreak;

        var list = PHY_$("history");
        if (!list) { return; }
        list.innerHTML = "";

        if (h.length === 0) {
          var empty = document.createElement("div");
          empty.className = "empty-msg";
          empty.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
            + '<span>' + PHY_esc(PHY_t("no_records")) + '</span>';
          list.appendChild(empty);
          return;
        }

        var recent = h.slice(-12).reverse();
        for (var j = 0; j < recent.length; j++) {
          (function (rec) {
            var topicName = (PHY_LANG === "en") ? rec.topic_en : rec.topic_zh;
            var pct = Math.round((rec.score / rec.total) * 100);
            var bgColor, fgColor;
            if (pct >= 70) { bgColor = "var(--success-light)"; fgColor = "var(--success)"; }
            else if (pct >= 40) { bgColor = "var(--warning-light)"; fgColor = "var(--warning)"; }
            else { bgColor = "var(--danger-light)"; fgColor = "var(--danger)"; }

            var row = document.createElement("div");
            row.className = "history-row";

            var topicSpan = document.createElement("span");
            topicSpan.className = "h-topic";
            var dot = document.createElement("span");
            dot.className = "h-dot";
            dot.style.background = fgColor;
            topicSpan.appendChild(dot);
            var nameSpan = document.createElement("span");
            nameSpan.textContent = topicName;
            topicSpan.appendChild(nameSpan);
            row.appendChild(topicSpan);

            var scoreSpan = document.createElement("span");
            scoreSpan.className = "h-score";
            scoreSpan.style.background = bgColor;
            scoreSpan.style.color = fgColor;
            scoreSpan.textContent = rec.score + " / " + rec.total;
            row.appendChild(scoreSpan);

            list.appendChild(row);
          })(recent[j]);
        }
      }

      function PHY_exportReport() {
        var h = PHY_STATE.history;
        if (h.length === 0) {
          PHY_toast(PHY_t("toast_no_data"), "info");
          return;
        }

        var text = buildReportText(h, PHY_STATE.bestStreak, PHY_LANG, PHY_t);
        try {
          var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "phyverse-report-" + Date.now() + ".txt";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          PHY_toast(PHY_t("toast_exported"), "success");
        } catch (e) {
          PHY_toast("Export failed", "info");
        }
      }

      function PHY_renderLibrary() {
        var countEl = PHY_$("tplCount");
        if (countEl) { countEl.textContent = PHY_TEMPLATES.length; }

        var container = PHY_$("libraryList");
        if (!container) { return; }
        container.innerHTML = "";

        var byTopic = {};
        for (var i = 0; i < PHY_TEMPLATES.length; i++) {
          var tpl = PHY_TEMPLATES[i];
          var key = (PHY_LANG === "en") ? tpl.topic_en : tpl.topic_zh;
          if (!byTopic[key]) { byTopic[key] = []; }
          var subKey = (PHY_LANG === "en") ? tpl.subtopic_en : tpl.subtopic_zh;
          byTopic[key].push(subKey);
        }

        var keys = Object.keys(byTopic);
        for (var k = 0; k < keys.length; k++) {
          var topic = keys[k];
          var subs = byTopic[topic];
          var card = document.createElement("div");
          card.className = "lib-card";

          var head = document.createElement("div");
          head.className = "lib-head";
          head.innerHTML = '<span class="lib-topic">' + PHY_esc(topic) + '</span>'
            + '<span class="lib-count">' + subs.length + ' ' + PHY_esc(PHY_t("tpl_count_suffix")) + '</span>';
          card.appendChild(head);

          var chips = document.createElement("div");
          chips.className = "lib-chips";
          for (var s = 0; s < subs.length; s++) {
            var chip = document.createElement("span");
            chip.className = "lib-chip";
            chip.textContent = subs[s];
            chips.appendChild(chip);
          }
          card.appendChild(chips);

          container.appendChild(card);
        }
      }

      function PHY_renderFormulas() {
        var container = PHY_$("formulaList");
        if (!container) { return; }
        container.innerHTML = "";

        for (var i = 0; i < PHY_FORMULAS.length; i++) {
          var group = PHY_FORMULAS[i];
          var card = document.createElement("div");
          card.className = "formula-group";

          var title = document.createElement("h3");
          title.textContent = PHY_t(group.group_key);
          card.appendChild(title);

          for (var j = 0; j < group.items.length; j++) {
            var item = group.items[j];
            var row = document.createElement("div");
            row.className = "formula-item";

            var eq = document.createElement("span");
            eq.className = "formula-eq";
            eq.textContent = item.eq;

            var desc = document.createElement("span");
            desc.className = "formula-desc";
            desc.textContent = (PHY_LANG === "en") ? item.en : item.zh;

            row.appendChild(eq);
            row.appendChild(desc);
            card.appendChild(row);
          }
          container.appendChild(card);
        }
      }

      function PHY_switchTab(name) {
        var panels = ["practice", "formulas", "report", "library", "leaderboard"];
        for (var i = 0; i < panels.length; i++) {
          var p = PHY_$("panel-" + panels[i]);
          if (!p) { continue; }
          if (panels[i] === name) {
            p.style.display = "";
            p.classList.add("active");
          } else {
            p.classList.remove("active");
          }
        }
        var btns = document.querySelectorAll(".tab-btn");
        for (var j = 0; j < btns.length; j++) {
          if (btns[j].getAttribute("data-tab") === name) { btns[j].classList.add("active"); }
          else { btns[j].classList.remove("active"); }
        }
        if (name === "report") { PHY_renderReport(); }
        if (name === "library") { PHY_renderLibrary(); }
        if (name === "formulas") { PHY_renderFormulas(); }
      }

      /* ============================================================
         LANGUAGE TOGGLE (含 window.PhyVerse.setLang 同步)
         ============================================================ */
      function PHY_toggleLang() {
        PHY_LANG = (PHY_LANG === "en") ? "zh" : "en";
        PHY_saveLang();
        PHY_applyI18n();
        PHY_buildTopicChips();
        PHY_buildDiffChips();

        if (PHY_STATE.qs.length > 0) {
          var oldCount = PHY_STATE.qs.length;
          var savedNotes = {};
          for (var n in PHY_STATE.notes) {
            if (Object.prototype.hasOwnProperty.call(PHY_STATE.notes, n)) {
              savedNotes[n] = PHY_STATE.notes[n];
            }
          }
          var qCountEl = PHY_$("qCount");
          if (qCountEl) { qCountEl.value = oldCount; }
          PHY_generateQuestions();
          for (var k in savedNotes) {
            if (Object.prototype.hasOwnProperty.call(savedNotes, k)) {
              PHY_STATE.notes[k] = savedNotes[k];
            }
          }
          PHY_saveNotes();
        }

        PHY_renderLibrary();
        PHY_renderFormulas();
        if (PHY_$("panel-report") && PHY_$("panel-report").classList.contains("active")) {
          PHY_renderReport();
        }

        if (window.PhyVerse) {
          window.PhyVerse.setLang(PHY_LANG === "en" ? "en" : "zh-HK");
        }
      }


      /* ============================================================
         INIT
         ============================================================ */
      export function initPractice() {
        PHY_mountDOM();
        PHY_loadState();

        var theme = document.documentElement.getAttribute("data-theme") || "light";
        PHY_applyTheme(theme);

        if (window.PhyVerse) {
          window.PhyVerse.lang = (PHY_LANG === "en") ? "en" : "zh-HK";
          window.PhyVerse.theme = theme;
        }

        PHY_applyI18n();
        PHY_buildTopicChips();
        PHY_buildDiffChips();
        PHY_renderLibrary();
        PHY_renderFormulas();
        PHY_updateStreakBadge();

        var qCount = PHY_$("qCount");
        if (qCount) {
          qCount.addEventListener("input", function () {
            var lbl = PHY_$("countLbl");
            if (lbl) { lbl.textContent = this.value; }
          });
        }

        var genBtn = PHY_$("genBtn");
        if (genBtn) {
          genBtn.addEventListener("click", PHY_generateQuestions);
        }

        var langBtn = PHY_$("langBtn");
        if (langBtn) {
          langBtn.addEventListener("click", PHY_toggleLang);
        }

        var themeBtn = PHY_$("themeBtn");
        if (themeBtn) {
          themeBtn.addEventListener("click", PHY_toggleTheme);
        }

        var exportBtn = PHY_$("exportBtn");
        if (exportBtn) {
          exportBtn.addEventListener("click", PHY_exportReport);
        }

        var clearBtn = PHY_$("clearBtn");
        if (clearBtn) {
          clearBtn.addEventListener("click", function () {
            if (!confirm(PHY_t("confirm_clear"))) { return; }
            PHY_STATE.history = [];
            PHY_STATE.currentStreak = 0;
            PHY_STATE.bestStreak = 0;
            PHY_saveHistory();
            PHY_saveStreak();
            PHY_updateStreakBadge();
            PHY_renderReport();
            PHY_toast(PHY_t("toast_cleared"), "info");
          });
        }

        var tabBtns = document.querySelectorAll(".tab-btn");
        for (var i = 0; i < tabBtns.length; i++) {
          (function (btn) {
            btn.addEventListener("click", function () {
              PHY_switchTab(btn.getAttribute("data-tab"));
            });
          })(tabBtns[i]);
        }

        if (PHY_STATE.qs.length > 0) {
          PHY_renderQuestions();
        }
      }


window.onerror = function (msg, url, line) {
  var banner = PHY_$("errorBanner");
  if (banner) {
    banner.classList.add("show");
    banner.textContent = "Error (line " + line + "): " + msg;
  }
  return false;
};

export { PHY_STATE, PHY_LANG };
