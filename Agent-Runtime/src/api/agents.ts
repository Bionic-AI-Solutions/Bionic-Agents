import { Router } from "express";
import { z } from "zod";
import { agentRuntime } from "../runtime/agent-runtime";

export const agentsRouter = Router();

// Middleware for API key authentication
agentsRouter.use(async (req, res, next) => {
  const apiKey = req.headers.authorization?.replace("Bearer ", "");
  const config = (await import("../config/config")).getConfig();
  
  if (config.runtime.apiKey && apiKey !== config.runtime.apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
});

// Register agent
agentsRouter.post("/register", async (req, res) => {
  try {
    const schema = z.object({
      agentId: z.number(),
      tenantId: z.number(),
      config: z.any(),
    });
    
    const { agentId, tenantId, config } = schema.parse(req.body);
    
    await agentRuntime.registerAgent(agentId, tenantId, config);
    
    res.json({ success: true, agentId });
  } catch (error: any) {
    console.error("Agent registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Unregister agent
agentsRouter.delete("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    await agentRuntime.unregisterAgent(agentId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Agent unregistration error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get agent status
agentsRouter.get("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    const status = await agentRuntime.getAgentStatus(agentId);
    res.json(status);
  } catch (error: any) {
    console.error("Get agent status error:", error);
    res.status(404).json({ error: error.message });
  }
});

// List all agents
agentsRouter.get("/", async (req, res) => {
  try {
    const agents = await agentRuntime.listAgents();
    res.json({ agents });
  } catch (error: any) {
    console.error("List agents error:", error);
    res.status(500).json({ error: error.message });
  }
});

