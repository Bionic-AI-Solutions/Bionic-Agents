import { Router } from "express";
import { metricsCollector } from "../runtime/metrics-collector";

export const metricsRouter = Router();

// Get agent metrics
metricsRouter.get("/agent/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    const metrics = await metricsCollector.getAgentMetrics(agentId, startDate, endDate);
    res.json(metrics);
  } catch (error: any) {
    console.error("Get agent metrics error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get tenant metrics
metricsRouter.get("/tenant/:tenantId", async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    const metrics = await metricsCollector.getTenantMetrics(tenantId, startDate, endDate);
    res.json(metrics);
  } catch (error: any) {
    console.error("Get tenant metrics error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get session metrics
metricsRouter.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const metrics = await metricsCollector.getSessionMetrics(sessionId);
    res.json(metrics);
  } catch (error: any) {
    console.error("Get session metrics error:", error);
    res.status(404).json({ error: error.message });
  }
});

