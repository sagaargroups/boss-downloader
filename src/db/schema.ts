import { pgSchema, text, timestamp, uuid, real, bigint, jsonb } from "drizzle-orm/pg-core";

export const bossDownloaderSchema = pgSchema("boss_downloader");

export const downloads = bossDownloaderSchema.table("downloads", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  title: text("title"),
  platform: text("platform").default("unknown"),
  engine: text("engine").default("ytdlp"),
  status: text("status", {
    enum: [
      "queued",
      "detecting",
      "downloading",
      "paused",
      "merging",
      "completed",
      "failed",
      "cancelled",
    ],
  }).default("queued"),
  progress: real("progress").default(0),
  fileSize: bigint("file_size", { mode: "number" }),
  filePath: text("file_path"),
  format: text("format").default("mp4"),
  quality: text("quality").default("best"),
  speed: text("speed"),
  eta: text("eta"),
  error: text("error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = bossDownloaderSchema.table("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
