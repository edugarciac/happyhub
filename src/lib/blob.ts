import { del } from '@vercel/blob';

/**
 * Delete a Vercel Blob file by its URL. URLs from other hosts (e.g. old S3 links) are ignored.
 */
export async function deleteBlobImage(url: string): Promise<void> {
  if (!new URL(url).hostname.endsWith('.blob.vercel-storage.com')) return;
  await del(url);
}
