import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || '';

/**
 * Upload a base64-encoded file to S3.
 * Returns the public URL.
 */
export async function uploadToS3(
  base64Data: string,
  folder: string,
  originalName: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;

  const contentTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentTypeMap[ext] || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `https://${BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3 by its full URL.
 */
export async function deleteFromS3(url: string): Promise<void> {
  const urlObj = new URL(url);
  const key = urlObj.pathname.slice(1); // remove leading /
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
