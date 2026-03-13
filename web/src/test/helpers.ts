import { NextRequest } from "next/server";

type JsonResponseBody = Awaited<ReturnType<Response["json"]>>;

function createJsonRequest(
  method: "POST" | "PUT" | "PATCH",
  url: string,
  body: Record<string, unknown>
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function createGetRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
  });
}

export function createDeleteRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "DELETE",
  });
}

export function createPostRequest(url: string, body: Record<string, unknown>): NextRequest {
  return createJsonRequest("POST", url, body);
}

export function createPutRequest(url: string, body: Record<string, unknown>): NextRequest {
  return createJsonRequest("PUT", url, body);
}

export function createPatchRequest(url: string, body: Record<string, unknown>): NextRequest {
  return createJsonRequest("PATCH", url, body);
}

export async function parseJsonResponse<T = JsonResponseBody>(
  res: Response
): Promise<{ status: number; body: T }> {
  const body = await res.json();
  return { status: res.status, body };
}
