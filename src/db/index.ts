import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

declare global {
  var postgresClient: ReturnType<typeof postgres> | undefined;
}

const client = globalThis.postgresClient || postgres(databaseUrl, { prepare: false, ssl: 'require' });

if (process.env.NODE_ENV !== "production") {
  globalThis.postgresClient = client;
}

export const db = drizzle(client, { schema });
