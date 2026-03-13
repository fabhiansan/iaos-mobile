import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import type { Readable } from "stream";

const s3Client = new S3Client({
  region: process.env.STORAGE_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_S3_KEY || "",
    secretAccessKey: process.env.STORAGE_S3_SECRET || "",
  },
  ...(process.env.STORAGE_S3_ENDPOINT && {
    endpoint: process.env.STORAGE_S3_ENDPOINT,
    forcePathStyle: true,
  }),
});

const bucket = process.env.STORAGE_S3_BUCKET || "iaos-connect";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key } = await params;
    const s3Key = key.map(decodeURIComponent).join("/");

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const contentType = response.ContentType || "application/octet-stream";
    const etag = response.ETag;

    // Convert the S3 body stream to a web ReadableStream
    const nodeStream = response.Body as Readable;
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        nodeStream.on("end", () => {
          controller.close();
        });
        nodeStream.on("error", (err: Error) => {
          controller.error(err);
        });
      },
    });

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    };

    if (etag) {
      headers["ETag"] = etag;
    }

    return new NextResponse(webStream, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("NoSuchKey") || message.includes("not found")) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
