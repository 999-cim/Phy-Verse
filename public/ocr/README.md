# Local Tesseract assets

These files are copied from pinned npm packages so OCR never depends on a CDN.

- `worker.min.js` — tesseract.js 5.0.4
- `core/tesseract-core-lstm.wasm.js` — tesseract.js-core 5.0.0
- `core/tesseract-core-simd-lstm.wasm.js` — tesseract.js-core 5.0.0
- `lang-data/eng.traineddata.gz` — @tesseract.js-data/eng 1.0.0 (`4.0.0` set)
- `lang-data/chi_tra.traineddata.gz` — @tesseract.js-data/chi_tra 1.0.0 (`4.0.0` set)

Tesseract.js is Apache-2.0. The language data retains its upstream license.
