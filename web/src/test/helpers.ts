import { NextRequest } from "next/server";

export function createPostRequest(url: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function parseJsonResponse(res: Response): Promise<{ status: number; body: Record<string, unknown> }> {
  const body = await res.json();
  return { status: res.status, body };
}
