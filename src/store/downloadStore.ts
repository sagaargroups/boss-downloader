// ============================================
// Download Store — Zustand Global State
// ============================================

import { create } from "zustand";
import type { Download, DownloadStatus } from "@/types";

interface DownloadState {
  downloads: Download[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;

  // Actions
  setDownloads: (downloads: Download[]) => void;
  addDownload: (download: Download) => void;
  updateDownload: (id: string, updates: Partial<Download>) => void;
  removeDownload: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  clearCompleted: () => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  isLoading: false,
  isConnected: true,
  error: null,

  setDownloads: (downloads) => set({ downloads }),

  addDownload: (download) =>
    set((state) => ({
      downloads: [download, ...state.downloads],
    })),

  updateDownload: (id, updates) =>
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    })),

  removeDownload: (id) =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setConnected: (isConnected) => set({ isConnected }),
  setError: (error) => set({ error }),

  clearCompleted: () =>
    set((state) => ({
      downloads: state.downloads.filter((d) => d.status !== "completed"),
    })),
}));

// ---- Selectors (use outside of components too) ----

export function getActiveDownloads(): Download[] {
  return useDownloadStore
    .getState()
    .downloads.filter(
      (d) => d.status === "downloading" || d.status === "paused"
    );
}

export function getQueuedDownloads(): Download[] {
  return useDownloadStore
    .getState()
    .downloads.filter((d) => d.status === "queued");
}

export function getCompletedDownloads(): Download[] {
  return useDownloadStore
    .getState()
    .downloads.filter((d) => d.status === "completed");
}

export function getFailedDownloads(): Download[] {
  return useDownloadStore
    .getState()
    .downloads.filter((d) => d.status === "failed");
}

export function getDownloadById(id: string): Download | undefined {
  return useDownloadStore
    .getState()
    .downloads.find((d) => d.id === id);
}
