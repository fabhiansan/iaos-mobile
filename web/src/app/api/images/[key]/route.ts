import { NextRequest, NextResponse } from "next/server";
import { getSignedDownloadUrl } from "@/lib/s3";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    const url = await getSignedDownloadUrl(decodedKey);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
