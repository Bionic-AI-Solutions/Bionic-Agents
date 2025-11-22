import type { AgentConfig } from "../database/models";
import { AgentInstance } from "./agent-instance";

export class AgentManager {
  private agentInstances: Map<number, AgentInstance> = new Map();
  private configs: Map<number, AgentConfig> = new Map();

  async registerAgent(agentId: number, config: AgentConfig): Promise<void> {
    this.configs.set(agentId, config);
    
    // Create agent instance if not exists
    if (!this.agentInstances.has(agentId)) {
      const instance = new AgentInstance(agentId, config);
      await instance.initialize();
      this.agentInstances.set(agentId, instance);
    } else {
      // Update existing instance
      const instance = this.agentInstances.get(agentId)!;
      await instance.updateConfig(config);
    }
  }

  async unregisterAgent(agentId: number): Promise<void> {
    const instance = this.agentInstances.get(agentId);
    if (instance) {
      await instance.cleanup();
      this.agentInstances.delete(agentId);
    }
    this.configs.delete(agentId);
  }

  getAgentInstance(agentId: number): AgentInstance | undefined {
    return this.agentInstances.get(agentId);
  }

  getAgentConfig(agentId: number): AgentConfig | undefined {
    return this.configs.get(agentId);
  }

  listAgents(): number[] {
    return Array.from(this.agentInstances.keys());
  }

  async getAgentStatus(agentId: number): Promise<{
    registered: boolean;
    active: boolean;
    activeSessions: number;
    maxSessions: number;
  }> {
    const instance = this.agentInstances.get(agentId);
    if (!instance) {
      return { registered: false, active: false, activeSessions: 0, maxSessions: 0 };
    }

    const status = await instance.getStatus();
    return {
      registered: true,
      active: status.active,
      activeSessions: status.activeSessions,
      maxSessions: status.maxSessions,
    };
  }
}

export const agentManager = new AgentManager();

