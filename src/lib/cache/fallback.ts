// ============================================
// Three-Tier Cache Fallback
// ============================================
// Try Redis → IndexedDB → In-Memory Map

import {
  getCachedVideoInfo,
  cacheVideoInfo as redisCacheVideoInfo,
  checkRedisConnection,
} from "./redis";
import { db } from "../db/dexie";
import type { VideoInfo } from "@/types";

// In-memory fallback (last resort)
const memoryCache = new Map<string, { data: unknown; expiry: number }>();

// ---- Generic Three-Tier Get ----

export async function getCached<T>(key: string): Promise<T | null> {
  // Tier 1: Try Redis
  try {
    const redisOk = await checkRedisConnection();
    if (redisOk) {
      // For video info specifically
      if (key.startsWith("videoinfo:")) {
        const url = Buffer.from(
          key.replace("videoinfo:", ""),
          "base64"
        ).toString();
        const result = await getCachedVideoInfo(url);
        if (result) return result as T;
      }
    }
  } catch {
    // Redis unavailable, continue to next tier
  }

  // Tier 2: Try IndexedDB (Dexie)
  try {
    const localSettings = await db.settings.get(key);
    if (localSettings) return localSettings.value as T;
  } catch {
    // IndexedDB unavailable, continue to next tier
  }

  // Tier 3: In-memory Map
  const memItem = memoryCache.get(key);
  if (memItem && memItem.expiry > Date.now()) {
    return memItem.data as T;
  }

  return null;
}

// ---- Generic Three-Tier Set ----

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  // Always write to in-memory (guaranteed to work)
  memoryCache.set(key, {
    data: value,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  // Try Redis (primary)
  try {
    const redisOk = await checkRedisConnection();
    if (redisOk && key.startsWith("videoinfo:")) {
      const url = Buffer.from(
        key.replace("videoinfo:", ""),
        "base64"
      ).toString();
      await redisCacheVideoInfo(url, value as VideoInfo, ttlSeconds);
    }
  } catch {
    // Redis failed, data is still in memory + will try IndexedDB
  }

  // Try IndexedDB (secondary)
  try {
    await db.settings.put({
      key,
      value: value as unknown,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // IndexedDB failed, data is still in memory
  }
}

// ---- Clear in-memory cache ----

export function clearMemoryCache(): void {
  memoryCache.clear();
}

// ---- Get cache tier status ----

export async function getCacheTierStatus(): Promise<{
  redis: boolean;
  indexeddb: boolean;
  memory: boolean;
}> {
  let redisOk = false;
  let indexeddbOk = false;

  try {
    redisOk = await checkRedisConnection();
  } catch {
    /* noop */
  }

  try {
    await db.settings.count();
    indexeddbOk = true;
  } catch {
    /* noop */
  }

  return {
    redis: redisOk,
    indexeddb: indexeddbOk,
    memory: true, // always available
  };
}
