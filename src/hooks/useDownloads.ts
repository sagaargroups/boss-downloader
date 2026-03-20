// ============================================
// useDownloads Hook — Polling-based, no SSE
// ============================================
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useDownloadStore } from "@/store/downloadStore";
import type { Download } from "@/types";

export function useDownloads() {
  const {
    downloads,
    isLoading,
    error,
    setDownloads,
    setLoading,
    setError,
    setConnected,
  } = useDownloadStore();
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  // Fetch downloads from DB
  const fetchDownloads = useCallback(async () => {
    // Prevent overlapping fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      const res = await fetch("/api/queue");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDownloads(data.data || []);
          setConnected(true);
        }
      }
    } catch (err) {
      setError("Failed to fetch downloads");
      setConnected(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [setDownloads, setError, setConnected]);

  // Initial fetch + polling every 3 seconds for fresh data
  useEffect(() => {
    setLoading(true);
    fetchDownloads().finally(() => setLoading(false));

    // Poll every 3s — balanced for Supabase pooler
    pollTimerRef.current = setInterval(fetchDownloads, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchDownloads, setLoading]);

  return {
    downloads,
    isLoading,
    error,
    refetch: fetchDownloads,
  };
}
