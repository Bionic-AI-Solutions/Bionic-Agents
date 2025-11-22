import { Router } from "express";
import { z } from "zod";
import { agentRuntime } from "../runtime/agent-runtime";

export const sessionsRouter = Router();

// Create session
sessionsRouter.post("/create", async (req, res) => {
  try {
    const schema = z.object({
      agentId: z.number(),
      tenantId: z.number(),
      roomName: z.string(),
      participantName: z.string().optional(),
    });
    
    const { agentId, tenantId, roomName, participantName } = schema.parse(req.body);
    
    const session = await agentRuntime.createSession(agentId, tenantId, roomName, participantName);
    
    res.json({ success: true, session });
  } catch (error: any) {
    console.error("Session creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

// End session
sessionsRouter.post("/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await agentRuntime.endSession(sessionId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Session end error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get session status
sessionsRouter.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await agentRuntime.getSession(sessionId);
    res.json(session);
  } catch (error: any) {
    console.error("Get session error:", error);
    res.status(404).json({ error: error.message });
  }
});

