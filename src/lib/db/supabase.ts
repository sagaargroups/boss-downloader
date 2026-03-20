import { db } from "@/db";
import { downloads, settings } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { Download, DownloadStatus } from "@/types";

// ---- Helper: Drizzle -> App type converter ----

function rowToDownload(row: any): Download {
  return {
    ...row,
    fileSize: row.fileSize || null,
    metadata: row.metadata as any,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---- Downloads CRUD ----

export async function getDownloads(): Promise<Download[]> {
  try {
    const result = await db.query.downloads.findMany({
      orderBy: [desc(downloads.createdAt)],
    });
    return result.map(rowToDownload);
  } catch (err) {
    console.error("[Drizzle] Error fetching downloads:", err);
    return [];
  }
}

export async function getDownloadById(id: string): Promise<Download | null> {
  try {
    const result = await db.query.downloads.findFirst({
      where: eq(downloads.id, id),
    });
    return result ? rowToDownload(result) : null;
  } catch (err) {
    console.error(`[Drizzle] Error fetching download ${id}:`, err);
    return null;
  }
}

export async function getDownloadsByStatus(
  status: DownloadStatus
): Promise<Download[]> {
  try {
    const result = await db.query.downloads.findMany({
      where: eq(downloads.status, status),
      orderBy: [desc(downloads.createdAt)],
    });
    return result.map(rowToDownload);
  } catch (err) {
    console.error(`[Drizzle] Error fetching downloads by status ${status}:`, err);
    return [];
  }
}

export async function createDownload(
  download: any
): Promise<Download> {
  try {
    const [result] = await db
      .insert(downloads)
      .values(download)
      .returning();
    return rowToDownload(result);
  } catch (err) {
    console.error("[Drizzle] Error creating download:", err);
    throw err;
  }
}

export async function updateDownload(
  id: string,
  updates: any
): Promise<Download> {
  try {
    const [result] = await db
      .update(downloads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(downloads.id, id))
      .returning();
    return rowToDownload(result);
  } catch (err) {
    console.error(`[Drizzle] Error updating download ${id}:`, err);
    throw err;
  }
}

export async function deleteDownload(id: string): Promise<void> {
  try {
    await db.delete(downloads).where(eq(downloads.id, id));
  } catch (err) {
    console.error(`[Drizzle] Error deleting download ${id}:`, err);
    throw err;
  }
}

// ---- Settings CRUD ----

export async function getSettings(): Promise<Record<string, unknown>> {
  try {
    const result = await db.select().from(settings);
    const settingsMap: Record<string, unknown> = {};
    for (const row of result) {
      settingsMap[row.key] = row.value;
    }
    return settingsMap;
  } catch (err) {
    console.error("[Drizzle] Error fetching settings:", err);
    return {};
  }
}

export async function updateSetting(
  key: string,
  value: unknown
): Promise<void> {
  try {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  } catch (err) {
    console.error(`[Drizzle] Error updating setting ${key}:`, err);
    throw err;
  }
}

// ---- Health Check ----

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    await db.select({ id: downloads.id }).from(downloads).limit(1);
    return true;
  } catch {
    return false;
  }
}
