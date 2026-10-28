## 1. Dependencies

- [x] 1.1 Add `@vercel/blob`, remove `@aws-sdk/client-s3`

## 2. Upload

- [x] 2.1 Rewrite `/api/upload` as a `handleUpload` token route (admin only, folder allowlist, image types, 5 MB, random suffix)
- [x] 2.2 Rewrite `ImageUpload` to use `upload()` from `@vercel/blob/client`, with errors always clearing the uploading state

## 3. Display and delete

- [x] 3.1 `next.config.js`: `remotePatterns` for `**.public.blob.vercel-storage.com`; CSP `connect-src` adds `https://vercel.com`
- [x] 3.2 Service delete uses `del()` for Blob URLs; remove `src/lib/s3.ts`

## 4. Verification

- [x] 4.1 `tsc --noEmit`, lint and `next build` pass
- [ ] 4.2 Vercel: create a Blob store and connect it to `happyhub` (manual)
- [ ] 4.3 Production: upload a JPG and a PNG for a service; check `/admin/services` and `/servicios`
