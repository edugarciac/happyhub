## 1. Dependencies

- [x] 1.1 Add `@vercel/blob`, remove `@aws-sdk/client-s3`

## 2. Upload

- [x] 2.1 Rewrite `/api/upload` as a `handleUpload` token route (admin only, folder allowlist, image types, 5 MB, random suffix)
- [x] 2.2 Rewrite `ImageUpload` to use `upload()` from `@vercel/blob/client`, with errors always clearing the uploading state

## 3. Display and delete

- [x] 3.1 `next.config.js`: `remotePatterns` for `**.public.blob.vercel-storage.com`; CSP `connect-src` adds `https://vercel.com`
- [x] 3.2 Service delete uses `del()` for Blob URLs; remove `src/lib/s3.ts`

## 4. Partners

- [x] 4.1 Add `partners` to the `/api/upload` folder allowlist
- [x] 4.2 `/admin/partners` uploads with `upload()` from `@vercel/blob/client`; remove `/api/admin/upload-partner-image`
- [x] 4.3 Partner delete removes its Blob image

## 5. OIDC

- [x] 5.1 Switch to `handleUploadPresigned` / `uploadPresigned` + `issueSignedToken` so uploads work with the OIDC store connection (`BLOB_STORE_ID`)

## 6. Verification

- [x] 6.1 `tsc --noEmit` and `next build` pass (ESLint is not configured in the repo)
- [x] 6.2 Vercel: create a Blob store and connect it to `happyhub` (manual)
- [ ] 6.3 Production: upload a JPG and a PNG for a service and a partner; check `/admin/services`, `/servicios`, `/admin/partners` and `/partners`
