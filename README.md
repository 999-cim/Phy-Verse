# PhyVerse Vite

Vite + native ES modules migration of `test017.html`, without React/Vue.
Tailwind 3 is compiled locally by Vite + PostCSS; no Play CDN.

## Status

**All 15 experiments migrated and validated on a Netlify Deploy Preview.**

Final preview: https://6ae37522263ec6b5f1268cd8--phy-verse.netlify.app

Production `https://phy-verse.netlify.app` has not been promoted; it still
serves the original single-file app.

Deploy Preview access was temporarily made public for validation and can be
set back to private/team-only after review.

## Commands

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # dist/
npm run preview  # preview dist/
```

## Deploy

`netlify.toml` builds `npm run build` and publishes `dist/`.

```bash
npx netlify login
npx netlify deploy --build --dir dist
```

The final draft deploy is available at the URL above. Production promotion is a
separate command and has not been run.

## Constraints preserved

- Tailwind 3.4 is compiled via PostCSS (`tailwindcss`, `postcss`, `autoprefixer`);
  `cdn.tailwindcss.com` has been removed.
- `window.PhyVerse` API signatures are unchanged.
- localStorage keys are centralized in `src/core/storage.js` without renames:
  `phy_history_v2`, `phygenius_exp_scores_v1`, `phy_notes_v2`, `phy_lang_v2`,
  `phy_theme_v2`, `phy_streak_v2`, `phyverse_exp_last_v1`, plus the dynamic
  `phyverse_exp_marks_<id>` prefix.
- Experiment math/HUD/sidebar code is copied from the reference; only module
  imports and lifecycle registration changed.
- Tesseract worker/core/lang data are local in `public/ocr/`; OCR has no CDN
  dependency. Three and Tailwind are bundled locally too, so the app has no
  external runtime CDN dependency.

## Validation

See `validation/final/REPORT.md` for the 15-experiment migration validation and
`validation/tailwind/REPORT.md` for the Tailwind migration / visual parity.
