// ============================================
// useProgress Hook — Single Download SSE
// ============================================
"use client";

import { useState, useEffect, useRef } from "react";
import type { SSEProgressEvent, DownloadStatus } from "@/types";

interface ProgressState {
  progress: number;
  speed: string | null;
  eta: string | null;
  status: DownloadStatus;
}

export function useProgress(downloadId?: string) {
  const [state, setState] = useState<ProgressState>({
    progress: 0,
    speed: null,
    eta: null,
    status: "queued",
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!downloadId) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `/api/progress?id=${downloadId}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: SSEProgressEvent = JSON.parse(event.data);
          if (data.downloadId === downloadId) {
            setState({
              progress: data.progress,
              speed: data.speed,
              eta: data.eta,
              status: data.status,
            });
            retryCountRef.current = 0; // Reset on success
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        retryCountRef.current++;

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          30000
        );
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [downloadId]);

  return state;
}
