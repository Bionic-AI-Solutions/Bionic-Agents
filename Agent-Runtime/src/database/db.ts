import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getConfig } from "../config/config";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    const config = getConfig();
    if (!config.database.url) {
      console.warn("[Database] DATABASE_URL not configured");
      return null;
    }
    
    try {
      const client = postgres(config.database.url);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

