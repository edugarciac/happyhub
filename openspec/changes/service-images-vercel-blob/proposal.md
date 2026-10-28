## Why

Uploading a service image in `/admin/services` fails for every format. The upload goes through `/api/upload` to AWS S3, which no longer works after the move to Vercel:

- The Vercel project has the AWS keys but no `AWS_S3_REGION` (flagged "Missing AWS Region") and no working `AWS_S3_BUCKET`; the documented bucket `happyhub-assets-prod` does not exist.
- The S3 bucket is private and its host is not allowed by `next/image`, so even a successful upload would render as a broken image.
- The image travels as base64 in the request body, so anything above ~3.4 MB hits Vercel's 4.5 MB request limit, while the UI promises 5 MB. A non-JSON error leaves the button stuck on "Subiendo...".

## What Changes

- Store service images in **Vercel Blob** (public store connected to the project) instead of S3.
- The browser uploads the file directly to Blob (client upload); `/api/upload` only issues a short-lived upload token after checking the admin session, folder, content type and size. No file bytes pass through our function, so the 4.5 MB limit no longer applies.
- Allow `*.public.blob.vercel-storage.com` in `next/image` and `https://vercel.com` (Blob API) in the CSP `connect-src`.
- Deleting a service deletes its Blob image.
- Remove `src/lib/s3.ts` and `@aws-sdk/client-s3`.

## Capabilities

### New Capabilities
- `service-image-upload`: admins upload a JPG, PNG, WebP, GIF or AVIF image (max 5 MB) for a service and see it in the admin and on `/servicios`.

## Impact

- **Code**: `src/pages/api/upload.ts`, `src/components/admin/ImageUpload.tsx`, `src/pages/api/admin/services/[id].ts`, `next.config.js`, `package.json`; `src/lib/s3.ts` removed.
- **Infra (manual)**: create a Blob store in Vercel and connect it to `happyhub` (adds `BLOB_READ_WRITE_TOKEN`). After that the `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` variables are unused by the app.
- **Existing data**: services that already point to an S3 URL never displayed; they need their image re-uploaded.
- **Security**: `/api/upload` becomes admin-only (today any logged-in user can call it; only the admin uses it). SVG is no longer accepted.
