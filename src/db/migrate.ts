import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing in .env.local");
  }

  // Use the exact config that we know works with Supabase connection poolers
  const migrationClient = postgres(databaseUrl, {
    max: 1,
    ssl: "require",
    prepare: false, 
  });

  console.log("Running manual migrations to avoid Supabase pooler lock deadlocks...");

  try {
    const sqlContent = fs.readFileSync(path.join(process.cwd(), "src/db/migrations/0001_thankful_ulik.sql"), "utf-8");
    const queries = sqlContent.split("--> statement-breakpoint").map(q => q.trim()).filter(Boolean);

    for (const query of queries) {
      console.log("Executing query...");
      await migrationClient.unsafe(query);
    }
    
    // Also insert the default settings
    console.log("Inserting default settings into boss_downloader schema...");
    await migrationClient.unsafe(`
      INSERT INTO boss_downloader.settings (key, value) VALUES
        ('defaultEngine', '"ytdlp"'),
        ('defaultQuality', '"best"'),
        ('defaultFormat', '"mp4"'),
        ('downloadPath', '"./downloads"'),
        ('maxConcurrent', '3')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await migrationClient.end();
    process.exit(0);
  }
}

runMigration().catch(console.error);
