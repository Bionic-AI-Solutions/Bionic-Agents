import { eq } from "drizzle-orm";
import { settings, type InsertSetting } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get a setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

  if (existing.length > 0) {
    await db.update(settings).set({ value, description }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value, description });
  }
}

/**
 * Get all settings as a key-value object
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};

  const result = await db.select().from(settings);
  const settingsMap: Record<string, string> = {};

  for (const setting of result) {
    if (setting.value) {
      settingsMap[setting.key] = setting.value;
    }
  }

  return settingsMap;
}

/**
 * Get LiveKit configuration from settings
 */
export async function getLivekitConfig(): Promise<{
  url: string;
  apiKey: string;
  apiSecret: string;
} | null> {
  const url = await getSetting("livekit_url");
  const apiKey = await getSetting("livekit_api_key");
  const apiSecret = await getSetting("livekit_api_secret");

  if (!url || !apiKey || !apiSecret) {
    return null;
  }

  return { url, apiKey, apiSecret };
}

/**
 * Get LangFuse configuration from settings
 */
export async function getLangfuseConfig(): Promise<{
  enabled: boolean;
  publicKey: string;
  secretKey: string;
  baseUrl: string;
} | null> {
  const enabled = (await getSetting("langfuse_enabled")) === "true";
  const publicKey = await getSetting("langfuse_public_key");
  const secretKey = await getSetting("langfuse_secret_key");
  const baseUrl = await getSetting("langfuse_base_url");

  if (!enabled || !publicKey || !secretKey || !baseUrl) {
    return null;
  }

  return { enabled, publicKey, secretKey, baseUrl };
}

/**
 * Initialize default settings if they don't exist
 */
export async function initializeDefaultSettings(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const defaults: Array<{ key: string; value: string; description: string }> = [
    {
      key: "livekit_url",
      value: process.env.LIVEKIT_URL || "",
      description: "LiveKit server WebSocket URL",
    },
    {
      key: "livekit_api_key",
      value: process.env.LIVEKIT_API_KEY || "",
      description: "LiveKit API key",
    },
    {
      key: "livekit_api_secret",
      value: process.env.LIVEKIT_API_SECRET || "",
      description: "LiveKit API secret",
    },
    {
      key: "langfuse_enabled",
      value: process.env.LANGFUSE_ENABLED || "false",
      description: "Enable LangFuse tracing",
    },
    {
      key: "langfuse_public_key",
      value: process.env.LANGFUSE_PUBLIC_KEY || "",
      description: "LangFuse public API key",
    },
    {
      key: "langfuse_secret_key",
      value: process.env.LANGFUSE_SECRET_KEY || "",
      description: "LangFuse secret API key",
    },
    {
      key: "langfuse_base_url",
      value: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
      description: "LangFuse instance base URL",
    },
  ];

  for (const setting of defaults) {
    const existing = await db.select().from(settings).where(eq(settings.key, setting.key)).limit(1);
    if (existing.length === 0) {
      await db.insert(settings).values(setting);
    }
  }
}
