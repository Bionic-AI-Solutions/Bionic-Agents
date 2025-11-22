import type { AgentConfig } from "../database/models";
import { agentManager } from "./agent-manager";
import { sessionManager } from "./session-manager";
import { nanoid } from "nanoid";

export class AgentRuntime {
  async registerAgent(agentId: number, tenantId: number, config: AgentConfig): Promise<void> {
    await agentManager.registerAgent(agentId, config);
  }

  async unregisterAgent(agentId: number): Promise<void> {
    await agentManager.unregisterAgent(agentId);
  }

  async createSession(
    agentId: number,
    tenantId: number,
    roomName: string,
    participantName?: string
  ): Promise<{ sessionId: string; roomName: string }> {
    const instance = agentManager.getAgentInstance(agentId);
    if (!instance) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    const sessionId = nanoid();
    await instance.joinRoom(roomName, sessionId);

    return { sessionId, roomName };
  }

  async endSession(sessionId: string): Promise<void> {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const instance = agentManager.getAgentInstance(session.agentId);
    if (instance) {
      await instance.leaveRoom(sessionId);
    } else {
      await sessionManager.endSession(sessionId);
    }
  }

  async getSession(sessionId: string) {
    return sessionManager.getSession(sessionId);
  }

  async getAgentStatus(agentId: number) {
    return agentManager.getAgentStatus(agentId);
  }

  async listAgents(): Promise<number[]> {
    return agentManager.listAgents();
  }
}

export const agentRuntime = new AgentRuntime();

