# Tailwind Play CDN → Vite PostCSS

Date: 2026-10-30 (HKT)

## Installed

```text
tailwindcss  3.4.19
postcss      8.5.32
autoprefixer 10.6.2
```

All are devDependencies. No UI framework or component library was added.

## Files changed

- `package.json` / `package-lock.json` — added the three devDependencies.
- `tailwind.config.js` — `content: ['./index.html', './src/**/*.{js,html}']`,
  selector-based dark mode, existing sans/mono font families, no plugins.
- `postcss.config.js` — `tailwindcss` + `autoprefixer`.
- `src/index.css` — `@tailwind base; @tailwind components; @tailwind utilities;`.
- `index.html` — removed `cdn.tailwindcss.com` and the inline
  `window.tailwind.config`; now references both local CSS entries.
- `src/styles/index.css` — unchanged custom CSS aggregate.

## CSS order

`index.html` intentionally loads the existing custom CSS **before** the compiled
Tailwind CSS:

```html
<link rel="stylesheet" href="/src/styles/index.css" />
<link rel="stylesheet" href="/src/index.css" />
```

This matches the previous Play CDN cascade: the CDN injected its preflight and
utilities after the custom styles. Reversing the order changed the inherited
`line-height` from 21px to 22.4px and produced visible layout differences.
With this order, the computed styles and screenshots are pixel-identical.

## Build

```text
dist/index.html                   1.11 kB
dist/assets/index-*.css          65.27 kB
dist/assets/index-*.js          256.20 kB
dist/assets/three-*.js          525.85 kB
```

`npm run build` exits 0. The existing >500 kB warning for the separate Three
chunk remains; no new warning or error.

The built CSS contains Tailwind's preflight and utilities; `.hidden` is present.
There are no `cdn.tailwindcss.com` references in `index.html`, `src/`, or the
configs.

## Visual parity

Before: final pre-migration Deploy Preview
(`6ae370d13348441aa8429f63--phy-verse.netlify.app`).
After: local production preview from the new `dist/`.

Animations were disabled and launcher particles hidden for both sides so only
layout/style was compared.

| Viewport / theme | Screens | Result |
|---|---|---|
| 390×844, DPR2, light | launcher, practice, selector, snell lab, launcher return | 0 differing pixels on all 5 |
| 1280×900, light | launcher, practice, selector, snell lab | 0 differing pixels on all 4 |
| 390×844, DPR2, dark | launcher, practice, selector, dark snell lab | 0 differing pixels |
| 390×844, DPR2, dark | latent lab | 2686 px / 0.204%; isolated HUD + thermometer animation (T 0.02 °C difference), not a CSS change |

Computed style comparison for body/header/cards/chips/buttons/lab headings also
reported no differences (font, size, weight, color, padding, radius, display,
box-sizing, line-height).

## CDN request check

Playwright request capture against the built app:

```text
tailwindCDN []
```

No request to `cdn.tailwindcss.com` or any Tailwind CDN asset. All 15
experiments still open with no console errors.

## Deploy Preview

A new draft deploy was uploaded after the migration:

```text
URL:       https://6ae37522263ec6b5f1268cd8--phy-verse.netlify.app
Deploy ID: 6ae37522263ec6b5f1268cd8
Admin:     https://app.netlify.com/projects/phy-verse/deploys/6ae37522263ec6b5f1268cd8
```

Preview response `HTTP 200`; 15 experiments present; body line-height 21px;
no Tailwind CDN requests. Production was not promoted.
