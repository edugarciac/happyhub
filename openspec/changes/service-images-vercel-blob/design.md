## Context

`ImageUpload` (only used by `/admin/services`) reads the file as base64 and POSTs it to `/api/upload`, which calls `uploadToS3`. S3 is not configured on Vercel, the bucket is private and `next/image` does not allow its host.

## Decisions

### Vercel Blob instead of S3
Blob is native to Vercel: connecting a store injects `BLOB_READ_WRITE_TOKEN`, URLs are public and CDN-cached, and the Hobby plan includes free storage. S3 would need region, bucket, a public bucket policy and an IAM user kept alive only for this.

### Client upload (`@vercel/blob/client` `upload()` + `handleUpload()`)
The file goes straight from the browser to Blob. Our function only signs a token, so Vercel's 4.5 MB request body limit does not apply and photos from a phone (3–5 MB) work.
- Rejected: server `put()` with base64 body — would need a ~3 MB limit, too low for phone photos.

### Validation in `onBeforeGenerateToken`
- Admin session required (`requireAdminSession`).
- Pathname must start with an allowed folder (`services/`, `partners/`, `event-types/`, `reviews/`, `uploads/`, `custom-details/`).
- `allowedContentTypes`: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`. SVG excluded (can carry scripts).
- `maximumSizeInBytes`: 5 MB. `addRandomSuffix: true` so names never collide.
- No `onUploadCompleted`: the form saves the URL itself; this keeps the route admin-only (the completion webhook would come from Vercel without a session).

### Display
`next.config.js` gets `images.remotePatterns` for `**.public.blob.vercel-storage.com`; CSP `connect-src` adds `https://vercel.com` (Blob API). `img-src` already allows `https:`.

### Delete
On service delete, call `del(url)` only when the URL is a Blob URL; failure is non-fatal (logged), as today.

### Partners
`/admin/partners` keeps its own UI (small square preview, toast messages) and calls the same `upload()` with `partners/<name>`. `/api/admin/upload-partner-image` is removed. Partner delete calls `deleteBlobImage(logo_url)` (non-fatal); `/uploads/partners/...` URLs are ignored by it.

## Risks

- If the Blob store is not connected, token generation fails; the UI shows the server error instead of hanging.
- Old S3 URLs in `service_catalog.image_url` remain broken until re-uploaded.
