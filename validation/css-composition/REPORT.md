# CSS composition of `dist/assets/index-*.css`

Generated: 2026-10-30 (HKT)

## Bundle measured

```text
dist/assets/index-BNQIEW_j.css
65,265 bytes (63.7 KiB), 12.46 kB gzip as reported by Vite
```

## Method

Direct CSS split, no config changes:

1. `npx vite build --minify false --outDir /tmp/phyverse-css-unmin`
   produces one readable CSS file with the same PostCSS/Tailwind pipeline and
   the same source order.
2. The unminified bundle is split at the start of each source section
   (verified by its first selector).
3. Every section is re-minified with esbuild's CSS minifier, the same minifier
   Vite uses for the production bundle.
4. Bytes are the minified UTF-8 byte lengths of each section.

The section boundaries are valid because the sum of the separately minified
sections is 65,272 B, only 7 B (0.01%) above the actual 65,265 B bundle. The
7-byte delta is whole-file minification across section boundaries. Percentages
below use the 65,272 B attributed total so they sum to 100%.

## Composition

| 来源 | 字节数 | 占比 |
|---|---:|---:|
| `phy-css` → `src/styles/base.css` | 18,307 | 28.047% |
| `phyexp-css` + `phy-bridge-css` → `src/styles/lab-theme.css` | 15,016 | 23.005% |
| `phy-ocr-css` → `src/styles/ocr.css` | 5,513 | 8.446% |
| `phy-lab-css` → `src/styles/lab.css` | 11,205 | 17.167% |
| `phy-lb-css` → `src/styles/leaderboard.css` | 2,179 | 3.338% |
| `phy-fix-css` + runtime bridgeFix → `src/styles/fixes.css` | 6,559 | 10.049% |
| **项目自定义 CSS 合计** | **58,779** | **90.052%** |
| `@tailwind base` (preflight) | 4,731 | 7.248% |
| `@tailwind components` | 0 | 0.000% |
| `@tailwind utilities` | 1,762 | 2.700% |
| **Tailwind 合计** | **6,493** | **9.948%** |
| **Attributed total** | **65,272** | **100.000%** |
| Actual bundle | 65,265 | — |

## 40 KB check

Tailwind total is **6,493 B**, and the utility layer alone is **1,762 B**.
Both are far below 40 KB, so the requested content/safelist audit is not
triggered.

For reference only (not changed):

- `tailwind.config.js` content is `./index.html` + `./src/**/*.{js,html}`.
- There is no `safelist` in the config.
- The generated utility layer is small; it contains a handful of incidental
  utility matches such as `.grid`, `.hidden`, `.rounded`, `.shadow`, `.ring`,
  `.filter` from the broad JavaScript scan, not a bulk safelist.

No configuration was modified for this analysis.
