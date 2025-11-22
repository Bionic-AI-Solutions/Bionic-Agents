export interface Config {
  database: {
    url: string;
  };
  livekit: {
    url: string;
    apiKey: string;
    apiSecret: string;
  };
  langfuse?: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    baseUrl: string;
  };
  runtime: {
    apiPort: number;
    apiKey?: string;
    maxAgentsPerInstance: number;
    maxSessionsPerAgent: number;
  };
}

export function getConfig(): Config {
  return {
    database: {
      url: process.env.DATABASE_URL || "",
    },
    livekit: {
      url: process.env.LIVEKIT_URL || "",
      apiKey: process.env.LIVEKIT_API_KEY || "",
      apiSecret: process.env.LIVEKIT_API_SECRET || "",
    },
    langfuse: process.env.LANGFUSE_ENABLED === "true" ? {
      enabled: true,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY || "",
      secretKey: process.env.LANGFUSE_SECRET_KEY || "",
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
    } : undefined,
    runtime: {
      apiPort: parseInt(process.env.PORT || "8080", 10),
      apiKey: process.env.AGENT_RUNTIME_API_KEY,
      maxAgentsPerInstance: parseInt(process.env.MAX_AGENTS_PER_INSTANCE || "50", 10),
      maxSessionsPerAgent: parseInt(process.env.MAX_SESSIONS_PER_AGENT || "100", 10),
    },
  };
}

