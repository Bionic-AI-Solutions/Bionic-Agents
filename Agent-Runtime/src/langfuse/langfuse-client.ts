import type { AgentConfig } from "../database/models";

export interface LangFuseTrace {
  traceId: string;
  name?: string;
  userId?: string;
  input?: any;
  output?: any;
  metadata?: any;
  tags?: string[];
  timestamp: Date;
}

export interface LangFuseMetrics {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number; // micro-cents
  avgLatency: number; // milliseconds
  modelName?: string;
}

export class LangFuseClient {
  private config?: AgentConfig["langfuseConfig"];

  constructor(config?: AgentConfig["langfuseConfig"]) {
    this.config = config;
  }

  isEnabled(): boolean {
    return this.config?.enabled === true && !!this.config.publicKey && !!this.config.secretKey;
  }

  async createTrace(trace: LangFuseTrace): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error("LangFuse is not enabled");
    }

    // In production, use LangFuse SDK
    // For now, return a mock trace ID
    // TODO: Integrate with LangFuse SDK
    return trace.traceId || `trace-${Date.now()}`;
  }

  /**
   * Not implemented — deliberately does no I/O.
   *
   * This previously issued `GET /api/public/traces/{id}`. That route is REMOVED
   * in Langfuse v4 (it returns 404 once the server runs the default
   * `events_only` write mode), and the request was already failing before the
   * upgrade: it sent `Authorization: Bearer <publicKey>`, while Langfuse's
   * public API expects HTTP Basic with publicKey as the user and secretKey as
   * the password. Every call therefore fell through to `return null`.
   *
   * Keeping a live call to a removed endpoint would mean one network round-trip
   * per invocation to produce the null this returns anyway, so the call is gone
   * rather than repointed. The behaviour is unchanged.
   *
   * To implement for real, use the v4 replacements — Observations v2 for
   * per-observation usage and Metrics v2 for aggregates — with Basic auth.
   * See ../../../k8s-infrastructure/.../langfuse/harness/APP-MIGRATION.md.
   */
  async getTraceMetrics(_traceId: string): Promise<LangFuseMetrics | null> {
    return null;
  }

  async queryTraces(params: {
    agentId?: number;
    tenantId?: number;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LangFuseTrace[]> {
    if (!this.isEnabled()) {
      return [];
    }

    // Query LangFuse API for traces
    // TODO: Implement LangFuse API query integration
    return [];
  }
}

