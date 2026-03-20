// ============================================
// API: SSE Progress Stream (Disabled — using polling instead)
// ============================================

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // SSE disabled — frontend uses polling via /api/queue every 3s
  // This prevents Supabase connection pool exhaustion
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": keepalive\n\n"));
      
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
