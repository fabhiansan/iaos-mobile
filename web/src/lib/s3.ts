import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.STORAGE_S3_ENDPOINT,
  region: process.env.STORAGE_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_S3_KEY || "",
    secretAccessKey: process.env.STORAGE_S3_SECRET || "",
  },
  forcePathStyle: true,
});

const bucket = process.env.STORAGE_S3_BUCKET || "iaos-connect";
const root = process.env.STORAGE_S3_ROOT || "iaos-mobile";

export function getS3Key(folder: string, filename: string): string {
  return `${root}/${folder}/${Date.now()}-${filename}`;
}

export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
