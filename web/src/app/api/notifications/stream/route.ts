import { auth } from "@/lib/auth";
import { notificationEmitter } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sseWriter = {
    write(chunk: string) {
      writer.write(encoder.encode(chunk)).catch(() => {});
    },
  };

  notificationEmitter.addConnection(userId, sseWriter);

  // Keepalive every 30s
  const keepaliveInterval = setInterval(() => {
    try {
      sseWriter.write(": keepalive\n\n");
    } catch {
      clearInterval(keepaliveInterval);
    }
  }, 30_000);

  // Send initial connection confirmation
  sseWriter.write(": connected\n\n");

  // Cleanup when client disconnects
  const cleanup = () => {
    clearInterval(keepaliveInterval);
    notificationEmitter.removeConnection(userId, sseWriter);
    writer.close().catch(() => {});
  };

  // Use a readable stream wrapper to detect client disconnect
  const monitoredStream = new ReadableStream({
    start(controller) {
      const reader = readable.getReader();
      const pump = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            cleanup();
            return;
          }
          controller.enqueue(value);
          pump();
        }).catch(() => {
          controller.close();
          cleanup();
        });
      };
      pump();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(monitoredStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
