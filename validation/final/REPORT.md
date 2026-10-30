# Final validation — 15 / 15 experiments

Date: 2026-10-30 (HKT)

> This 15-experiment validation was run before the Tailwind Play CDN was
> replaced by Vite/PostCSS. The latest preview after that migration is
> https://6ae37522263ec6b5f1268cd8--phy-verse.netlify.app; the CSS visual parity
> checks are in `../tailwind/REPORT.md`.

## Deploy Preview

```text
URL:       https://6ae370d13348441aa8429f63--phy-verse.netlify.app
Deploy ID: 6ae370d13348441aa8429f63
Admin:     https://app.netlify.com/projects/phy-verse/deploys/6ae370d13348441aa8429f63
```

Netlify preview access was temporarily made public for validation. Production
`https://phy-verse.netlify.app` was **not** promoted and still reports the
original 15 experiments.

## Build

```text
dist/index.html                   1.62 kB
dist/assets/index-*.css          58.62 kB
dist/assets/index-*.js          256.20 kB
dist/assets/three-*.js          525.85 kB
```

The separate `three-*.js` chunk confirms the requested manual chunk split.
The only build warning is Vite's default >500 kB warning for the Three chunk.

## 15/15 experiment open test

All cards rendered from the final preview, and all 15 opened with a
`#three-canvas`:

`boyle`, `charles`, `heatcap`, `latent`, `hooke`, `ohm`, `snell`, `pendulum`,
`projectile`, `conduction`, `convection`, `radiation`, `greenhouse`, `wave`,
`dimension`.

No page errors, no HTTP >= 400 responses.

Canvas sizes: 780×880 for 14 experiments; 780×1220 for `dimension` (same
as the reference because of its taller layout).

## HUD parity

Reference: `reference/test017.html` served from a local HTTP origin, opened at
390×844 / DPR2. The migrated app was opened at the same viewport/DPR from the
Deploy Preview.

| Experiment | HUD / equipment / variables / graph labels |
|---|---|
| boyle | exact |
| charles | exact after fixing `vars.T=312` on both sides |
| heatcap | exact |
| latent | exact |
| hooke | exact |
| ohm | exact |
| snell | exact |
| pendulum | exact after fixing `angle=0.35`, `omega=0` on both sides |
| projectile | exact |
| conduction | exact |
| convection | exact |
| radiation | exact after fixing `Tblk=Tslv=293`, `t=0` on both sides |
| greenhouse | exact |
| wave | exact |
| dimension | exact |

The three normalizations are necessary because neither build's `reset()`
resets those particular time-dependent fields; the two pages were paused at
slightly different phases. They are test-state normalizations, not app changes.
Outside those fields every compared item was already identical.

The comparison covered:

- `#hud .hud-row` text
- equipment checkboxes
- variable slider rows
- graph type `<option>` labels
- graph info and point count
- lab action button labels
- canvas dimensions

## localStorage / bridge

All seven fixed keys plus the dynamic marks key were exercised:

```text
phy_history_v2
phygenius_exp_scores_v1
phy_notes_v2
phy_lang_v2
phy_theme_v2
phy_streak_v2
phyverse_exp_last_v1
phyverse_exp_marks_boyle
```

No renamed keys. The bridge still exposes the same methods and arity:

```text
registerExperiment 1
openExperiment     1
closeExperiment    0
onLangChange       1
onThemeChange      1
setLang            1
setTheme           1
```

`version`, `lang`, `theme`, `experiments`, `rawExp`, and `renderSelector` are
also retained.

## Language / theme

On the final preview:

- language toggle: `phy_lang_v2=en`, `PhyVerse.lang=en`, HUD changed from
  `狀態 / 固態 / 已熔化` to `Phase / solid / Ice melted`, lab back became `Back`.
- theme toggle: `phy_theme_v2=dark`, `PhyVerse.theme=dark`,
  `data-theme=dark`, dark lab shell/3D rendering.
- Reload persistence was also checked in the local production build.

## OCR

A generated image containing `HELLO 123` was recognised on the final preview:

```text
progress: 完成
text:     HELLO 123
confidence: 信心 高 (95%)
```

OCR requests were same-origin only:

```text
/ocr/worker.min.js
/ocr/core/tesseract-core-simd-lstm.wasm.js
/ocr/lang-data/eng.traineddata.gz
/ocr/lang-data/chi_tra.traineddata.gz
```

No jsDelivr or unpkg OCR request.

## Remaining limitations

- Tailwind remains on the CDN by requirement, so the whole page is not strictly
  offline; OCR/Tesseract itself is local.
- The final preview is a draft, not production. Promotion is a separate step.
- This session has no dsh browser-plugin entry point; validation used
  Playwright 1.64.1 + Chrome DevTools Protocol.

## Artifacts

- `selector-15.png` — 15-card selector
- `ohm-en-dark.png` — English + dark lab view
- `dimension.png` — experiment 15
- `batch1-hud.json`, `batch2-hud.json`, `batch3-hud.json` — raw HUD comparisons
- `build.log` — final Vite build
- `netlify-deploy.json` — final draft deploy metadata
