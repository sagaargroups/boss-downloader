CREATE TABLE "downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"platform" text DEFAULT 'unknown',
	"engine" text DEFAULT 'ytdlp',
	"status" text DEFAULT 'queued',
	"progress" real DEFAULT 0,
	"file_size" bigint,
	"file_path" text,
	"format" text DEFAULT 'mp4',
	"quality" text DEFAULT 'best',
	"speed" text,
	"eta" text,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
