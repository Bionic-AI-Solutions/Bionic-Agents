import type { AgentConfig } from "../database/models";
import { LangFuseClient } from "../langfuse/langfuse-client";
import { sessionManager } from "./session-manager";

export interface AgentInstanceStatus {
  active: boolean;
  activeSessions: number;
  maxSessions: number;
}

export class AgentInstance {
  private agentId: number;
  private config: AgentConfig;
  private langfuseClient: LangFuseClient;
  private activeSessions: Set<string> = new Set();
  private initialized: boolean = false;

  constructor(agentId: number, config: AgentConfig) {
    this.agentId = agentId;
    this.config = config;
    this.langfuseClient = new LangFuseClient(config.langfuseConfig);
  }

  async initialize(): Promise<void> {
    // Initialize LiveKit agent session
    // TODO: Implement actual LiveKit AgentSession initialization
    // This is a placeholder structure
    this.initialized = true;
  }

  async updateConfig(config: AgentConfig): Promise<void> {
    this.config = config;
    this.langfuseClient = new LangFuseClient(config.langfuseConfig);
    // Update LiveKit agent session configuration
  }

  async joinRoom(roomName: string, sessionId: string): Promise<void> {
    if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
      throw new Error(`Agent ${this.agentId} is at capacity (${this.config.maxConcurrentSessions} sessions)`);
    }

    // Create session in session manager
    await sessionManager.createSession(
      this.agentId,
      this.config.tenantId,
      roomName
    );

    // Connect to LiveKit room
    // TODO: Implement actual LiveKit room connection
    // await this.agentSession.connect(roomName);

    this.activeSessions.add(sessionId);
    await sessionManager.updateSessionStatus(sessionId, "active");
  }

  async leaveRoom(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
    await sessionManager.endSession(sessionId);
  }

  async getStatus(): Promise<AgentInstanceStatus> {
    return {
      active: this.initialized,
      activeSessions: this.activeSessions.size,
      maxSessions: this.config.maxConcurrentSessions,
    };
  }

  async cleanup(): Promise<void> {
    // End all active sessions
    for (const sessionId of this.activeSessions) {
      await this.leaveRoom(sessionId);
    }
    
    // Disconnect from LiveKit
    // TODO: Implement cleanup
    this.initialized = false;
  }

  getLangFuseClient(): LangFuseClient {
    return this.langfuseClient;
  }
}

