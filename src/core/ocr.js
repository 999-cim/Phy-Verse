import { createWorker, OEM } from 'tesseract.js';
import '../core/bridge.js';

/** OCR add-on: local Tesseract worker/core/lang assets only. */
      var PHY_OCR = {
        modal: null,
        currentTextareaId: null,
        lastResult: null,
        injectTimer: null
      };

      function phyOcrIsEn() { return document.documentElement.lang === "en"; }
      function phyOcrT(zh, en) { return phyOcrIsEn() ? en : zh; }

      /* 1. LOCAL TESSERACT ASSETS (no CDN) */
      const OCR_BASE = new URL((import.meta.env.BASE_URL || '/') + 'ocr/', window.location.origin);

      /* 2. BUILD MODAL */
      function phyOcrBuildModal() {
        if (PHY_OCR.modal) { return; }

        var backdrop = document.createElement("div");
        backdrop.className = "phy-modal-backdrop";
        backdrop.id = "phyOcrModal";

        var modal = document.createElement("div");
        modal.className = "phy-modal";

        var head = document.createElement("div");
        head.className = "phy-modal-head";
        head.innerHTML = ''
          + '<div class="phy-modal-title">'
          +   '<div class="phy-modal-title-icon">'
          +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
          +       '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>'
          +       '<circle cx="12" cy="13" r="4"/>'
          +     '</svg>'
          +   '</div>'
          +   '<span id="phyOcrTitle">' + phyOcrT("掃描手寫答案", "Scan Handwritten Answer") + '</span>'
          + '</div>'
          + '<button class="phy-modal-close" id="phyOcrClose" type="button">'
          +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
          +     '<line x1="18" y1="6" x2="6" y2="18"/>'
          +     '<line x1="6" y1="6" x2="18" y2="18"/>'
          +   '</svg>'
          + '</button>';
        modal.appendChild(head);

        var preview = document.createElement("img");
        preview.className = "phy-ocr-preview";
        preview.id = "phyOcrPreview";
        preview.alt = "Preview";
        preview.style.display = "none";
        modal.appendChild(preview);

        var progWrap = document.createElement("div");
        progWrap.className = "phy-progress-wrap";
        progWrap.id = "phyOcrProgressWrap";
        progWrap.innerHTML = ''
          + '<div class="phy-progress-label">'
          +   '<span id="phyOcrProgressText">準備中...</span>'
          +   '<span id="phyOcrProgressPct">0%</span>'
          + '</div>'
          + '<div class="phy-progress-bar">'
          +   '<div class="phy-progress-fill" id="phyOcrProgressFill"></div>'
          + '</div>';
        modal.appendChild(progWrap);

        /* 取消檔案選擇後仍可重新選圖（不必關閉再開） */
        var pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.id = "phyOcrPickBtn";
        pickBtn.className = "phy-btn-retry";
        pickBtn.textContent = phyOcrT("選擇圖片", "Choose image");
        pickBtn.style.marginTop = "10px";
        pickBtn.addEventListener("click", phyOcrPickFile);
        modal.appendChild(pickBtn);

        var resultWrap = document.createElement("div");
        resultWrap.id = "phyOcrResultWrap";
        resultWrap.style.display = "none";

        var label = document.createElement("div");
        label.className = "phy-ocr-label";
        label.innerHTML = '<span id="phyOcrResultLabel">' + phyOcrT("辨識結果（可修改）", "Recognised text (editable)") + '</span>'
          + '<span class="phy-ocr-confidence" id="phyOcrConfidence">--</span>';
        resultWrap.appendChild(label);

        var textarea = document.createElement("textarea");
        textarea.className = "phy-ocr-textarea";
        textarea.id = "phyOcrTextarea";
        textarea.setAttribute("placeholder", phyOcrT("辨識結果會顯示在這裡...", "Recognised text will appear here..."));
        resultWrap.appendChild(textarea);

        modal.appendChild(resultWrap);

        var actions = document.createElement("div");
        actions.className = "phy-modal-actions";
        actions.id = "phyOcrActions";
        actions.style.display = "none";
        actions.innerHTML = ''
          + '<button class="phy-btn-retry" id="phyOcrRetry" type="button">' + phyOcrT("重試", "Retry") + '</button>'
          + '<button class="phy-btn-apply" id="phyOcrApply" type="button">'
          +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">'
          +     '<polyline points="20 6 9 17 4 12"/>'
          +   '</svg>'
          +   '<span>' + phyOcrT("套用到答案", "Apply to answer") + '</span>'
          + '</button>';
        modal.appendChild(actions);

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        PHY_OCR.modal = backdrop;

        document.getElementById("phyOcrClose").addEventListener("click", phyOcrCloseModal);
        document.getElementById("phyOcrRetry").addEventListener("click", function () {
          phyOcrReset();
          phyOcrPickFile();
        });
        document.getElementById("phyOcrApply").addEventListener("click", phyOcrApplyResult);

        backdrop.addEventListener("click", function (e) {
          if (e.target === backdrop) { phyOcrCloseModal(); }
        });

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && backdrop.classList.contains("show")) {
            phyOcrCloseModal();
          }
        });
      }

      function phyOcrOpenModal(textareaId) {
        phyOcrBuildModal();
        PHY_OCR.currentTextareaId = textareaId;
        phyOcrReset();
        PHY_OCR.modal.classList.add("show");
        /* 由使用者的點擊直接觸發，避免瀏覽器攔截非手勢的 file picker */
        phyOcrPickFile();
      }

      function phyOcrCloseModal() {
        if (PHY_OCR.modal) { PHY_OCR.modal.classList.remove("show"); }
        PHY_OCR.currentTextareaId = null;
        PHY_OCR.lastResult = null;
      }

      function phyOcrReset() {
        var preview = document.getElementById("phyOcrPreview");
        var resultWrap = document.getElementById("phyOcrResultWrap");
        var actions = document.getElementById("phyOcrActions");
        var progWrap = document.getElementById("phyOcrProgressWrap");
        if (preview) { preview.style.display = "none"; preview.src = ""; }
        if (resultWrap) { resultWrap.style.display = "none"; }
        if (actions) { actions.style.display = "none"; }
        if (progWrap) { progWrap.style.display = "block"; }
        var txt = document.getElementById("phyOcrTextarea");
        if (txt) { txt.value = ""; }
        var apply = document.getElementById("phyOcrApply");
        if (apply) { apply.disabled = false; }
        phyOcrUpdateProgress(phyOcrT("準備中...", "Preparing..."), 0);
        PHY_OCR.lastResult = null;
      }

      /* 3. FILE PICKER */
      function phyOcrPickFile() {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";
        input.addEventListener("change", function () {
          var f = input.files[0];
          if (f) { phyOcrProcessImage(f); }
          if (input.parentNode) { input.parentNode.removeChild(input); }
        });
        document.body.appendChild(input);
        input.click();
      }

      function phyOcrProcessImage(file) {
        if (!file.type.match(/^image\//)) {
          alert(phyOcrT("請選擇圖片檔案", "Please choose an image file"));
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(phyOcrT("圖片過大（上限 10 MB）", "Image is too large (max 10 MB)"));
          return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
          var dataUrl = e.target.result;
          var preview = document.getElementById("phyOcrPreview");
          if (preview) {
            preview.src = dataUrl;
            preview.style.display = "block";
          }
          phyOcrRunRecognition(dataUrl);
        };
        reader.onerror = function () {
          alert(phyOcrT("讀取圖片失敗", "Could not read the image"));
        };
        reader.readAsDataURL(file);
      }

      /* 4. RECOGNITION */
      function phyOcrUpdateProgress(text, pct) {
        var txt = document.getElementById("phyOcrProgressText");
        var pctEl = document.getElementById("phyOcrProgressPct");
        var fill = document.getElementById("phyOcrProgressFill");
        if (txt) { txt.textContent = text; }
        if (pctEl) { pctEl.textContent = Math.round(pct) + "%"; }
        if (fill) { fill.style.width = pct + "%"; }
      }

      async function phyOcrRunRecognition(dataUrl) {
        phyOcrUpdateProgress(phyOcrT("載入 OCR 引擎...", "Loading OCR engine..."), 5);
        var worker = null;
        try {
          phyOcrUpdateProgress(phyOcrT("初始化辨識器...", "Initialising recogniser..."), 12);
          worker = await createWorker('eng+chi_tra', OEM.LSTM_ONLY, {
            workerPath: new URL('worker.min.js', OCR_BASE).href,
            corePath: new URL('core/', OCR_BASE).href,
            langPath: new URL('lang-data/', OCR_BASE).href,
            workerBlobURL: false,
            logger: function (m) {
              if (m.status === "loading tesseract core") {
                phyOcrUpdateProgress(phyOcrT("載入核心...", "Loading core..."), 20);
              } else if (m.status === "initializing tesseract") {
                phyOcrUpdateProgress(phyOcrT("初始化中...", "Initialising..."), 30);
              } else if (m.status === "loading language traineddata") {
                phyOcrUpdateProgress(phyOcrT("載入語言包...", "Loading language data..."), 30 + (m.progress || 0) * 30);
              } else if (m.status === "initializing api") {
                phyOcrUpdateProgress(phyOcrT("準備 API...", "Preparing API..."), 65);
              } else if (m.status === "recognizing text") {
                phyOcrUpdateProgress(phyOcrT("辨識中...", "Recognising..."), 65 + (m.progress || 0) * 35);
              }
            }
          });

          var result = await worker.recognize(dataUrl);
          phyOcrUpdateProgress(phyOcrT("完成", "Done"), 100);
          var text = "";
          var confidence = 0;
          if (result && result.data) {
            text = (result.data.text || "").trim();
            confidence = result.data.confidence || 0;
          }
          PHY_OCR.lastResult = { text: text, confidence: confidence };
          phyOcrShowResult(text, confidence);
        } catch (err) {
          phyOcrUpdateProgress(phyOcrT("失敗：", "Failed: ") + ((err && err.message) || "Unknown error"), 100);
          var actions = document.getElementById("phyOcrActions");
          if (actions) { actions.style.display = "flex"; }
          var resultWrap = document.getElementById("phyOcrResultWrap");
          if (resultWrap) { resultWrap.style.display = "block"; }
          var txt = document.getElementById("phyOcrTextarea");
          if (txt) {
            txt.value = phyOcrT("（辨識失敗）\n\n" + ((err && err.message) || "") + "\n\n請確認網絡連線，或手動輸入答案。",
                                "(Recognition failed)\n\n" + ((err && err.message) || "") + "\n\nCheck your connection, or type the answer manually.");
          }
          var retry = document.getElementById("phyOcrRetry");
          if (retry) { retry.textContent = "重試"; }
          var apply = document.getElementById("phyOcrApply");
          if (apply) { apply.disabled = true; }
        } finally {
          if (worker) {
            try { await worker.terminate(); } catch (e) {}
          }
        }
      }

      function phyOcrShowResult(text, confidence) {
        var progWrap = document.getElementById("phyOcrProgressWrap");
        if (progWrap) { progWrap.style.display = "none"; }

        var resultWrap = document.getElementById("phyOcrResultWrap");
        if (resultWrap) { resultWrap.style.display = "block"; }

        var actions = document.getElementById("phyOcrActions");
        if (actions) { actions.style.display = "flex"; }

        var apply = document.getElementById("phyOcrApply");
        if (apply) { apply.disabled = false; }

        var txt = document.getElementById("phyOcrTextarea");
        if (txt) { txt.value = text || phyOcrT("（未辨識到文字）", "(No text recognised)"); }

        var conf = document.getElementById("phyOcrConfidence");
        if (conf) {
          var level = "low";
          var isEn = phyOcrIsEn();
          var label = isEn ? "low" : "低";
          if (confidence >= 75) { level = "high"; label = isEn ? "high" : "高"; }
          else if (confidence >= 50) { level = "medium"; label = isEn ? "medium" : "中"; }
          conf.className = "phy-ocr-confidence " + level;
          conf.textContent = (isEn ? "Confidence " + label : "信心 " + label) + " (" + Math.round(confidence) + "%)";
        }
      }

      /* 5. APPLY + ADVICE */
      function phyOcrApplyResult() {
        if (!PHY_OCR.currentTextareaId) { return; }
        var target = document.getElementById(PHY_OCR.currentTextareaId);
        var ocrText = document.getElementById("phyOcrTextarea");
        if (!target || !ocrText) { return; }

        target.value = ocrText.value;
        target.focus();

        var advice = phyOcrGenerateAdvice(ocrText.value);
        phyOcrShowAdvice(advice);

        var card = target.closest(".question");
        if (card) {
          var gradeBtn = card.querySelector(".btn-grade");
          if (gradeBtn) {
            setTimeout(function () {
              gradeBtn.click();
            }, 350);
          }
        }

        var scanBtn = document.querySelector('.phy-scan-btn[data-ans="' + PHY_OCR.currentTextareaId + '"]');
        if (scanBtn) {
          var span = scanBtn.querySelector("span");
          if (span) {
            var isEn = (document.documentElement.lang === "en");
            span.textContent = isEn ? "Scan again" : "重新掃描";
          }
        }

        phyOcrCloseModal();
      }

      /* 6. ADVICE ENGINE */
      function phyOcrGenerateAdvice(text) {
        var en = phyOcrIsEn();
        var advice = [];
        if (!text || text.trim().length === 0) {
          advice.push(en
            ? "No text was recognised. Check the lighting and make the handwriting clearer."
            : "未辨識到任何文字。請確認照片光線充足、字跡清晰。");
          return advice;
        }

        var t = text;
        var numMatches = t.match(/-?\d+\.?\d*/g) || [];
        if (numMatches.length === 0) {
          advice.push(en
            ? "No numerical answer was detected. Calculation questions normally need a final value."
            : "未偵測到數值答案。計算題通常需要一個最終數值。");
        } else if (numMatches.length === 1) {
          advice.push(en
            ? "Only 1 numerical value was found. For multi-step calculations, write down the intermediate steps so you can check them."
            : "找到 1 個數值。若為多步計算，建議寫下中間步驟，方便自己檢查。");
        } else {
          advice.push(en
            ? "Found " + numMatches.length + " numerical values — it looks like you wrote out the calculation steps. Good."
            : "找到 " + numMatches.length + " 個數值，看起來有寫出計算步驟，很好。");
        }

        var unitPatterns = [
          /\b(m\/s|ms-?1|m s-?1|m\/s2|m s-?2)\b/i,
          /\b(kg|g|km)\b/i,
          /\b(N|J|W|V|A|Pa|Hz|MeV|ohm|C|T)\b/i,
          /\b(degC|K)\b/i,
          /\b(年|天|秒|分|個|years?|days?|sec|minutes?)\b/
        ];
        var hasUnit = false;
        for (var i = 0; i < unitPatterns.length; i++) {
          if (unitPatterns[i].test(t)) { hasUnit = true; break; }
        }
        if (numMatches.length > 0 && !hasUnit) {
          advice.push(en
            ? "A value was found, but no unit is visible. Add the correct unit after the answer (e.g. N, J, m s-1)."
            : "找到了數值，但看不到單位。記得在答案後加上正確單位（如 N、J、m s-1）。");
        } else if (hasUnit) {
          advice.push(en ? "Units are shown — good." : "有標示單位，很好。");
        }

        var hasEquals = /[=＝]/.test(t);
        var hasFormulaHint = /\b(sqrt|sin|cos|tan|log|pi)\b/i.test(t)
          || /[a-z]\s*=\s*[a-z0-9]/i.test(t)
          || /[×xX\*\+\/\-]\s*\d/.test(t);
        if (!hasEquals && !hasFormulaHint && numMatches.length > 0) {
          advice.push(en
            ? "Only a value is visible — no formula. HKDSE awards method marks for showing the equation, even if the final answer is right."
            : "只看到數值，看不到公式。即使答案正確，DSE 也需要寫出公式才可獲步驟分。");
        } else if (hasEquals && hasFormulaHint) {
          advice.push(en
            ? "The formula and substitution steps are shown, matching HKDSE marking expectations."
            : "有寫出公式與代入步驟，符合 DSE 評分要求。");
        }

        var wordCount = t.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
        if (wordCount < 3 && numMatches.length <= 1) {
          advice.push(en
            ? "The answer is quite short. If you have time, add one or two more derivation steps."
            : "答案偏短。若有時間，建議多寫一兩步推導。");
        }

        var digitsOnly = /^[\d\s\.\-\+\=\×\*\/\(\)]+$/.test(t);
        if (digitsOnly) {
          advice.push(en
            ? "The answer seems to contain only numbers and symbols — add the physical quantity name or formula."
            : "答案似乎只有數字與符號，缺少物理量名稱或公式。");
        }

        if (PHY_OCR.lastResult && PHY_OCR.lastResult.confidence < 60) {
          advice.push(en
            ? "OCR confidence is low. Please check the recognised text by hand before submitting."
            : "OCR 辨識信心偏低，請人手核對答案框內容是否正確。");
        }

        if (advice.length === 0) {
          advice.push(en
            ? "The answer format looks complete. Compare the value with the reference solution."
            : "作答格式看起來完整，請對照參考答案檢查數值。");
        }

        return advice;
      }

      function phyOcrShowAdvice(adviceList) {
        var old = document.querySelectorAll(".phy-advice-box");
        for (var i = 0; i < old.length; i++) {
          if (old[i].parentNode) {
            old[i].parentNode.removeChild(old[i]);
          }
        }
        if (!adviceList || adviceList.length === 0) { return; }

        var target = document.getElementById(PHY_OCR.currentTextareaId);
        if (!target) { return; }
        var card = target.closest(".question");
        if (!card) { return; }

        var isEn = (document.documentElement.lang === "en");
        var box = document.createElement("div");
        box.className = "phy-advice-box";
        var listItems = "";
        for (var j = 0; j < adviceList.length; j++) {
          listItems += "<li>" + adviceList[j] + "</li>";
        }
        box.innerHTML = ''
          + '<div class="phy-advice-head">'
          +   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
          +     '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'
          +   '</svg>'
          +   '<span>' + (isEn ? "AI Suggestion" : "AI 建議") + '</span>'
          + '</div>'
          + '<ul class="phy-advice-list">' + listItems + '</ul>';

        var result = card.querySelector(".result");
        if (result && result.parentNode) {
          result.parentNode.insertBefore(box, result.nextSibling);
        } else {
          var btnRow = card.querySelector(".btn-row");
          if (btnRow && btnRow.parentNode) {
            btnRow.parentNode.insertBefore(box, btnRow.nextSibling);
          } else {
            card.appendChild(box);
          }
        }
      }

      /* 7. INJECT SCAN BUTTONS */
      function phyOcrInjectScanButtons() {
        var cards = document.querySelectorAll(".question");
        var isEn = (document.documentElement.lang === "en");
        for (var i = 0; i < cards.length; i++) {
          var card = cards[i];
          if (card.getAttribute("data-phy-ocr") === "1") { continue; }

          var textarea = card.querySelector('textarea[id^="ans-"]');
          if (!textarea) { continue; }

          var scanRow = document.createElement("div");
          scanRow.className = "phy-scan-row";

          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "phy-scan-btn";
          btn.setAttribute("data-ans", textarea.id);
          btn.innerHTML = ''
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
            +   '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>'
            +   '<circle cx="12" cy="13" r="4"/>'
            + '</svg>'
            + '<span>' + (isEn ? "Scan handwritten answer" : "掃描手寫答案") + '</span>';

          btn.addEventListener("click", function () {
            var ansId = this.getAttribute("data-ans");
            phyOcrOpenModal(ansId);
          });

          scanRow.appendChild(btn);

          if (textarea.parentNode) {
            textarea.parentNode.insertBefore(scanRow, textarea);
          }

          card.setAttribute("data-phy-ocr", "1");
        }
      }

      /* 8. LANGUAGE HOOK */
      function phyOcrUpdateLanguage() {
        var lang = document.documentElement.lang;
        var isEn = (lang === "en");

        var btns = document.querySelectorAll(".phy-scan-btn span");
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].textContent.indexOf("掃描") !== -1 || btns[i].textContent.indexOf("Scan") !== -1) {
            btns[i].textContent = isEn ? "Scan handwritten answer" : "掃描手寫答案";
          } else {
            btns[i].textContent = isEn ? "Scan again" : "重新掃描";
          }
        }

        var title = document.getElementById("phyOcrTitle");
        if (title) { title.textContent = isEn ? "Scan Handwritten Answer" : "掃描手寫答案"; }

        var rl = document.getElementById("phyOcrResultLabel");
        if (rl) { rl.textContent = isEn ? "Result (editable)" : "辨識結果（可修改）"; }

        var applySpan = document.querySelector("#phyOcrApply span");
        if (applySpan) { applySpan.textContent = isEn ? "Apply to Answer" : "套用到答案"; }

        var retry = document.getElementById("phyOcrRetry");
        if (retry) { retry.textContent = isEn ? "Retry" : "重試"; }

        var pick = document.getElementById("phyOcrPickBtn");
        if (pick) { pick.textContent = isEn ? "Choose image" : "選擇圖片"; }

        var ocrTa = document.getElementById("phyOcrTextarea");
        if (ocrTa) {
          ocrTa.setAttribute("placeholder", isEn ? "Recognised text will appear here..." : "辨識結果會顯示在這裡...");
        }

        var adviceHeads = document.querySelectorAll(".phy-advice-head span");
        for (var j = 0; j < adviceHeads.length; j++) {
          adviceHeads[j].textContent = isEn ? "AI Suggestion" : "AI 建議";
        }
      }

      /* 9. MUTATION OBSERVER */
      function phyOcrStartObserver() {
        phyOcrInjectScanButtons();

        var observer = new MutationObserver(function (mutations) {
          var needsInject = false;
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === "childList" && m.addedNodes.length > 0) {
              for (var j = 0; j < m.addedNodes.length; j++) {
                var node = m.addedNodes[j];
                if (node.nodeType === 1) {
                  if (node.classList && node.classList.contains("question")) {
                    needsInject = true;
                  } else if (node.querySelector && node.querySelector(".question")) {
                    needsInject = true;
                  }
                }
              }
            }
          }
          if (needsInject) {
            if (PHY_OCR.injectTimer) { clearTimeout(PHY_OCR.injectTimer); }
            PHY_OCR.injectTimer = setTimeout(function () {
              phyOcrInjectScanButtons();
            }, 60);
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      }

      /* 10. HOOK INTO LANGUAGE BUTTON & PHYVERSE BRIDGE */
      function phyOcrHookLangButton() {
        var langBtn = document.getElementById("langBtn");
        if (langBtn) {
          langBtn.addEventListener("click", function () {
            setTimeout(phyOcrUpdateLanguage, 100);
          });
        }
        if (window.PhyVerse && typeof window.PhyVerse.onLangChange === "function") {
          window.PhyVerse.onLangChange(function () {
            setTimeout(phyOcrUpdateLanguage, 50);
          });
        }
      }

      /* 11. INIT */
      export function initOcr() {
        phyOcrBuildModal();
        phyOcrStartObserver();
        phyOcrHookLangButton();
        setTimeout(phyOcrUpdateLanguage, 200);
        console.log("[PhyVerse OCR] Add-on v2.1 ready");
      }

export { PHY_OCR };
