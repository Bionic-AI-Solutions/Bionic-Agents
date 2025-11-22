// Re-export schema from shared database
// Agent Runtime uses the same PostgreSQL database as Dashboard and Agent Builder
// We import the schema definitions from the shared location

// Note: In a real setup, these would be in a shared package or imported from Dashboard
// For now, we'll define minimal types needed for runtime operations

export interface AgentConfig {
  agentId: number;
  tenantId: number;
  name: string;
  description?: string;
  sttProvider: string;
  ttsProvider: string;
  llmProvider: string;
  llmModel?: string;
  systemPrompt?: string;
  visionEnabled: boolean;
  screenShareEnabled: boolean;
  transcribeEnabled: boolean;
  languages: string[];
  voiceId?: string;
  avatarModel?: string;
  mcpGatewayUrl?: string;
  maxConcurrentSessions: number;
  resourceLimits?: {
    cpu?: string;
    memory?: string;
  };
  livekitConfig: {
    url: string;
    apiKey: string;
    apiSecret: string;
  };
  langfuseConfig?: {
    enabled: boolean;
    publicKey: string;
    secretKey: string;
    baseUrl: string;
  };
}

