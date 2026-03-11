import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.STORAGE_S3_REGION || "us-east-1",
  endpoint: process.env.STORAGE_S3_ENDPOINT || "http://localhost:9000",
  credentials: {
    accessKeyId: process.env.STORAGE_S3_KEY || "minioadmin",
    secretAccessKey: process.env.STORAGE_S3_SECRET || "minioadmin",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.STORAGE_S3_BUCKET || "iaos-connect";
const ROOT = process.env.STORAGE_S3_ROOT || "iaos-mobile";

export function getS3Key(folder: string, filename: string): string {
  return `${ROOT}/${folder}/${Date.now()}-${filename}`;
}

export async function uploadToS3(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
  return key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}

export async function deleteFromS3(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
