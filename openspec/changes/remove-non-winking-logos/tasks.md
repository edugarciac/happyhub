## 1. Assets

- [x] 1.1 Regenerate `public/favicon.png` from `happyhub_logo_cara.png` on a 512×512 transparent canvas
- [x] 1.2 Point `og:image` in `_document.tsx` to `/happyhub_logo_white.png`
- [x] 1.3 Delete non-winking assets: `favicon.jpeg`, `favicon2.jpeg`, `happyhub_logo_white.jpg`, `logo-happyhub-white.jpeg`, `logo-happyhub-white-small.jpeg`, `src/logo/*`
- [x] 1.4 Delete identical `_old` duplicates

## 2. Verify

- [x] 2.1 Grep: no code references to deleted files
- [x] 2.2 Visual check of remaining logo assets (contact sheet)
- [ ] 2.3 `npm run build` passes (not run: no node_modules in session; change is a single string in `_document.tsx`)

## 3. HappyHub con H mayúscula

- [x] 3.1 Delete `public/logo-happyhub-black.jpeg` and `public/happyhub_home.png` (no references)
- [x] 3.2 Replace Hero video with `images/Happyhub_eventos_3.png`; delete `happyhub_coming.mp4` and `Happyhub-coming2026.jpeg`
- [x] 3.3 Preview Hero crop at 1440px and 390px (Playwright)
- [x] 3.4 Hero uses real venue photo `images/hero-sala.jpg` (user-provided), previewed at 1440px and 390px
- [x] 3.5 mis-eventos uses `hero-sala.jpg`; delete AI renders `images/Happyhub_eventos*.png`
