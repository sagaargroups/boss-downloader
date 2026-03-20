// ============================================
// Settings Store — Zustand
// ============================================

import { create } from "zustand";
import type { AppSettings, EngineName, VideoQuality, OutputFormat } from "@/types";

interface SettingsState extends AppSettings {
  isLoaded: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => Promise<void>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultEngine: "ytdlp",
  defaultQuality: "best",
  defaultFormat: "mp4",
  downloadPath: "./downloads",
  maxConcurrent: 3,
  supabaseUrl: "",
  supabaseKey: "",
  redisUrl: "",
  redisToken: "",
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          set({ ...data.data, isLoaded: true });
        }
      }
    } catch (err) {
      console.warn("[Settings] Failed to load:", err);
      set({ isLoaded: true }); // Use defaults
    }
  },

  updateSetting: async (key, value) => {
    // Optimistic update
    set({ [key]: value } as Partial<SettingsState>);

    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    } catch (err) {
      console.warn("[Settings] Failed to save:", err);
    }
  },

  resetSettings: () => {
    set({ ...DEFAULT_SETTINGS });
  },
}));
