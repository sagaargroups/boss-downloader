// ============================================
// useOffline Hook — Online/Offline Detection
// ============================================
"use client";

import { useState, useEffect, useCallback } from "react";

interface OfflineState {
  isOnline: boolean;
  isChecking: boolean;
  lastOnline: Date | null;
}

export function useOffline() {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isChecking: false,
    lastOnline: null,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkConnectivity = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      // Try to ping a fast endpoint
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/settings", {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      setState({
        isOnline: res.ok,
        isChecking: false,
        lastOnline: res.ok ? new Date() : state.lastOnline,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        isChecking: false,
      }));
    }
  }, [state.lastOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check every 30s
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  return {
    ...state,
    isOnline: isMounted ? state.isOnline : true,
    checkConnectivity,
  };
}
