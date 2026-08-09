## 1. Generate favicon.ico

- [x] 1.1 Install Pillow (`pip3 install Pillow`) — no image conversion tool was available in the environment
- [x] 1.2 Generate `public/favicon.ico` from `public/favicon.png` with sizes 16/32/48/64/128/256

## 2. Wire it up

- [x] 2.1 Add `<link rel="icon" href="/favicon.ico" sizes="any">` and `<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">` to `src/pages/_document.tsx`
- [x] 2.2 Keep the existing PNG `<link>` as fallback

## 3. Verify

- [x] 3.1 Confirm `public/favicon.ico` is a valid multi-icon `.ico` file (`file public/favicon.ico`)
- [ ] 3.2 Visually confirm the browser tab icon after deploy

## 4. Swap in official logo (user-provided)

- [x] 4.1 Merge `origin/main` to bring in `public/HappyHub_logo.ico`, uploaded directly by the user
- [x] 4.2 Replace `public/favicon.ico` with a copy of `public/HappyHub_logo.ico` (identical bytes), superseding the auto-generated version from task 1.2
