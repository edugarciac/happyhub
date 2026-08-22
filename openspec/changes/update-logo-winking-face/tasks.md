## 1. Edit logo assets (first pass — superseded, see section 3)

- [x] 1.1 Install Pillow locally for image editing (`pip3 install --user pillow`)
- [x] 1.2 Detect eye/mouth/star/dot coordinates per asset via color-based connected-component analysis
- [x] 1.3 Redraw an eye as a wink, remove duplicate dot, in the 4 assets
- [x] 1.4 Fix residual halo artifact from first edit pass (insufficient erase padding) and regenerate

## 2. Verify (first pass)

- [x] 2.1 Visual zoom review of each edited asset before replacing files in `public/`
- [x] 2.2 Browser check: header logo (`/`) shows winking face
- [x] 2.3 Browser check: footer logo shows a wink and a star

## 3. Correction pass (wrong eye, wrong wink curve, wrong star/dots — user feedback)

- [x] 3.1 Re-render reference PDF at 6x resolution with `pymupdf` and re-measure eye/star/dot geometry and exact colors
- [x] 3.2 Restore pristine originals via `git checkout` (tracked files); reconstruct `happyhub_logo-removebg-preview.png` from `happyhub_logo_white.png` (untracked, original was overwritten with no backup)
- [x] 3.3 Fix: wink on the RIGHT eye (not left), curved upward as an arc (not a downward valley)
- [x] 3.4 Fix: sparkle star with turquoise outline + white fill (not solid color), tuned against reference via side-by-side comparison
- [x] 3.5 Fix: two turquoise dots (not one, not coral), positioned via ratios measured from the reference
- [x] 3.6 Fix erase bug: eye erase was using page background color instead of face yellow, leaving a hole; switched to keep-mask erase (keep face-yellow/already-bg pixels, erase everything else) and erase-before-draw ordering to avoid clobbering the redrawn eye
- [x] 3.7 Apply to all 4 assets, verify visually and in browser (header + footer)
