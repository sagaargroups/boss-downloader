// ============================================
// Upstash Redis Cache — Serverless HTTP Redis
// ============================================

import { Redis } from "@upstash/redis";
import type { VideoInfo } from "@/types";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

// ---- Video Info Cache ----

export async function cacheVideoInfo(
  url: string,
  info: VideoInfo,
  ttl: number = 3600 // 1 hour
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `videoinfo:${Buffer.from(url).toString("base64")}`;
    await client.set(key, JSON.stringify(info), { ex: ttl });
  } catch (err) {
    console.warn("[Redis] Failed to cache video info:", err);
  }
}

export async function getCachedVideoInfo(
  url: string
): Promise<VideoInfo | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `videoinfo:${Buffer.from(url).toString("base64")}`;
    const cached = await client.get<string>(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("[Redis] Failed to get cached video info:", err);
    return null;
  }
}

// ---- Download Progress Cache ----

export async function cacheDownloadProgress(
  id: string,
  progress: {
    progress: number;
    speed: string | null;
    eta: string | null;
    status: string;
  }
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `progress:${id}`;
    await client.set(key, JSON.stringify(progress), { ex: 300 }); // 5 min TTL
  } catch (err) {
    console.warn("[Redis] Failed to cache progress:", err);
  }
}

export async function getCachedProgress(
  id: string
): Promise<{
  progress: number;
  speed: string | null;
  eta: string | null;
  status: string;
} | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `progress:${id}`;
    const cached = await client.get<string>(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("[Redis] Failed to get cached progress:", err);
    return null;
  }
}

// ---- Cache Management ----

export async function invalidateCache(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err) {
    console.warn("[Redis] Failed to invalidate cache:", err);
  }
}

export async function flushDownloadCache(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    // Scan and delete all download-related keys
    let cursor: number = 0;
    do {
      const result = await client.scan(cursor, {
        match: "progress:*",
        count: 100,
      });
      cursor = typeof result[0] === "string" ? parseInt(result[0], 10) : result[0];
      const keys = result[1] as string[];
      if (keys.length > 0) {
        await Promise.all(keys.map((k: string) => client.del(k)));
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn("[Redis] Failed to flush cache:", err);
  }
}

// ---- Health Check ----

export async function checkRedisConnection(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}
