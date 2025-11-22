import { nanoid } from "nanoid";
import { getDb } from "../database/db";
// Note: In production, import from shared package
// For now, we'll define the type locally

export interface Session {
  sessionId: string;
  agentId: number;
  tenantId: number;
  roomName: string;
  status: "connecting" | "active" | "ended" | "error";
  startedAt: Date;
  endedAt?: Date;
  participantCount: number;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private agentSessions: Map<number, Set<string>> = new Map();

  async createSession(
    agentId: number,
    tenantId: number,
    roomName: string,
    runtimeInstanceId?: number
  ): Promise<Session> {
    const sessionId = nanoid();
    const session: Session = {
      sessionId,
      agentId,
      tenantId,
      roomName,
      status: "connecting",
      startedAt: new Date(),
      participantCount: 0,
    };

    this.sessions.set(sessionId, session);
    
    if (!this.agentSessions.has(agentId)) {
      this.agentSessions.set(agentId, new Set());
    }
    this.agentSessions.get(agentId)!.add(sessionId);

    // Store in database
    await this.saveSessionToDb(session, runtimeInstanceId);

    return session;
  }

  async updateSessionStatus(
    sessionId: string,
    status: Session["status"],
    participantCount?: number
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = status;
    if (participantCount !== undefined) {
      session.participantCount = participantCount;
    }

    if (status === "ended") {
      session.endedAt = new Date();
      await this.updateSessionInDb(sessionId, session);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    await this.updateSessionStatus(sessionId, "ended");
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      const agentSessions = this.agentSessions.get(session.agentId);
      if (agentSessions) {
        agentSessions.delete(sessionId);
      }
    }
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAgentSessions(agentId: number): Session[] {
    const sessionIds = this.agentSessions.get(agentId) || new Set();
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter((s): s is Session => s !== undefined);
  }

  private async saveSessionToDb(session: Session, runtimeInstanceId?: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Use raw SQL for now - in production, use shared schema package
      const client = (db as any).client;
      if (client && typeof client.query === 'function') {
        await client.query(
          `INSERT INTO agent_instance_sessions (
            agent_id, tenant_id, session_id, room_name, 
            runtime_instance_id, status, started_at, participant_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            session.agentId,
            session.tenantId,
            session.sessionId,
            session.roomName,
            runtimeInstanceId || null,
            session.status,
            session.startedAt,
            session.participantCount,
          ]
        );
      }
    } catch (error) {
      console.error("Failed to save session to DB:", error);
    }
  }

  private async updateSessionInDb(sessionId: string, session: Session): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      const client = (db as any).client;
      if (client && typeof client.query === 'function') {
        const durationSeconds = session.endedAt && session.startedAt
          ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
          : null;

        await client.query(
          `UPDATE agent_instance_sessions
          SET 
            status = $1,
            ended_at = $2,
            duration_seconds = $3,
            participant_count = $4
          WHERE session_id = $5`,
          [
            session.status,
            session.endedAt || null,
            durationSeconds,
            session.participantCount,
            sessionId,
          ]
        );
      }
    } catch (error) {
      console.error("Failed to update session in DB:", error);
    }
  }
}

export const sessionManager = new SessionManager();

