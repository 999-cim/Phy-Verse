# Batch 1 validation — experiments 01–05

Date: 2026-10-29 (HKT)

> Historical note: this batch was later re-checked against the public Deploy
> Preview. See `../final/REPORT.md` for the final 15/15 validation. The
> "ACCESS BLOCKED" row below records the first deploy attempt, before preview
> access was changed to Public.

## Scope

Migrated `boyle`, `charles`, `heatcap`, `latent`, `hooke`. The other ten
experiment definitions remain in `reference/test017.html` by design.

## Commands run

```bash
npm install
npm run build
npx vite preview --host 127.0.0.1 --port 5182
```

Build result:

```text
dist/index.html                   1.63 kB
dist/assets/index-*.css          58.62 kB
dist/assets/index-*.js          195.48 kB
dist/assets/three-*.js          521.72 kB
```

The separate `three-*.js` chunk confirms the manual chunk split. The remaining
warning is only Vite's default 500 kB chunk-size warning for the Three chunk.

## Checks

| Check | Result | Evidence |
|---|---|---|
| Production build | PASS | `vite build` exit 0 |
| Selector shows migrated experiments | PASS | 5 cards: boyle, charles, heatcap, latent, hooke |
| All five experiments open | PASS | each rendered `#three-canvas` at 780×880 in the 390×844 / DPR2 context |
| HUD parity | PASS | boyle / heatcap / latent / hooke exact at paused reset; charles exact after forcing the same `vars.T = 312` before reset (its reset does not reset T in either build) |
| Equipment / variables / graph labels | PASS | no diff against reference at the same state |
| Bridge object shape | PASS | same keys, including `renderSelector`; function arity 1/1/0/1/1/1/1 |
| Language switch | PASS | `phy_lang_v2=en`, `PhyVerse.lang=en`, HUD `Phase / solid / Ice melted`, lab back = `Back` |
| Theme switch | PASS | `phy_theme_v2=dark`, `data-theme=dark`, `PhyVerse.theme=dark`, dark 3D scene |
| localStorage keys | PASS | all 7 fixed keys plus `phyverse_exp_marks_boyle` exercised; no renamed key |
| Experiment marks key | PASS | `phyverse_exp_marks_boyle` written with 3 readings |
| Experiment score save | PASS | `phygenius_exp_scores_v1` entry written after submit |
| Leaderboard tab/modal | PASS | tab panel and `#p9LbBackdrop` both render the saved score |
| OCR local assets | PASS | `HELLO 123` at 95%; requests were `http://127.0.0.1:5182/ocr/*`; no jsDelivr/unpkg request |
| Three CDN removal | PASS | only `assets/three-*.js` requested |
| Netlify Deploy Preview | **DEPLOYED, ACCESS BLOCKED** | draft URL returns HTTP 401 / Netlify team-protection login redirect |
| dsh browser plugin | **UNAVAILABLE** | this session exposes no browser plugin; validation used Playwright 1.64.1 + CDP |

## HUD comparison detail

The automated comparison opens the reference (`127.0.0.1:5181/test017.html`)
and the migrated app (`127.0.0.1:5180/`), pauses the experiment, resets it, and
compares:

- `#hud .hud-row` text
- equipment list
- variable rows
- graph type options
- graph info / point count
- action button labels
- canvas dimensions

`boyle`, `heatcap`, `latent`, `hooke`: exact match.

`charles`: initial comparison differed by `V = 1.297 L` vs `1.295 L` because its
`reset()` does not reset `vars.T` and the two pages were paused at slightly
different temperatures. With `vars.T` fixed to 312 K before reset, both are
exactly:

```text
V     1.297 L
T     312 K
n     0.050 mol
P     100 kPa
V/T   4.157 mL/K
供應   12.0 V
```

## Storage/API evidence

Storage keys observed after a full interaction pass:

```text
phy_history_v2
phy_lang_v2
phy_notes_v2
phy_streak_v2
phy_theme_v2
phygenius_exp_scores_v1
phyverse_exp_last_v1
phyverse_exp_marks_boyle
```

Bridge arity:

```text
registerExperiment 1
openExperiment     1
closeExperiment    0
onLangChange       1
onThemeChange      1
setLang            1
setTheme           1
```

## Deploy Preview status

Netlify login and project link are now available. A draft deploy was created:

```text
Deploy URL: https://6ae36da1b89de32a8bcce6e5--phy-verse.netlify.app
Deploy ID:  6ae36da1b89de32a8bcce6e5
Admin:      https://app.netlify.com/projects/phy-verse/deploys/6ae36da1b89de32a8bcce6e5
```

The preview is currently protected by Netlify **team/private preview access**:

```text
HTTP/2 401
location: https://app.netlify.com/edge-access?domain=6ae36da1b89de32a8bcce6e5--phy-verse.netlify.app...
```

So the preview URL cannot be loaded by the validation browser yet. Production
`https://phy-verse.netlify.app` was checked and still reports the original 15
experiments, so the draft deploy did not replace production.

To unblock preview validation, use the Netlify dashboard (these settings have no
public API/CLI):

`https://app.netlify.com/projects/phy-verse/configuration/general/#project-visibility`

Set **Preview access** to **Public** (or set the project visibility to Public),
then repeat the checklist against the deploy URL. Do not send a password or
token in chat.
